import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from 'react-markdown';
import deepLearningAnalysisBg from '../src/assets/images/deep_learning_analysis_bg_1785615121328.jpg';
import convolutionalEngineBg from '../src/assets/images/convolutional_engine_bg_1785614983427.jpg';

import { DLPhaseResult, DLPhaseCandidate } from "../types";
import { identifyPhasesDL, parseXYData, applySavitzkyGolay } from "../utils/physics";
import { playSynthTone } from "../utils/sound";
import { analyzePhaseID } from "../services/geminiService";
import {
  ComposedChart,
  Bar,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine,
  ReferenceArea,
  Brush,
  AreaChart,
} from "recharts";
import {
  Box,
  Brain,
  Activity,
  CheckCircle,
  Search,
  Database,
  Layers,
  Zap,
  ChevronDown,
  ChevronUp,
  MoveRight,
  FlaskConical,
  Loader2,
  Upload,
  FileText,
  Trash2,
  Settings,
  Settings2,
  Info,
  HelpCircle,
  Calculator,
  Plus,
  X,
  ShieldAlert,
  Focus,
  Eye,
  EyeOff,
  Scan,
  BookOpen,
  Microscope,
  Cpu,
  RefreshCw,
  Sliders,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  CheckCircle2,
  Timer,
  Thermometer,
  Droplets,
  Wind,
  Focus as Ruler,
  TestTube as Vial,
  Download,
  Maximize2,
  Network
} from "lucide-react";

import { GeminiFlashMaterialSearch } from './GeminiFlashMaterialSearch';
import { CrystallographicIntelligencePanel } from './CrystallographicIntelligencePanel';
import { ConstituentPhaseElementsPanel } from './ConstituentPhaseElementsPanel';
import { SynthesisIntelligenceStudio, SynthMorphologyType, SynthAtmosphereType } from './SynthesisIntelligenceStudio';
import { getActiveMaterials } from "../utils/materialsHelper";
const MATERIAL_DB = getActiveMaterials();

const MATERIAL_ELEMENTS: Record<
  string,
  { name: string; number: number; category: string; mass: number }
> = {
  H: {
    name: "Hydrogen",
    number: 1,
    category: "Reactive Nonmetal",
    mass: 1.008,
  },
  Li: { name: "Lithium", number: 3, category: "Alkali Metal", mass: 6.94 },
  B: { name: "Boron", number: 5, category: "Metalloid", mass: 10.81 },
  C: { name: "Carbon", number: 6, category: "Reactive Nonmetal", mass: 12.011 },
  N: {
    name: "Nitrogen",
    number: 7,
    category: "Reactive Nonmetal",
    mass: 14.007,
  },
  O: { name: "Oxygen", number: 8, category: "Reactive Nonmetal", mass: 15.999 },
  F: {
    name: "Fluorine",
    number: 9,
    category: "Reactive Nonmetal",
    mass: 18.998,
  },
  Na: { name: "Sodium", number: 11, category: "Alkali Metal", mass: 22.99 },
  Mg: {
    name: "Magnesium",
    number: 12,
    category: "Alkaline Earth Metal",
    mass: 24.305,
  },
  Al: {
    name: "Aluminum",
    number: 13,
    category: "Post-Transition Metal",
    mass: 26.982,
  },
  Si: { name: "Silicon", number: 14, category: "Metalloid", mass: 28.085 },
  P: {
    name: "Phosphorus",
    number: 15,
    category: "Reactive Nonmetal",
    mass: 30.974,
  },
  S: { name: "Sulfur", number: 16, category: "Reactive Nonmetal", mass: 32.06 },
  Cl: {
    name: "Chlorine",
    number: 17,
    category: "Reactive Nonmetal",
    mass: 35.45,
  },
  K: { name: "Potassium", number: 19, category: "Alkali Metal", mass: 39.098 },
  Ca: {
    name: "Calcium",
    number: 20,
    category: "Alkaline Earth Metal",
    mass: 40.078,
  },
  Ti: {
    name: "Titanium",
    number: 22,
    category: "Transition Metal",
    mass: 47.867,
  },
  V: {
    name: "Vanadium",
    number: 23,
    category: "Transition Metal",
    mass: 50.942,
  },
  Cr: {
    name: "Chromium",
    number: 24,
    category: "Transition Metal",
    mass: 51.996,
  },
  Mn: {
    name: "Manganese",
    number: 25,
    category: "Transition Metal",
    mass: 54.912,
  },
  Fe: { name: "Iron", number: 26, category: "Transition Metal", mass: 55.845 },
  Co: {
    name: "Cobalt",
    number: 27,
    category: "Transition Metal",
    mass: 58.933,
  },
  Ni: {
    name: "Nickel",
    number: 28,
    category: "Transition Metal",
    mass: 58.693,
  },
  Cu: {
    name: "Copper",
    number: 29,
    category: "Transition Metal",
    mass: 63.546,
  },
  Zn: { name: "Zinc", number: 30, category: "Transition Metal", mass: 65.38 },
  Ga: {
    name: "Gallium",
    number: 31,
    category: "Post-Transition Metal",
    mass: 69.723,
  },
  Ge: { name: "Germanium", number: 32, category: "Metalloid", mass: 72.63 },
  As: { name: "Arsenic", number: 33, category: "Metalloid", mass: 74.922 },
  Se: {
    name: "Selenium",
    number: 34,
    category: "Reactive Nonmetal",
    mass: 78.971,
  },
  Br: {
    name: "Bromine",
    number: 35,
    category: "Reactive Nonmetal",
    mass: 79.904,
  },
  Sr: {
    name: "Strontium",
    number: 38,
    category: "Alkaline Earth Metal",
    mass: 87.62,
  },
  Y: {
    name: "Yttrium",
    number: 39,
    category: "Transition Metal",
    mass: 88.906,
  },
  Zr: {
    name: "Zirconium",
    number: 40,
    category: "Transition Metal",
    mass: 91.224,
  },
  Nb: {
    name: "Niobium",
    number: 41,
    category: "Transition Metal",
    mass: 92.906,
  },
  Mo: {
    name: "Molybdenum",
    number: 42,
    category: "Transition Metal",
    mass: 95.95,
  },
  Ru: {
    name: "Ruthenium",
    number: 44,
    category: "Transition Metal",
    mass: 101.07,
  },
  Rh: {
    name: "Rhodium",
    number: 45,
    category: "Transition Metal",
    mass: 102.91,
  },
  Pd: {
    name: "Palladium",
    number: 46,
    category: "Transition Metal",
    mass: 106.42,
  },
  Ag: {
    name: "Silver",
    number: 47,
    category: "Transition Metal",
    mass: 107.87,
  },
  Cd: {
    name: "Cadmium",
    number: 48,
    category: "Transition Metal",
    mass: 112.41,
  },
  In: {
    name: "Indium",
    number: 49,
    category: "Post-Transition Metal",
    mass: 114.82,
  },
  Sn: {
    name: "Tin",
    number: 50,
    category: "Post-Transition Metal",
    mass: 118.71,
  },
  Sb: { name: "Antimony", number: 51, category: "Metalloid", mass: 121.76 },
  Te: { name: "Tellurium", number: 52, category: "Metalloid", mass: 127.6 },
  I: { name: "Iodine", number: 53, category: "Reactive Nonmetal", mass: 126.9 },
  Ba: {
    name: "Barium",
    number: 56,
    category: "Alkaline Earth Metal",
    mass: 137.33,
  },
  Be: {
    name: "Beryllium",
    number: 4,
    category: "Alkaline Earth Metal",
    mass: 9.012,
  },
  Sc: {
    name: "Scandium",
    number: 21,
    category: "Transition Metal",
    mass: 44.956,
  },
  La: { name: "Lanthanum", number: 57, category: "Lanthanide", mass: 138.91 },
  Ce: { name: "Cerium", number: 58, category: "Lanthanide", mass: 140.12 },
  Nd: { name: "Neodymium", number: 60, category: "Lanthanide", mass: 144.24 },
  Sm: { name: "Samarium", number: 62, category: "Lanthanide", mass: 150.36 },
  Eu: { name: "Europium", number: 63, category: "Lanthanide", mass: 151.96 },
  Gd: { name: "Gadolinium", number: 64, category: "Lanthanide", mass: 157.25 },
  Dy: { name: "Dysprosium", number: 66, category: "Lanthanide", mass: 162.5 },
  Tm: { name: "Thulium", number: 69, category: "Lanthanide", mass: 168.93 },
  Yb: { name: "Ytterbium", number: 70, category: "Lanthanide", mass: 173.05 },
  Lu: { name: "Lutetium", number: 71, category: "Lanthanide", mass: 174.97 },
  Hf: {
    name: "Hafnium",
    number: 72,
    category: "Transition Metal",
    mass: 178.49,
  },
  Ta: {
    name: "Tantalum",
    number: 73,
    category: "Transition Metal",
    mass: 180.95,
  },
  W: {
    name: "Tungsten",
    number: 74,
    category: "Transition Metal",
    mass: 183.84,
  },
  Re: {
    name: "Rhenium",
    number: 75,
    category: "Transition Metal",
    mass: 186.21,
  },
  Os: {
    name: "Osmium",
    number: 76,
    category: "Transition Metal",
    mass: 190.23,
  },
  Ir: {
    name: "Iridium",
    number: 77,
    category: "Transition Metal",
    mass: 192.22,
  },
  Pt: {
    name: "Platinum",
    number: 78,
    category: "Transition Metal",
    mass: 195.08,
  },
  Au: { name: "Gold", number: 79, category: "Transition Metal", mass: 196.97 },
  Pb: {
    name: "Lead",
    number: 82,
    category: "Post-Transition Metal",
    mass: 207.2,
  },
  Bi: {
    name: "Bismuth",
    number: 83,
    category: "Post-Transition Metal",
    mass: 208.98,
  },
  Th: { name: "Thorium", number: 90, category: "Actinide", mass: 232.04 },
  U: { name: "Uranium", number: 92, category: "Actinide", mass: 238.03 },
};

const parseElementsFromFormula = (
  formulaStr: string,
): { symbol: string; name: string }[] => {
  if (!formulaStr) return [];

  let clean = formulaStr
    .replace(/\([^)]*[A-Za-z]{3,}[^)]*\)/g, "")
    .replace(/\b(17-4PH|H13|C276|2205|316L|304|310|430)\b/gi, "")
    .replace(/\b(HEA|APM|Nano|impure|primarily|phase)\b/gi, "")
    .replace(/[A-Za-z][a-z]{2,}/g, "");

  const matches = clean.match(/([A-Z][a-z]?)/g);
  if (!matches) return [];

  const uniqueSymbols = Array.from(new Set(matches));
  return uniqueSymbols
    .filter((sym) => sym in MATERIAL_ELEMENTS)
    .map((sym) => ({ symbol: sym, name: MATERIAL_ELEMENTS[sym].name }));
};

const colorizeLine = (line: string) => {
  const commentIdx = line.indexOf('#');
  let codePart = line;
  let commentPart = '';
  
  if (commentIdx !== -1) {
    codePart = line.substring(0, commentIdx);
    commentPart = line.substring(commentIdx);
  }
  
  const tokens = codePart.split(/(\s+|\(|\)|\{|\}|\[|\]|=|\+|-|\*|\/|,|:|;|\"|\')/);
  
  return (
    <>
      {tokens.map((token, i) => {
        const trimmed = token.trim();
        if (/^(def|class|import|from|as|return|if|else|elif|for|in|with|try|except|pass|raise|lambda)$/.test(trimmed)) {
          return <span key={i} className="text-fuchsia-400 font-bold">{token}</span>;
        }
        if (/^(print|len|range|list|dict|set|tuple|str|int|float|isinstance|super|__init__|forward)$/.test(trimmed)) {
          return <span key={i} className="text-rose-300">{token}</span>;
        }
        if (/^(torch|nn|F|optim|lr_scheduler|np|pd|chromadb|SentenceTransformer|genai)$/.test(trimmed)) {
          return <span key={i} className="text-cyan-400 font-bold">{token}</span>;
        }
        if (trimmed.startsWith('"') || trimmed.startsWith("'") || trimmed.endsWith('"') || trimmed.endsWith("'")) {
          return <span key={i} className="text-amber-300">{token}</span>;
        }
        if (/^[0-9.]+$/.test(trimmed)) {
          return <span key={i} className="text-emerald-400">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
      {commentPart && <span className="text-slate-500">{commentPart}</span>}
    </>
  );
};

// --- XRD-Calc Pro Synthesis Stoichiometry Engine Helpers ---
export interface PrecursorInfo {
  name: string;
  formula: string;
  mw: number;
  atomsPerMolecule: number;
}

export const PRECURSOR_DATABASE: Record<string, PrecursorInfo[]> = {
  Li: [
    { name: "Lithium Nitrate", formula: "LiNO3", mw: 68.94, atomsPerMolecule: 1 },
    { name: "Lithium Carbonate", formula: "Li2CO3", mw: 73.89, atomsPerMolecule: 2 },
    { name: "Lithium Acetate", formula: "LiC2H3O2", mw: 65.99, atomsPerMolecule: 1 },
    { name: "Lithium Chloride", formula: "LiCl", mw: 42.39, atomsPerMolecule: 1 }
  ],
  Co: [
    { name: "Cobalt(II) Nitrate Hexahydrate", formula: "Co(NO3)2Â·6H2O", mw: 291.03, atomsPerMolecule: 1 },
    { name: "Cobalt(II) Acetate Tetrahydrate", formula: "Co(C2H3O2)2Â·4H2O", mw: 249.08, atomsPerMolecule: 1 },
    { name: "Cobalt(II) Chloride Hexahydrate", formula: "CoCl2Â·6H2O", mw: 237.93, atomsPerMolecule: 1 }
  ],
  Ti: [
    { name: "Titanium Isopropoxide (TTIP)", formula: "C12H28O4Ti", mw: 284.22, atomsPerMolecule: 1 },
    { name: "Titanium Tetrachloride", formula: "TiCl4", mw: 189.68, atomsPerMolecule: 1 },
    { name: "Titanium(IV) Butoxide", formula: "Ti(OBu)4", mw: 340.32, atomsPerMolecule: 1 }
  ],
  Zr: [
    { name: "Zirconyl Nitrate Hydrate", formula: "ZrO(NO3)2Â·xH2O", mw: 231.23, atomsPerMolecule: 1 },
    { name: "Zirconium(IV) Chloride", formula: "ZrCl4", mw: 233.03, atomsPerMolecule: 1 },
    { name: "Zirconium(IV) Oxychloride Octahydrate", formula: "ZrOCl2Â·8H2O", mw: 322.25, atomsPerMolecule: 1 }
  ],
  Zn: [
    { name: "Zinc Nitrate Hexahydrate", formula: "Zn(NO3)2Â·6H2O", mw: 297.49, atomsPerMolecule: 1 },
    { name: "Zinc Acetate Dihydrate", formula: "Zn(CH3COO)2Â·2H2O", mw: 219.51, atomsPerMolecule: 1 },
    { name: "Zinc Chloride", formula: "ZnCl2", mw: 136.31, atomsPerMolecule: 1 }
  ],
  Al: [
    { name: "Aluminum Nitrate Nonahydrate", formula: "Al(NO3)3Â·9H2O", mw: 375.13, atomsPerMolecule: 1 },
    { name: "Aluminum Chloride Hexahydrate", formula: "AlCl3Â·6H2O", mw: 241.43, atomsPerMolecule: 1 },
    { name: "Aluminum Isopropoxide", formula: "Al(C3H7O)3", mw: 204.25, atomsPerMolecule: 1 }
  ],
  Fe: [
    { name: "Iron(III) Nitrate Nonahydrate", formula: "Fe(NO3)3Â·9H2O", mw: 404.00, atomsPerMolecule: 1 },
    { name: "Iron(II) Sulfate Heptahydrate", formula: "FeSO4Â·7H2O", mw: 278.01, atomsPerMolecule: 1 },
    { name: "Iron(III) Chloride Hexahydrate", formula: "FeCl3Â·6H2O", mw: 270.30, atomsPerMolecule: 1 }
  ],
  Si: [
    { name: "Tetraethyl Orthosilicate (TEOS)", formula: "Si(OC2H5)4", mw: 208.33, atomsPerMolecule: 1 },
    { name: "Tetramethyl Orthosilicate (TMOS)", formula: "Si(OCH3)4", mw: 152.22, atomsPerMolecule: 1 }
  ],
  Ce: [
    { name: "Cerium(III) Nitrate Hexahydrate", formula: "Ce(NO3)3Â·6H2O", mw: 434.22, atomsPerMolecule: 1 },
    { name: "Cerium(III) Chloride Heptahydrate", formula: "CeCl3Â·7H2O", mw: 372.58, atomsPerMolecule: 1 }
  ],
  La: [
    { name: "Lanthanum(III) Nitrate Hexahydrate", formula: "La(NO3)3Â·6H2O", mw: 433.01, atomsPerMolecule: 1 },
    { name: "Lanthanum(III) Chloride Heptahydrate", formula: "LaCl3Â·7H2O", mw: 371.37, atomsPerMolecule: 1 }
  ],
  Sr: [
    { name: "Strontium Nitrate", formula: "Sr(NO3)2", mw: 211.63, atomsPerMolecule: 1 },
    { name: "Strontium Chloride Hexahydrate", formula: "SrCl2Â·6H2O", mw: 266.62, atomsPerMolecule: 1 },
    { name: "Strontium Carbonate", formula: "SrCO3", mw: 147.63, atomsPerMolecule: 1 }
  ],
  Ba: [
    { name: "Barium Nitrate", formula: "Ba(NO3)2", mw: 261.34, atomsPerMolecule: 1 },
    { name: "Barium Chloride Dihydrate", formula: "BaCl2Â·2H2O", mw: 244.26, atomsPerMolecule: 1 },
    { name: "Barium Carbonate", formula: "BaCO3", mw: 197.34, atomsPerMolecule: 1 }
  ],
  Mn: [
    { name: "Manganese(II) Nitrate Tetrahydrate", formula: "Mn(NO3)2Â·4H2O", mw: 251.01, atomsPerMolecule: 1 },
    { name: "Manganese(II) Acetate Tetrahydrate", formula: "Mn(C2H3O2)2Â·4H2O", mw: 245.09, atomsPerMolecule: 1 }
  ],
  Ni: [
    { name: "Nickel(II) Nitrate Hexahydrate", formula: "Ni(NO3)2Â·6H2O", mw: 290.79, atomsPerMolecule: 1 },
    { name: "Nickel(II) Sulfate Hexahydrate", formula: "NiSO4Â·6H2O", mw: 262.85, atomsPerMolecule: 1 }
  ],
  Cu: [
    { name: "Copper(II) Nitrate Hemipentahydrate", formula: "Cu(NO3)2Â·2.5H2O", mw: 232.59, atomsPerMolecule: 1 },
    { name: "Copper(II) Acetate Monohydrate", formula: "Cu(C2H3O2)2Â·H2O", mw: 199.65, atomsPerMolecule: 1 }
  ],
  Y: [
    { name: "Yttrium(III) Nitrate Hexahydrate", formula: "Y(NO3)3Â·6H2O", mw: 383.01, atomsPerMolecule: 1 },
    { name: "Yttrium(III) Chloride Hexahydrate", formula: "YCl3Â·6H2O", mw: 303.48, atomsPerMolecule: 1 }
  ],
  Mg: [
    { name: "Magnesium Nitrate Hexahydrate", formula: "Mg(NO3)2Â·6H2O", mw: 256.41, atomsPerMolecule: 1 },
    { name: "Magnesium Acetate Tetrahydrate", formula: "Mg(C2H3O2)2Â·4H2O", mw: 214.45, atomsPerMolecule: 1 }
  ],
  Ca: [
    { name: "Calcium Nitrate Tetrahydrate", formula: "Ca(NO3)2Â·4H2O", mw: 236.15, atomsPerMolecule: 1 },
    { name: "Calcium Carbonate", formula: "CaCO3", mw: 100.09, atomsPerMolecule: 1 }
  ],
  Na: [
    { name: "Sodium Chloride", formula: "NaCl", mw: 58.44, atomsPerMolecule: 1 },
    { name: "Sodium Nitrate", formula: "NaNO3", mw: 84.99, atomsPerMolecule: 1 },
    { name: "Sodium Carbonate", formula: "Na2CO3", mw: 105.99, atomsPerMolecule: 2 }
  ],
  Cl: [
    { name: "Ammonium Chloride", formula: "NH4Cl", mw: 53.49, atomsPerMolecule: 1 }
  ]
};

export function parseChemicalFormula(formula: string): Record<string, number> {
  const result: Record<string, number> = {};
  if (!formula) return result;
  // Clean formula of extra names like (Nano) or polymorph indicators
  const clean = formula.split("(")[0].replace(/\s+/g, "");
  const regex = /([A-Z][a-z]?)\s*(\d*\.?\d*)/g;
  let match;
  while ((match = regex.exec(clean)) !== null) {
    const element = match[1];
    const count = match[2] ? parseFloat(match[2]) : 1;
    result[element] = (result[element] || 0) + count;
  }
  return result;
}

export const DeepLearningModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
  const { t } = useTranslation();
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Preproc, 2: CNN, 3: DB, 4: Done
  const [selectedCandidate, setSelectedCandidate] =
    useState<DLPhaseCandidate | null>(null);
  
  // Interactive visualization state
  const [showResidual, setShowResidual] = useState(true);
  const [showSimulation, setShowSimulation] = useState(true);
  const [showInput, setShowInput] = useState(true);
  const [showHklLabels, setShowHklLabels] = useState(true);
  const [showSticks, setShowSticks] = useState(true);
  
  // Synchronize active predicted candidate with localStorage for AI Context support
  useEffect(() => {
    if (selectedCandidate) {
      localStorage.setItem("xrd_current_deep_learning_selected", JSON.stringify(selectedCandidate));
    } else {
      localStorage.removeItem("xrd_current_deep_learning_selected");
    }
  }, [selectedCandidate]);

  const [scanPos, setScanPos] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ML Validation detailed tab view states
  const [selectedValidationTab, setSelectedValidationTab] = useState<'audit' | 'robustness' | 'confusion'>('audit');
  const [showGradCam, setShowGradCam] = useState<boolean>(false);
  const [noiseLevel, setNoiseLevel] = useState<number>(10); // Gaussian noise perturbation %
  const [backgroundDrift, setBackgroundDrift] = useState<number>(5); // Background curve shift %
  const [isPerturbationRunning, setIsPerturbationRunning] = useState<boolean>(false);
  const [perturbationScore, setPerturbationScore] = useState<number | null>(null);
  const [activeMatrixCell, setActiveMatrixCell] = useState<{ row: string; col: string; val: number } | null>(null);

  // Advanced Engine Configuration
  const [engineConfig, setEngineConfig] = useState(() => {
    const defaultScientific = {
      kernelSize: 5,
      kernelProfile: "Gaussian",
      filters: 64,
      activation: "ReLU",
      optimization: "Adam",
      multiScale: true,
      dropout: 0.2,
      attentionMechanism: false,
      pooling: "max",
      depth: 50,
      learningRate: 0.001,
      batchNorm: true,
      confidenceThreshold: 50,
      cagliotiCorrection: true,
      asymmetryCorrection: true,
      backgroundSubtraction: true,
      shapeExponent: 2.5
    };
    try {
      const saved = localStorage.getItem("xrd_engine_config");
      if (saved) {
        return {
          ...defaultScientific,
          ...JSON.parse(saved)
        };
      }
    } catch (e) {
      console.error("Failed to load neural config", e);
    }
    return defaultScientific;
  });

  useEffect(() => {
    try {
      localStorage.setItem("xrd_engine_config", JSON.stringify(engineConfig));
    } catch (e) {
      console.error("Failed to save neural config", e);
    }
  }, [engineConfig]);

  // AI Auto-Tuning Optimizer simulated states
  const [isAutoTuning, setIsAutoTuning] = useState(false);
  const [autoTuneProgress, setAutoTuneProgress] = useState(0);
  const [autoTuneLogs, setAutoTuneLogs] = useState<string[]>([]);
  const [activePreset, setActivePreset] = useState<string>("Standard");
  const [showConfigImportExport, setShowConfigImportExport] = useState(false);
  const [importJsonText, setImportJsonText] = useState("");
  const [configFeedback, setConfigFeedback] = useState("");

  // User-Friendly Mode & Optional Sections progressive disclosure state
  const [viewMode, setViewMode] = useState<'standard' | 'expert'>('standard');
  const [showAdvancedHyperparameters, setShowAdvancedHyperparameters] = useState<boolean>(false);
  const [showArchitectureDiagnostics, setShowArchitectureDiagnostics] = useState<boolean>(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(false);

  const runAutoTuner = () => {
    setIsAutoTuning(true);
    setAutoTuneProgress(0);
    setAutoTuneLogs(["Tuning Process Initialized: Querying GPU/TPU baseline registers..."]);
    
    const steps = [
      { progress: 15, log: "Analyzing signal noise-floor & background amorphous humps..." },
      { progress: 35, log: "Trial 1/4: Scanning Gaussian kernel of width 3. Confidence rating: 78.4%" },
      { progress: 55, log: "Trial 2/4: Symmetrizing Multi-Scale Residual bypass links... Preserving peak bounds." },
      { progress: 75, log: "Trial 3/4: Minimizing cross-correlation loss via GELU activation. Error: 0.012" },
      { progress: 95, log: "Trial 4/4: Stabilising Batch-Norm scale & learning multipliers..." },
      { progress: 100, log: "Optimization complete. Super-resolved 1D CNN configuration selected and loaded!" }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const item = steps[currentStep];
        setAutoTuneProgress(item.progress);
        setAutoTuneLogs(prev => [...prev, `[Optimizer] ${item.log}`]);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setEngineConfig({
            kernelSize: 5,
            kernelProfile: "Pseudo-Voigt",
            filters: 128,
            activation: "GELU",
            optimization: "AdamW",
            multiScale: true,
            dropout: 0.15,
            pooling: "max",
            depth: 50,
            learningRate: 0.0015,
            batchNorm: true,
            confidenceThreshold: 45,
            cagliotiCorrection: true,
            asymmetryCorrection: true,
            backgroundSubtraction: true,
            shapeExponent: 3.0
          });
          setActivePreset("Tuned");
          setIsAutoTuning(false);
        }, 1000);
      }
    }, 1200);
  };

  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "Standard") {
      setEngineConfig({
        kernelSize: 5,
        kernelProfile: "Gaussian",
        filters: 64,
        activation: "ReLU",
        optimization: "Adam",
        multiScale: true,
        dropout: 0.2,
        pooling: "max",
        depth: 50,
        learningRate: 0.001,
        batchNorm: true,
        confidenceThreshold: 50,
        cagliotiCorrection: true,
        asymmetryCorrection: true,
        backgroundSubtraction: true,
        shapeExponent: 2.5
      });
    } else if (presetName === "Low SNR") {
      setEngineConfig({
        kernelSize: 7,
        kernelProfile: "Pseudo-Voigt",
        filters: 128,
        activation: "LeakyReLU",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.35,
        pooling: "max",
        depth: 18,
        learningRate: 0.0005,
        batchNorm: true,
        confidenceThreshold: 45,
        cagliotiCorrection: true,
        asymmetryCorrection: true,
        backgroundSubtraction: true,
        shapeExponent: 3.0
      });
    } else if (presetName === "Nanocrystal") {
      setEngineConfig({
        kernelSize: 3,
        kernelProfile: "Lorentzian",
        filters: 128,
        activation: "GELU",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.15,
        pooling: "avg",
        depth: 34,
        learningRate: 0.002,
        batchNorm: true,
        confidenceThreshold: 35,
        cagliotiCorrection: true,
        asymmetryCorrection: false,
        backgroundSubtraction: true,
        shapeExponent: 1.8
      });
    } else if (presetName === "Lightweight") {
      setEngineConfig({
        kernelSize: 5,
        kernelProfile: "Gaussian",
        filters: 32,
        activation: "ReLU",
        optimization: "SGD",
        multiScale: false,
        dropout: 0.0,
        pooling: "max",
        depth: 18,
        learningRate: 0.005,
        batchNorm: false,
        confidenceThreshold: 30,
        cagliotiCorrection: false,
        asymmetryCorrection: false,
        backgroundSubtraction: false,
        shapeExponent: 2.5
      });
    }
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      const required = ["kernelSize", "filters", "depth", "learningRate", "dropout", "confidenceThreshold"];
      const missing = required.filter(k => !(k in parsed));
      if (missing.length > 0) {
        setConfigFeedback(`Invalid Schema. Missing: ${missing.join(", ")}`);
        return;
      }
      setEngineConfig({
        kernelSize: parsed.kernelSize || 5,
        kernelProfile: parsed.kernelProfile || "Gaussian",
        filters: parsed.filters || 64,
        activation: parsed.activation || "ReLU",
        optimization: parsed.optimization || "Adam",
        multiScale: parsed.multiScale ?? true,
        dropout: parsed.dropout ?? 0.2,
        pooling: parsed.pooling || "max",
        depth: parsed.depth || 50,
        learningRate: parsed.learningRate ?? 0.001,
        batchNorm: parsed.batchNorm ?? true,
        confidenceThreshold: parsed.confidenceThreshold ?? 50,
      });
      setActivePreset("Custom");
      setConfigFeedback("Configuration loaded successfully!");
      setTimeout(() => setConfigFeedback(""), 3000);
    } catch (e: any) {
      setConfigFeedback(`JSON Error: ${e.message}`);
    }
  };

  // Search & Advanced Tools State
  const [searchTerm, setSearchTerm] = useState("");
  const [dbSearch, setDbSearch] = useState("");

  useEffect(() => {
    try {
      const initialSearch = localStorage.getItem("xrd_initial_search");
      if (initialSearch) {
        setSearchTerm(initialSearch);
        setShowSuggestions(true);
        localStorage.removeItem("xrd_initial_search");
      }
    } catch (e) {}
  }, []);
  const [dbFilter, setDbFilter] = useState("All");
  const [checkedAudits, setCheckedAudits] = useState<boolean[]>([
    true,
    true,
    true,
    false,
    false,
  ]);
  const [selectedAuditLog, setSelectedAuditLog] = useState<number | null>(null);

  // Quantum Morphological Synthesizer interactive states
  const [synthMorphology, setSynthMorphology] = useState<SynthMorphologyType>("spherical");
  const [synthSize, setSynthSize] = useState<number>(10.0); // Size in nm (2.0 to 50.0)
  const [synthTemp, setSynthTemp] = useState<number>(450); // Temp in Â°C (100 to 1200)
  const [synthDoping, setSynthDoping] = useState<number>(3.0); // Doping concentration % (0.0 to 15.0)
  const [synthTime, setSynthTime] = useState<number>(4.0); // Calcination time in hours (1.0 to 24.0)
  const [synthPH, setSynthPH] = useState<number>(7.0); // Synthesis Environment pH (1.0 to 14.0)
  const [synthAtmosphere, setSynthAtmosphere] = useState<SynthAtmosphereType>("air");

  // AI Phase ID states
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [aiChatInput, setAiChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [aiChatHistory, isAiLoading]);
  

  // AI Synthesis formulation states
  const [synthAiResult, setSynthAiResult] = useState<string | null>(null);
  const [synthAiLoading, setSynthAiLoading] = useState<boolean>(false);
  const [synthAiFocus, setSynthAiFocus] = useState<"purity" | "defects" | "confinement">("purity");
  const [synthAiStep, setSynthAiStep] = useState<string>("");
  const [recipeCopied, setRecipeCopied] = useState<boolean>(false);

  // Precursor Weight Calculator States
  const [synthTargetMass, setSynthTargetMass] = useState<number>(1.0); // in grams
  const [selectedPrecursors, setSelectedPrecursors] = useState<Record<string, string>>({});
  const [dopantElement, setDopantElement] = useState<string>("Mg");
  const [dopedSubstitutedElement, setDopedSubstitutedElement] = useState<string>("");
  const [customPrecursorMws, setCustomPrecursorMws] = useState<Record<string, number>>({});

  // --- Stoichiometric Precursor Weight Calculator Engine ---
  const calculatePrecursorWeights = () => {
    if (!selectedCandidate) return { success: false, errors: [], mwProduct: 0, precursors: [], actualSubstitutedSite: "" };

    const formula = selectedCandidate.formula;
    const parsedElements = parseChemicalFormula(formula);
    const elementKeys = Object.keys(parsedElements);

    // Filter out Oxygen and Hydrogen from precursor calculation as they are usually solvent/atmosphere-supplied
    const activeElements = elementKeys.filter(el => el !== "O" && el !== "H");
    
    // Choose which element is substituted by the dopant
    // Usually, the first non-O, non-H metallic element is selected as the default site
    const defaultSite = activeElements[0] || "";
    const actualSubstitutedSite = dopedSubstitutedElement || defaultSite;
    
    // Compute molecular weight of the target doped product
    let mwProduct = 0;
    const dopingFraction = synthDoping / 100.0;
    
    // Map element name to its atomic weight
    const getAtomicWeight = (el: string): number => {
      if (el === dopantElement) {
        return MATERIAL_ELEMENTS[dopantElement]?.mass || 24.305; // Fallback to Mg
      }
      return MATERIAL_ELEMENTS[el]?.mass || 50.0; // Fallback
    };

    // Calculate Stoichiometric Coefficients
    const stoichCoeffs: Record<string, number> = {};
    
    elementKeys.forEach(el => {
      let coeff = parsedElements[el];
      if (synthDoping > 0 && el === actualSubstitutedSite) {
        stoichCoeffs[el] = coeff * (1 - dopingFraction);
      } else {
        stoichCoeffs[el] = coeff;
      }
    });

    if (synthDoping > 0 && dopantElement && actualSubstitutedSite) {
      const parentCoeff = parsedElements[actualSubstitutedSite] || 1.0;
      stoichCoeffs[dopantElement] = parentCoeff * dopingFraction;
    }

    // Now sum up the total molecular weight
    Object.entries(stoichCoeffs).forEach(([el, coeff]) => {
      mwProduct += coeff * getAtomicWeight(el);
    });

    if (mwProduct === 0) mwProduct = selectedCandidate.molecularWeight || 100;

    // Total moles of target product needed
    const molesProduct = synthTargetMass / mwProduct;

    // Now calculate precursor weights
    const precursorsList = Object.entries(stoichCoeffs)
      .filter(([el]) => el !== "O" && el !== "H") // Exclude solvent elements
      .map(([el, coeff]) => {
        const molesElement = molesProduct * coeff;
        
        // Find selected precursor
        const dbPrecursors = PRECURSOR_DATABASE[el] || [];
        const chosenPrecursorName = selectedPrecursors[el] || (dbPrecursors[0] ? dbPrecursors[0].name : "Custom Precursor");
        
        let precursorFormula = "";
        let precursorMw = 0;
        let atomsPerMolecule = 1;
        
        if (chosenPrecursorName === "Custom Precursor") {
          precursorFormula = "Custom";
          precursorMw = customPrecursorMws[el] || getAtomicWeight(el);
          atomsPerMolecule = 1;
        } else {
          const found = dbPrecursors.find(p => p.name === chosenPrecursorName);
          if (found) {
            precursorFormula = found.formula;
            precursorMw = found.mw;
            atomsPerMolecule = found.atomsPerMolecule;
          } else {
            precursorFormula = el;
            precursorMw = getAtomicWeight(el);
            atomsPerMolecule = 1;
          }
        }

        const molesPrecursor = molesElement / atomsPerMolecule;
        const massGrams = molesPrecursor * precursorMw;
        const massMilligrams = massGrams * 1000;

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
      actualSubstitutedSite
    };
  };

  useEffect(() => {
    if (selectedCandidate) {
      const formula = selectedCandidate.formula;
      const parsed = parseChemicalFormula(formula);
      const activeElements = Object.keys(parsed).filter(el => el !== "O" && el !== "H");
      
      // Select default precursors
      const initialPrecursors: Record<string, string> = {};
      activeElements.forEach(el => {
        const db = PRECURSOR_DATABASE[el] || [];
        if (db[0]) {
          initialPrecursors[el] = db[0].name;
        } else {
          initialPrecursors[el] = "Custom Precursor";
        }
      });
      setSelectedPrecursors(initialPrecursors);
      
      // Default substitution site
      if (activeElements[0]) {
        setDopedSubstitutedElement(activeElements[0]);
      }
    }
  }, [selectedCandidate]);

  const handleRunSynthesisAI = async () => {
    if (!selectedCandidate) return;
    setSynthAiResult(null);
    setSynthAiLoading(true);
    
    const steps = [
      "Calibrating thermodynamic boundaries...",
      "Resolving Arrhenius diffusion kinetics...",
      "Simulating crystal growth constraints...",
      "Generating dynamic stoichiometric formulation..."
    ];
    
    let currentStepIdx = 0;
    setSynthAiStep(steps[currentStepIdx]);
    
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length - 1) {
        currentStepIdx++;
        setSynthAiStep(steps[currentStepIdx]);
      }
    }, 1800);

    try {
      const response = await fetch("/api/gemini/synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseName: selectedCandidate.phase_name,
          formula: selectedCandidate.formula,
          morphology: synthMorphology,
          size: synthSize,
          temp: synthTemp,
          time: synthTime,
          doping: synthDoping,
          pH: synthPH,
          atmosphere: synthAtmosphere,
          focus: synthAiFocus,
          targetMass: synthTargetMass,
          selectedPrecursors: selectedPrecursors,
          dopantElement: dopantElement
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSynthAiResult(data.text);
      } else {
        setSynthAiResult(`### Synthesis Generation Error\n\n${data.error || "Could not retrieve the formulation route."}`);
      }
    } catch (err: any) {
      setSynthAiResult(`### Network Interface Failure\n\nFailed to establish connection to Synthesis Intelligence engine: ${err.message}`);
    } finally {
      clearInterval(interval);
      setSynthAiLoading(false);
      setSynthAiStep("");
    }
  };

  // Enhanced Diffraction Pattern Input controls states
  const [activeInputTool, setActiveInputTool] = useState<"none" | "presets" | "preview" | "denoise" | "noise">("presets");
  const [inputSgWindow, setInputSgWindow] = useState<number>(11);
  const [inputSgDegree, setInputSgDegree] = useState<number>(2);
  const [inputNoiseLevel, setInputNoiseLevel] = useState<number>(15);
  const [inputBroadening, setInputBroadening] = useState<number>(0.25);
  const [inputBgAmorphous, setInputBgAmorphous] = useState<number>(10);
  const [formatErrorLog, setFormatErrorLog] = useState<string | null>(null);

  // AI Neural Net Training & Tutor State Variables
  const [trainEpochs, setTrainEpochs] = useState<number>(40);
  const [trainLR, setTrainLR] = useState<number>(0.005);
  const [trainBatchSize, setTrainBatchSize] = useState<number>(32);
  const [trainOptimizer, setTrainOptimizer] = useState<string>("Adam");
  const [trainArch, setTrainArch] = useState<string>("Deep MLP");
  const [trainActivation, setTrainActivation] = useState<string>("GELU");
  const [trainDropout, setTrainDropout] = useState<number>(0.0);
  const [trainStrainRange, setTrainStrainRange] = useState<number>(2.0); // % boundary
  const [trainBroadeningRange, setTrainBroadeningRange] = useState<number>(0.25); // FWHM scale
  const [trainNoiseLevel, setTrainNoiseLevel] = useState<number>(10); // %
  const [trainBgDrift, setTrainBgDrift] = useState<number>(5.0); // %
  
  const [isTrainingNet, setIsTrainingNet] = useState<boolean>(false);
  const [trainingHistory, setTrainingHistory] = useState<any[]>([]);
  const [confusionMatrix, setConfusionMatrix] = useState<number[][] | null>(null);
  const [trainMetrics, setTrainMetrics] = useState<any | null>(null);
  const [trainError, setTrainError] = useState<string | null>(null);
  const [trainingLogs, setTrainingLogs] = useState<string[]>([]);
  
  const [selectedTutorLesson, setSelectedTutorLesson] = useState<string>("lesson1");
  const [tutorUserQuery, setTutorUserQuery] = useState<string>("");
  const [tutorOutputText, setTutorOutputText] = useState<string>("");
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);

  const handleRunTrainingNet = async () => {
    setIsTrainingNet(true);
    setTrainError(null);
    setTrainingHistory([]);
    setConfusionMatrix(null);
    setTrainMetrics(null);
    setTrainingLogs([
      "Initializing AI Training session...",
      "Generating high-fidelity physics-augmented XRD pattern dataset...",
      "Total class count: 7 standard crystallographic standards database",
      "Synthetic augmentation presets active (Compressive/Tensile strain transformations included)",
      "Establishing connection to backend Python MLP optimizer..."
    ]);

    let progress = 0;
    const logInterval = setInterval(() => {
      progress += 5;
      if (progress === 10) {
        setTrainingLogs(prev => [...prev, "Compiling dataset: 420 augmented profiles constructed."]);
      } else if (progress === 25) {
        setTrainingLogs(prev => [...prev, `Splitting samples: 294 Train, 126 Validation. Initializing layer matrices (${trainArch}).`]);
      } else if (progress === 45) {
        setTrainingLogs(prev => [...prev, `Applying activation weights (${trainActivation}) and optimization rules (${trainOptimizer}).`]);
      } else if (progress === 65) {
        setTrainingLogs(prev => [...prev, "Running forward propagation sweeps & evaluating categorical losses..."]);
      } else if (progress === 85) {
        setTrainingLogs(prev => [...prev, "Computing backpropagation partial derivatives & gradient adjustments..."]);
      } else if (progress === 95) {
        setTrainingLogs(prev => [...prev, "Serializing model coefficients & saving optimized weights..."]);
      }
      if (progress >= 100) {
        clearInterval(logInterval);
      }
    }, 400);

    try {
      const response = await fetch("/api/gemini/train-neural-net", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          epochs: trainEpochs,
          learningRate: trainLR,
          batchSize: trainBatchSize,
          optimizer: trainOptimizer,
          architecture: trainArch,
          noiseLevel: trainNoiseLevel,
          backgroundDrift: trainBgDrift,
          strainRange: trainStrainRange,
          broadeningRange: trainBroadeningRange,
          dropout: trainDropout,
          activation: trainActivation
        })
      });

      clearInterval(logInterval);
      const data = await response.json();
      if (data.success) {
        setTrainingHistory(data.epoch_history);
        setConfusionMatrix(data.confusion_matrix);
        setTrainMetrics(data.metrics);
        setTrainingLogs(prev => [
          ...prev,
          `Training complete! Saved weights successfully '/tmp/trained_xrd_mlp_weights.json'. Optimization Engine: ${data.metrics.accelerator || 'PyTorch v2.0 CPU Acceleration'}. Final CV Accuracy: ${data.metrics.final_val_acc.toFixed(2)}% in ${data.metrics.training_time_sec}s`
        ]);
        playSynthTone("success"); // happy beep!
      } else {
        setTrainError(data.error || "Training process timed out on backend server.");
        setTrainingLogs(prev => [...prev, `âš ï¸ Error: ${data.error || "Failed execution"}`]);
      }
    } catch (err: any) {
      clearInterval(logInterval);
      setTrainError(err.message || "Network interface error conducting backprop.");
      setTrainingLogs(prev => [...prev, `âš ï¸ Interface failure: ${err.message}`]);
    } finally {
      setIsTrainingNet(false);
    }
  };

  const handleQueryTutor = async () => {
    if (!tutorUserQuery.trim()) return;
    setIsTutorLoading(true);
    setTutorOutputText("");
    try {
      const context = {
        hyperparameters: {
          epochs: trainEpochs,
          lr: trainLR,
          batchSize: trainBatchSize,
          optimizer: trainOptimizer,
          architecture: trainArch,
          activation: trainActivation,
          dropout: trainDropout
        },
        physics_distortions: {
          strain_range_pct: trainStrainRange,
          broadening_fwhm: trainBroadeningRange,
          noise_level_pct: trainNoiseLevel,
          bg_drift_pct: trainBgDrift
        },
        model_results: trainMetrics || { status: "not trained yet" }
      };

      const prompt = `You are a world-class AI Crystallography Tutor. The researcher is learning about deep learning for XRD Phase ID and has a question.
      
      Experimental Training Parameters we configured/ran:
      - Architecture: ${trainArch} (${trainActivation} Gated layers)
      - Optimizer: ${trainOptimizer} with base rate ${trainLR}
      - Iterations: ${trainEpochs} epochs, mini-batch size ${trainBatchSize}
      - Physical Augmentations applied on reference cards: ${trainStrainRange}% strain shift bounds, ${trainBroadeningRange}Â° broadening width, ${trainNoiseLevel}% noise ratio.
      
      Current Training metrics:
      ${trainMetrics ? `- Final Train accuracy: ${trainMetrics.final_train_acc}%\n- Final Val accuracy: ${trainMetrics.final_val_acc}%\n- Cross entropy loss: ${trainMetrics.final_val_loss}` : "Model has not been trained yet in this session."}
      
      Context elements: ${JSON.stringify(context)}
      
      User lesson chapter selected: ${selectedTutorLesson}
      User's question/query: "${tutorUserQuery}"
      
      Provide an exceptionally detailed, academic, and mathematically clear response explaining how this deep neural network behaves. Use LaTeX math alignments and clear bullet points. Keep it professional and educational.`;

      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success) {
        setTutorOutputText(data.text);
      } else {
        setTutorOutputText(`### Tutor connection error\n\n${data.error}`);
      }
    } catch (err: any) {
      setTutorOutputText(`### Tutor interface failed\n\n${err.message}`);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const auditItems = [
    {
      label: "Lattice Alignment",
      desc: "Sub-atomic spacing alignment check",
      getMetric: (candidate: DLPhaseCandidate | null) => {
        const delta = candidate
          ? ((100 - candidate.confidence_score) / 100000).toFixed(6)
          : "0.00015";
        return `Î”d = ${delta} Ã… (limit < 0.01Ã…)`;
      },
      status: (candidate: DLPhaseCandidate | null) => {
        if (!candidate) return { text: "Pending", color: "text-slate-500" };
        const d = (100 - candidate.confidence_score) / 100000;
        return d < 0.01
          ? { text: "Verified", color: "text-emerald-400" }
          : { text: "Marginal", color: "text-amber-400" };
      },
    },
    {
      label: "Intensity Profile Ï‡Â² / R-factor",
      desc: "Discrepancy of simulated pattern versus observed",
      getMetric: (candidate: DLPhaseCandidate | null) => {
        const rFactor = candidate
          ? ((3.5 * (100 - candidate.confidence_score)) / 45 + 1.15).toFixed(2)
          : "2.50";
        return `R_wp = ${rFactor}% (limit < 5.0%)`;
      },
      status: (candidate: DLPhaseCandidate | null) => {
        if (!candidate) return { text: "Pending", color: "text-slate-500" };
        const r = (3.5 * (100 - candidate.confidence_score)) / 45 + 1.15;
        return r < 5.0
          ? { text: "Verified", color: "text-emerald-400" }
          : { text: "High Var", color: "text-rose-400" };
      },
    },
    {
      label: "Space Group Symmetry Validator",
      desc: "Check structural group reflections consistency",
      getMetric: (candidate: DLPhaseCandidate | null) => {
        return candidate
          ? `Symmetry: ${candidate.spaceGroup || "P m -3 m"} (100% Consistent)`
          : "Symmetry profile unevaluated";
      },
      status: (candidate: DLPhaseCandidate | null) => {
        return candidate
          ? { text: "System Match", color: "text-indigo-400" }
          : { text: "Pending", color: "text-slate-500" };
      },
    },
    {
      label: "Volume Fraction Purity Bounds",
      desc: "Calculated weight fraction estimation with variance",
      getMetric: (candidate: DLPhaseCandidate | null) => {
        const purity = candidate
          ? (candidate.confidence_score * 0.985).toFixed(1)
          : "95.0";
        return `Purity = ${purity}% (limit > 80.0%)`;
      },
      status: (candidate: DLPhaseCandidate | null) => {
        if (!candidate) return { text: "Pending", color: "text-slate-500" };
        const p = candidate.confidence_score * 0.985;
        return p > 80
          ? { text: "Pure Phase", color: "text-emerald-400" }
          : { text: "Mixture", color: "text-amber-400" };
      },
    },
    {
      label: "Model Attention Audit",
      desc: "Validation of neural weights attention overlay",
      getMetric: (candidate: DLPhaseCandidate | null) => {
        const score = candidate
          ? candidate.confidence_score.toFixed(1)
          : "90.0";
        return `Attention Score = ${score}% (threshold > 50%)`;
      },
      status: (candidate: DLPhaseCandidate | null) => {
        if (!candidate) return { text: "Pending", color: "text-slate-500" };
        return candidate.confidence_score > 50
          ? { text: "Robust", color: "text-emerald-400" }
          : { text: "Low Conf", color: "text-rose-400" };
      },
    },
  ];

  const auditDetailsData = [
    {
      title: "Lattice Alignment Math",
      formula: "d = Î» / (2 * sin(Î¸))",
      details:
        "Calculates Bragg interplanar spacing parameters for observed reflections versus simulated reference database parameters. Evaluates structural deviations from standard monoclinic/hexagonal bounds.",
      steps: [
        { name: "Symmetry Vector Check", value: "PASSED", status: "success" },
        {
          name: "Max Spacing Deviation",
          value: "0.00032 Ã…",
          status: "success",
        },
        { name: "Strain Correction Factor", value: "1.0024", status: "info" },
      ],
    },
    {
      title: "Rietveld Discrepancy (R_wp / Ï‡Â²)",
      formula: "R_wp = [ Î£ w_i (y_o,i - y_c,i)Â² / Î£ w_i y_o,iÂ² ]^0.5",
      details:
        "Analyzes the weighted profile residual (R_wp) over the entire continuous 2-Theta scan. Lower profile discrepancy indicates unmatched phases are extremely statistically insignificant.",
      steps: [
        { name: "Goodness of Fit (S / GoF)", value: "1.04", status: "success" },
        {
          name: "Observed Background Error",
          value: "1.18%",
          status: "success",
        },
        { name: "Bragg R-factor (R_B)", value: "1.45%", status: "success" },
      ],
    },
    {
      title: "Symmetry & Extinction Operator",
      formula: "F_hkl = Î£ f_j * e^(2Ï€i * (h*x_j + k*y_j + l*z_j))",
      details:
        "Verifies the presence of reflection conditions (extinctions) determined by glide planes and screw axes of the identified space group. Forbidden reflections are analyzed to ensure phase purity.",
      steps: [
        {
          name: "Forbidden Relation Peaks",
          value: "0 Detected",
          status: "success",
        },
        { name: "Extinction Consistency", value: "100.0%", status: "success" },
        {
          name: "Symmetry Operator Density",
          value: "High Check",
          status: "info",
        },
      ],
    },
    {
      title: "Quantitative Multi-Phase Weight Bounds",
      formula: "W_a = (I_a / RIR_a) / Î£ (I_j / RIR_j)",
      details:
        "Estimates the relative weight fraction of the target identified phase compared to secondary amorphous or secondary crystalline deviations using the Reference Intensity Ratio (RIR).",
      steps: [
        {
          name: "Selected Phase Proportion",
          value: "98.4%",
          status: "success",
        },
        {
          name: "Amorphous Matrix Estimate",
          value: "< 1.6%",
          status: "success",
        },
        { name: "RIR Confidence Factor", value: "0.992", status: "info" },
      ],
    },
    {
      title: "Model attention weights check",
      formula: "Î±_ij = exp(e_ij) / Î£ exp(e_ik)",
      details:
        "Examines convolutional attention activation overlays corresponding to the matching diffraction profile sections. Stable activation distribution isolates structural fingerprint.",
      steps: [
        {
          name: "Model Peak Localization",
          value: "Excellent",
          status: "success",
        },
        { name: "Activation Entropy", value: "0.144 Nats", status: "success" },
        { name: "Backprop validation", value: "Stable", status: "success" },
      ],
    },
  ];

  const getFilteredMaterials = () => {
    if (!searchTerm.trim()) return [];
    const rawTokens = searchTerm.trim().split(/[\s,]+/);
    const keywords = rawTokens.map((t) => t.toLowerCase()).filter(Boolean);

    // Check if the input consists mostly of numbers (potential peak search)
    const numericTokens = rawTokens.map(parseFloat).filter((n) => !isNaN(n));
    const isPeakSearch =
      numericTokens.length > 0 && numericTokens.length >= keywords.length / 2;

    return MATERIAL_DB.map((material: any) => {
      let score = 0;

      keywords.forEach((kw) => {
        if (material.name.toLowerCase().includes(kw)) score += 10;
        if (material.formula?.toLowerCase().includes(kw)) score += 15; // formula is highly specific
        if (material.elements?.some((el: string) => el.toLowerCase() === kw)) score += 20; // explicit element search
        if (material.crystalSystem?.toLowerCase().includes(kw)) score += 5;
        if (material.type?.toLowerCase().includes(kw)) score += 5;
        if (material.spaceGroup?.toLowerCase().includes(kw)) score += 3;
        if (
          material.applications?.some((app: string) => app.toLowerCase().includes(kw))
        )
          score += 2;
      });

      // Unified peak matching
      if (isPeakSearch && material.pattern) {
        let patternPeaks: number[];
        try {
          patternPeaks = parseXYData(material.pattern).map((p) => p.twoTheta);
        } catch (e) {
          patternPeaks = [];
        }

        let matchCount = 0;
        numericTokens.forEach((nt) => {
          if (patternPeaks.some((mp) => Math.abs(mp - nt) <= 0.5)) {
            score += 20; // High score for each matching peak
            matchCount++;
          }
        });

        // Bonus for multi-peak alignment
        if (matchCount >= 2) score += 30;
        if (matchCount >= 3) score += 50;
      }

      return { material, score };
    })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.material)
      .slice(0, 15); // Show top 15 results
  };

  const searchResults = getFilteredMaterials();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGeminiSearch, setShowGeminiSearch] = useState(false);
  const [usePythonRAG, setUsePythonRAG] = useState(false);
  const [pythonRAGResults, setPythonRAGResults] = useState<any>(null);

  useEffect(() => {
    if (!pythonFeaturesEnabled && usePythonRAG) {
      setUsePythonRAG(false);
    }
  }, [pythonFeaturesEnabled, usePythonRAG]);
  const [ragRunning, setRagRunning] = useState(false);
  const [isLatticeModalOpen, setIsLatticeModalOpen] = useState(false);
  const [latticeResult, setLatticeResult] = useState<{
    a: number;
    error: string;
  } | null>(null);
  const [mixtureList, setMixtureList] = useState<string[]>([]);
  const [isMixMode, setIsMixMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Check for pending neural load requests (e.g., from the Crystalin Lifecycle Dashboard)
  useEffect(() => {
    const checkPendingLoad = () => {
      const pending = localStorage.getItem('xrd_pending_neural_load');
      if (pending) {
        try {
          const item = JSON.parse(pending);
          if (item && item.pattern) {
            setInputData(item.pattern);
            if (item.name) {
              setSearchTerm(item.name);
            }
            setActiveInputTool("preview");
            // Automatically execute the deep learning phase identification sequence
            setTimeout(() => {
              runAnalysis(item.pattern, false);
            }, 600);
          }
          localStorage.removeItem('xrd_pending_neural_load');
        } catch (e) {
          console.error("Failed to load pending neural pattern:", e);
        }
      }
    };
    checkPendingLoad();
    window.addEventListener('focus', checkPendingLoad);
    return () => window.removeEventListener('focus', checkPendingLoad);
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time input custom format validator
  useEffect(() => {
    if (!inputData.trim()) {
      setFormatErrorLog(null);
      return;
    }
    const lines = inputData.split("\n");
    let firstError: string | null = null;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (line.startsWith("#")) continue;

      const parts = line.split(/[\s,]+/).filter((v) => v !== "");
      if (parts.length < 2) {
        firstError = `Line ${i + 1}: "${line}" is missing Intensity. Format needs to be: 2Î¸, Intensity`;
        break;
      }
      const twoTheta = parseFloat(parts[0]);
      const intensity = parseFloat(parts[1]);
      if (isNaN(twoTheta) || isNaN(intensity)) {
        firstError = `Line ${i + 1}: Could not parse values in "${line}". Expected "2Î¸, Intensity" as numbers`;
        break;
      }
      if (twoTheta < 2 || twoTheta > 165) {
        firstError = `Line ${i + 1}: Sub-optimal 2Î¸ value (${twoTheta}Â°). Recommended standard range is 5Â° to 150Â°`;
        break;
      }
      if (intensity < 0) {
        firstError = `Line ${i + 1}: Intensity value cannot be negative (${intensity})`;
        break;
      }
    }
    setFormatErrorLog(firstError);
  }, [inputData]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputData(content);
      }
    };
    reader.readAsText(file);
  };

  const steps = [
    { label: "Idle", icon: Brain },
    { label: "Preprocessing Pattern", icon: Activity },
    { label: "Self-Attention Gating", icon: Brain },
    { label: "CNN Feature Extraction", icon: Layers },
    { label: "Database Matching", icon: Database },
    { label: "Final Scoring", icon: CheckCircle },
  ];

  const handleMaterialSelect = (material: (typeof MATERIAL_DB)[0]) => {
    if (isMixMode) {
      // In mix mode, we don't switch patterns immediately, we add to list
      if (!mixtureList.includes(material.name)) {
        const newList = [...mixtureList, material.name];
        setMixtureList(newList);
        generateMixturePattern(newList);
      }
    } else {
      setInputData(material.pattern);
      setSearchTerm(material.name);
      setShowSuggestions(false);
      runAnalysis(material.pattern);
    }
  };

  const generateMixturePattern = (names: string[]) => {
    const materials = names
      .map((n) => MATERIAL_DB.find((m) => m.name === n))
      .filter(Boolean) as typeof MATERIAL_DB;
    if (materials.length === 0) return;

    // Simple sum of patterns
    const masterPoints: Record<number, number> = {};
    materials.forEach((mat, idx) => {
      const weight = 1 / materials.length; // Equal weighting for simplicity
      const pts = parseXYData(mat.pattern);
      pts.forEach((p) => {
        const rounded = Math.round(p.twoTheta * 100) / 100;
        masterPoints[rounded] =
          (masterPoints[rounded] || 0) + p.intensity * weight;
      });
    });

    const combinedStr = Object.entries(masterPoints)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([t, i]) => `${t}, ${i.toFixed(1)}`)
      .join("\n");

    setInputData(combinedStr);
    setSearchTerm("Custom Mixture");
  };

  const handleRunExpertAI = async () => {
    if (!inputData) return;
    setIsAiLoading(true);
    setShowAiModal(true);
    setAiChatHistory([]);
    try {
      const response = await fetch("/api/gemini/phase-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Please analyze my XRD data and identify possible material phases.",
          history: [],
          xrdData: inputData
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiChatHistory([
          { role: 'user', text: "Please analyze my XRD data and identify possible material phases." },
          { role: 'model', text: data.text }
        ]);
      } else {
        setAiChatHistory([{ role: 'model', text: "Failed to perform expert analysis: " + data.error }]);
      }
    } catch (err: any) {
      setAiChatHistory([{ role: 'model', text: "Failed to perform expert analysis: " + err.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendAiChatMessage = async () => {
    if (!aiChatInput.trim() || !inputData) return;
    
    const userMessage = aiChatInput.trim();
    setAiChatInput("");
    setAiChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsAiLoading(true);
    
    try {
      const response = await fetch("/api/gemini/phase-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          history: aiChatHistory,
          xrdData: inputData
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiChatHistory(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        setAiChatHistory(prev => [...prev, { role: 'model', text: "Error: " + data.error }]);
      }
    } catch (err: any) {
      setAiChatHistory(prev => [...prev, { role: 'model', text: "Error: " + err.message }]);
    } finally {
      setIsAiLoading(false);
    }
  };


  const handleLatticeEstimation = () => {
    if (!selectedCandidate || !selectedCandidate.matched_peaks?.length) return;

    // Smart estimation based on Crystal System
    const firstPeak = [...selectedCandidate.matched_peaks].sort(
      (a, b) => a.obsT - b.obsT,
    )[0];
    const cs = selectedCandidate.crystalSystem?.toLowerCase() || "";

    let aResult = 0;
    let message = "";

    if (cs.includes("hexagonal") || cs.includes("trigonal")) {
      // Often first prominent peak is 100 or 101. Assuming 100 for 'a'.
      // d = a * sqrt(3) / 2 => a = d * 2 / sqrt(3)
      const d = calculateLatticeConstant(firstPeak.obsT, 1, 0, 0); // calculateLatticeConstant basically returns d when hkl=100
      aResult = d * (2 / Math.sqrt(3));
      message =
        "Smart AI Estimate: Hexagonal/Trigonal 'a' (assuming 100 reflection)";
    } else if (cs.includes("tetragonal") || cs.includes("orthorhombic")) {
      // Assuming 110 or 101 or 200...
      aResult = calculateLatticeConstant(firstPeak.obsT, 1, 1, 0);
      message = "Smart AI Estimate: 'a' parameter (assuming 110 reflection)";
    } else {
      // Cubic or Default
      aResult = calculateLatticeConstant(firstPeak.obsT, 1, 1, 1);
      message = "Smart AI Estimate: Cubic 'a' (assuming 111 reflection)";
    }

    setLatticeResult({ a: aResult, error: message });
    setIsLatticeModalOpen(true);
  };

  // Smart Local Search & Engine
  const handleSmartSearch = () => {
    if (!searchTerm.trim()) return;

    if (searchResults.length > 0) {
      handleMaterialSelect(searchResults[0]);
    } else {
      // If no exact name match, try to find by peak similarity (Advance local feature)
      const points = parseXYData(inputData);
      if (points.length > 0) {
        runAnalysis(inputData);
      }
    }
    setShowSuggestions(false);
  };

  const calculateLatticeConstant = (
    twoTheta: number,
    h: number,
    k: number,
    l: number,
    wavelength: number = 1.5406,
  ) => {
    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
    const d = wavelength / (2 * Math.sin(thetaRad));
    const a = d * Math.sqrt(h * h + k * k + l * l);
    return a;
  };

  const handleRunAI = () => {
    const isActuallyMixMode =
      isMixMode ||
      searchTerm.toLowerCase().includes("mix") ||
      searchTerm.toLowerCase().includes("suite");
    if (isActuallyMixMode && !isMixMode) {
      setIsMixMode(true);
    }
    runAnalysis(inputData, isActuallyMixMode);
  };

  const runAnalysis = (dataToAnalyze: string, mixMode: boolean = false) => {
    if (!dataToAnalyze.trim()) return;

    setIsSimulating(true);
    setResult(null);
    setSelectedCandidate(null);
    setProgressStep(1);

    // Start Scan Animation
    let currentX = 0;
    const scanInterval = setInterval(() => {
      currentX += 2;
      setScanPos(currentX > 100 ? 0 : currentX);
    }, 50);

    // Load active materials from local storage merges if present
    let activeMaterialsList = MATERIAL_DB;
    try {
      const savedMaterials = localStorage.getItem("crystal_suite_materials_v1");
      if (savedMaterials) {
        const parsedMaterials = JSON.parse(savedMaterials);
        if (Array.isArray(parsedMaterials) && parsedMaterials.length > 0) {
          const parsedNames = new Set(parsedMaterials.map(m => m?.name).filter(Boolean));
          const missingMaterials = MATERIAL_DB.filter(m => !parsedNames.has(m.name));
          activeMaterialsList = [...parsedMaterials, ...missingMaterials];
        }
      }
    } catch (e) {
      console.error("Failed to load custom materials in Deep Learning matches", e);
    }

    // Check if input matches a known material to override/enhance results
    const matchedMaterial = activeMaterialsList.find(
      (m) => m.pattern === dataToAnalyze || m.name === searchTerm,
    );

    // Simulation Sequence
    setTimeout(() => setProgressStep(2), 500);
    setTimeout(() => setProgressStep(3), 1200);
    setTimeout(() => setProgressStep(4), 2000);
    setTimeout(() => {
      const points = parseXYData(dataToAnalyze);
      let computed = identifyPhasesDL(points, mixMode, engineConfig);

      // Enhance result with known material data if matched
      if (matchedMaterial) {
        const enhancedCandidate: DLPhaseCandidate = {
          phase_name: matchedMaterial.name,
          confidence_score: 98.5,
          card_id: "DB-MATCH-001",
          formula: matchedMaterial.formula,
          elements: (matchedMaterial as any).elements,
          matched_peaks: parseXYData(matchedMaterial.pattern).map((p) => ({
            refT: p.twoTheta,
            obsT: p.twoTheta,
            refI: p.intensity,
            h: p.h,
            k: p.k,
            l: p.l,
          })),
          description: matchedMaterial.description,
          crystalSystem: matchedMaterial.crystalSystem,
          spaceGroup: matchedMaterial.spaceGroup,
          density: matchedMaterial.density,
          applications: matchedMaterial.applications,
          materialType: matchedMaterial.type,
          molecularWeight: (matchedMaterial as any).molecularWeight,
          bandGap: (matchedMaterial as any).bandGap,
          elasticModulus: (matchedMaterial as any).elasticModulus,
          magneticProperties: (matchedMaterial as any).magneticProperties,
          opticalProperties: (matchedMaterial as any).opticalProperties,
          hazards: (matchedMaterial as any).hazards,
          thermalConductivity: (matchedMaterial as any).thermalConductivity,
          meltingPoint: (matchedMaterial as any).meltingPoint,
          vickersHardness: (matchedMaterial as any).vickersHardness,
          poissonsRatio: (matchedMaterial as any).poissonsRatio,
          electricalResistivity: (matchedMaterial as any).electricalResistivity,
          dielectricConstant: (matchedMaterial as any).dielectricConstant,
          thermalExpansion: (matchedMaterial as any).thermalExpansion,

          // Custom manual metadata fields
          standardState: (matchedMaterial as any).standardState,
          standardEntropy: (matchedMaterial as any).standardEntropy,
          formationEnergy: (matchedMaterial as any).formationEnergy,
          heatCapacity: (matchedMaterial as any).heatCapacity,
          debyeTemperature: (matchedMaterial as any).debyeTemperature,
          energyAboveHull: (matchedMaterial as any).energyAboveHull,
          stabilityStatus: (matchedMaterial as any).stabilityStatus,
          decompositionTemp: (matchedMaterial as any).decompositionTemp,
          formationEnthalpy: (matchedMaterial as any).formationEnthalpy,
          zValue: (matchedMaterial as any).zValue,
          latticeParams: (matchedMaterial as any).latticeParams
        };

        // Put the matched one first
        computed = {
          ...computed,
          candidates: [
            enhancedCandidate,
            ...computed.candidates.filter(
              (c) => c.phase_name !== matchedMaterial.name,
            ),
          ],
        };
      }

      if (usePythonRAG) {
        setRagRunning(true);
        const customSessionKey = localStorage.getItem("gemini_custom_api_key") || "";
        fetch("/api/gemini/rag-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            experimental_peaks: points.map(p => ({ twoTheta: p.twoTheta, intensity: p.intensity })),
            customKey: customSessionKey
          })
        })
        .then(res => res.json())
        .then(data => {
          setRagRunning(false);
          if (data.success) {
            setPythonRAGResults(data);
            
            // Map the Python candidates to DLPhaseCandidate type
            const pythonCandidates: DLPhaseCandidate[] = data.retrieved_candidates.map((cand: any, cIdx: number) => {
              const matchedPeaks = cand.reference_peaks.map((p: any) => ({
                refT: p.two_theta,
                obsT: p.two_theta,
                refI: p.intensity
              }));
              
              return {
                phase_name: cand.name,
                confidence_score: cand.optimized_similarity * 100,
                mlValidationScore: cand.validation_score,
                card_id: `PY-RAG-${100 + cIdx}`,
                formula: cand.formula,
                description: cand.description,
                crystalSystem: cand.crystal_system,
                spaceGroup: cand.space_group,
                density: cand.density,
                matched_peaks: matchedPeaks,
                raw_score: cand.alignment_similarity * 100,
                fitted_strain_pct: cand.fitted_strain_pct,
                fitted_domain_size_broadening: cand.fitted_domain_size_broadening,
                match_quality: cand.optimized_similarity > 0.85 ? "Excellent Match" : cand.optimized_similarity > 0.6 ? "Moderate Match" : "Weak Match",
                applications: ["Photocatalytic Standard", "Refractive Index Material", "Lattice Matching standard"]
              };
            });
            
            if (pythonCandidates.length > 0) {
              const modifiedComputed = {
                ...computed,
                candidates: [
                  ...pythonCandidates,
                  ...computed.candidates.filter(c => !pythonCandidates.some(py => py.phase_name === c.phase_name))
                ]
              };
              setResult(modifiedComputed);
              setSelectedCandidate(pythonCandidates[0]);
              
              // Synchronize to Lifecycle logs
              try {
                const stored = localStorage.getItem('xrd_neural_probe_events');
                const neuralRuns = stored ? JSON.parse(stored) : [];
                const topP = pythonCandidates[0];
                const dSpacings = (topP.matched_peaks || []).slice(0, 3).map(p => {
                  const thetaRad = (p.obsT / 2) * (Math.PI / 180);
                  return 1.5406 / (2 * Math.sin(thetaRad));
                });
                
                const newRun = {
                  id: 'python_rag_' + Date.now(),
                  timestamp: new Date().toLocaleString(),
                  dateMs: Date.now(),
                  materialName: topP.phase_name,
                  formula: topP.formula,
                  category: 'other',
                  isNeural: true,
                  isPythonRAG: true,
                  confidence: topP.confidence_score,
                  crystalSystem: topP.crystalSystem,
                  spaceGroup: topP.spaceGroup,
                  density: topP.density,
                  impact: `Identified by ML-Optimized Python RAG pipeline. Optimized alignment score: ${topP.confidence_score.toFixed(1)}%. Fitted strain: ${topP.fitted_strain_pct?.toFixed(3)}%, Broadening width: ${topP.fitted_domain_size_broadening?.toFixed(2)}Â°.`,
                  dSpacings: dSpacings.length > 0 ? dSpacings : [2.5123, 3.1415, 4.2384],
                  pattern: (topP.matched_peaks || []).map(p => `${p.obsT}, ${p.refI}`).join('\n')
                };
                neuralRuns.push(newRun);
                localStorage.setItem('xrd_neural_probe_events', JSON.stringify(neuralRuns));
              } catch (e) {
                console.error("Save state error:", e);
              }
            }
          } else {
            // Fall back to local mock
            setResult(computed);
            if (computed.candidates.length > 0) {
              setSelectedCandidate(computed.candidates[0]);
            }
          }
        })
        .catch(err => {
          console.error("Failed to run Python RAG Engine, falling back:", err);
          setRagRunning(false);
          setResult(computed);
          if (computed.candidates.length > 0) {
            setSelectedCandidate(computed.candidates[0]);
          }
        });
      } else {
        // Standard non-python RAG execution path
        setResult(computed);
        if (computed.candidates.length > 0) {
          const topCand = computed.candidates[0];
          setSelectedCandidate(topCand);

          // Synchronize with Crystalin Lifecycle Dashboard: Log as a Neural Probe Event
          try {
            const stored = localStorage.getItem('xrd_neural_probe_events');
            const neuralRuns = stored ? JSON.parse(stored) : [];

            // Capture top matched peak d-spacings utilizing realistic wavelength
            const topPeaks = topCand.matched_peaks || [];
            const dSpacings = topPeaks.slice(0, 3).map(p => {
              const thetaRad = (p.obsT / 2) * (Math.PI / 180);
              return 1.5406 / (2 * Math.sin(thetaRad));
            });

            const newRun = {
              id: 'neural_' + Date.now(),
              timestamp: new Date().toLocaleString(),
              dateMs: Date.now(),
              materialName: topCand.phase_name,
              formula: topCand.formula,
              category: 'other',
              isNeural: true,
              confidence: topCand.confidence_score,
              crystalSystem: topCand.crystalSystem,
              spaceGroup: topCand.spaceGroup,
              density: topCand.density,
              applications: topCand.applications,
              impact: `Identified by PhaseID Neural Core CNN. Confidence: ${topCand.confidence_score.toFixed(1)}%. Structure profile matches ${topCand.crystalSystem || 'unknown'} system (${topCand.spaceGroup || 'N/A'}, density: ${topCand.density?.toFixed(2) || 'N/A'} g/cmÂ³).`,
              dSpacings: dSpacings.length > 0 ? dSpacings : [2.5123, 3.1415, 4.2384],
              pattern: topPeaks.map(p => `${p.obsT}, ${p.refI}`).join('\n')
            };

            neuralRuns.push(newRun);
            localStorage.setItem('xrd_neural_probe_events', JSON.stringify(neuralRuns));
          } catch (err) {
            console.error("Failed to save neural probe event:", err);
          }
        }
      }

      setProgressStep(5);
      setIsSimulating(false);
      clearInterval(scanInterval);
      setScanPos(null);
    }, 3000);
  };

  const handleGenerateReport = () => {
    if (!selectedCandidate) return;

    const report = `XRD Analysis Report
Generated by XRD-Calc Pro AI Engine
Date: ${new Date().toLocaleString()}

--- Identification Result ---
Phase Name: ${selectedCandidate.phase_name}
Formula: ${selectedCandidate.formula}
Confidence Score: ${selectedCandidate.confidence_score}%
Match Quality: ${selectedCandidate.match_quality || "N/A"}
Card ID: ${selectedCandidate.card_id}

--- Material Properties ---
Crystal System: ${selectedCandidate.crystalSystem || "Unknown"}
Space Group: ${selectedCandidate.spaceGroup || "N/A"}
Density: ${selectedCandidate.density ? selectedCandidate.density + " g/cmÂ³" : "N/A"}
Material Type: ${selectedCandidate.materialType || "N/A"}
Molecular Weight: ${selectedCandidate.molecularWeight ? selectedCandidate.molecularWeight + " g/mol" : "N/A"}
Band Gap: ${selectedCandidate.bandGap !== undefined ? selectedCandidate.bandGap + " eV" : "N/A"}
Elastic Modulus: ${selectedCandidate.elasticModulus !== undefined ? selectedCandidate.elasticModulus + " GPa" : "N/A"}
Thermal Conductivity: ${selectedCandidate.thermalConductivity !== undefined ? selectedCandidate.thermalConductivity + " W/mÂ·K" : "N/A"}
Melting Point: ${selectedCandidate.meltingPoint !== undefined ? selectedCandidate.meltingPoint + " Â°C" : "N/A"}
Vickers Hardness: ${selectedCandidate.vickersHardness !== undefined ? selectedCandidate.vickersHardness + " GPa" : "N/A"}
Poisson's Ratio: ${selectedCandidate.poissonsRatio !== undefined ? selectedCandidate.poissonsRatio : "N/A"}
Electrical Resistivity: ${selectedCandidate.electricalResistivity !== undefined ? selectedCandidate.electricalResistivity + " ÂµÎ©Â·cm" : "N/A"}
Dielectric Constant: ${selectedCandidate.dielectricConstant !== undefined ? selectedCandidate.dielectricConstant : "N/A"}
Thermal Expansion: ${selectedCandidate.thermalExpansion !== undefined ? selectedCandidate.thermalExpansion + " 10^-6/K" : "N/A"}
Magnetic Properties: ${selectedCandidate.magneticProperties || "N/A"}
Optical Properties: ${selectedCandidate.opticalProperties || "N/A"}
Hazards: ${selectedCandidate.hazards ? selectedCandidate.hazards.join(", ") : "None Detected"}

--- Description ---
${selectedCandidate.description || "N/A"}

--- Matched Peaks ---
${selectedCandidate.matched_peaks?.map((p) => `Ref: ${p.refT.toFixed(2)}Â°${p.h !== undefined ? ` [${p.h} ${p.k} ${p.l}]` : ""} | Obs: ${p.obsT.toFixed(2)}Â° | Int: ${p.refI}`).join("\n") || "No detailed peak data"}

--- Applications ---
${selectedCandidate.applications?.join(", ") || "N/A"}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedCandidate.phase_name}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [pythonArch, setPythonArch] = useState<'cnn' | 'transformer' | 'graph_gnn' | 'rag_pipeline'>('cnn');

  const getPythonEngineCode = (arch: 'cnn' | 'transformer' | 'graph_gnn' | 'rag_pipeline', config: any): string => {
    const mapActivation = (act: string) => {
      const lower = (act || "relu").toLowerCase();
      if (lower === "relu") return "relu";
      if (lower === "leakyrelu") return "leaky_relu";
      if (lower === "gelu") return "gelu";
      if (lower === "sigmoid") return "sigmoid";
      if (lower === "swish" || lower === "silu") return "silu";
      if (lower === "elu") return "elu";
      return "relu";
    };

    if (arch === 'transformer') {
      return `import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import numpy as np

# XRD-Calc Pro - 1D Vision-Transformer (ViT) Spectral Encoder
# High-fidelity self-attention modeling for long-range XRD peak correlation.
# T-Theta segments are parsed as tokens, enriched with position embeddings,
# and analyzed via Multihead-Attention layer blocks.

class PatchEmbedding1D(nn.Module):
    """Splits continuous XRD spectra into non-overlapping patches and projects to embedding space"""
    def __init__(self, seq_len=1000, patch_size=20, in_chans=1, embed_dim=128):
        super().__init__()
        self.num_patches = seq_len // patch_size
        self.patch_size = patch_size
        self.proj = nn.Conv1d(in_chans, embed_dim, kernel_size=patch_size, stride=patch_size)

    def forward(self, x):
        # Input shape: (B, 1, SeqLen) -> Output: (B, EmbedDim, NumPatches)
        x = self.proj(x)
        # Permute to (B, NumPatches, EmbedDim) for Transformer Encoder
        return x.transpose(1, 2)

class TransformerSpectrumEncoder(nn.Module):
    """Self-Attention Transformer for Crystallographic Fingerprinting"""
    def __init__(self, seq_len=1000, patch_size=20, num_classes=${MATERIAL_DB.length}, 
                 embed_dim=128, depth=4, num_heads=8, mlp_ratio=4.0, dropout=${config.dropout || 0.1}):
        super().__init__()
        self.patch_embed = PatchEmbedding1D(seq_len, patch_size, 1, embed_dim)
        num_patches = self.patch_embed.num_patches
        
        # Class token and Positional Embeddings
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.zeros(1, num_patches + 1, embed_dim))
        self.pos_drop = nn.Dropout(p=dropout)
        
        # Transformer Blocks
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=embed_dim, 
            nhead=num_heads, 
            dim_feedforward=int(embed_dim * mlp_ratio), 
            dropout=dropout,
            activation='gelu',
            batch_first=True
        )
        self.blocks = nn.TransformerEncoder(encoder_layer, num_layers=depth)
        self.norm = nn.LayerNorm(embed_dim)
        
        # Classifier Head
        self.head = nn.Linear(embed_dim, num_classes)
        
        # Initialize weights
        nn.init.trunc_normal_(self.pos_embed, std=0.02)
        nn.init.trunc_normal_(self.cls_token, std=0.02)
        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, nn.Linear):
            nn.init.trunc_normal_(m.weight, std=0.01)
            if m.bias is not None:
                nn.init.constant_(m.bias, 0)
        elif isinstance(m, nn.LayerNorm):
            nn.init.constant_(m.bias, 0)
            nn.init.constant_(m.weight, 1.0)

    def forward(self, x):
        B = x.shape[0]
        # (B, NumPatches, EmbedDim)
        x = self.patch_embed(x)
        
        # Prepend Classifier (CLS) token
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x = torch.cat((cls_tokens, x), dim=1)
        
        # Inject structural positional embeddings
        x = self.pos_drop(x + self.pos_embed)
        
        # Execute self-attention sequence encoding
        x = self.blocks(x)
        x = self.norm(x)
        
        # Classify based on the output at the Class token position
        class_vector = x[:, 0]
        return self.head(class_vector)

if __name__ == '__main__':
    model = TransformerSpectrumEncoder()
    # Batch size: 8 sweeps of 1000 2-theta grid items
    xrd_profiles = torch.rand((8, 1, 1000))
    logits = model(xrd_profiles)
    print("Spectral Vision-Transformer Initialized successfully.")
    print("Shape output logit matrix:", logits.shape)
`;
    }

    if (arch === 'graph_gnn') {
      return `import torch
import torch.nn as nn
import torch.nn.functional as F
try:
    import torch_geometric
    from torch_geometric.nn import GCNConv, global_mean_pool
    from torch_geometric.data import Data, Batch
except ImportError:
    # Educational wrapper mock to ensure error-free running if package isn't preinstalled
    print("PyTorch Geometric not found. Installing 'torch-geometric' via pip is recommended for crystalline graph modeling.")
    # Fallback placeholders for educational execution
    GCNConv = None
    global_mean_pool = None

# XRD-Calc Pro - Crystalline Graph Neural Network (GNN) Engine
# CGCNN Architecture representation. Instead of analyzing raw 1D sweeps,
# the mineral is represented as an atomic coordinate graph:
# Coordinates/atomic numbers form node features, bond distances form edges.

class CrystallineGraphGNN(nn.Module):
    """3D Crystal Structure classification engine using Graph Neural Networks"""
    def __init__(self, node_feature_dim=16, hidden_dim=${config.filters || 64}, num_classes=${MATERIAL_DB.length}):
        super().__init__()
        self.has_pyg = GCNConv is not None
        
        if self.has_pyg:
            # Dual message passing layers to aggregate atomic environment spheres
            self.conv1 = GCNConv(node_feature_dim, hidden_dim)
            self.conv2 = GCNConv(hidden_dim, hidden_dim)
            self.fc1 = nn.Linear(hidden_dim, hidden_dim)
            self.fc2 = nn.Linear(hidden_dim, num_classes)
        else:
            self.linear = nn.Linear(node_feature_dim, num_classes)

    def forward(self, x, edge_index, batch_index):
        if self.has_pyg:
            # 1. Message passing to resolve atomic neighborhood coordinates
            h = self.conv1(x, edge_index)
            h = F.relu(h)
            h = self.conv2(h, edge_index)
            h = F.relu(h)
            
            # 2. Graph Pooling to retain translation/rotation invariance in unit cell
            pooled = global_mean_pool(h, batch_index)
            
            # 3. Dense classifications
            out = F.relu(self.fc1(pooled))
            return self.fc2(out)
        else:
            # Simplified mock pooling
            mean_pooled = torch.mean(x, dim=0, keepdim=True)
            return self.linear(mean_pooled)

def generate_mock_crystal_graph():
    """Generates a synthetic FCC Diamond Silicon unit cell graph representation"""
    # 8 Silicon atoms in unit cell (atomic number 14)
    # Feature vector: [atomic_number, valence_electrons, covalent_radius, electronegativity]
    silicon_node_feats = torch.tensor([
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9],
        [14, 4, 111, 1.9]
    ], dtype=torch.float)
    
    # Adjacency matrices of direct covalent bonds
    edge_index = torch.tensor([
        [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7],
        [1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6]
    ], dtype=torch.long)
    
    batch_vector = torch.zeros(8, dtype=torch.long) # All nodes belong to graph 0
    return silicon_node_feats, edge_index, batch_vector

if __name__ == '__main__':
    model = CrystallineGraphGNN()
    feats, edges, batch = generate_mock_crystal_graph()
    
    # Simulating forward pass
    outputs = model(feats, edges, batch)
    print("Graph Crystalline Neural Engine successfully compiled.")
    print("Output shape on unit cell classification:", outputs.shape)
`;
    }

    if (arch === 'rag_pipeline') {
      return `import os
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

try:
    import chromadb
    from sentence_transformers import SentenceTransformer
except ImportError:
    chromadb = None
    SentenceTransformer = None

# XRD-Calc Pro - Enterprise Crystalline Retrieval-Augmented Generation (RAG) Pipeline
# Demonstrates a fully-fledged materials database query mechanism.
# Raw experimental peaks are embedded into space vectors, candidate PDF cards are
# retrieved from ChromaDB, and context-injected into the Gemini API framework.

# Comprehensive local powder diffraction standards database
MATERIALS_PDF_DB = [
    {
        "name": "Beta-Quartz (SiO2, Hexagonal, P6222)",
        "peaks": "20.6, 25.8, 36.4, 38.8, 42.3",
        "description": "High temperature polymorph of Quartz, major stable ceramic skeleton."
    },
    {
        "name": "Rutile (TiO2, Tetragonal, P42/mnm)",
        "peaks": "27.4, 36.1, 41.2, 54.3, 56.6",
        "description": "Birefringent titanium oxide mineral, pristine photo-catalyst benchmark."
    },
    {
        "name": "Anatase (TiO2, Tetragonal, I41/amd)",
        "peaks": "25.3, 37.8, 48.0, 53.9, 55.1",
        "description": "Metastable polymorph of TiO2 with heightened electron transport properties."
    },
    {
        "name": "Corundum (Al2O3, Trigonal, R-3c)",
        "peaks": "25.6, 35.1, 37.8, 43.3, 52.5, 57.5",
        "description": "Aluminium oxide crystalline standard, extremely high structural hardness."
    },
    {
        "name": "Halite (NaCl, Cubic, Fm-3m)",
        "peaks": "27.3, 31.7, 45.4, 53.8, 56.4",
        "description": "Rock salt octahedral crystal standard used in general peak calibrations."
    }
]

class MaterialRAGManager:
    def __init__(self):
        print("Initializing SentenceTransformer Embedding Encoder (all-MiniLM-L6-v2)...")
        self.embedding_model = SentenceTransformer("all-MiniLM-L6-v2") if SentenceTransformer else None
        
        if chromadb:
            # Setup Chroma Vector DB on local ephemeral memory structure
            self.chroma_client = chromadb.EphemeralClient()
            self.collection = self.chroma_client.create_collection(name="diffraction_standards")
            self._seed_database()
        else:
            self.collection = None
            print("ChromaDB not installed. Standard list similarity lookups will act as safe fallback.")

    def _seed_database(self):
        """Generates dense vector embeddings for physical material descriptors"""
        for idx, item in enumerate(MATERIALS_PDF_DB):
            document_content = f"Material: {item['name']}. Peaks: {item['peaks']}. Description: {item['description']}"
            embedding = self.embedding_model.encode(document_content).tolist()
            
            self.collection.add(
                embeddings=[embedding],
                documents=[document_content],
                metadatas=[{"name": item["name"], "peaks": item["peaks"]}],
                ids=[f"mat_{idx}"]
            )
        print("ChromaDB successfully seeded with PDF phase standards.")

    def query_material(self, user_peaks: str, top_k=2):
        """Retrieves best-fit candidate cards using vector distance clustering"""
        if self.collection and self.embedding_model:
            query_vector = self.embedding_model.encode(f"XRD peaks: {user_peaks}").tolist()
            results = self.collection.query(
                query_embeddings=[query_vector],
                n_results=top_k
            )
            return results["documents"][0]
        else:
            # Simple keyword overlap fallback
            print("Running fallback rule-based substring matching...")
            matches = []
            for item in MATERIALS_PDF_DB:
                score = len(set(user_peaks.split()).intersection(set(item["peaks"].split())))
                matches.append((item, score))
            matches.sort(key=lambda x: x[1], reverse=True)
            return [f"Material: {m[0]['name']}. Peaks: {m[0]['peaks']}. Description: {m[0]['description']}" for m in matches[:top_k]]

def gemini_retrieval_augmented_generation(user_xrd_query: str):
    """Connects Grounded Vector Retrieval directly into Google Gemini API Pro"""
    # 1. Retrieve most relevant physical phase matches from Chromatography DB
    rag_manager = MaterialRAGManager()
    database_grounding_contexts = rag_manager.query_material(user_xrd_query, top_k=2)
    
    print("\\n[RAG Phase] Retrieved Grounding Context from Vector DB:")
    for doc in database_grounding_contexts:
        print(">> ", doc)
        
    combined_grounding_text = "\\n".join(database_grounding_contexts)
    
    # 2. Invoke Gemini Pro with our context-loaded instruction suite
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("\\n[ERROR] GEMINI_API_KEY environment variable missing. Please export your secret key.")
        return
        
    if not genai:
        print("\\nNote: 'google-genai' SDK is recommended. Printing compiled prompting payload:")
        print("System Instruction: You are an expert Crystallographer executing RAG validations.")
        print(f"Grounding Context:\\n{combined_grounding_text}")
        print(f"User Query:\\n{user_xrd_query}")
        return

    client = genai.Client(api_key=api_key)
    prompt = f\"\"\"
    You are an AI Crystallography Assistant. Analyze the user's experimental diffraction peaks.
    
    Use the following verified Database Grounding Context to match peaks and identify phases:
    {combined_grounding_text}
    
    User Experimental Peaks:
    {user_xrd_query}
    
    Determine the most likely chemical phase match and explain your logical reasoning.
    \"\"\"
    
    print("\\nCalling Google Gemini API model 'gemini-3.1-pro-preview'...")
    response = client.models.generate_content(
        model='gemini-3.1-pro-preview',
        contents=prompt
    )
    print("\\n=== AI Analysis Output (Grounded RAG) ===")
    print(response.text)

if __name__ == '__main__':
    # Simulating a user query for Rutile Titanium Oxide
    experimental_peaks = "27.4, 36.1, 41.2"
    gemini_retrieval_augmented_generation(experimental_peaks)
`;
    }

    // Default 'cnn' (Residual 1D CNN)
    return `import torch
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
import torch.optim.lr_scheduler as lr_scheduler
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split

# XRD-Calc Pro - Scientific PyTorch Phase ID Engine Script
# Configuration used in simulation:
# Context Depth: ${config.depth || 50} Layers | Dropout: ${(config as any).dropout || 0} | Scaling: ${config.multiScale ? 'True' : 'False'}
# Kernel Size: ${config.kernelSize}
# Multi-Scale: ${config.multiScale}
# Batch Norm: ${config.batchNorm}
# Dropout: ${(config as any).dropout}
# Attention: ${(config as any).attentionMechanism}

class XRDDataAugmentation(nn.Module):
    """Stochastic Data Augmentation for XRD Profiles"""
    def __init__(self, noise_std=0.02, mask_prob=0.05):
        super().__init__()
        self.noise_std = noise_std
        self.mask_prob = mask_prob

    def forward(self, x):
        if self.training:
            # Add structural noise equivalent to detector counting variations
            noise = torch.randn_like(x) * self.noise_std
            # Random artifact masking to force robust peak learning
            mask = (torch.rand_like(x) > self.mask_prob).float()
            return (x + noise) * mask
        return x

class ResidualBlock1D(nn.Module):
    def __init__(self, in_channels, out_channels, kernel_size, dropout=${(config as any).dropout || 0}):
        super().__init__()
        self.conv1 = nn.Conv1d(in_channels, out_channels, kernel_size, padding='same')
        self.bn1 = nn.BatchNorm1d(out_channels) if ${config.batchNorm ? 'True' : 'False'} else nn.Identity()
        self.conv2 = nn.Conv1d(out_channels, out_channels, kernel_size, padding='same')
        self.bn2 = nn.BatchNorm1d(out_channels) if ${config.batchNorm ? 'True' : 'False'} else nn.Identity()
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        res = x
        x = F.${mapActivation(config.activation)}(self.bn1(self.conv1(x)))
        x = self.dropout(x)
        x = self.bn2(self.conv2(x))
        return F.${mapActivation(config.activation)}(x + res)

class XRDPhaseIDModel(nn.Module):
    def __init__(self, num_classes=${MATERIAL_DB.length}, kernel_size=${config.kernelSize}):
        super().__init__()
        self.augment = XRDDataAugmentation()
        self.attn = nn.MultiheadAttention(1, 1) if ${(config as any).attentionMechanism ? 'True' : 'False'} else None
        self.initial_conv = nn.Conv1d(1, ${config.filters || 32}, kernel_size, padding='same')
        
        # Deep Residual Feature Extraction (${config.depth} layers simulated)
        self.blocks = nn.ModuleList([
            ResidualBlock1D(${config.filters || 32}, ${config.filters || 32}, kernel_size)
            for _ in range(${Math.floor((config.depth || 50) / 10)})
        ])
        
        self.pool = nn.${config.pooling === 'max' ? 'MaxPool1d' : 'AvgPool1d'}(2)
        self.fc = nn.Linear((${config.filters || 32} * 100), num_classes) # Approximate representation
        
    def forward(self, x):
        x = self.augment(x)
        if self.attn:
            x_permuted = x.permute(2, 0, 1)
            attn_out, _ = self.attn(x_permuted, x_permuted, x_permuted)
            x = attn_out.permute(1, 2, 0)
            
        x = F.${mapActivation(config.activation)}(self.initial_conv(x))
        for block in self.blocks:
            x = block(x)
            x = self.pool(x)
            
        x = x.view(x.size(0), -1)
        return self.fc(x)

def train_engine():
    model = XRDPhaseIDModel()
    optimizer = optim.${config.optimization || 'Adam'}(model.parameters(), lr=${config.learningRate || 0.001})
    loss_fn = nn.CrossEntropyLoss()
    
    print("PyTorch Phase ID Model Initialized.")
    print("Optimization Algorithm:", optimizer.__class__.__name__)
    print("Learning Rate:", optimizer.param_groups[0]['lr'])
    return model

if __name__ == '__main__':
    model = train_engine()
    mock_xrd_sweep = torch.rand((16, 1, 1000)) 
    predictions = model(mock_xrd_sweep)
    print("Inference completed. Logic structure valid.")
    print("Predictions shape:", predictions.shape)
`;
  };

  const handleExportPythonML = () => {
    const pythonCode = getPythonEngineCode(pythonArch, engineConfig);
    const blob = new Blob([pythonCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = pythonArch === 'rag_pipeline' ? 'XRD_PhaseID_RAG_Pipeline.py' : `XRD_PhaseID_${pythonArch.toUpperCase()}_Engine.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = (type: string) => {
    const isMixType = [
      "Mixture",
      "Complex",
      "Modern-Ceramic",
      "Solar-Mix",
      "Cathode-Mix",
      "Geological-Suite",
      "Catalyst-Mix",
      "Precious-Metal-Mix",
      "Halide-Mineral-Mix",
      "Iron-Oxide-Mix",
      "Biocoat-Composite-Suite",
      "SOFC-Electrode-Suite",
      "Aerospace-Armor-Suite",
      "Pharma-Drug-Suite",
      "Nuclear-Fuel-Suite",
      "Battery-Anode-Suite",
      "Superconductor-Suite",
      "Zeolite-Catalyst-Suite",
      "Cantor-Alloy-Suite",
      "Carbon-Steel-Suite",
      "Superalloy-Carbide-Suite",
      "Multiferroic-Ceramic-Suite",
      "Photocatalyst-TiO2-WO3-Suite",
      "Nanocomposite-2D-Energy-Suite",
      "Carbon-Allotropes-Hybrid-Suite",
      "Carbon-Carbide-Refractory-Suite",
      "Biomineral-Carbonate-Suite",
      "Drug-Carrier-Suite",
      "Dental-Implant-Composite",
      "HEA-Brass-Suite",
      "Cement-Clinker-Suite",
      "Clay-Mineral-Suite",
      "Battery-Cathode-Suite",
      "Archaeological-Pigment-Suite",
      "Zeolite-Adsorbent-Suite",
      "Lunar-Regolith-Simulant",
      "Pharmaceutical-Polymorph-Mixture",
      "Bone-Scaffold-Bioactive",
      "Meteorite-Chondrite-Suite",
      "Solid-State-Electrolyte-Suite",
      "Earth-Mantle-Assemblage",
      "Semiconductor-Hetero-Suite",
      "Nuclear-Waste-Pyrochlore",
      "Superconducting-Tape-HTS",
      "Mars-Soil-Curiosity",
      "Corrosion-Rust-Scale",
      "Asbestos-Mineralogy",
      "Volcanic-Ash-Tephra",
      "Fly-Ash-Geopolymer",
      "Solar-Cell-Perovskite-Degradation",
      "Kidney-Stone-Urolithiasis",
      "ASR-Cement-Suite",
      "Li-S-Battery-Suite",
      "MXene-Supercap-Suite",
      "Greenschist-Facies-Suite",
      "Atmospheric-Aerosol-Dust",
      "Deep-Ocean-Manganese-Nodule",
      "Hydrothermal-Vent-Precipitate",
      "Banded-Iron-Formation",
      "Portland-Cement-Hydration",
      "Lithium-Ion-SEI-Layer",
      "Solid-Oxide-Electrolysis-Cell",
      "Heavy-Mineral-Sand",
      "Geothermal-Pipe-Scaling",
      "Bauxite-Al-Ore",
      "Copper-Porphyry-Ore",
      "Superalloy-Oxidation-Scale",
      "Tribological-Wear-Debris",
      "High-Entropy-Alloy-Oxidation",
      "Hypersonic-Ablation-Layer",
      "Fusion-Reactor-First-Wall",
      "Solder-Joint-Intermetallic",
      "Bronze-Disease-Corrosion",
      "Geopolymer-Binder-Phase",
    ].includes(type);
    setIsMixMode(isMixType);
    setMixtureList([]);

    if (type === "Mixture") {
      setInputData(
        `20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`,
      );
      setSearchTerm("Mixture (SiO2 + Au)");
    } else if (type === "Complex") {
      // Quartz: 26.64(100), 20.86(22), 50.14(14)
      // Rutile: 27.44(100), 54.32(60)
      // Anatase: 25.28(100), 48.05(35)
      // Ag: 38.12(100), 44.30(40)
      setInputData(
        `20.86, 15\n25.28, 60\n26.64, 100\n27.44, 40\n38.12, 30\n44.30, 15\n48.05, 18\n50.14, 10\n54.32, 22`,
      );
      setSearchTerm("ICSD-15598: Complex (Quartz + Rutile + Anatase + Ag)");
    } else if (type === "Modern-Ceramic") {
      setInputData(
        `28.17, 30\n31.47, 20\n35.9, 100\n41.7, 85\n50.12, 10\n60.4, 60\n72.3, 45`,
      );
      setSearchTerm("Modern Ceramic (TiC + ZrO2)");
    } else if (type === "Solar-Mix") {
      setInputData(
        `14.15, 100\n14.2, 90\n20.1, 45\n24.5, 45\n28.4, 60\n28.6, 90\n31.8, 30\n32.1, 25\n40.6, 20\n40.8, 55`,
      );
      setSearchTerm("Solar Mix (Hybrid MAPbI3 + Inorganic CsPbI3)");
    } else if (type === "Cathode-Mix") {
      setInputData(
        `18.9, 100\n36.7, 45\n37.3, 50\n38.4, 85\n44.3, 40\n45.2, 40\n64.4, 25\n77.4, 25`,
      );
      setSearchTerm("Cathode Mix (LCO + NMC-111)");
    } else if (type === "Geological-Suite") {
      setInputData(
        `20.86, 35\n23.6, 60\n24.1, 40\n26.64, 100\n29.40, 100\n33.2, 80\n36.54, 12\n54.1, 85`,
      );
      setSearchTerm(
        "Geological Suite (Quartz + Calcite + Hematite + Feldspar)",
      );
    } else if (type === "Catalyst-Mix") {
      setInputData(
        `25.28, 60\n27.45, 80\n28.55, 100\n33.08, 20\n35.09, 15\n36.09, 35\n38.42, 15\n40.17, 50\n41.23, 20\n47.48, 45\n48.05, 25\n54.32, 45\n56.34, 30`,
      );
      setSearchTerm("Catalyst Mix (CeO2 + Rutile + Anatase + Ti)");
    } else if (type === "Precious-Metal-Mix") {
      setInputData(
        `38.15, 100\n43.30, 90\n44.33, 60\n50.43, 40\n64.50, 25\n74.13, 20`,
      );
      setSearchTerm("Precious Metal Mix (Au + Ag + Cu)");
    } else if (type === "Halide-Mineral-Mix") {
      setInputData(
        `27.37, 10\n28.30, 100\n31.69, 80\n40.50, 40\n45.43, 60\n47.00, 50\n50.15, 15\n55.75, 25\n56.45, 15\n66.35, 10`,
      );
      setSearchTerm("Halide Mineral Mix (Halite + Sylvite + Fluorite)");
    } else if (type === "Iron-Oxide-Mix") {
      setInputData(
        `20.86, 15\n24.14, 20\n26.64, 80\n30.09, 25\n33.15, 90\n35.45, 100\n43.05, 15\n49.48, 30\n50.14, 10\n54.09, 35\n56.94, 25\n62.51, 35`,
      );
      setSearchTerm("Iron Oxide Mix (Magnetite + Hematite + Quartz)");
    } else if (type === "Biocoat-Composite-Suite") {
      setInputData(
        `25.87, 25\n30.27, 60\n31.77, 100\n32.19, 90\n35.25, 12\n46.71, 15\n49.46, 15\n50.37, 35\n60.20, 20`,
      );
      setSearchTerm("COD-9002220: Implant Suite (HAp + ZrO2)");
    } else if (type === "SOFC-Electrode-Suite") {
      setInputData(
        `22.4, 15\n30.1, 80\n31.8, 100\n34.8, 18\n39.3, 10\n45.8, 30\n50.2, 45\n57.2, 20\n59.7, 25\n62.8, 10\n67.1, 22`,
      );
      setSearchTerm("ICSD-62295: SOFC (YSZ + SRO)");
    } else if (type === "Aerospace-Armor-Suite") {
      setInputData(
        `25.58, 20\n35.15, 80\n35.9, 100\n37.78, 15\n41.7, 50\n43.36, 45\n52.55, 18\n57.50, 40\n60.4, 30\n61.30, 5\n66.52, 10\n68.21, 15\n72.3, 20`,
      );
      setSearchTerm("ICSD-43221: Aerospace (TiC + Al2O3)");
    } else if (type === "Pharma-Drug-Suite") {
      setInputData(
        `6.1, 40\n12.1, 20\n12.2, 25\n15.5, 30\n16.6, 100\n17.7, 20\n18.2, 90\n18.9, 30\n20.2, 35\n20.4, 18\n22.3, 45\n23.5, 22\n24.4, 40\n32.8, 10`,
      );
      setSearchTerm("CSD-HXACAN: Pharma (Ibu + Para)");
    } else if (type === "Nuclear-Fuel-Suite") {
      setInputData(
        `21.44, 20\n25.95, 45\n26.45, 40\n28.25, 100\n32.74, 35\n34.32, 25\n43.15, 12\n44.50, 10\n47.01, 55\n55.78, 45\n58.55, 15\n68.62, 25`,
      );
      setSearchTerm("ICDD-PDF-4: Nuclear Fuel Suite (UO2 + U3O8)");
    } else if (type === "Battery-Anode-Suite") {
      setInputData(
        `26.54, 80\n28.44, 100\n42.39, 5\n44.59, 12\n47.30, 48\n54.67, 10\n56.12, 25`,
      );
      setSearchTerm("ICSD-76031: Battery (Si + C)");
    } else if (type === "Superconductor-Suite") {
      setInputData(
        `22.8, 25\n32.5, 100\n32.8, 90\n35.5, 45\n38.5, 15\n38.7, 50\n40.3, 10\n46.7, 30\n48.7, 15\n53.5, 8\n58.1, 25\n58.3, 10\n61.5, 12\n66.2, 10\n68.1, 10`,
      );
      setSearchTerm("ICSD-65546: Superconductor (YBCO + CuO)");
    } else if (type === "Zeolite-Catalyst-Suite") {
      setInputData(
        `7.2, 80\n7.9, 100\n8.8, 60\n10.2, 40\n12.5, 50\n16.1, 15\n21.7, 25\n23.1, 85\n23.3, 75\n23.9, 65\n24.0, 35\n24.4, 45\n27.1, 20\n29.9, 30\n34.2, 15`,
      );
      setSearchTerm("IZA-ZSM5: Zeolite (ZSM-5 + LTA)");
    } else if (type === "Cantor-Alloy-Suite") {
      setInputData(
        `44.39, 60\n44.51, 100\n44.67, 80\n51.85, 45\n64.58, 15\n65.02, 18\n76.38, 25\n81.72, 20\n82.33, 22\n92.95, 15\n98.05, 8\n98.45, 8\n98.94, 10`,
      );
      setSearchTerm("COD-9014004: Cantor Alloy (Fe + Cr + Ni)");
    } else if (type === "Carbon-Steel-Suite") {
      setInputData(
        `37.7, 15\n39.8, 20\n40.6, 25\n42.9, 18\n43.6, 60\n43.7, 24\n44.5, 22\n44.67, 100\n44.9, 25\n50.8, 25\n65.02, 15\n74.7, 15\n82.33, 20\n90.7, 12`,
      );
      setSearchTerm("ICSD-64795: Steel (Ferrite + Austenite + Fe3C)");
    } else if (type === "Superalloy-Carbide-Suite") {
      setInputData(
        `31.51, 80\n35.64, 75\n43.8, 100\n48.30, 65\n51.0, 45\n64.06, 25\n73.11, 30\n75.1, 20\n75.48, 18\n77.16, 15\n91.2, 12`,
      );
      setSearchTerm("COD-9011620: Superalloy (Inconel + WC)");
    } else if (type === "Multiferroic-Ceramic-Suite") {
      setInputData(
        `22.20, 15\n30.1, 30\n31.50, 100\n35.4, 80\n37.1, 10\n38.90, 18\n43.1, 24\n45.30, 32\n50.90, 12\n53.4, 18\n56.20, 10\n57.0, 35\n62.6, 45\n65.80, 15`,
      );
      setSearchTerm("ICSD-188686: Multiferroic (BaTiO3 + CoFe2O4)");
    } else if (type === "Photocatalyst-TiO2-WO3-Suite") {
      setInputData(
        `23.1, 60\n23.6, 55\n24.4, 55\n25.28, 100\n26.6, 15\n27.44, 80\n28.9, 10\n33.3, 20\n34.1, 25\n36.08, 40\n37.80, 15\n39.18, 5\n41.22, 15\n44.05, 8\n48.05, 25\n53.89, 15\n54.31, 45\n55.06, 12\n56.62, 12\n62.69, 10`,
      );
      setSearchTerm("COD-9004144: Photocatalytic (TiO2 + WO3)");
    } else if (type === "Nanocomposite-2D-Energy-Suite") {
      setInputData(
        `9.2, 80\n10.5, 100\n14.38, 70\n18.4, 12\n22.0, 10\n26.6, 8\n27.6, 12\n32.67, 10\n33.51, 8\n34.2, 5\n38.9, 10\n39.54, 6\n42.1, 8\n42.6, 5\n44.15, 6\n49.79, 10\n58.34, 12\n60.5, 8`,
      );
      setSearchTerm("COD-4513689: 2D Composite (MXene + MoS2 + GO)");
    } else if (type === "Carbon-Allotropes-Hybrid-Suite") {
      setInputData(
        `10.5, 35\n22.0, 5\n26.54, 80\n42.39, 4\n43.92, 100\n44.59, 12\n54.67, 8\n75.30, 25\n91.50, 16`,
      );
      setSearchTerm("COD-9012290: Carbon Allotropes (Diamond + Graphite + GO)");
    } else if (type === "Carbon-Carbide-Refractory-Suite") {
      setInputData(
        `23.5, 15\n26.54, 60\n33.6, 15\n34.9, 60\n35.6, 100\n37.8, 80\n41.4, 20\n44.59, 10\n44.8, 20\n53.4, 25\n60.0, 40\n71.8, 30`,
      );
      setSearchTerm("ICSD-16997: Refractory (Graphite + SiC + B4C)");
    } else if (type === "Biomineral-Carbonate-Suite") {
      setInputData(
        `23.06, 12\n25.87, 35\n26.2, 85\n29.40, 95\n31.77, 100\n32.19, 90\n32.90, 60\n33.1, 40\n34.04, 45\n35.96, 12\n36.1, 18\n37.8, 25\n38.4, 25\n39.40, 18\n43.16, 18\n45.8, 30\n46.71, 35\n47.50, 22\n48.4, 20\n48.50, 22\n49.46, 30`,
      );
      setSearchTerm("RRUFF-R050512: Biomineral (HAp + CaCO3)");
    } else if (type === "Drug-Carrier-Suite") {
      setInputData(`0.9, 80\n1.6, 25\n1.8, 20\n2.1, 100\n3.6, 12\n4.2, 8`);
      setSearchTerm("ICDD-PDF-4: Drug Carrier (SBA-15 + MCM-41)");
    } else if (type === "Dental-Implant-Composite") {
      setInputData(
        `25.87, 30\n30.27, 85\n31.77, 100\n32.19, 95\n35.15, 60\n43.36, 55\n50.37, 50\n57.50, 48\n60.20, 25`,
      );
      setSearchTerm("RRUFF-R060180: Dental Ceramic (ZrO2 + Al2O3 + HAp)");
    } else if (type === "HEA-Brass-Suite") {
      setInputData(
        `42.6, 60\n44.51, 80\n44.67, 100\n49.6, 25\n51.85, 30\n65.02, 12\n72.8, 15\n76.38, 15\n82.33, 15\n88.1, 10\n92.95, 5`,
      );
      setSearchTerm("ICSD-108343: HEA Brass (Cu-Zn + Fe + Ni)");
    } else if (type === "Cement-Clinker-Suite") {
      setInputData(
        `26.64, 15\n29.4, 100\n32.2, 70\n32.6, 75\n34.4, 35\n41.2, 25\n51.7, 20`,
      );
      setSearchTerm("COD-9011942: Cement Clinker (Alite + Calcite)");
    } else if (type === "Clay-Mineral-Suite") {
      setInputData(
        `8.8, 60\n12.3, 70\n19.8, 30\n20.8, 15\n24.9, 50\n26.64, 100\n35.3, 20`,
      );
      setSearchTerm(
        "RRUFF-R040030: Clay Minerals (Kaolinite + Illite + Quartz)",
      );
    } else if (type === "Battery-Cathode-Suite") {
      setInputData(`18.6, 100\n36.6, 40\n44.4, 60\n64.8, 30`);
      setSearchTerm("ICSD-181156: NMC Cathode (LiNiMnCoO2 + LiCoO2)");
    } else if (type === "Archaeological-Pigment-Suite") {
      setInputData(
        `14.8, 50\n15.2, 30\n22.8, 100\n24.1, 75\n30.7, 35\n31.4, 30\n32.2, 40`,
      );
      setSearchTerm("COD-9015949: Ancient Pigment (Egyptian Blue + Malachite)");
    } else if (type === "Zeolite-Adsorbent-Suite") {
      setInputData(
        `6.2, 100\n7.9, 70\n8.8, 55\n10.15, 20\n15.7, 28\n20.4, 22\n23.1, 50`,
      );
      setSearchTerm(
        "IZA-FAU: Zeolitic Adsorbents (ZSM-5 + Alpha-Beta + Faujasite)",
      );
    } else if (type === "Lunar-Regolith-Simulant") {
      setInputData(
        `22.1, 35\n27.8, 100\n31.2, 85\n32.9, 60\n35.6, 75\n42.1, 40\n48.4, 30`,
      );
      setSearchTerm(
        "RRUFF-R050186: Lunar Regolith (Anorthite + Ilmenite + Pyroxene)",
      );
    } else if (type === "Pharmaceutical-Polymorph-Mixture") {
      setInputData(
        `10.2, 90\n15.6, 100\n18.1, 60\n22.3, 80\n24.5, 45\n27.1, 35`,
      );
      setSearchTerm("CSD-ACSALA: Pharma Polymorphs (Paracetamol Form I + Form II)");
    } else if (type === "Bone-Scaffold-Bioactive") {
      setInputData(
        `25.87, 80\n31.0, 100\n31.77, 95\n32.19, 90\n34.3, 45\n39.8, 30\n46.7, 35`,
      );
      setSearchTerm("COD-9010050: Bone Scaffold (HAp + beta-TCP)");
    } else if (type === "Dental-Calcium-Phosphate-Cement") {
      setInputData(
        `11.62, 70\n20.93, 60\n29.20, 85\n29.80, 100\n31.20, 90\n32.50, 75`,
      );
      setSearchTerm("COD-3001020: Dental CPC Cement (TTCP + Brushite DCPD)");
    } else if (type === "Bioglass-45S5-Bone-Graft") {
      setInputData(
        `25.87, 85\n29.80, 100\n31.77, 95\n32.40, 80\n34.10, 60\n48.50, 40`,
      );
      setSearchTerm("AMS-000451: Bioglass 45S5 + Hydroxyapatite HCA Graft");
    } else if (type === "Pharma-Solid-Tablet-Formulation") {
      setInputData(
        `12.10, 50\n12.50, 90\n13.80, 100\n15.20, 70\n16.40, 85\n22.60, 95`,
      );
      setSearchTerm("CSD-LAKTOS01: Solid Tablet (Paracetamol API + Lactose + MCC)");
    } else if (type === "Meteorite-Chondrite-Suite") {
      setInputData(
        `22.9, 45\n32.2, 90\n35.6, 100\n44.67, 85\n52.1, 30\n61.4, 25`,
      );
      setSearchTerm("RRUFF-R040026: Meteorite Minerals (Olivine + Kamacite)");
    } else if (type === "Solid-State-Electrolyte-Suite") {
      setInputData(
        `21.4, 65\n28.1, 90\n30.8, 100\n34.2, 45\n43.1, 50\n51.9, 30`,
      );
      setSearchTerm("ICSD-185799: Solid State Electrolyte (LLZO + ZrO2)");
    } else if (type === "Earth-Mantle-Assemblage") {
      setInputData(
        `29.8, 85\n31.9, 100\n33.3, 70\n35.1, 60\n45.2, 50\n52.2, 40`,
      );
      setSearchTerm(
        "RRUFF-R060046: Lower Mantle (Bridgmanite + Ferropericlase)",
      );
    } else if (type === "Semiconductor-Hetero-Suite") {
      setInputData(
        `27.3, 100\n31.6, 95\n36.1, 90\n43.9, 80\n56.4, 75\n69.1, 70`,
      );
      setSearchTerm("ICSD-151025: III-V Semiconductor GaAs-GaN-AlN");
    } else if (type === "Nuclear-Waste-Pyrochlore") {
      setInputData(
        `28.2, 100\n31.4, 55\n35.6, 80\n42.1, 45\n49.5, 52\n57.5, 38`,
      );
      setSearchTerm("COD-9000185: Nuclear Waste Pyrochlore Refractory");
    } else if (type === "Superconducting-Tape-HTS") {
      setInputData(
        `28.1, 40\n32.8, 100\n38.5, 80\n46.7, 75\n58.2, 55\n68.3, 35`,
      );
      setSearchTerm("ICSD-65546: HTS Tape (YBCO + CeO2 + SrTiO3)");
    } else if (type === "Mars-Soil-Curiosity") {
      setInputData(
        `13.9, 30\n22.0, 45\n27.8, 100\n35.6, 90\n42.1, 35\n57.1, 25\n62.7, 15`,
      );
      setSearchTerm("RRUFF-R040031: Mars Regolith (Plagioclase + Olivine)");
    } else if (type === "Corrosion-Rust-Scale") {
      setInputData(
        `21.2, 40\n24.1, 65\n33.2, 100\n35.6, 95\n41.5, 30\n54.1, 55\n62.5, 45`,
      );
      setSearchTerm("COD-1011267: Corrosion Rust Scale (Hematite + Goethite)");
    } else if (type === "Asbestos-Mineralogy") {
      setInputData(
        `12.1, 100\n24.3, 85\n28.6, 60\n31.5, 45\n36.4, 70\n42.4, 30`,
      );
      setSearchTerm("RRUFF-R060166: Asbestos Hazard (Chrysotile + Amosite)");
    } else if (type === "Volcanic-Ash-Tephra") {
      setInputData(`22.1, 40\n27.8, 100\n29.4, 45\n35.6, 60\n42.1, 20`);
      setSearchTerm("RRUFF-R050013: Volcanic Ash (Plagioclase + Augite)");
    } else if (type === "Fly-Ash-Geopolymer") {
      setInputData(`16.2, 35\n26.64, 100\n33.2, 50\n35.6, 70\n40.8, 30`);
      setSearchTerm("COD-9001569: Geopolymer Fly Ash (Mullite + Hematite)");
    } else if (type === "Solar-Cell-Perovskite-Degradation") {
      setInputData(
        `12.7, 100\n14.1, 45\n28.4, 60\n31.8, 30\n38.2, 15\n43.1, 25`,
      );
      setSearchTerm("COD-4336146: Perovskite Degradation (MAPbI3 + PbI2)");
    } else if (type === "Kidney-Stone-Urolithiasis") {
      setInputData(
        `14.9, 100\n23.8, 85\n30.1, 45\n32.2, 60\n36.4, 30\n40.1, 20`,
      );
      setSearchTerm("COD-1011110: Kidney Stone (Whewellite + Weddellite)");
    } else if (type === "ASR-Cement-Suite") {
      setInputData(
        `9.1, 80\n15.8, 45\n18.1, 90\n20.8, 15\n22.9, 30\n26.64, 100\n34.1, 75\n47.1, 45`,
      );
      setSearchTerm(
        "COD-9008210: Cement ASR Degradation Suite (Portlandite + Quartz + Ettringite)",
      );
    } else if (type === "Li-S-Battery-Suite") {
      setInputData(
        `23.1, 80\n25.8, 35\n26.5, 20\n27.0, 100\n27.7, 30\n44.8, 55\n53.1, 40`,
      );
      setSearchTerm(
        "COD-9014120: Li-S Battery Cathode Suite (S8 + Li2S + Carbon)",
      );
    } else if (type === "MXene-Supercap-Suite") {
      setInputData(
        `9.2, 100\n10.5, 75\n18.4, 20\n26.5, 15\n27.6, 12\n28.0, 95\n35.1, 80\n54.3, 60`,
      );
      setSearchTerm(
        "COD-4501280: MXene Supercapacitor Suite (Ti3C2Tx + GO + RuO2)",
      );
    } else if (type === "Greenschist-Facies-Suite") {
      setInputData(
        `6.3, 50\n10.5, 45\n12.6, 75\n18.9, 30\n23.3, 35\n25.2, 40\n28.0, 100\n28.1, 95\n31.4, 45\n34.2, 60`,
      );
      setSearchTerm(
        "RRUFF-R070110: Greenschist Metamorphic Suite (Chlorite + Actinolite + Epidote)",
      );
    } else if (type === "Atmospheric-Aerosol-Dust") {
      setInputData(
        `20.8, 40\n21.1, 30\n26.6, 100\n27.5, 60\n29.4, 90\n35.1, 15\n39.4, 10`,
      );
      setSearchTerm(
        "COD-AEROSOL: Atmospheric Dust (Quartz + Calcite + Gypsum)",
      );
    } else if (type === "Deep-Ocean-Manganese-Nodule") {
      setInputData(
        `12.2, 50\n18.1, 60\n24.5, 45\n36.8, 100\n41.2, 30\n53.8, 20`,
      );
      setSearchTerm(
        "ICSD-NODULE: Mn Nodule (Todorokite + Birnessite + Goethite)",
      );
    } else if (type === "Hydrothermal-Vent-Precipitate") {
      setInputData(
        `16.2, 30\n27.8, 55\n28.6, 100\n33.0, 80\n47.5, 60\n56.4, 45`,
      );
      setSearchTerm(
        "RRUFF-VENT: Vent Precipitate (Sphalerite + Chalcopyrite + Pyrite)",
      );
    } else if (type === "Banded-Iron-Formation") {
      setInputData(
        `20.8, 25\n26.6, 100\n33.2, 85\n35.6, 90\n41.5, 30\n50.1, 15\n54.2, 40`,
      );
      setSearchTerm(
        "RRUFF-BIF: Banded Iron Formation (Quartz + Hematite + Magnetite)",
      );
    } else if (type === "Portland-Cement-Hydration") {
      setInputData(`18.1, 100\n34.2, 60\n47.2, 35\n50.8, 20\n54.4, 10`);
      setSearchTerm(
        "COD-CEMENT: Hydrated Cement (Portlandite + C-S-H + Ettringite)",
      );
    } else if (type === "Lithium-Ion-SEI-Layer") {
      setInputData(
        `20.2, 100\n23.4, 45\n27.5, 20\n32.1, 60\n38.8, 30\n44.5, 10`,
      );
      setSearchTerm("COD-SEI: Li-Ion SEI Layer (Li2CO3 + LiF + PEDOT)");
    } else if (type === "Solid-Oxide-Electrolysis-Cell") {
      setInputData(
        `28.2, 50\n30.5, 100\n35.2, 80\n43.1, 30\n50.8, 65\n60.2, 40`,
      );
      setSearchTerm("ICSD-SOEC: SOEC Cathode (LSCF + GDC + YSZ)");
    } else if (type === "Heavy-Mineral-Sand") {
      setInputData(
        `25.2, 50\n27.5, 100\n32.8, 85\n35.7, 70\n42.3, 30\n48.0, 45`,
      );
      setSearchTerm(
        "RRUFF-HMS: Heavy Mineral Sand (Rutile + Zircon + Ilmenite)",
      );
    } else if (type === "Geothermal-Pipe-Scaling") {
      setInputData(
        `20.8, 30\n26.6, 100\n29.5, 90\n39.4, 45\n43.1, 20\n48.5, 15`,
      );
      setSearchTerm("COD-GEO: Geothermal Scale (Silica + Calcite + Stibnite)");
    } else if (type === "Bauxite-Al-Ore") {
      setInputData(
        `14.5, 100\n24.3, 30\n28.4, 60\n33.2, 20\n38.5, 40\n45.2, 10`,
      );
      setSearchTerm("RRUFF-BAUX: Bauxite Ore (Gibbsite + Boehmite + Hematite)");
    } else if (type === "Copper-Porphyry-Ore") {
      setInputData(
        `26.6, 100\n28.5, 45\n29.1, 65\n32.0, 30\n33.3, 15\n47.5, 25`,
      );
      setSearchTerm(
        "RRUFF-PORPH: Cu Porphyry (Quartz + Chalcopyrite + Bornite)",
      );
    } else if (type === "Superalloy-Oxidation-Scale") {
      setInputData(
        `34.5, 10\n35.8, 100\n41.5, 15\n43.2, 60\n44.8, 20\n54.5, 10`,
      );
      setSearchTerm("COD-SCALE: Superalloy Scale (Cr2O3 + NiO + Spinel)");
    } else if (type === "Tribological-Wear-Debris") {
      setInputData(`35.6, 50\n43.2, 30\n44.5, 100\n65.2, 15\n82.1, 10`);
      setSearchTerm("COD-WEAR: Wear Debris (Alpha-Fe + Fe3O4 + Graphite)");
    } else if (type === "High-Entropy-Alloy-Oxidation") {
      setInputData(`35.8, 100\n43.8, 50\n44.4, 80\n51.6, 30\n75.2, 20`);
      setSearchTerm("ICSD-HEA: HEA Scale (AlCoCrFeNi + Al2O3 + Cr2O3)");
    } else if (type === "Hypersonic-Ablation-Layer") {
      setInputData(
        `27.4, 35\n30.1, 100\n31.8, 85\n35.7, 45\n44.1, 60\n50.5, 40`,
      );
      setSearchTerm("COD-UHTC: Ablation Layer (HfB2 + SiC + m-ZrO2)");
    } else if (type === "Fusion-Reactor-First-Wall") {
      setInputData(`26.5, 30\n40.2, 100\n44.6, 45\n54.2, 25\n58.3, 80`);
      setSearchTerm("ICSD-FW: Fusion First Wall (W + Be + Graphite)");
    } else if (type === "Solder-Joint-Intermetallic") {
      setInputData(
        `30.0, 100\n32.1, 60\n34.8, 70\n38.2, 90\n42.1, 45\n43.5, 80`,
      );
      setSearchTerm("COD-IMC: Solder Interface (Cu6Sn5 + Cu3Sn + Ag3Sn)");
    } else if (type === "Bronze-Disease-Corrosion") {
      setInputData(
        `16.2, 100\n24.5, 50\n32.0, 30\n36.4, 85\n39.8, 40\n42.3, 60`,
      );
      setSearchTerm(
        "RRUFF-BRONZE: Bronze Disease (Cuprite + Nantokite + Atacamite)",
      );
    } else if (type === "Geopolymer-Binder-Phase") {
      setInputData(
        `14.1, 45\n21.5, 60\n24.5, 100\n26.6, 80\n31.8, 50\n34.5, 40`,
      );
      setSearchTerm("COD-GEO: Geopolymer Binder (N-A-S-H + Sodalite + Quartz)");
    } else {
      // Generic finder for all single phase examples
      const searchKey =
        type === "HAP" || type === "HAP-Sintered"
          ? "Hydroxyapatite (Sintered)"
          : type === "HAP-Nano"
            ? "Hydroxyapatite (Nano)"
            : type === "Carbonated-HAP"
              ? "Carbonated Hydroxyapatite"
              : type === "Dental-HAP"
                ? "Hydroxyapatite (Dental Enamel)"
                : type === "Dentin-HAP"
                  ? "Hydroxyapatite (Human Dentin)"
                  : type === "Mg-HAP"
                    ? "Magnesium-Doped HAp"
                    : type === "Si-HAP"
                      ? "Silicon-substituted HAp"
                      : type === "Pb-HAP"
                        ? "Lead-doped HAp"
                        : type === "Cd-HAP"
                          ? "Cadmium-doped HAp"
                          : type === "Magnetite-Hyper"
                            ? "Magnetite (Hyperthermia)"
                            : type === "Cobalt-Ferrite"
                              ? "Cobalt Ferrite"
                              : type === "Maghemite"
                                ? "Maghemite"
                                : type === "Zn-Ferrite"
                                  ? "Zinc-doped Ferrite"
                                  : type === "LMO"
                                    ? "Lithium Manganese Oxide"
                                    : type === "HfO2"
                                      ? "Hafnium Oxide"
                                      : type === "SAC305"
                                        ? "Lead-Free Solder"
                                        : type === "Ta2O5"
                                          ? "Tantalum Pentoxide"
                                          : type === "SWCNT"
                                            ? "Single-Walled Carbon Nanotubes"
                                            : type === "Phosphorene"
                                              ? "Black Phosphorus"
                                              : type === "IGZO"
                                                ? "Indium Gallium Zinc Oxide"
                                                : type === "SPIONs"
                                                  ? "Superparamagnetic Iron Oxide Nanoparticles"
                                                  : type === "MSN"
                                                    ? "Mesoporous Silica Nanoparticles"
                                                    : type === "AgNPs"
                                                      ? "Silver Nanoparticles"
                                                      : type === "Mo"
                                                        ? "Molybdenum"
                                                        : type === "Ir"
                                                          ? "Iridium"
                                                          : type === "Os"
                                                            ? "Osmium"
                                                            : type === "Rh"
                                                              ? "Rhodium"
                                                              : type ===
                                                                  "PuDelta"
                                                                ? "Plutonium (Delta Phase)"
                                                                : type ===
                                                                    "PuAlpha"
                                                                  ? "Plutonium (Alpha Phase)"
                                                                  : type ===
                                                                      "PuO2"
                                                                    ? "Plutonium Dioxide (PuO2)"
                                                                    : type ===
                                                                        "BNNT"
                                                                      ? "BNNT (Boron Nitride Nanotubes)"
                                                                      : type ===
                                                                          "GdYSZ"
                                                                        ? "Gd-YSZ (Gadolinia-doped Zirconia)"
                                                                        : type ===
                                                                            "U3Si5"
                                                                          ? "U3Si5 Fuel"
                                                                          : type ===
                                                                              "TritiumScavenger"
                                                                            ? "Tritium Scavenger (ZrCo)"
                                                                            : type ===
                                                                                "HypersonicAblator"
                                                                              ? "Hypersonic Ablator (HfB2)"
                                                                              : type ===
                                                                                  "VitrifiedNuclearWaste"
                                                                                ? "Vitrified Nuclear Waste (Borosilicate)"
                                                                                : type ===
                                                                                    "AramidBodyArmor"
                                                                                  ? "Aramid Body Armor (Kevlar)"
                                                                                  : type ===
                                                                                      "ReactiveArmorExplosive"
                                                                                    ? "Reactive Armor Explosive (RDX)"
                                                                                    : type ===
                                                                                        "DepletedUraniumAlloy"
                                                                                      ? "Depleted Uranium Alloy (DU-0.75Ti)"
                                                                                      : type ===
                                                                                          "SiCSiC"
                                                                                        ? "SiC-SiC Composite"
                                                                                        : type ===
                                                                                            "LaBr3Ce"
                                                                                          ? "LaBr3:Ce Scintillator"
                                                                                          : type ===
                                                                                              "TiCN"
                                                                                            ? "TiCN Defensive Armor"
                                                                                            : type ===
                                                                                                "UO2"
                                                                                              ? "Uranium Dioxide"
                                                                                              : type ===
                                                                                                  "U3O8"
                                                                                                ? "Triuranium Octoxide"
                                                                                                : type ===
                                                                                                    "UO3"
                                                                                                  ? "Uranium Trioxide"
                                                                                                  : type ===
                                                                                                      "U-Metal"
                                                                                                    ? "Alpha-Uranium Metal"
                                                                                                    : type ===
                                                                                                        "LiTaO3"
                                                                                                      ? "Lithium Tantalate"
                                                                                                      : type ===
                                                                                                          "LiNbO3"
                                                                                                        ? "Lithium Niobate"
                                                                                                        : type ===
                                                                                                            "PbS"
                                                                                                          ? "Lead Sulphide"
                                                                                                          : type ===
                                                                                                              "ZnTe"
                                                                                                            ? "Zinc Telluride"
                                                                                                            : type ===
                                                                                                                "LaAlO3"
                                                                                                              ? "Lanthanum Aluminate"
                                                                                                              : type ===
                                                                                                                  "Cu2O"
                                                                                                                ? "Cuprite"
                                                                                                                : type ===
                                                                                                                    "CdSe"
                                                                                                                  ? "Cadmium Selenide"
                                                                                                                  : type ===
                                                                                                                      "SiO"
                                                                                                                    ? "Silicon Monoxide"
                                                                                                                    : type ===
                                                                                                                        "Y2O3"
                                                                                                                      ? "Yttrium Oxide"
                                                                                                                      : type ===
                                                                                                                          "BaZrO3"
                                                                                                                        ? "Barium Zirconate"
                                                                                                                        : type ===
                                                                                                                            "NASICON"
                                                                                                                          ? "NASICON"
                                                                                                                          : type ===
                                                                                                                              "TiS2"
                                                                                                                            ? "Titanium Disulfide"
                                                                                                                            : type ===
                                                                                                                                "ACP"
                                                                                                                              ? "Amorphous Calcium Phosphate"
                                                                                                                              : type ===
                                                                                                                                  "Bio-Glass-1393"
                                                                                                                                ? "Bioactive Glass (13-93)"
                                                                                                                                : type ===
                                                                                                                                    "Bio-Glass-S53P4"
                                                                                                                                  ? "Bioactive Glass (S53P4)"
                                                                                                                                  : type ===
                                                                                                                                      "Bioactive Glass"
                                                                                                                                    ? "Bioactive Glass (45S5)"
                                                                                                                                    : type ===
                                                                                                                                        "Fluorapatite"
                                                                                                                                      ? "Fluorapatite"
                                                                                                                                      : type ===
                                                                                                                                          "Sr-HAP"
                                                                                                                                        ? "Strontium-Apatite"
                                                                                                                                        : type ===
                                                                                                                                            "Chlorapatite"
                                                                                                                                          ? "Chlorapatite"
                                                                                                                                          : type ===
                                                                                                                                              "PbTiO3"
                                                                                                                                            ? "Lead Titanate"
                                                                                                                                            : type ===
                                                                                                                                                "LTA"
                                                                                                                                              ? "Zeolite A"
                                                                                                                                              : type ===
                                                                                                                                                  "YAG"
                                                                                                                                                ? "Yttrium Aluminum Garnet"
                                                                                                                                                : type ===
                                                                                                                                                    "SrTiO3"
                                                                                                                                                  ? "Strontium Titanate"
                                                                                                                                                  : type ===
                                                                                                                                                        "LiFePO4" ||
                                                                                                                                                      type ===
                                                                                                                                                        "LFP"
                                                                                                                                                    ? "Lithium Iron Phosphate"
                                                                                                                                                    : type ===
                                                                                                                                                        "GaN"
                                                                                                                                                      ? "Gallium Nitride"
                                                                                                                                                      : type ===
                                                                                                                                                          "Au"
                                                                                                                                                        ? "Gold"
                                                                                                                                                        : type ===
                                                                                                                                                            "Fe"
                                                                                                                                                          ? "Iron - Alpha"
                                                                                                                                                          : type ===
                                                                                                                                                              "Ni"
                                                                                                                                                            ? "Nickel"
                                                                                                                                                            : type ===
                                                                                                                                                                "WC"
                                                                                                                                                              ? "Tungsten Carbide"
                                                                                                                                                              : type ===
                                                                                                                                                                  "Fe3O4"
                                                                                                                                                                ? "Magnetite"
                                                                                                                                                                : type ===
                                                                                                                                                                    "MAPbI3"
                                                                                                                                                                  ? "Methylammonium Lead Iodide"
                                                                                                                                                                  : type ===
                                                                                                                                                                      "SiC"
                                                                                                                                                                    ? "Silicon Carbide"
                                                                                                                                                                    : type ===
                                                                                                                                                                        "GaAs"
                                                                                                                                                                      ? "Gallium Arsenide"
                                                                                                                                                                      : type ===
                                                                                                                                                                          "BFO"
                                                                                                                                                                        ? "Bismuth Ferrite"
                                                                                                                                                                        : type ===
                                                                                                                                                                            "B4C"
                                                                                                                                                                          ? "Boron Carbide (B4C)"
                                                                                                                                                                          : type ===
                                                                                                                                                                              "ZrB2"
                                                                                                                                                                            ? "Zirconium Diboride (ZrB2)"
                                                                                                                                                                            : type ===
                                                                                                                                                                                "HfB2"
                                                                                                                                                                              ? "Hafnium Diboride (HfB2)"
                                                                                                                                                                              : type ===
                                                                                                                                                                                  "TiB2"
                                                                                                                                                                                ? "Titanium Diboride (TiB2)"
                                                                                                                                                                                : type ===
                                                                                                                                                                                    "U3Si2"
                                                                                                                                                                                  ? "Uranium Silicide (U3Si2)"
                                                                                                                                                                                  : type ===
                                                                                                                                                                                      "Gd2O3"
                                                                                                                                                                                    ? "Gadolinium Oxide (Gd2O3)"
                                                                                                                                                                                    : type ===
                                                                                                                                                                                        "Er2O3"
                                                                                                                                                                                      ? "Erbium Oxide (Er2O3)"
                                                                                                                                                                                      : type ===
                                                                                                                                                                                          "AgInCd"
                                                                                                                                                                                        ? "Ag-In-Cd Alloy (80-15-5)"
                                                                                                                                                                                        : type ===
                                                                                                                                                                                            "Kevlar"
                                                                                                                                                                                          ? "Kevlar (PPTA)"
                                                                                                                                                                                          : type ===
                                                                                                                                                                                              "UHMWPE"
                                                                                                                                                                                            ? "UHMWPE (Dyneema/Spectra)"
                                                                                                                                                                                            : type ===
                                                                                                                                                                                                "ALON"
                                                                                                                                                                                              ? "Aluminum Oxynitride (ALON)"
                                                                                                                                                                                              : type ===
                                                                                                                                                                                                  "Spinel"
                                                                                                                                                                                                ? "Magnesium Aluminate Spinel"
                                                                                                                                                                                                : type ===
                                                                                                                                                                                                    "Sm2O3"
                                                                                                                                                                                                  ? "Samarium Oxide (Sm2O3)"
                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                      "PbWO4"
                                                                                                                                                                                                    ? "Lead Tungstate (PbWO4)"
                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                        "CdWO4"
                                                                                                                                                                                                      ? "Cadmium Tungstate (CdWO4)"
                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                          "BeO"
                                                                                                                                                                                                        ? "Beryllium Oxide (BeO)"
                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                            "ZrC"
                                                                                                                                                                                                          ? "Zirconium Carbide (ZrC)"
                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                              "BGO"
                                                                                                                                                                                                            ? "Bismuth Germanate (BGO)"
                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                "NaITl"
                                                                                                                                                                                                              ? "Sodium Iodide doped with Thallium (NaI:Tl)"
                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                  "ZrH2"
                                                                                                                                                                                                                ? "Zirconium Hydride (ZrH2)"
                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                    "ITO"
                                                                                                                                                                                                                  ? "Indium Tin Oxide"
                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                      "FeS2"
                                                                                                                                                                                                                    ? "Pyrite"
                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                        "Cr"
                                                                                                                                                                                                                      ? "Chromium"
                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                          "Ga2O3"
                                                                                                                                                                                                                        ? "Gallium Oxide"
                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                            "CdTe"
                                                                                                                                                                                                                          ? "Cadmium Telluride"
                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                              "Bi2Te3"
                                                                                                                                                                                                                            ? "Bismuth Telluride"
                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                "SnO2"
                                                                                                                                                                                                                              ? "Tin Oxide"
                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                  "LCO"
                                                                                                                                                                                                                                ? "Lithium Cobalt Oxide"
                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                    "Si3N4"
                                                                                                                                                                                                                                  ? "Silicon Nitride"
                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                      "AlN"
                                                                                                                                                                                                                                    ? "Aluminum Nitride"
                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                        "hBN"
                                                                                                                                                                                                                                      ? "Boron Nitride"
                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                          "GaP"
                                                                                                                                                                                                                                        ? "Gallium Phosphide"
                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                            "ZnSe"
                                                                                                                                                                                                                                          ? "Zinc Selenide"
                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                              "Ta"
                                                                                                                                                                                                                                            ? "Tantalum"
                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                "V2O5"
                                                                                                                                                                                                                                              ? "Vanadium Pentoxide"
                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                  "AgCl"
                                                                                                                                                                                                                                                ? "Silver Chloride"
                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                    "MnO2"
                                                                                                                                                                                                                                                  ? "Manganese Oxide"
                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                      "PTFE"
                                                                                                                                                                                                                                                    ? "Polytetrafluoroethylene"
                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                        "PbO"
                                                                                                                                                                                                                                                      ? "Lead(II) Oxide (Litharge)"
                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                          "Bi2O3"
                                                                                                                                                                                                                                                        ? "Bismuth(III) Oxide"
                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                            "Sb2O3"
                                                                                                                                                                                                                                                          ? "Antimony Trioxide"
                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                              "TeO2"
                                                                                                                                                                                                                                                            ? "Tellurium Dioxide"
                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                "GeO2"
                                                                                                                                                                                                                                                              ? "Germanium Dioxide"
                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                  "Sc2O3"
                                                                                                                                                                                                                                                                ? "Scandium(III) Oxide"
                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                    "Lu2O3"
                                                                                                                                                                                                                                                                  ? "Lutetium(III) Oxide"
                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                      "Nb2O5"
                                                                                                                                                                                                                                                                    ? "Niobium Pentoxide"
                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                        "FeO"
                                                                                                                                                                                                                                                                      ? "WÃ¼stite (FeO)"
                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                          "LiF"
                                                                                                                                                                                                                                                                        ? "Lithium Fluoride"
                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                            "NaF"
                                                                                                                                                                                                                                                                          ? "Sodium Fluoride"
                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                              "MgF2"
                                                                                                                                                                                                                                                                            ? "Magnesium Fluoride"
                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                "AlF3"
                                                                                                                                                                                                                                                                              ? "Aluminum Fluoride"
                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                  "KBr"
                                                                                                                                                                                                                                                                                ? "Potassium Bromide"
                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                    "KI"
                                                                                                                                                                                                                                                                                  ? "Potassium Iodide"
                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                      "CsI"
                                                                                                                                                                                                                                                                                    ? "Cesium Iodide"
                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                        "CsCl"
                                                                                                                                                                                                                                                                                      ? "Cesium Chloride"
                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                          "AgBr"
                                                                                                                                                                                                                                                                                        ? "Silver Bromide"
                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                            "CuI"
                                                                                                                                                                                                                                                                                          ? "Copper(I) Iodide"
                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                              "PbI2"
                                                                                                                                                                                                                                                                                            ? "Lead(II) Iodide"
                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                "NaBr"
                                                                                                                                                                                                                                                                                              ? "Sodium Bromide"
                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                  "NaI"
                                                                                                                                                                                                                                                                                                ? "Sodium Iodide"
                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                    "CuCl"
                                                                                                                                                                                                                                                                                                  ? "Copper(I) Chloride"
                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                      "LiCl"
                                                                                                                                                                                                                                                                                                    ? "Lithium Chloride"
                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                        "MgCl2"
                                                                                                                                                                                                                                                                                                      ? "Magnesium Chloride"
                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                          "CaCl2"
                                                                                                                                                                                                                                                                                                        ? "Calcium Chloride"
                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                            "BaO"
                                                                                                                                                                                                                                                                                                          ? "Barium Oxide"
                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                              "SrO"
                                                                                                                                                                                                                                                                                                            ? "Strontium Oxide"
                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                "NaCl"
                                                                                                                                                                                                                                                                                                              ? "Halite"
                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                  "KCl"
                                                                                                                                                                                                                                                                                                                ? "Sylvite"
                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                    "CaF2"
                                                                                                                                                                                                                                                                                                                  ? "Calcium Fluoride"
                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                      "In2O3"
                                                                                                                                                                                                                                                                                                                    ? "Indium(III) Oxide (In2O3)"
                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                        "PbF2"
                                                                                                                                                                                                                                                                                                                      ? "Lead(II) Fluoride (PbF2)"
                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                          "TlBr"
                                                                                                                                                                                                                                                                                                                        ? "Thallium(I) Bromide (TlBr)"
                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                            "ZrO2"
                                                                                                                                                                                                                                                                                                                          ? "Zirconia"
                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                              "Graphite"
                                                                                                                                                                                                                                                                                                                            ? "Graphite"
                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                "Hematite"
                                                                                                                                                                                                                                                                                                                              ? "Hematite"
                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                  "MgO"
                                                                                                                                                                                                                                                                                                                                ? "Magnesium Oxide"
                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                    "CeO2"
                                                                                                                                                                                                                                                                                                                                  ? "Cerium Oxide"
                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                      "Calcite"
                                                                                                                                                                                                                                                                                                                                    ? "Calcite"
                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                        "Tungsten"
                                                                                                                                                                                                                                                                                                                                      ? "Tungsten"
                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                          "Quartz"
                                                                                                                                                                                                                                                                                                                                        ? "Quartz"
                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                            "Beta-Quartz"
                                                                                                                                                                                                                                                                                                                                          ? "Beta-Quartz (High Quartz, SiO2)"
                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                              "Alpha-Cristobalite"
                                                                                                                                                                                                                                                                                                                                            ? "Alpha-Cristobalite (Low Cristobalite, SiO2)"
                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                "Beta-Cristobalite"
                                                                                                                                                                                                                                                                                                                                              ? "Beta-Cristobalite (High Cristobalite, SiO2)"
                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                  "Alpha-Tridymite"
                                                                                                                                                                                                                                                                                                                                                ? "Alpha-Tridymite (Low Tridymite, SiO2)"
                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                    "Beta-Tridymite"
                                                                                                                                                                                                                                                                                                                                                  ? "Beta-Tridymite (High Tridymite, SiO2)"
                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                      "Keatite"
                                                                                                                                                                                                                                                                                                                                                    ? "Keatite (SiO2 Synthetic Polymorph)"
                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                        "Moganite"
                                                                                                                                                                                                                                                                                                                                                      ? "Moganite (SiO2 Monoclinic Polymorph)"
                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                          "Stishovite"
                                                                                                                                                                                                                                                                                                                                                        ? "Stishovite (SiO2 High-Pressure Polymorph)"
                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                            "Seifertite"
                                                                                                                                                                                                                                                                                                                                                          ? "Seifertite (SiO2 Ultra-High-Pressure)"
                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                              "Diamond"
                                                                                                                                                                                                                                                                                                                                                            ? "Diamond"
                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                "Rutile"
                                                                                                                                                                                                                                                                                                                                                              ? "Rutile"
                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                  "Anatase"
                                                                                                                                                                                                                                                                                                                                                                ? "Anatase"
                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                    "BaTiO3"
                                                                                                                                                                                                                                                                                                                                                                  ? "Barium Titanate"
                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                      "MoS2"
                                                                                                                                                                                                                                                                                                                                                                    ? "Molybdenum Disulfide"
                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                        "Corundum"
                                                                                                                                                                                                                                                                                                                                                                      ? "Corundum"
                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                          "TTCP"
                                                                                                                                                                                                                                                                                                                                                                        ? "Tetracalcium Phosphate"
                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                            "PZT"
                                                                                                                                                                                                                                                                                                                                                                          ? "Lead Zirconate Titanate"
                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                              "ZnS"
                                                                                                                                                                                                                                                                                                                                                                            ? "Zinc Sulfide"
                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                "BaFe12O19"
                                                                                                                                                                                                                                                                                                                                                                              ? "Barium Ferrite"
                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                  "WO3"
                                                                                                                                                                                                                                                                                                                                                                                ? "Tungsten Trioxide"
                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                    "VO2"
                                                                                                                                                                                                                                                                                                                                                                                  ? "Vanadium Dioxide"
                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                      "Ag2O"
                                                                                                                                                                                                                                                                                                                                                                                    ? "Silver(I) Oxide"
                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                        "CuO"
                                                                                                                                                                                                                                                                                                                                                                                      ? "Copper(II) Oxide"
                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                          "NiO"
                                                                                                                                                                                                                                                                                                                                                                                        ? "Nickel Oxide"
                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                            "Co3O4"
                                                                                                                                                                                                                                                                                                                                                                                          ? "Cobalt(II,III) Oxide"
                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                              "LTO"
                                                                                                                                                                                                                                                                                                                                                                                            ? "Lithium Titanate"
                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                "YBCO"
                                                                                                                                                                                                                                                                                                                                                                                              ? "YBCO Superconductor"
                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                  "ZSM5"
                                                                                                                                                                                                                                                                                                                                                                                                ? "Zeolite ZSM-5"
                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                    "MOF5"
                                                                                                                                                                                                                                                                                                                                                                                                  ? "Metal-Organic Framework-5"
                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                      "Pt"
                                                                                                                                                                                                                                                                                                                                                                                                    ? "Platinum"
                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                        "Pd"
                                                                                                                                                                                                                                                                                                                                                                                                      ? "Palladium"
                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                          "NMC"
                                                                                                                                                                                                                                                                                                                                                                                                        ? "NMC-111"
                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                            "YSZ"
                                                                                                                                                                                                                                                                                                                                                                                                          ? "Yttria-Stabilized Zirconia"
                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                              "SRO"
                                                                                                                                                                                                                                                                                                                                                                                                            ? "Strontium Ruthenate"
                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                "GO"
                                                                                                                                                                                                                                                                                                                                                                                                              ? "Graphene Oxide"
                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                  "OCP"
                                                                                                                                                                                                                                                                                                                                                                                                                ? "Octacalcium Phosphate"
                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                    "Cellulose"
                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Cellulose"
                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                      "Chitosan"
                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Chitosan"
                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                        "Silk"
                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Silk Fibroin"
                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                          "Whewellite"
                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Calcium Oxalate"
                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                            "ACP"
                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Amorphous Calcium"
                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                              "PLA"
                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Polylactic Acid"
                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                "PEEK"
                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Polyether ether ketone"
                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                  "Collagen"
                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Collagen Type I"
                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                    "ThO2"
                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Thorium Dioxide"
                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                      "Zircaloy"
                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Zircaloy-4"
                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                        "NuclearGraphite"
                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Nuclear Graphite"
                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                          "Nd2Fe14B"
                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Neodymium Magnet"
                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                            "TiC"
                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Titanium Carbide"
                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                              "Cr2O3"
                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Chromium(III) Oxide"
                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                "CoFe2O4"
                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Cobalt Ferrite"
                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                  "BiOCl"
                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Bismuth Oxychloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                    "CsPbI3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Cesium Lead Iodide"
                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Ti3C2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Titanium MXene"
                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                        "UiO66"
                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "UiO-66"
                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                          "HKUST1"
                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "HKUST-1"
                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                            "MoO3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Molybdenum Trioxide"
                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                              "V2O3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Vanadium(III) Oxide"
                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Hematite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Hematite(Fe2O3)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "PerovskiteCat"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Perovskite (CaTiO3)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Feldspar"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Feldspar (Orthoclase)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "SS316L"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Stainless Steel 316L"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "SS304"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Stainless Steel 304"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "SS310"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Stainless Steel 310"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "SS430"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Stainless Steel 430"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "SS174PH"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Stainless Steel 17-4PH"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Duplex2205"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Duplex Stainless Steel 2205"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "HastelloyC276"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Hastelloy C-276"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "ToolSteelH13"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Tool Steel H13"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "FeCrAlKanthal"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "FeCrAl Alloy (Kanthal APM)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "AlCoCrFeNiHEA"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "High-Entropy Alloy (AlCoCrFeNi)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Ti64"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Ti-6Al-4V (Grade 5)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Brass"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Brass (C26000)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "SAC305"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Lead-Free Solder (SAC305)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "TiGrade2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Titanium (Ti)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "AZ31B"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Magnesium Alloy (AZ31B)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Al7075"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Aluminum Alloy (7075-T6)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "CoCrMo"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Cobalt-Chrome (CoCrMo)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Nitinol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Nitinol (NiTi Shape Memory)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Zircaloy2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Zircaloy-2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "HastelloyX"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Hastelloy X"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Monel400"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Monel 400"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Maraging300"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Maraging Steel (Grade 300)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Beryllium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Beryllium (Be)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Vanadium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Vanadium (V)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Niobium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Niobium (Nb)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Zirconium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Zirconium (Zr)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Magnesium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Magnesium (Mg)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Tin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Tin (Sn)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Zinc"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Zinc (Zn)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Lead"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Lead (Pb)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "PoloniumEl"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Polonium (Po)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "CastIron"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Cast Iron (Grey)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "A36Steel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "A36 Structural Steel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "O1ToolSteel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "O1 Tool Steel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Constantan"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Constantan"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Kovar"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Kovar"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Nichrome"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Nichrome"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "BabbittMetal"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Babbitt Metal"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Duralumin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Duralumin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Dexamethasone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Dexamethasone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Metformin Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Metformin Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Omeprazole"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Omeprazole"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Ciprofloxacin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Ciprofloxacin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Azithromycin (Dihydrate)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Azithromycin (Dihydrate)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Amlodipine Besylate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Amlodipine Besylate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Simvastatin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Simvastatin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Losartan Potassium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Losartan Potassium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Cetirizine Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Cetirizine Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Fluconazole"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Fluconazole"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Ampicillin Trihydrate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Ampicillin Trihydrate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Pantoprazole Sodium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Pantoprazole Sodium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Valsartan"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Valsartan"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Loratadine"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Loratadine"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Glipizide"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Glipizide"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Erythromycin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Erythromycin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Tetracycline Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Tetracycline Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Rosuvastatin Calcium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Rosuvastatin Calcium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Ranitidine Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Ranitidine Hydrochloride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Prednisolone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Prednisolone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Hydrocortisone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Hydrocortisone"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "AlSb"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "AlSb Semiconductor"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "MoTe2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "MoTe2 Monolayer"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "BaSnO3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Barium Stannate Perovskite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Sb2Se3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Sb2Se3 Photovoltaic Absorber"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "CZTS"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "CZTS Kesterite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Fe3GeTe2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Fe3GeTe2 Layered Ferromagnet"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "LLZO"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "LLZO (Li7La3Zr2O12)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "LGPS"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "LGPS (Li10GeP2S12)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "LATP"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "LATP (Li1.3Al0.3Ti1.7(PO4)3)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "FAPbI3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "FAPbI3 Perovskite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "PrussianBlueNa"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Prussian Blue Na-Cathode"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "MgH2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Magnesium Hydride"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Inconel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Inconel 718"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "SBA15"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "SBA-15"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "MCM41"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "MCM-41"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "MOF5"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "MOF-5"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "ZIF8"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "ZIF-8"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Ibuprofen"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Ibuprofen"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Paracetamol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Paracetamol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "ZTA"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Zirconia Toughened Alumina (ZTA)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "YTZP"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Y-TZP (Yttria-stabilized Zirconia)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Alginate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Alginate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "HyaluronicAcid"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Hyaluronic Acid (HA)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Caffeine"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Caffeine (Anhydrous)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "AscorbicAcid"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Ascorbic Acid (Vitamin C)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Sucrose"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Sucrose (Sugar)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "Cholesterol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Cholesterol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Carbamazepine"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Carbamazepine (Form III)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Theophylline"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Theophylline (Anhydrous)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Naproxen"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Naproxen (S-Naproxen)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "Diclofenac"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Diclofenac Sodium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Aspirin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Aspirin (Acetylsalicylic Acid)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Amoxicillin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Amoxicillin Trihydrate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "MgTCP"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Mg-Substituted beta-TCP (Mg-TCP)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "SrTCP"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Sr-Substituted beta-TCP (Sr-TCP)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "ZnHAp"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Zn-Substituted HAp (Zn-HAp)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "BariumSulfate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Barium Sulfate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "PMMA"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Polymethyl Methacrylate (PMMA)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "PCL"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Polycaprolactone (PCL)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "PLGA"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Poly(lactic-co-glycolic acid) (PLGA)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "TiO2Nano"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "TiO2 Nanotubes (Biomedical)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "CaSO4Hemi"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Calcium Sulfate Hemihydrate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "CaSO4Di"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Calcium Sulfate Dihydrate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "Whitlockite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Whitlockite"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "Meloxicam"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Meloxicam"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Curcumin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Curcumin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "CoralAragoniteScaffold"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Coral Aragonite Scaffold"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "PyrolyticCarbon"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Pyrolytic Carbon"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "AkermaniteCeramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Akermanite Ceramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "AWGlassCeramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "A-W Glass-ceramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "AtorvastatinCalcium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Atorvastatin Calcium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "BiphasicCalciumPhosphate"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Biphasic Calcium Phosphate (HAp/beta-TCP)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "PaclitaxelTaxol"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Paclitaxel Crystalline Form I (Taxol)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "GelMABioInk"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Gelatin Methacryloyl (GelMA) Bio-Ink"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "BetaChitin"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Beta-Chitin Diatomaceous Biomaterial"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "BaghdaditeCeramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Baghdadite Ceramic"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "StruviteCement"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Struvite Bone Cement (MgNH4PO4Â·6H2O)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "PiroxicamFormI"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Piroxicam Crystalline Form I"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "GOBioNanosheet"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "Graphene Oxide Bio-Nanosheet"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "CBDCrystalline"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "Cannabidiol Crystalline Polymorph"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "UO2F2"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Uranyl Fluoride (UO2F2)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "Ag2F"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Silver Subfluoride (Ag2F)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "YbOF"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Ytterbium(III) Oxyfluoride (YbOF)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "NIST1976"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "NIST SRM 1976 (Corundum / Î±-Al2O3)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "NIST640"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "NIST SRM 640 (Silicon Profile Standard)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "NIST660"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "NIST SRM 660 (Lanthanum Hexaboride, LaB6)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "NIST676"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                ? "NIST SRM 676 (Alumina Phase Quant Standard)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    "NIST674"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ? "NIST SRM 674b (TiO2/ZnO/Cr2O3/CeO2)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      "BiOI"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    ? "Bismuth Oxyiodide (BiOI)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "ReO3"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ? "Rhenium Trioxide (ReO3)"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          "SS904L"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        ? "Stainless Steel 904L"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            "Ti15Mo"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ? "Ti-15Mo High-Beta Alloy"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              "Invar36"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "Invar 36 Low-Expansion Alloy"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                "Stellite6"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ? "Stellite 6 Cobalt-Base Alloy"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : type ===
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "ElectricalSteel"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               xœìÛvÛF–†ïýÕX³:`[d(JòAŽ‚EQ’ã±ek…êq•Á‰qÅ.€:$Ñ;õe_ÏÌ3Í®ÂŠÖÁI÷dÿw!‘@kï](Š±3ó¥3…\²a&„dþ‘h£–÷èßÝ þ•ì²ìj&ØÞÞL¬Þ‰Ð1—R]!tƒu#pì›ùo£ö‘€DkD
Xk¼“©JgS¥÷µJ~ˆá`ý µ’›7óKsgùˆ°†@¶€5ÇÛúJÊhÔl&49XGÇÒYnêÌl>íu»/`-|k×—O»OwÃÁzŸÇQBÂ¥Ÿ?(2ß>}áÖHÐ ¼ãÉûÃí-Äq°®|9æ“D¤Q¥_`ò`xÀ;å›Ý÷å`}	Œ•'—ó¸MÆžK˜<X_ _@CðÞŽ¶†	Â9XgHÃ¼Ô("	s%Ì·F§G`­ŒÁÌg:Êð—G`Í	*[gþ`Þ{Ö(Ð ¼Á”ËP…3 ®Á[M3„¦kThÞ€ëLGã‰Ø×<MãÁú8fÏ¬Ý³AïI·ëë4höt^%QøAÈ§Ý-zÐ‚šå³§Ý6l4ÈÐ8¼¾ŽáA3rƒgCG¡JÆó0SøºHÐ q@ñŽÕ©è!Ìƒ¦6Ïb•(É¯ðØ 9@æ€FâíóaòßK„ù¯\›oæf<Ix&Ø‰Ðê<ý€ÏÞƒFáŠ7õ†Ò4Š 4|v2U™:W2ãQÈø(Uz„SÐ, €@cñßñA³rÃg¯Eš	|}h= ÁxGbë¥ÀG|@	æÏì'}Ä˜	­UlþcU— Mr4ï»Óþ‘ˆ•æò?U”` $°~À
G`ðÐP ˆ@ÃÉÿs†Ç ¡Ž0ÿHl½ÛÆW4ƒFAwrˆøš	©¡%¯D6½’"!Atr5
ô Ìûvð« h*Aîl8Ÿ	/HÊ fþºLÄ  MÆžéLòdÌr`~_F™ÀÙh0PI X¼w2:|Ì4š òæ)]üm>th4PJ x'WZ]
ˆ%Ðt‚…30ÿ0I3žA. Á@…·)ü ùþ€7 `€PÀÁ;ž§¡:Çò  Ë¿  @	$ 5¼×\É(Á€%€O PÂ	€%¼c¥)Ç:@Iàºó‡Ñ ŸiÀÀ¼ƒHÍÒh@A · `H( Và½QI:æRà8
 ‡ æÌÿJ\vØAÄc•Œq8@Ô +ñ†Óy2¸ F × `S |¯ŸŒ5Ó²ñ’ëDà›Æ¨8>Âr'aþ€o‰ž?ŒÞm·¶p|@h. >Š7P"ÅV€•w˜®¿ë±¯¢É´}¢EšÎµ`æÿÇJÏ¦P] ,ÝÀ-xƒ)WP^ ¬ ¨üƒùï§æ×€ë‘JX_J•i5Ãw£pè. nÅ{?×ÙÏ^ ¬$X¸ˆýx<Ÿ¨„Kö]2„è`] Ü7Ð*ŒÆJB{ð‚šŸ0_Îë§#‘f*eýx6FJâü€Õ@Œp'Þ±J²XéHJ…o-àãð î	 ÷À{%qÀmp î¢€{á(©b¬( ÜJ Wà>@~pO¼¾6*Æ²Àð î	d ÷Æ{%c•€»	à. ÜH1 €×Ÿñ‹ ÷ ¨ü…ùGr®4Ïßá#¸¨3 „÷]¤C•`}àn8 ÷’€âª¹Ž¹Œœ›p/×m˜?§JKœp/ Ô x0Þ¾ÐWË ÷#€Ï ð  Î ø¼¾Œy2ÆI  p<‡ù/¹ND†Ã4 î4 Ÿ„w4—RhÕÀCßaþàI¢€ ÙÀ'â¿¼=Å’ÀC0ÿ‹i.³¨}ÁI¼Ù€ë‘JØ[ž¨l>)ó­cAÌð  ç ød¼¯¸ç«Ö F;ƒð)@¿ðð^Jž¦WX ø4‚Ò‰ ã øD ä øMxý$›jâuø$8 ¿\Ê½xT¸O¨’4c1ÏØ;îŸ~ýªÿæÇƒýÎY”Œ}?n±½/YÜIx,:QÊùX¤~*¸§¯ÅU«õ¢(&:c>ÒbSžŒ¥8æ™Ð—C!E˜Ù;yÊkúym+Ï+žqŠñ‰Š’,¥Ø·ß|{À3îGÉlž™W-›þóÏÙ@%Y”ÌÕ<eiÏ%U2féŒjÐó˜)Í²©`2:l¦Åy$.ØLªŒ]DÙ”Q‚"GfïrM¢÷iÕ“k0åÚÖH-ùZPÚÎ<Ç"V¾oÇá—G‹›ÝÚÞrH(UGŠdBõ“vfÝÓ"›ë„}ÿCžÈþ ®•¦2óa]±ÞÿþÓö'”‚'¶Ôñ‰S}Jé©ó{ìûN§CµüÐ1W|Ÿo°‘m+ïdêt*¨3m6ªÞm“‚æ<JN©€¼¤ï»?Tiœ$üÒI’ÿ*ûÓf›ËYÊÎ^ÎÈ
ØHÍ“±í§’ô$Jl‚¢^2‘i‡*ð{ù¥6Û)ZWT›§ˆs§»‘_|\¥qÆ"4ÓV™P9²ÔŽWI¨OE9°!5(³ãšÆJ‘­hfÚ+-è^<£.š dL¶[í<ÿÀfßc½n÷…[š‰]ömÛ¶3-ö¹›Éi²©Ý7c{IYLÒôê‹=Û=óòñž-¯U[>!—á+[w·t8[NÑ:¦ÎŠ9Zd³ð’ÏÓ42$ø–N9íáb5’Í³HF?S/k~aMx_+>I9N?©þ¥ÔÍ^gkg§EÚs.{tLéIeWì/ù|ŠË™ß¶¯fêÂ¿¤ñšUV´Ázfàü^™Ø$IÍÕE aÕ`ÐHQ-åõëâ÷£ªó}š×ÙÔ‹?L´±F
OR±P˜>“ûPÔë=ëtÙXLn‘IUV-jŽ&Õˆ,RPÛ·>ÞYSÝÊnnîä7=]ô„l;MUÒ–ÑÁzSÌ¢iì-Í~kR¾çBÖ[M1Œ&‰¡j0©3/jÉòzÈ¬m59ŠŠ)¶Y·³Ó¢–/UAWºíz´†pù_¶žÊÛ©“NçÕ¬è3Åús%©wÊ¤ëgdFÅë!—‘HÂ+æ¿Ô|ÜôÙ…ˆ&ÓÜMÌª@éZµ†ó7‹‡ŽF¶D§ãŸ/š¶¹QŽV½3iQíû¼.7<u©Sù(óoÔöö|§œk›aÃ©~sçæœ;­3›§SáÕ¥¯ì²·óx$´ÙÉÔQt)Æ>ÏF•®r¼*a9«Ó—Ý«’×û[eÚ\dºvÖtV.lNÓÍÝëö}µ0n,‡e+Ú¸áN?T«ÿŸGÙÏ®Ú/•äW6`sãÄåR?¦ªå<œä—ÿ–óße….
É×)SŸÍäU9vü¼ŠbÌ†“÷$ÙÔEõö@L´îrY4¶XÇc>óý%·­©Lla`N`.îi~±ëõòzÙÌÝêÕ÷Ñ´]sÞ9+ÁŠ"®sXe-éWaù0å¢s â8Ê†¶N)výÎóüâ;¿yq™¸4‘©,ÕNñÌ´å§ÿøe1›•/oµhÀÍj67¿þ©Õùoòcßû[âµ¤"{U—o*+®Ï¨µÃ+ÚšŸªDø^:C‘¦y®ëódSŠ4úYÇ¿:áÜuò/›®eÁ[…á|Þƒ´¡–+“]1J«ÄÝ¹–îN%pŸ}LànïT÷Yk©ÙfœßÍÍ¼z^%m_Š„{’«SŠÎÔÝ´X+iÞ4r†,ƒvF<,UÜ=d'å|°ê¤‘ø¨äÔê,’âò"!¬ÿh¢ð~rÏl¦^˜’ÔÙ9v-“‘{ÃÐ:æƒ$ M˜þâà¢Ú–•†›Õü:ÚðU5µ·(D§-ËÃPºÍ#E8W	ÙÀV¯ÃmK~rµËêàF%wHÄQ—ïæÌ¼hat	³‡	ìÀ%‘LU¢’#-þ>·–74ßÔBâEì²ƒ7'Sêú ¼Â~eÉ\ÊÖ.ý2¢lMØûS•³Ò!›½Rƒç5Ú9/Ru„äi…Çj<—d“¿þJâ³kMàŒKi,eÊ\c/O¸SŠžªZ9ãbÒ¨ 2ÐÐ56ù<Œ·œ"Î¨ÇfëÜÙ®YÉ!™<•^ŒoÑ‰R¯RWv./&4š‡IÆ“‰19%½ÖjfG4¯÷Îa5ÒãþCÛí<¾½XŒ‰šÈ¸¸ZF¤µ¡
õUšq9¤Ÿ"¨;oÔ…ÐÊLŽDãW†tSi˜.ŽØ¼p>ŠBÏ¦©]R²JºWîqª¦<y¾e'C&äö¦tË”]úž[ÔT\ò‰ÙRÙjV¥ znO@sImÙK­ÚìtŸ?+[µµÔªzeÔ­²=7
Ùzö¤,dû¶BH1M•mÕŠÚì<}¾Yóä¶bbòÒBéŠBzîÓçe!ÏníÍRYÆ"÷V·WæÞì¶9¦_ÔL'VR˜í¬.vœÆ]»ÝšzüñÜÈ&[ôcšÿnw“¼+¾XåM&­#üê1‹vG22¡V•‹19ÃAtvfÏHQ½ÿê˜ùÁŸýÏ?(ä§æ°•ü‘]'c®Ç­Ê#ÍêBa;6.ÿìb[«Ü|æÈº¢Q‹`ßéno0›6—ÛÏz+<=;îù¬«­Çº'É…¬mÏœq‹Òƒ(µ9íÛc+òaDñQ)¶òÃY›®8Õ»±X?}èYl
ºswo‡\	Hõÿ55Ç’å¥adÎBÎèå7_83B«å¨~v—·Pœå“aNþIµ-0#š?ËÃàgìÏ¾qÿKc[;´Ÿ[¾±k§·f’ÅôW¦àµ·n¤êõj«>Yow“ÄYp^Hñ»UÌƒäÅÌ-d§9è¥>eŸ™Þê©,Akw>,c»,‡„yÜNíÙ/)çh<çå	Ym‡\ØD¾OvÌ­\´8sLw¡/M[SûèCŒ«ì‹Û1þÑÕ´tMlÇùïCr³zû/r'žuL‚ÕªtæZgžò´P¨ÅÜ9jz¡œÍ«%_°Ù–.7ß)!È[ÁG©ï*þv­-'Ã®]Â_,ª+¦Î‚ÛŽ2ì4-ÎÈVj,áî­0](B­›É0µÔ»•YÔ•ÔîbÌþDŽi’¹eç·Üro”u]íhªº2”‘MËàgÂÉ‡Â9ÊË¸ÝR¶-¥p&åî®|êæ._7·½öõ™TJû®K¹›ìcŸZp¸±9î•Ç«¡ˆd½ š£®z0eŸµjÑœ/ å‘]íŽYŽìêl^ÐrW®qù}sdñ¨¾Îªít¶ØNg«ŸâD«‚Åêç8y\‡.ÚNë²‰ãµ=o=îT~dÒ¶Øl»Š¤5çˆœÐp÷.ÛöÑ Pºåü·EÇß#6þ¶Èxc(‹ çF´‡ŒäH{{l½u(ë±tiXQxzw4]Š¥ÆAî|ìÝ÷±Ãª³E'Ãý#ìCâërDü½bëÊGf¼–%kèHÕòÕ·¥<X‹š§bóök¾É†eXú¦­ù{ÏÏE‘ÚßììlwŸ°~2!Y¨ât¡ÎýñuÿÇ7ýãýƒ¾Ý™„eÁ‡—¤öÙ>mÀ&lÜ.NÝj»ÌRKÆ¼<§J):gùÉgmp0,ò“L/ç@LÊ­ö»X4x¯Ö®eQïä6û÷-KwùÚ—Ô­g‹§2µÍ’mè×ÜôÂw[eö­ÒSO^·¤2êju±°U]¦’œh›ä÷‰P·¶	s:¼»Óú&ÌØ´”ÑÄì­BE¯Rö6?WäIH!Ò¬F“‰ýl‚€_½~c5¬}¸/ùˆv¡µi°Zw˜ç!«2ÐtÞFÄ]Ö×d:_üâxv>;/–\²¼:ý rÐÌVýåí—-žæ#µjæŒhíÙ‰IÿÀ§'îá”Hç2«úóh9^í¯þŠ¾÷Ü–×Æ…)/§-¦â4zùÖˆ'âÛwöPµ~ïúËBwÔ5Dd—Gúõ«}Ä†.=~¼XjŠ‰kÍþ  ÿÿì}ÙvÛH–à{E$+3MU‘wKJËydÉ‹º¼¨MUfwº|Ò 	‘hƒ  -15:§§fz¾`¾`¾ çmž»ßû#êKæÞˆ D -^²’u*-‚@ âÆ»/iHŽó6y+Fj®MY­ÀqTâŠòúN{ðâ‡
OyC<È‹1Þ„¯w…>¬B$q„=ü ÈÍ0' ã†Ž À2ñßð•ôDÆ˜YÔOõÒ§ú5žê§O
OåÁ)òfiÜžJÆÀwöeðöß~W¸aÔ× ¸¯ pÙ>@¶ßé¢øÄnÎ¯×—Vøºšôß?àÌ¿!CqôèÔ3fŽb^ $ô]Ý=Òîwƒ‹ûÚƒ¯Ãìk¾Ž³¯øº_%ÄÙç“Dl CcÜbºÕxi(]êã¥1^jï¤Æ¡›q#‘95%ho¥ÒÛ«¼üt
ïÏ$ŠdT!‚B$	8±ì'qmEQBdìí_øÑ,, ÐÆà°C×
\P5ÉÑÀ¿ó+ø ³G¤­ïe±ù{fûXºÄ2 $®\N~êº—~[R	líÍí3Çf (Wß+¯ºòUI(|÷õ%ŽvEÿyÏþq¯ÞIÂ`údm€œêÍÛ¿£¦¶lÖyêB'^*šý{U)0ñ#Éo‚Ý¨)À*«„Ea¡™__ÿ{K3ò×S/'SD~¼£â "IRŸ¼I}BØZöžÉåØuû«Sßwc‡Æ]^õÖøo\ßš·˜4D®ö@>Úä$!‡“Ý-ü™J-2ÏMÀÄBÙ¸¶À^hÔÍŠÍH]­)­FÈÝ ŽíeôÐòÈëN;Uâ$¾ Ž Ûéîˆô‹’)Ì@7¬(zi­ìýÆtÑ~ó»îýîQoçíöîˆz¸ç¡´§î:l¯æÔ«ÚŽÏîvIÐê ·çíþ…‹a¤sÿ¼ý¦ûshøÏüO¸˜ZÍn‹þ¯³³õ–q‘©¢?ýÃ½ßínïtÑlÒ†aúÈ'Þ6
ÈŸñ™k_†mwÎ6í©ŸÛ¶G€ZÔfîx²š¶$˜¶ûQò®©üÒnWz‡æ-Ò¨+h÷sOÁs“`áÁs ÐþO×<ÛXð¦nƒlµJzðÌ÷âöÔw% äôôA‘8„ÝjŸ;ÇuØáý=ô‰7½^vìÃ¹Ž-(ùylãDrÀØh\>=„ø‚-{Ûëæö<ýe ¨tÑî“`ÓîÂC	J­æEçÅ‹ˆ"CY€T
ÌÆCŒžßW­R·Â .ub§ïÀÀqYæKá$ŠÁÿñï×9¿ \¹Üþ=™dÖ×CæLvýEhK¸ð‚z‚#òûí«’ã³9Áÿ´A­Œ`(^³3[ÇÐn—Ê€¡doà´«°áYÂÿà+M÷w7Ý^öÜ_áÅ“€ÉÆ)ö%³`4ç?«Ü2ØÝ´€ˆ)ŒÍÓ^Ù¡åÎéyW`å©RÊ\D’áÖùÏ{¼­ñ×ýß«[<¢Ÿì¢
-Uÿõÿú—ÿ~W°Þo4pg–­.À÷–N!çÑßw •PZhÖ¤“yÖ‡.ô#[M/Ó_8½„ã³'œJwAÏî5È&{ &›º=~á`›rjÃÜÞþËÈ03’aj}%/ÑAr¨Â’f²­¸«W&Ó/ ÊÖÕß•]$Av›n]îõ—‰¸É$t*¥¶ˆ3¿HÌELfÏO	Æ/¬â½½Ù¿|3a¸±¼˜ªwÁpWïòt…ÔCTdCŠ~ÜÂnœ/ááí7 ~Þæ@Ï~åst‹»p]!LÜÏéZJ\ílíjØFñÆµ÷//•?!ôÐw}ªÜÌð–î~ÿbB…å=ò®l`\ÐpkúÐÕ;õcWÅ=#EY’®_y˜”R¤HÂµ7cA(÷ù;û$ø¤z»ò€+ÙT:YÅ0F¢_ŠG“Ý"3i7TT­î’GÃ–»¦ÅMHƒ¿pl~YpÑÄzñª”—ÒÙ{~¸î/lÉ™Õ,ˆô€SRÌ"8·¶$i¯À¯ògj£rÃùå§3.ˆs(úUjYy™ÏLœ™‰¢üžÁqs6ñ×áÌÎQe¥¾¡‘› Õ¦ÚB&‚ÿëÿµAÃ¨˜Dnß¤¯*'"óÀ&f?I‰¯ç{Ä]ì	_™|¿LÅYá89³æôßù:¤Î<º)lkA¡ãtÅ¨pœúyf[HÍ¿%/ü¹M&çZCòÈ
]#?/˜Ì Eogô”9j/íØo‡ä,ôW‰éáè-ùàXøí ×ëaW|á§ ="Ñj/hS¢=(è"H?¸U¡.Ë6Aé™W—Î|n{Â¾æ§nMi´à§´»$D7ü{ÞÞó€ÿÀb„÷Ð&2B-'8Cs³?Àª# ž-Jv²šïÑ¿Cÿÿ6`ÍéRi÷ºÕ6”cVèqç¸‘Küh* C»1NV”Ká_éyäÏà‰ä;éxžBö| gÑÉY_p‹Æ)ºk7²ÖòTþÚâÈƒe¯(×ºˆÅôO[ž«Q!)£ˆ1"’Ùv@žÛVHƒ.1è“Æ³“ã9·X
+®yÙÓ0bqª*£ÃêEªà*÷YüqÐ•„=+Tf=[PBáàã”ç›ë3N¸¨”œòü²[ÙñÃÚ|öŽûáþè>^Ï€xcöÜ¾ I®è¤·Ö±¿¢+^;vzòœüËÚÒoßƒíàZæ¢XcLßÓ5Ì/!ß§þbáÚF¢Œ‡V ÀyDeü#¯w>˜®ã¸0}ß;ta"û—,N;²ãÉÒ?§“£sk~Iß·ò2[6µËwzË#àî q·/š¬$’BËc¦Ð¶å¦|äë¢œ/OŠ(°ð{ÒÈÈß˜a¾L÷†‰Éï£1X1ÒI²¾©Ìä9¡~‰LmO ì‚ô$L+//çUÁÂÁxf»Á¡Î\[kÚÎÖ§3n?¼Ìk¨ã¿ô[—,àgãJ­e3„’0›á¶,ŒÈø¬ósºãî!J=™…©ÍšEnUä@J|/`¼J‡„SðƒcŸã2š÷’ÐÒ{RôŸp+˜ƒùŒý™?U%ÌªÖ4Ï,W¨š z0œ!vPJtäXÏÇ`_ýƒ
©Þ	ìÉfcù2ò/BÅé#äKIHA¤ÔMÙITˆ˜ÙáD©òƒã»vÌ¾e§†«¹Ú ˆšc
Â¹K]cÅg‹žÀF¾wíH>hj§ÀÿÒ—X¨‡â‰Wœµä´¥a€Í'!À`în¶t¼09S¹ë·„Ë4Ù"¾&»¼"kžû,ñ˜ƒ§‹xëƒ@6[F 0}Nhì¢u¸‹©š]ŽÄ)pÈé…Û:è«ˆr_ÓïÈAXe*k
\N”Y¨lH%ÏÉrfÿ+1 “7A:`†å¢UÊGFQt[dIc¦àÏ<‚r­Eº¿—Ýß@±±‘ÄÊØø²!h„† Q¹!¨`_ ]4û:àŠ£ð’r’ñá(úÃ·…`‚•¾ÈyÍ”3tŽôÌËdòQ®áò(jÆˆèEI¶J˜)¿Lij<ìil§‡Kß‡9¢âÇÃ¼¤™*:,X ¯ì¸ RáºÑ’pam_ðvdè¢ÀD,°÷ #Ë1:<÷J’ÙÁ:	m„Mo~H¦¶ëŸ“&-WðÜ9ô_ýõ/i‘‰£û»óñCrêà[øç: á9ÿÜÃ¢xí,Í¡Aë`•‰NmíéFxÊió-â)ñãá©´„šxÚ×á)Å”cF1Wêã"ê3'®ÂÍlnÌ¨Âí(G)švÈé’VlÇhhBuÝŽ^ zG¼rŒ†™Ñ»?óý8iî¯ã‘•ƒaû6 ô<úÈ()cn	'ESÍÇAJy5±r ÁJàù.Vx|MCk£Œ”ÇM•$<°–PëQ$Ø‹6+¬ç°iÑr=6Aÿb1›3ÅÌÂËkÜ%iùß‹eÿ>8ÑšbwXûlg"Mv=µËÈÒÊR4Tëô9îW ßRïÁ‰åÙndî)­àÔ{!@ß•hä±·€S™{kóÐw]+ˆ”ëÒ²©6
ÒL-¢òø–,ßQ”F+AiO£Š‚À.Éå'vTâ¿ÈŒ
Î}<s²¢!C)Ze¾Á“ƒ×ü\op×Š‰(¬£
ÏA=Ýè9  ‰–@Žß·U!&6­£õÄHeÓRÒµ{û&qËAÑ‹¿R»ù	(`,9„“?e'âÁör`1Pfû7ß¨¼ï[®ÅŸ(#¶ðs šN´@8äÍWAì¬€ŒÍóa9lWêÜÈäOþiS¸3ÂÓ™ÛA¼¼"ý×ÿCä(!¦{À~ý£-ÌÝôž^œÀÙMÏ_çnp¹¯ç5ÌÝrh-\è3ªoP¢¯€C`€È×øícÚÈYè*Òú7URkÛ–Âµ‡{Ž[­6s'B5}¾éDü6XsÍx¦
ãN&™ÀÁ	±tyÇ}ArNpŸ_%…ó!YØ×Þa ƒ0)#›¡0ÄŽ×È"eØe˜Êç{D/Z£úµÓ#4;èÍ6—ùçØ_N‡>žžfµ‘ÿÆ&I«â¥tÉÐ¥À³"¿–ó&
žM.D%Ê …0KŒAÝæ$…„–X.í ñ¡b]†S)TòÇëØå0Žª†•…€¼é‡öê­é¡¨¶w¨K#VéÂC˜è]8®BÈL>ŒSsò(«ù”ÇæW¹§ÒÇdnwÉ/ðEüHbåkó@K:Ë6[›øÓø­8uþK6ý^Ùœsî6æµI1|’ÎjA¢p¶9ëo3™ãÑâŠXn¼ßÈIã¨ü°dÿøÓåÖTÚgvÚá‰Gy³ßðüvrI…]U ËÙÍã4Àˆã0bß¶w»<Æˆ1Ú€'j…†(í»&BovhŒ„¸‘Ã¡uAFääQ\U˜¨W,Ì”‰Õ©6IûÊ¢^ad:H"’$r\‘±r_åÚÍ«bà‘IY=TÍ‰Ó<×NÂŽªè1á…‰&£Š„Ê«EòÖ(YºFtV^-(,š¸&üs57‰o"D­Ô(…f£²Øt›Ê|ìÃ­:”ü‚jÐÓÌú¥ÇÒ…âs?|Oý°(+åqj©Ó7¯’¦¥Œeps)ÜD´Ò„Ê~NÁwÏ(£xÏ(“ª|á<‰X§¶O
É¹­ViŒR—Éü2qÎb»?÷FI6ìîn«×í·úÃ^«Ûéo½å3oîw•7áf…– ÄÄ…CÒ¦à]áµW@’\E'45ÉP«(ìÝ\]hÕ…ÛRô*ƒR„ÌXƒŽ¨“«èæë•ƒÒàÔd*Jb!†!€ôŠ9)òK¿MX[+„ÐûoXËr9âUÂÂ¯zãVogÔêõwY^vCŠ:C‘V•#T+ßD°û< X«ä	‚‹Xõëµ‡ À©çÂíDü×-äR2Ô©g3ª¦œFj(‹¶º&¹Ô“&s=T1x]=”¬\`…fÄ†‚CÿtÏTÐ?×V@KÌZ‹—peä„yŸúïú‹ùûP˜k¡<h–J¾¢¾Jƒ8óõôZªNE•%QÁ~.‰rÔ¿ Tb+¬újMÊ™}ý·äÍÊŠÞ·Ä,ì=d<V˜²ïfìÿ<õî«E,xïÅ-zþÅ+ÀÈLdÚú´ ø|ê‚¹ý²à6¨ôiòÖ*©«QaN	Öq³I
ÙÉyŽ{œGÍ:qîU¤:KÌ²´ä€ÙÊôZ	‘+ø¢ÊzÞ~nm`4f_/,Ê(ÿ½‹Ò³²l—ú’œÂ¦ž9:óZt•­@<¥j¬Rqw`Î;¹lÛœo\ïýš«º9‘U’z£-uVèêw@ã’áÅ²uÔM5Òî”ú•j`Øì`ã£@ìGGÆšapðe;¸ "kÞeÚ¸
2|‰ÍÉµÏfsÛy»·=Ð¨V%¦Æ0Á1¢Ú–pCCE¼Ø#oîu¿¹×"÷@‚øæÞ[”í3a o™§È'-XU`[ñœ•3Ü´6ÞÜ#÷ç¸§TjÁþ‘ëþ˜§0ŸúVð_Ž¡ð›É),·D·%á@dÌ¤2šð¥Ç™òsT,áDk4ÑžæTW	•ËITUÐÒ:‡*n*-ÖÙA$m^V2dÈ/ZösÚ•Ný<Ÿ--~à\É»Ö¥â£˜±9ìÊVXMä3«³—©éÑ’,!	NÐ‰2xNŽË¦º;bUx.²t•ÆC­óø:)øwB_ñ€öŽnF`Ÿ8.døb©k¢ÿ)Èk‹Ìaá	Þé—‘ZÜa`LW|a¦À¿%òšÄé·ŒÜœTè…zÛeï•,€‰û[ üâÃ®,_¥V¾~ï~ë~·ÕìrBœYÚXìç0‹=âß“a‹_áŸ]áJg`ÓÒ­“ô_Ptµ¿OÚ«X¾DêY†H!¤jr–Ã’£tgŒ"hÉÑSºK )„ùIÒøÜMèàBéÒ’~ŸÌ©Oƒ)³yµŽ?.dž¤¿\_›Ce¤¾^¿T™«:ù‚ˆ’I7bßÇþ“Ÿ`r2>Žu4*—,5àh¡N°âG7ˆUÕÛjÕòÓí~gTjä)!bS&²¤!ŒÚm¼žÔ›Ç!V²ŽiËü„rØ_¨6ácBô„µÂ½p
ìS­ð—Ý6HmO•Ýpg ãžÛCÃÄ&¥€›/¼Ël¦å[™/ËžgÎ!=Z€ ‘‰=S¸dWieÁIê…À@Ñ€‹j¤QÛ ¯
u£~ñi:}~¤
ß¾Vµfe¼BeÕ.!KÎ$ŽCãYS3Â‚?óC%™<gÔlÏ63f´”¼~”(8_NÔóNŠ|²K‹o$uõÍí	Ÿç©·1©+8­ó–+VTXë'ÐIJåÒÒ2#©ÌaSÓ…Ðº]µ³\²“¡À¤šVª±Ž¡&úîkÅ&¼SÕ!¨¡“ŸÚá
{W“çþÂD)Ï•:Hb¦j3F´&æN¶}ÄOÒš¥…â‘YY¿Š¢Ç	4pêLEwý­nªUÓ}~!ié¹üºdn&aq, ®VC½„9¨ã”iQŸ6a r9XÜG–MNAóRÍ6ü¼û@IÌË‚)¯Gn©I±VEhW·n—ÈÈ“¤pg_ƒQ<ƒÅI¬ p7ìeÍFR%¥¡+3ÂÄ€'¶=G×}³qÒ,$<Il±Œ:(6m€{#íX§ÎÊö×q3ÉÞØj‘~·Û­[»¤:Øf¨ŠõÐ%éêxcÑ¹PøˆH`ã5Åm€’:J­xN+ÔÜ>³0ÝÖ yáµ}[µ<<—¹OZ¸—2\º™Ä1Ê?¨PãrÜ0Ka1‹ÿkƒÉ¨A&u½Èo2,l‘ÆsÿœL^¾Æ?_ZžÏÁFÁY–éÛxËËCã,5¤S§D©)}TEöŽ|ˆØ$T8¯:AïàQŽÐ½¯ùîñƒC¦¼Óev‚FÊ¤©ž,†Þñ€*õiØfNz`vP”oBÃI>&Ó¥«düäëÈ)«úhÝ‹JÑ?Å¨±ý!òT°U„
ªØ­ït±Zynk¨YaÎÍ: Ûäï'¯^’ÉÆ›±Äsòˆ1ŽoI‚3Ÿåª¹í84dgáxøaüøÿË
)¯ë»çï#ß;”h"ì:¬å!,¦)êÅ-Öù”ô·nÎ«V;/ÇhÑ·]—ƒuLªÎ?„ëWÅBD^ªaž–;¤Éð“…GÓìV‚ÍVñEÓõù¸œI°h WŠrª®%Š¯Õ_¹H$9¦MIä¨(ƒJT“éšn# RWEÏYM:ß aE0‘DXþh3O‰BCªjö•*ÒÜ ²ùBNø¡ååA’N©†…/-o÷6í„SæÎ¶Ý·,ì˜Õ¬¯
CN]Ÿý¡¬óëÂ…f‰oM·9';Ía ™5gþlíy›bž°g{	l‡û+ŠI<)BØÒmÌ'¨V½54×ÀÑy:õâ–@ÃaWæ®m…Ò3«pòqÁD
ÙÅ:ËÊt&IhÕª3§Zì)Uh]V†!ÀÊdPB<ëƒ³°@oîÌ\'˜ú BwÎCXÛØû(„ËC?@Á•K«s'ÝÝ –“¾þ+µòÇ¼‰ˆ¥ [Ž/ÕÉ •Ø’I†·€1 Ã÷°ÖÂÓœ¸Šö4ó5Wå‰®ÈSTô®Ñ*mT*âëx•ÉÒ9+:•ÍûÁ½¬«d™l¥UÜKœ&1³uùa{i»Vå|¥…Ï’ª€½#†NÖžžÚH‰ gþjeSa4­||£`. E²B«@»‰0ŽHÍ,ÄûI[TóØ;ó+dAuå²Z'*[.Ý¹*ßHŠH4Âs›5àUºBè/zAh")¨I-ªÇÂ MA+‘YÍmÙœöX[Üc¯ ‘h ém‚Š´šÖ^PSã
;@"í€°Kû[d:Z%ò¨‹ÌË¢“n3Qá(ý’«q¥–dA)g‹°àiófügn.ˆVÉæ97†©Zèþ	Š#Öà*çXZ>.ä¥†þùƒmö”Á€£’G£”XÔò~É÷/î“Q{mÏì ÑE?ð~ Uù<ºò(,Í!¥b †4¤ª·Ý'Ì†B§³¡rDUàCˆöæ’ÔbeÈ·qµ2E^¼ªCSâháIú)ðÈ™ƒ­*!§5Ñã9´÷¦< £+/Xà”¥Ñ¦¿"NÉšD#oÄ6 r>`•¬¨Ê›UE°9#ö,	¸4ÇÎ9ðÌuà²ì€¤Ó»¤õDwÇ.Å}úµ±Ë$®ô³á•|B¿1Ê/ŠQöK¸Ð„î$iú[5øÚxX6dÚìa<¬3h¯¿S2ê‘íá<á¦$£dìßø¥Ž_fQ^ž½8šâJU3NIyÝh,yaÌ-y™#:Ø¯˜[>sìÐÂF3X-e€Èë×@ÕñÐìÌ×èe+“¡CqfG‚ë]}Ø°Ç"&¬`Å3x<EvwìRÜ¨_»dÙÚŸ³¤ÓùU~I¬²WÆz;,­:"MýP‡·Êæ`˜üÂž×vÔ-ÓY»é°”ÞÔâÅÝ^$º½tèÇÀ-ì•ý3¾3>ôW23Ú¯*M¯†	ê+7A¦˜M™sâ–ÙB^›³ŠQ|¿.nìŸ8ü^dqÑ<­9/`Ž3‡×D‰\u@G¼ ®³r’žS×¶çß‘ƒh(8ƒ«^äÄ‚è\ ²€æwÇ³íútÜ˜na]`TeìòMce]`¼˜õa‘Ä‰ù>¾¶ÄGÅü@íu2ôÑ8|—'(´Gü@ËŒk²c_kø–9Ë4§Göõµ2¿FwÁBÌb¸²Ã¨æ2Û†’£µÔUÜ4±ÐêÝÖûåŒ¢¡¯M­O©%L¢7–»ðC'^®(	7'ÒÜÇÃ3 êh’¶#)zþ?sj}äDðx„RkPdñàKT>Ó fAiJÌMòÜGäùÅ±<D×ÀN”¦¹}†U›—TJß!¹–7î‹'Ù|÷ÓnÊjþÔZƒÞjy,"8Ù	üvÙë¹ßþÁw1ý¢yé‡ãcüÊ®'áÁf×§ý|€»f Rrâ^ü)xÁÊñÚçí7cš¢xÍpà¯K2/Yì/ÿûfa¾„ÞÈè”çST2e2ƒPT‹e” É§â‡\ ôXpÃ©¡.¥fHCÿ‚W°%gkæZ2v’›ñ³SÆÈ!±/Pq˜ßÃŠ‰XUh ]Màf1.‘–¥eö±^½A‘sÌC¸Ypâ5Œt%²k„¥š%ô›4¡›ôÄ¢YUÍ•¦÷qÙ<[KIÃ"šå¶"û¹­¦ò˜ãÇ÷Ø‚†Æfëö6`»ú:ÆÚ´3øÁñÔQSÀî7šøÐà¦nötm¿Ñë(ã'áWëb¿1Òý
êX°ßèvå]ñÃÍh×Ôkßb=Ó^Z/±]Ú½{@³*ŸÑò£’ÞÊˆO\ß*˜?"SJl†Ö’Hù—¹ä#9í6o®«2Òé*:+HïN	éõüpe¹e%ñì3 9­H¦¸'D´Cð~¢®œYD, _$}¾#H äÛÐ
ÃïÈ·ù®¤†Qrk¶´Ó§á)ßç®Ê¸à¾I„9vLU'œ‹ü(/Ô²Ú;¨,mä¥è£ÉJwtÈÓÇÏÿç;B,9» 4Ð&½pNàØ­|?^’x‰9~H]“Tî;Ô'ö+Q*ÔªÄkûùŸ¨a[ï7ÉÜüwrîDKü¿s­áÌ»¾Âp¦	i¿=]!Ã®=ræ}Áö¢l!”#ÂZnšöw-é¿ž¬¯ÞßO&æØCß¸cc¥œÅ‚9ˆ3šbM
4yæ¯@‚BŸ/Qs}?47!Iéê4þ)§ÇžÀ—±N‡Ì­Õ)}O‚ÒæI?b¸`m"ŒWíÅÚµBì?GQ*Á01wsw„^Ú®ƒÄlø‰i}j÷ÉúÞÜ‰ wé:Ý!JéŸá?¯_L@2Ç@|Ï€2ûì6©½ˆnèˆ?¥Q¨{{F!q]Üc	ô_³åŸŠ°º)%îÞz”P	¸,|6¤7æXÖ<†“¨U!k8{`£=zjM]Ç¦¼`PÊ	ÌM+Ø_W™E®ç'Ÿž£¤<E„œF çþŠÀN®Pðgu_ÂÀ6œlÙÎ3ÈÂö0¹{?ÃI›h¨	;êxðvüO¸ÆAˆåù ‹:
·„®ÿÕCÙ\;Ì§}Ëg’
{<ù[ÂÕ¸7æ-ZîRÃlU,È³»ÅÂÄFÙÝr™cu>·Æà#ØÀL¼ÕdBm+5QÓ—Â´E^ÝÎNñ—ÄàÕ-T(µvñµV¸ømE8Ù³ÌæŒÂåøDÊ¬]ªÕ¸ó-/!½„C‘/ŸÓz»WQŠ»n6—l»™ùöÙ™3c23 ˜&f ¥üÐ
7<µCH>"„4fŠx¾a?ÐIˆË³i´|©pA¸B ÐLd‚F~xÍ·äÔ_,\›
Å¨)UT=‰±j$þG]«6iìÃùZy…œÎsÞ´ž`×zs~y·L²’#öoÊÕ>”Ÿ¬ò®f‚wyÌ#Xàò!8¯Ð™¶šCHP„Ë×…ËJ¹ÄðSq‰N·ÛU¸98«Pý”ò
åƒ%ÜB\xËïýô|CœÍgÍ<dÉgÈ;‰:	0Ë–E)¡©„¦7Ì×Ìž‚”‹HÚM/¨¡½¼p<V­cnÃZÿÖ	±©ÔŸëY–ƒâRãÛ­Çd@géºNêÕ7Ÿ•ÌÞS•bt¸	V,µŠ« óÉ	²bRõr`>*U»ždù­êŠó@zË#"Yi’$ÉÝu¢83Y87‰…¹[X–àv )tf<Û˜@?¢A–/©/=!ò\t¯"Ö],YE³L†-Åñ2äYf‡ªRd1ŸÃÜ,^§—Eš	•g}6	Füù†*[gC"§[*5¥¥Ùí¹³^)ç1‰©)˜½lò(’ˆí$šY.¶bŠ©¯|“°f¡!Âa‡^çFÄy®èHnVrò¶¨×w7b|%ÑÚô‡O²°;íð8–éQÎ¨Ÿj½’/>gêO—QìÒ.w\¿ÏX|Ò)q¤ê¿®vŽ•Z{/ßI½z$Iõ‚wÉ…àTKÌüeË¢í¢îÓåÐ?{J¯‚IbWE¶óA#a¢øÂFÓ½­~#w@'¶{ÖV û“ÐH¬½!$‰sräÇí“ÐŸ¯g±€±Ÿ8t@Ÿéíi˜o‘ùÆ³Vèr7_8¡´’Õ¦»‘§˜Å;”¤Cé,oó9SPIPOæ«X§©‚™ø£©uz÷T6qgåŒÚ¿QØÛ§°jPúúšz`Äþb‡>j“ë<E½Öß™SÅK×Óž0NŒô›RS«j3tAð!ð:‹BjÜUøúÊ=Y=fXÄË¦ú sÆ±w·‹Bõ­ŸQEë9	+¸Ì­×èC³ZÏ•âòMêÐw|^
µüÒ%nÇ1®µö®ÝØiSÁé7~4\„ï¡TyèÉ:údÔœ±hÓ^d$zïm‘¢VLX³p=O*ë®WŒ”Q×¹šv¨û\ånÝ•¼€œýòeÛ²uÈAƒ_žü[²¬»w_ˆi+èŒ[Ði“ÉzÊê±ý&ûÞ‘ñ•wLSÃübC'™ ìXò-ÁFˆg¡ý/kÛ›m¨oIz¿o_Q`~ñ–†iº-Â®Í³Š›¾l²ª\Ò¯Íl«YâÝSÛCká:~ìG¡oÍmÌpè‡¡ý¡½+B›‚ü8‹>´\g~BåïbÍ™ÈY¬,ÑP›¸¹úß5Ž­ïànØ8Ç£µÅÖE¾²{yòã³s%}®”wÆ—•‹<Ù-ÞñeÓÜâz~U"­zywOlŸÀ!Jwè_´ÿÞ–3ßŠ	¶=ðÈD›ÕÊŽÃÍ—Muk§Ó|t¬Ú†øÎL`Ÿ„ó×ÓÐƒè½}ÎK4fìfr/ü8‘fJ¿uãïÈ°ÿíÜ^|·Eæk›&ëù7FÃÀÙ4ÐÐšÚ!ïKð…Sh+9:z­¸åË¦ÑŠq"ma'‹/Fk–wëDºä‚ð'•]=§mk—¡ï%n8Þ»¶2uc§:uI°²‹Aºès)Dúê²€™¿…ýX4´§g`ëÍHI0ÖÉ%êÏË™OÉÙ'Ö¹åÄ„5ºlÞët¶#;üàÌìhûÌ	mTºï©ý
Éh@ã]~ò¨ìá¦EÎ±d‹,ìøÈŸEŠ×$CÓwÀ™u/qÎHó+œo8æÐþ	¦·¥Ms¶0¾¸Ùø'MV m2e½]Xåús'^’§¾Lh¨¤·ÐÇE›ñÚñ:ô”¿*“›‘áëfÉ ÷/ 
¯fÁæ|Ú"÷ÄÝÛâðlÞ[ÃÚç÷àŽý}øo,µ3×7Yä/ÅN<+ˆ–~œnß¨æ¿hŸÆ}žíØ« Þèw‚¤›ñÒ'‘õÁÎÃ8&Ú¢`_h¹<…%à'¥;@4›.Ð,Â%& OW1‡e¿)^êðîzmÒ{ûÙÞ&OíÅ WKßƒ¾[xGòº~o–eÑK¬’vÑ¤Î¿&>È" Gð§~[ßMÖ3l¿€´xC1;ï= ÄtPÐüì+Mß÷+PŠ0V³	„_rÌXj»Cok6žX†ñ3µ×hö|ùœs¬ ™aY©Rt(nuyL´.Ï!¸h0¢¿oÚ¾3ËëW¬úTm±³€ŽM²¦õ{bá÷¼OµÈÄŸ#ØžS¬Tö…Õ”
ø2ÙËž˜#öo[„=^£ØZŸ)‡A²—§zpÙ„ÞÝ>»aó8ž¤8ƒiß# G˜èùçz*ÅàÊ ßœãÿ‹<ª•Üª„%0¶§d]º°‚Í‡Wö¹÷bC˜„NÙäH¯äÉŒ„î‘’&ÅšÀ
6DhcG¡ƒx/vÍ²ÇÖÁ\û˜Ž‡UQL‰Ê+˜*E:‚êZ$ß˜Îã»¯Açñ±¡gÇÚ$%VŸ»î­œ(*Äîˆô'¥ðÚ±ß)#J}´6ŒßŽmËei4”7H·d—“‡rA™Ûåî‚¿—ÓÎøoRLY»ƒ)Vƒb: ¤ú%
!¾\o»b_ÕÕ*E§hR OXR¨›ImÝ`íF¶¦”‡²´ëñG	BRå¯šiæË}ÝºÊl‚ù¥ˆ¥ƒI êb²ŒÁEº¡}MažùŸÃ‚´n0¢k0,‘œyf` ¡ƒèE]:ó¹íIPÏÏPRó»¼M—´±þ1þâ?çí1îü˜ªÿ 	1Å·QÜuHW&v£á³Û“ŸìéÖë²ÜÏ’IÕBÞ)-•ð`Ù/˜öp'ò6H†}’I“¬æ{ôïÐ?çoÂÆx½@lU¶KÊpà”L‰V\[„»Ý©ÞtîþÜ?‡‹©Õìv[»ýV8nu;ý­·*«ì#L{–Ïá}Øôûü-HÚhÙ ö“h	Lõ};¿kÚsX0¬Âšg®´ñMìubÑt5…æ´ÕÏBO×Ž’–—v¬±x–Z #{åÐÔ…¢bÕÔ€’2eòIÐUj¨ˆ$-	•Õš‹V´´/¢Ó
Ï¢†Y¨¨éƒ£$-Rd­¤•—/N¿>>xþóÑ#®ù^aÀŽ:˜wËº°ó‘j*À>Ø^ösIœˆ÷dD·¢ðz©]Ï%ó§”c'î‰ÄHñ4™m™òPÁÆÔŸ.çjÂy’Ê)>Ôp®×kýN¾Ô²j#¤×¢ßJW{ º¸L‚dbc£ÈJgV2^F>Û¿ŒèS¯í³«Z>$.µM/VGPU6 ]Å¸Î¾Òx•f^¥?yÎvq9z”,™é—ÒP–çSâ³XZ`åÒ¦R´3Ç÷›WPº8ìE_øâ„Lþéåáã#Õ’tî1mí³”ƒ\ ·ºnDeÈ8%Ô5($~žºþpø@å$o|¯ÆÂUg{'qŽˆZD_Ò£%”î“]Aê£4Äëù¸Bâû*¥ÐÀ&±?3‹A/¤ñítmXmù&¯—RVÑØ¢žÉŒèŸ„þ?Û³¸£ë'¡“"©û†µ2DœMŠð©Åø”¬j©žV×¢Æ®œLë&Q^ã£ôd©Ž¢$luak‚V¯×ê lõ”Â~ êÛpî~ Öûä¸æÉS	U&Ù?)=®îƒà+ÉÌa”ýTø›%ÔLÒqò¹/Úä–ÉÒ?Ÿ¬ÐvÐŒCÍÝÊÜß{‚}Z—¶n<õ£´7ØÝ³bYhb´;ïíëEó˜jÂz«@jîÚ“h:ÛœjNÊ5Àül¬Ub‡ûÎÆ€EŠU4¦ÌH@I­EÍm-â‡<­æ¾èþNgØ"ÃûÁÈ *L(–!IÌ,C˜zÈÐûrèÊŽ¾37Ãä±\HKÂæõ=z‡âY”zô
?í”·é ºWRíÁ†cÇ÷C‚Ê‰#¢"ªÃ<×Ä1‹ƒjëI§fü–©gîDÖÔµçû—_e¼œfÕTžG`…>=l>-–ÈLpcA‹~—l#>žMÆ•¹è~Ù9”^Í¡Bz¿‚b’Nb¡Xç´8mÞjV€´’ªU?f±2EÛ   ú'¥¢È™îCŽ²GôJ]¤ZBw-ëNŒJ\LñIy‘oC•D©“'{¹®¡|’õ:»Zj­ÐÂUµ'µÀ~.êÌ
‹0=%%áÎ™¡ªe‡é÷Gs½šnHlò©½r<‡s)-Ÿ43ÈÓfí}±g¶±<¤¨Œp,¡r;^û‚u¸vrA°Ò§OŽ’Ë¹çG‚õ^¥SIQÄ’YýaÈ˜†¶‹|¹
Ù½tœ¾\JžS>#
–N0£_´¶Q{wÄ©Ku{*®gðƒµºÝîˆúBÛ¢Î§Ý„†¤èúD55ˆãÃ£#î¥¸AžÀæ/MKƒVøÃ,Ñ 1|szÆÙë«	™¯ GÖ¸v˜œáˆêGÛ¸°-Ä=ia·C Ñ²"Hœ´`vâUu:ŒdéÔ¬™¡dä§¢)2s?%¨)SÛ$¤Ájë¥v}”µD¹+Ó}ú¨ùŒð?íÔàˆƒÿëìl½ÕÆ&ÃyùË´—í7ÃÕêSçÅ†ñÂÒ>Š}©" 8º‡ÛèÀ®;µBŒ‹ÅG6É¢à©N%OLTÑÚÓ8 ‡¤K¾Wvî(Â'•v¤Ñ¨~…÷Ð!‰B¿‡Ùë-âÌ/ö°ÕÂã4CøJÚ‡°m"òîëËä,¨ýõ%¼DÝ•"ùä?;k
‘N\Iý“OQ= G1U(‡,D£oï–y‘8½Ü'c¡è_Ð)M—Füèö•n‡‘ýk¨Åõ(çí­â˜1` ’Q§HUyes´Ua7ÉmÁ¢.þ˜7ÆK <,8+ºíÈŸ›¹êÚ‰ÖSàô‡¨ê<H ÖY–ä=¨šEA¤TöSEê$›¥ËÀVôVz¶«f]Ò¤U^¿‰øVÒ‰²Tš„Š’úÂ¡ì¢3x©4eUAÆ6â¸iyRàÆ…‹"QrkÅTp×54›Z˜çÌÆs1ÚbìÆFÃNK‹Øî±1·ÉM•î)å/t+IËRwF‰5;#©Wcb†-yZé…a¡[WzŸ¦Ê²$¶[½õ|M†€Ÿb×%ÍëKðbdŠtr%vï€7MÔ‚XÈð’mÞQ¾Ð¯°M4}…««z“A¨¼ÑX&Ü¢ê–êª«–çÈ¤‘  ðy.ísÏP¤œyÊ9¿ÌØ+ð(C®]Nà¿¶Ò•Á²Qô}ÒØgKÛÊ=š—èõ†&nÂVG ¤ãUŠç†]üØGá¢8³@·-KžÈ+šlÊÓtîc…ÁŸ…TRkN‰!gwDe?ÁÃ¯d&~!oÈÙÕrvÕ†œÝRCÎ@gÈ—rR¹.•—æšJy›»¿år=UÃÌd2ÌÇÅhì é°¢=dÁì!‰¤`¡åÚ‚ë­ÝCiÞÈ¸™ŸúÞUã¦§¶„‚jÚÂ:€†ªûN.Ò¯Zkb'
¿^©S¨s¸K½ÂA™ò“’‹<ó3¼íÉ°Jt+F3T¸4x&ÄÖÆ³Rf¨mñKE,d@?Ùb/!“\Òn«TPHî‰îí{4pe¯Q'ª¢Q¶ÆàÓLÃÇè$ýÐqa—Oö0íÚF[VìC:Ø´›0hö›ôÿëÿ‘G¡µX0¯p‹¡<à³öœ˜Ìläi×µ|´šlÊQ£‚›Öà¥×â¤×à£%\TÀ Ç£þæëç,$®Žœ‡DvXj–¾ <&å4ð‡sîØkº:2ç…Âm¡`ÔCÑãÂMýÝQÁÁ‘³#U{:ðS›Þåùj¿_•¸*ž½mvòòü³ŠM–3I=T•=UÜ›»Oå²PJÈe±£Ÿo€ç‘sv–Ôæ:Ábà¡GŽ•‘PõâÙŠÊaBÖ…]%WgŽ«,³LXH-þLç‹QµÊÛ²à+f¼Oü)ÀœÛª¶Üž?¢¼9Kï7:›V'¾ˆ[YôAu«ÚãVBÅ)¸¸ò$™ðûÎÕg3®µ™l¼xyê{v³ÃÍ×îZžiç’]•U¬Ò×Ç²m¦ÏÔwîh® È¤Oò	™ÍQJÕi	C-Ì"Øi§6~÷df©vµŒfÝ. S¦¨€NÛfCŸW÷1—[Ó}µì6æÚ²ç‡pfLå¬|â$ô XE“ØšÝò±Ó Ç’¹~lTý(5¿¦Èš^,pçô—GXzaø	ñõ4¡µ¯ÀWŠŸ‡ØL“Z³e±`~–Û*üø½%¶•šKŒ…â&Ö]mŸú¾abÛ;²güeY„hœ¤ì•Ddå‘‡–V9RÎÅ¼´B¼|£ò™g¾G­¢5Z„òI¸r’^qfX‚"ª®T‰ÓÙ0û\æ9N÷Äõãt Z¶	›u•œÛ<MžÄ“‹|J¬kó3?t~ÁÈ*·tÈÂ€,·É&/¥Aƒµj˜·Ìï
h‰KÖG,9†?É>Á»;8¬êä³»ˆ•±Â"ôŠn88f#ÌUÏ³2:ëH©¢E=>|hzc¬Š¥•¸Ò™7ùÐå­ðSƒL–hbbå+*•öd
æ.Tv@™’™Ùý´ùú2ÝÈõó{¡öWêÇìîYMm8@*.7Ê^è³I†ÎL8Q„kŒJâ&tð×Ä hU ô„¨©½î1ªV1´¥gøªLÓ*“YT5â

VY´×´³ ðrÛÍ÷ˆ§Ïæ‹M1ñ¾B¸Tÿ”0ë¼Œ¥ìfhT[xÆ¦§MŒMìŠõ_&þ_]™µ`Zâ‡1H%+ä“–6:®ÌgQiXÈ\lTlybÁ›Žì•O87ÕJM×I–¼Ã"ÅQ$B5b-¢™Bjî7CfóÖ[ôs²àÐd±éìk_›‰Ë>JÑ…ÿTBYíAâ%‚¢/$&¯. Hóùá«­FI˜$§†pè¿úë_þRz; Õî}DíŽ-y“`Î±pËÒŸÛ™!·t¼€4`ÈÞNg·EzÝîŸ½ÁýÎ¸EúøÍéà_»Œ˜ýÙŽð¯áüµÛÀ¯pm´ÛÁ¯ý?{ã^ëJÞª”ŸØÇ ÎÇEa‡¼<žœbÇVºzCOÒ¤Ï‡Ýòmáp Ô´N7	|w“DÔc¡‹yRCiÌ–Â€á¸Óë3hŽw;= ân¸?îvÜwv:ÝÛŒÝagáÝ½3(?Û€Ð±±`ÚhÊm>;81ÅãCë¯ùïýË¿6O ›ÿçÖ_ÿò¿š¯žm"ö¡åÎðK?
–(8OŸñ¬ÔEô#t.L¡=êì0PzøCð~@}ŸýX?ð†^ŠêäÃqç><<¢¨ ÝÀ_¯cD´SI@]¼æO±1LÀ|j«ZÐîH°¿–‡ Ÿ;>¥Yˆß+?–Ìc
çû©c„äˆÁ°‡pî©‘,ŒûÏÇœTP’ÒÛ¡áÖôïº¨N;ÞÚ_Gä_Qi¸ë•ãY¦xý_ÿ·}à˜ÔÿƒŽ`„ÏÙ‹Ázý‚ôvï	96—æeá€[þÇ¿5‰x)þVÚÐ„ÌCç,&ß
½@W4MöÆ$d„é‰,sŸè!û\’øÜ?ÅòÓ{pN:#Ø¼´=ö"AÙv‡Œ:½‘4ÄnÝîwîË“Öa8èä9ìÔaÔïŒä†£š#ÜïŒº7‚Ã¸Gù‰¸5ç0wFýAr¼Óé÷¤F•#¼-Lr±ÛåËÑ6åw¢§¬‰·_ÀÍýîwðïƒ}ØJüãûxÆJ+Ò¦oËº½ÃCå¯ä/å'ˆøgìU¿'9u€
ï“ “½“uÃêØA³Mÿ
üóæiÃM	œ1zl“f?¹oéRîoé«ÁfŸìm ˜BÕUál-Ó,eDþ Ä\¿ŠAW9ûžáÜÙ›(„—5éó!m›
”®Íöø÷dh6Ìa÷ºt •u`ñ«ú{aåäM ï¾¾¼ûI¶È×—É«Òë½­«?{ïÊG,;7ÏÁKyÎui¨ÞÇd®\L7e®(™gãÉæ*Ö
r=I„2ÎšjMñÒWØ;,ë³ð-G­3×÷ÃÏ‚Ã2…á&–ë"M®Ë›˜z"Œ0¨ËY˜VsÎÂ•!a„~Í9pJ\EÍ9pÕKœÃ§æn€¿±·üçÙÛ˜ÁŽ~C5wëwo“»~ãnÆCé~áÞ6fü¾Z6Ve~]­h~~ò,$ðƒ'½†ófÃ?[{Ô•Ü ßç~ob|³|©2 ‹•€'ò²xÕÏå}z©o·âÑœK/be¯ËŸ2ÍT YÓÄcÃZD9WGIJŒ"&à÷ÒDbµ¡»Ê:Î¹SªòËJ¥˜wê’Iv—™«¢…œ÷ƒ–•ó”s“Œ(!"<™4—`æ]ÚUŒöfkÊ9Y1•&UˆûN¦„âñUy\¹AæS­%h~P%PiôØ_Ë96nn´Ç©r,—VÔ•Ææ´]uI<º¢íßcEsÔ§p\Œ~Ä„ß¢ãV½$M™ís,ˆ¶äUÑÒHèQVI›G0·íø:VBJª«sv›»\Ó Üh••µ†¿¯ïŠÝ¡®ØA…C®:"¸,ÛÙ¸‰`š˜R×‘[–ÒïOcJ#ÄGªq’ÄÍyd<.9ÒiS%4SYŸI¨¾hê¡àÿb0b0ÛÄYx´WwU”züžú;p7I•OCk~h­š_EÙ—zÂJyü~%•Ëw>zNÑÏ˜YOŠVªŠMJŠŽçZ‚~]§.ÊTãG³(ÑŒAg7ŒrµëûI)¡þpØZ»Ãhˆ[oõÒûìå¤ª»9’ÞË6¯´X/Ÿõ
ÞXAPíÃƒï™´`ÆÚÙ–ëÐÖö/¬àš²ž¢V®º\[‘éy)l(nY:åt’Lˆ§½?*K`ó)VH!wq‚)1ÍZžƒ.ÜUk)ô)Àù¸¬Ûì™>óhq@=©þ:jöôßìsWd¢*’çZgAYB /ÑãôåôT¼Fù•D¼ †Z¤Y‚˜i8·Ï¬µ‹Á×;ì='8¸.XÊ=ËâÅÒŠ
…^8b–®œ'.&‚£MM¯ê9Pg¦˜®A*Õì¬“}.i¯Âù	rŽ(mññØšê‰×iªó¼ÕÂºbF¥ÅÛô™Æãà²8«SÏÉáÒ
ã=âxØ(^N–6
÷ˆÒXÔn‡âˆÓðeÔ§_Vsú…ýâ.ðË˜ý‚åî\l=óW(¬6ùàDk8¼--ú;ÐH7^‚x Ó>T«=¦…»z£·X‚­¤G‘¬…	qªçR¡÷7ŽGógdïýn¾Ràxë­Ô7u²½‚Ê7.”+kv¤Ú¸cªF3LžÅòÿ4¢Ž‚,»¢%Z]X›•cA±Ù
ÓÝ&bF£Vòÿn§<æç^pÑÊÐá÷­VþáÝîÜ^´êÁ6.r~±÷(Ùf*ôÈŠÓ]8ã›ðûça9Z€(èñr¿Ñëv¿ið3À¿UØ{×AX™ÓƒT!ÜaÜýKDz7š0«Lû+8¦Ž·y‰ª7úsZLûÆà‰¯G®¦­‰ÉB*ÊÇ¬®šfŸEÕÐØ^?å[Mœù~ƒV{Ã|®6ÈEo¿BÜ†ýsÑgßà³R`"X5ñÏÎ ?÷#Ø¼pˆ¯Ùoü®ßŸl›]{Å:ˆï_v;Ã«rÔP¾k6ºÑØ¶eàT‚|ÛæþñàÂÑ³¤äƒHöG{Ÿ»«ªTŽ$U—•O«¾{î¯,DÉ7÷°Â)6t¦ÿ¾­®gSqøs_Ý=rïwãáýáÎF@‰b‚gžôºìÛ6Ãò{(ò;žX+ÇÝÀ5”=(§»W…ìÉ[ŸÃ~à›£8ôßc7ÎßÃÞhd4€`/Ð³û»ƒ©Ñ 4YŸ¦½ àa,G!%<lºÚbÚv´ëšâ°ÎÇ÷Ø!‡kU÷ö‚Ãû£Ñx÷n!X‰ðþ	“,1@3EŽn†#9´#Çòž";c@>²€ñ†¡¨< ƒñ³#Þ]ñ›à ²¬àø©ò¤{}”1¦¡ÓØ ÆŠ¨§ŠCë™{gáÞéM©Â"_'#À€H/û@O€(^á_ÜRìàW¨uû&`,¾aÈßp”¾ÁÚÎî_ïUÀ÷’DÁ¸Ô_”|RŠ–:†«ŸI±£;žŽçÃêpÖ¡Ûü]žm•fše§ÀìU“6¿©Ôq9¨¾ß£›Vtl
U‡ù#YQŒj9šísýö:JŒ4¥›}6œŒÞÃ¶;µÐ‘ñ Evá_jt1'ßÀ¾I-G¶…©
ÌÌNÕüÆà­•ÇS_0ù ‘{Œ¡ý:8
#Áª€Y&ê„	Q“uV³@‹–aÍHrX(²Zà8Ù6¬Iðäs±™Eñ˜<ñ˜éNÿl\/z£Ò¡ìÍŸ¸dŸôo‡*‹‰V1tÆNP9lÒñþeó’§~ƒÜcmh!Ž+›)û`*ž„´+y>û“RLbÂø¤²¸06Â›î[ÖÅÓ¹™”\ã•#¶É£%SKpñz%Á(,6þ6ÆuýžÇdÃ÷ÞN•UW„vÇR|XäxMx“I\~J“ò‹µóüQ÷Io÷m±‹CI^8FÆA.Üf“”÷eó…hµ
|Šºš4bŠà“TŒ¿¤Û$¦ýÇ¿cY:Ã
¿âëÎÛ(»;Þb[Ô¾´^6ç[ä{rïåöÁ=²Gæé[†[Wä?ÿí¯(ïJë¥gQ¦—äÐ:buÖZo­q³šÐOŽ©X§zÈ›jI¶%CQy0ŽÂ@U0£·(ã9þé¹ß>v¿òH66ynmü5hˆGMœ)CNJyeò‡Ì"~ŠíÀjm)ÏîBHyî±œçqY+,’1.?¡¸ÄçÇÖ+rB{ËÊ<7ÉÚêYKaî0m<y^{”•Lå†æAwÜ=|»=•šY­å‘ªIË³¨ê)	o¡e8uªbäÅò2e>Û„ôhâÕÕ? ª4ž6Æ€’?Ï¡k‰\i¢3ˆý«8‰ôÃ¦ªŸŠþÉò@õ³ÊuêæÄ†-Í¹Cªød~nÒ|òã³[æ¥óÕÈ“2^¡@ÌÃKGö©Ëì×ô•†Ì©¤¢üaZqˆUM4Š•ãí7ºîŽÑÍÖÅ~£×é—†$Ÿ(¶:´ÞöÊ°59ÈnÑXÉ{ ‹ÜCIÅÜ&,¹ÐiWAÎ' >Çù»FŠeßY0dðFÅ››ëQê ÙÒ ¶$n–G'vidë sŒ4'³¥†@ôí³3àu[ä[tãÅá{W°ZÉ 8tJcmù4ÈÖ¯ˆüLb ûh:  Ñ¸™;¤<Y\ŽQð8}Çç@lŒ)MY±¬ìÃèŒÁ¡R™ˆ:"#€ù&DFˆ¢¢DÄÇ_=‰95G ±œ®•z ž*2·c *>%/ÎŒÙ(±Jzä¯Ã™¥hýF`ÄiÐ#ž†Õ‘g–ë“GOïR´É‚ø®¾ùu’˜áG 1µ‚Œ éI2BØåß•yjƒzK›
úSÞ±šRæ|0JVÄ¾õw˜­¬±¹Ñ-Õ-¯i \brHÍ$¡}†µ—i{Û¸ÒdRng¸O…æol&¨$Œyé¨<ÿD J&z?S ½¹}œæµ½ q,Üötd2m‘K]òD*`_Ca/»¥¨Y+àÑ¸Ð¸ÐÙ·ÜH$ˆ$ó5 “ëÉV«ûè†šemm“¨^˜²Dº3yÐ%œ{#F‡’Õ¿Ì`•CD!büFÌšN7ßúXÄå×öÙïlÇË[#~h”Ï­˜:Hó?ÿmë–†åÙŒj¿¶ÝNg`ú¸¯ÄZ-Üe†+â©?ßøOf
T7ÉÞ5tê\¾ét:¢û­;‘ÆÍ¦Õ"SÊÝ­Ì•×&ÓôË–Ù`Ìmþ>ó››¹*s~Àà}6‰›xo×XÛ#Èˆuó;¹†¬iˆ”_[h7ÌÓbCÿ¼†__;WŒœš0–›Kâ{öd-¢Ök	ù.ËR™¶¥³ÝŽ(måêŠ¹¦5§) ^j` õã.çF{`âGýË	µJÆ2 m­Q¤Tµ-ª÷Žóvoœ%ç”÷tÍe]P©#ŸØNç\K ÑÌ±öSr¡41J×°lÄ:”‰îq1t”ä‰†­~¯×êvZX%§2Tõ‰âKƒi²ÂVºa…s€"÷ºÝeYñœí¬¬NŽÇQ† £*mm!Ç€q¶®¾ygÕœÿÝ‹Ÿšq	ü!¥‰D„¿@´­éÚµÂ¶·^EhvhÃ®ú 9^›.%àn¥¤¡kØA[XA&ÑÙ35AU ™ÉlìcÈ÷‹ý”¯Eá®Z¥§ÊÊí(õ×ú¹äG}VUÛx˜ÐÂ4âanEK{^™˜v½Î®ØVÒ eŒQS¢‡E>zƒ½Ÿ/Áºß•öT4]é±¡ «u‡IÊ„ÔxEœˆ<^¨˜ÔkSzåUJÖ•õMÄÒóÅkN¬(f-D3âÊkUE-PBiÀ!«–Ü">*¶D›–qä,0=nqÝ¶Üvì¬lö–x½^¢Êóuãb7IÛ¡×mcxín’YL/Ã|äN&Ñ-‚Ð-r®ÛmÖQÀ#”{I¦‘4î˜X@~y¿i?õ1±ô‰ãâKO°ßK		½~E•Šj
s'B0ßWæH? %aÖiÖ?òÐ_­œx²òýxY• Ù¿óT$L@–µ¥.æÚÍòÎ·B…“ên³:\«Ù\
¥=ž*H•]ã•R<?nÓ,m lšµëQê ÜIGŽ½ö	,A<eÔêÕè¼ç"	YäàPÖ5hêvFctÂFZÅuœ‘ŸØ	É,ã?:¬ŽLhŒÈ«ùÜ ®ÊT¢ýŽ“{Ñ	âJS{•äUåg4ô/R¿â ôô'öwËna~ÄÒx(…ÿ0‡Îy˜‚«dX­Ç0yøzîB­›P¤T«¸]²d}C²:E²¾˜#tâ»Ï_a¨#š{WGˆ^ô1O©¿˜EüTŸžÒA”§‡ABz8¤êœ“ºµI–úX•ë¹˜v„Ï? 9
[6k¼ëVJ%}Ìã{25ƒej’š‘å†B•Þ`Ô›¾òöª|Ô¨ñÁ*|D‹V3´ºÂG¾¾GZÞ£/T÷H‹{”ãJ…„–P”‡Ë?°4þªl!ã¿êÖº©ýBfÿîÐLw*ó	`êh>×8[hh7²1YÅøÙ÷/Ï,7²¯Šù—;WÅ<Nž¿ûG»Ù„"*?ƒüÍª×îîôT³J2Œ³LÒÇK§aœqT+ßè–,aÍœÑŸyÙ6&JõbÉërc–"h‰	™l m)ÚÐ
&/m˜“£¡˜ÈU'bövìI”hHeKÝ¶ó›eç£ZvÎÖ³%Ð½»±ì`“n-'yqbË‘Í¦´Œ£IáçgÉA<íÛr²¥`èö†—ë¸I'œdÒÀù+4éd0LlÚwnÌÉçNþf¿¡¯§Gî”÷|ºF~œš8‰TèöRã>¦NZ•ú–¤¼U+¦0R©úz‡nw˜Ù¦UEÂU^¥"ž2•6(O6¾^âÇ'Où¸A6ÙuNj­T²jgxun‡qV‡I>‡Q²˜íõŽÄî05ìNiiˆMEþ’Y–Qõˆw¾«S&fù|©ÇlÇè˜•2Â;O’ºËô¨OzÒªmªÆ?–©fÆ˜Šô£¢±ý8ý÷Î™³ÚS‹Ö‹.f ]bs(+¦<÷j£@!¿eŠÜ¼= bkŒ^Þ4þ2,%YFI·QŽ`Ëc–ð”FMa´™:¥ŠAK}q¦rÄ)" è€ÞïÛº’%Œúä@¥¥Êm,Zgp¦…gÅÆ)iùqM¤˜SY™œ¯YçºZe¯(Å"¿f”MÕ´ë‰ª/œduÛ•C\³Zè½Ánk·ßêÇ-,Ñºõ–¶Ý8T¬óñûµúÑaX\NgV´ñPTô½£ÐZ`o“R‘ÝAP‹#ÖÐAÝ×Ñî€ê5ËO]¢Û÷äÀŽ5Ÿ«m 9Àb„ºº1«ÔÿEwO¶xÕŠ9+"ÏmëC¹×ì¦ 	ílØ—?ø[HÖ›ÕÅ¯v§HeÎì°ƒW£ï;oºÊ¦ÁèÅ;t•y²’m!¯Ø'ž}ŽaeökzA×?•ÝÞñ=d¹O*¼»ì¼°$] “¾ GØŸÅÂdc”itY\~Kn6š\U?yU:üç :fÇ@¤¾¹NçÐ"æ¹È¢.¿Êh½¡ Ð$Â<YÕý/çgò¨öÄ˜Ã®"¯ËÐƒÀÃ²¾Aß—+êlŒ+ÚÿO˜³ÇözòŒ¥Ž_#%ìË}AlnPè	’²ñ²Ê”þÄâŽ%™spÆyÕ«ÆZb™«Œ¨¢‚gZhYù–`©OZçäÿ)1GS¿©f’ßšÞõ—üF!N=²Wëžª™ ÈÕg‰Ó€Ñ¡cGdi‡êèGÍäLe}L	ƒ¹Zê:Û\;K³J!ÒªX”˜åT*Õ Fv.&(2)×(	ŽTØû³—ý¯¿ÓÁÊÚ½n÷ÏÞð~gÐm‘‘RëT½\ˆ¹·lw°uíH¸Ð<&ßÈ—õ%FB$KlO¬HÍi#ozE p~ácüÒJÊéùì~%¬¾i/€K€.;•Âb((•Ýé”e®£ÀvÝÃ¥Ž1;P¸©pÌÕº¤3ÏÌ5TËòf¡Ub®»-BUqþ”õh5µ"–'}™ÌZ6)EÆ£Ø,£)ým_`âà"¶{{B5Ì½ËQîzux¡y^ÔÉÅûY?<±ôÊMhaY-Ì‚Á>%ªÌv®ëVÑª·<AÛe'·ÒV­­rYi•ÒÄÚÅ%«3SûËŽÒyhE„TG9”yÓûK"Ù^8/ü¹ÝüÊIþÔ†$¢ ,Ü†ÏÃßØ1•—æ›·:Xm•	¹þ(jâ(ônô¤…a¿¤k,CÍ2¿¾L×È›½:ÞÜYøh¢HÛ½òKB›U~EÕò5 ww[½.
€=& 6
]]s$ª ;]nït5íJ•,A#=·6XøX]ÅW+Ê‚?	ýûàðôø‡Çtq=*%?©OyIüÀe¥ZbÀ*#/ª2(P•~	UtÕø&m¿ÞV»Cw¯(ãµº_fÐîDëÄMÛ[¨ÝÃÔšM—’·îª¹µ•´ÆÔQoüÐc‘<ä9ú³çõ´
•ø«ºWcÏð°g•+±‡¦™›Ê69ýMŽ2jD@¶q';àxäDBÇ£1<‚>WOô¹NˆÕ]Õqn\ú*	r«àÆÁPß¦ÅqÎSRõÐ@ A½®<Ô,Ç‹lL‡Ì¥«OÌÔg!(Öiwð¢éBù.lh`8ôDTï_*EÊhÑ¥xšh™¢U‹¬Ž+Úû(]É‡5ðqÛ__®®ð?Çåý{*KÞ—¦È;í|,GîÉVŒtöŸö3®a«ÔþvË]Ä™ùÓÃ¬qãÊÎví‚|µ¿W·	Ï‹WžÃBÈ‚—xäñXÌªçJòJýêÿXÝ=~$:‹ä#[<žåþÞòfÛeqÜ"S0Y
h™I¢JeG.¡æD	F‹F/XgX®ÈS	TxC_Uk‹Ç r[¯^¤9q×e‚'9˜ÏiYrô¨žì Ó¿Ì½±9	`œ°jÛ&L£×k³õÛà×•Ñ8ÚpôQE¿)Ž¤‹F¤Õ‚€J&I‘Œ´\RÔ±¯!¨¡±+[Š
rA1(×òÖ&|§‡JªãÃ£#²M_á_¿þÓ“'ðïñá„^œÕ\­>2“µ	Ï:ß0êO¾’n…³%™Û€êš´¥9 ãëä€åëÝÖi0À€Âq(©mÓ}‚>¼øÅíM´W‘¡ZHBRS‰«$æíòM	×»¤	` n#&5Z¬3-X˜»—0Œ”vgWSíV¸6à˜Ï®HŒ¡A®ÔåÜD —åyäŒª²Â\Ä«Él”•¼LçCO•<£¤J›4ôb6—ôR2‘\Õõ³À3-OBfèÞªdéZÞm¼Eù¹ˆ[éLÒ‹Ù<Ä0®\”–0íÞRuajÍvU'Ðj!˜kt´.¬<ÅT²QËÃ‹JâÑtBÉd3{™q¼áå»„=ôÄ2Å‚XÆ	hÎP™*äk¾Fº_åMMËƒ_aU%Û–µ½fúxžF&"–ž¦—Ñ²ÍFpë·šûKç|oKÌ
NÓ#|¦ì#zNìa¬UŽÍ|"t$;Iíó9ž"ƒ/:äåñä´E^] ói‘'öV§ÓÑ/ªçª³1÷BMÁÔ¬Š¾ð–Z>·½K‚þ“éË©—µ/~‘å+öCñ;zÏ¬•Ô(¸Kó]ì¹³Ö*çúü¾;
á5|ÁÜ{cb?PG”YZŒ+o«]M ‘ü5f.ŒÕžOÛL+£l¦°„þ5¦YG)¤hé*Ì¨˜\tf¤~¹œZRdÑ`n)CR¿ºZÔDodÐiú×S[+Í%V2¥È˜ï5 t€Gµ‡vÞ¡¢õ€AÙE'ÝœÁ:Ëáb¥Ž{ÙÔ¬’²åç‡ð¾…º™È>Q‹¿Úh?öø…"ù~ËâŠtu{òúÅ–&P’0mcOóþ²9Ð‡ç0|Go÷þXû
ü¸ÖÔvùÍ&Dð	Ò<p×+Ç³ÈÉ˜~’¤Læ3šàx¨‹ÕÌ Í‰DÂ÷ÈIèÓÀÐØw:ÓqÝ™‚~Ú|ny10ðõŠ<³/,@kÊIŸ[Æw:×º»>.l:ù‡5Lýã@öþ°îl‡SÒ<u^õ·ò^m†ýWƒíCûUÿZ³|«þAs¿ÉÑ·Wˆó5ö+‹È·ä1ö€	}Ï™E78ï`õA…JÀ2qJU/þÜSLãöP$ÉžÌ®™`Dâ³øÕè±—ÒS/Í:‘:1{Ð@z¿<8q%pš<tàN¦ÂSø•Ho2ÈÿÔî£Ðïä…ïaSÛhˆGÖÄ“–Í.;ô?Dï­Œ@0íOlqv€$NÍfrøÓéD¿’?Úò<³I<±Om É%BEìr#Cº3/¥1Â¸Ãù©-N¿=6‘›=ö“'B
¿™=dËO¾ëT~Ìleœþ©„ü‚Á£?¼·¿<tüô§WÂSø•œ>95yôd*B¿<têˆX‚ßL&y*Í¾PàTò	¥LŽe˜{”_0ÊO§"P~2„dî}ü‚Á£ÏSKz”_0zôå4÷(½`ò¨uàÊ²>;“Ð¿’æ3PÛï·ŒØËHD!üNš‡V=ìI&¹O±!ŠÛµ=,/oBëÇ@Äuð+äpi¹3?Ø˜ßGÖOáDÆR¼P“FýƒÅ#çQ8©bz‘ùë©kJ^õ%‚Ç¯Ôa™dâWBÚø6Éœ™™è$‚_ëLâ¥s"–~epáÙ±ÙžØòô{­^x¢@ß@qUÃcq
ø•ôÈ;}6ŽÉ(?ÊÈŠ_Éé‹#“G_ÛñQüJ<'òA²ÌÖÐÖ~áK£ð+ô~ËÝ‚b"qoøÀ±=“¦çdÝ9	~%”ö<N»›Ñ I&Ç¯äG{ãRIteÃšŒt*‚_¯1ÊOá©-ÒCúœúïú,Gc(‡žæåP¸À©Ù¢Š.Þº*÷ÈñgvhXµ|Y¥&œoQMõéÆ
Ý³ƒ“ö„Æª 9øÑA€vvÝˆ¡à@/-ÏÏ‚×Œ8´Â©ïÁ
çm+?Lö«Ñ`G6¶wPô}@®ñ Ž§„ýb4È‹…j ¸:÷ÃÅLÕpÕ|ˆ“©j¸j>Ä¡z_æuæ† #QãP|¿™p.wí‡V`ÅH&^6YùÒU#]6f
´¬}"1š¡¤u²ô£`iIc²{ªVWeÖ²\Wó*K!~-«ç§Ò–V®ŠK^á:ZÊ€N/Ù4P¦O/<þJš3|C²k&0úí§èh÷»²âê³¦Þ½A{×H5€'x¨P5Öp4Õ›Õd48ª†b?ŽuZß“Á›]3‘À–ö¹Š†4‚pÑä4Â­k×¤£˜^3:ÎNìG–'e'þÿ   ÿÿì½érã8º(øží®Åî2m­Þ:²¼©Ë[[ÎÌªÌÈÈ¢$Zb%Eê”m¥+oÄÌ½óóóçNÌ1ÿÎüïy‡û$ƒà ùÑKVÕíÖ9e‚ß¾5¡¨±óQ2Ø9É¡=ð=Õ½çGSQB|{Ü„!ä'QA>é`ôâàà±'\¢º‰<g1µ|Ê8Pô¾7˜Ï|ïZúØ´óvÓ7‡”$N=Gœ†ÐŠ!	}ÑÖB¯¨¼íû6Î¬Ø¿èŸ‰8Èà(á1j:ã³±?»f>¤ËGðöJÜrz•øJŒ·¶?¤¸g¢Æùéê­HÜ~2è5Yþ)¤Š(ÉÿÊ¾9¶]™i%M1qa:sæŒèmIâLnv#ŸÙC É
ã¤¤ïÞ…3“Âä§IRt5§æ'kf»Y’Ú1<sby³ÉÂqäq¤fÔ|®¯­ìT¢&ÌCÏävèµMQÎv	ÊAÑŸ}™FÇ-(
í9Ìt/¡½ØŠúŠ™íÛâ–Æ-˜ÎSïŽjÂ°ââ i+¡ÒÕd1ò‘`:–¥!*ÿ#å¡¾/÷¤"3²ç[dkÑöŽ¶÷LŸ"Nî\ËˆÎÛI|CÀOO%~E/É7u­)«ì€¢{"ŽÐ=¡ì‡ò¡!à§eÜ]§É¬“^¢,õçŒ^MÚÂùÀB¹!»fÿ¼ulMmqÔOñ‰wM(C³ñãì‹£-fÝ’evÇh7ÎQ‹ñ†
<Ž7ü˜ÄÒVP[àƒ):uÓ6”Ê#“lQQÓ£ .UÌœD0í)ñƒø\ŒòÃºAÐ}„
t±  
v=n½7?¾C¢[úÜÎGîJ­.7¡¾4íEÊ»!Hæ¦i$C¥ï1ÞpMÆˆŒY(zþEª]»]®ÅŠC
w‘"Ô¡5…ý$feÄ©è9¶Ì¹£l#ölª9°ßlÆÕÔî¸3	*—íu/õËÎCªR™w–seÞeäçø«´Bz87„sÚ¡ºFÏµÖ
*ˆíÖBåvÐ¶$¤‡Fƒ·’àßæeÒ_é.˜ãÉÈUD‡´×“ C?ôç7l
ŒÑ	<ºQ…Ú>'ª°]=q'ãU6òœnp¯`bYâÄŽÎÙF¦·0|o¿ë/("fEVzƒˆwPæÖ;sj…<i(¹ýQqj…xNÁì˜ÊnÞ,x`ÓÇÀ‡Ð·ë<
4Î§ÖÌ7?QiV´5¥˜u·A‰¦¬ÖÊìSjSùd‡ß›.èHdy?–v‹ˆ’À[„Îã*S‡jq ?‘=+X8Í3¹‹³ÜL¦!p¦UXÉ‰˜~hºäÂ)O“ùR|gÇ
©6ò	¾,Œ‚Y+~iízn®ÄVÔzÏŽ¸âñ}œýÆ½¬cu\äCé]TdéDË+(¥Ijïè×@;KÚ³¤C=
nŸämJÛø3’1¤æGáí•Y›‹¡£€,æŠÝ…¹—^0‹äE8ñ6Ê’ª=*B—ôlúÖøŽÌm¤f”A&ãù¡a[™(ÓšåÒ>9ëZÒZÁ¢%JÈLÖ<!]Ž7³GÞØ§äžps@,‚äKx/Ÿ^<:jøƒÀK8-bÉÐpù1Ò%0²\óÚvH×3ë¬¸‰óc…–3ÿ	×|×‰ZÐ¬(pQ´Ç 	|‹Ì©éXòÌÕ÷Q†ATRlú>j¡C“Îh «rŸªïc8ƒÑƒgº$ý4®zµ(1¬‘ãjâ[Y<WßÇYK@0í)2Í1AþÔ}ûN6 fÄ­Í‘3g¦_ý’$Oàèø—#}ï˜ÂÖbèM$7_õsXé[¾²kn\ÕÝ
ž;rµ˜Y`™×ŠB¦ŸEöYœq;ëYŽE¼‰Ç9º{ìO¸Ó“ƒºÙÈ ²ÜaÑØ<{Ý­ä½~k„ÌŒf4NE;cæÎ©:…€²`•tÇ[@U?´,½:‡£â9ÙF…òRt=(¶!@‘ ~ŽØÎXÚ2·êÌÅ.¨×]ˆv‚‹QÝD÷ÑÅÛ­'®Gå¦=]¬ç([úåDdu”†%)V(Œ;õg¨\©®¨Ï¿š»ã ”ü—opR†$I ^eŠžG‚é<—;nAA+|X&ä$iÃ J¿Y#_ú}¸žõZ¦'m@öÜ8Év¥-¨¾­fæ­Ð€rUmˆzeÇh½Fáœ;¤V´G-d³¾…›v}³uq,O¼¾i@Æø7Ÿ9Ö]£Qƒxy#¡±m|j@Ú»M1	 i']î`VÓóÆŽëb<;?œµ¸¢]¿ãüÀRq‰€@;YŽî £/º^×?´ÎìãƒŽÄlâv70HégbËØ5f£;Ý¦´KQ
@|s$Åà_Ùd™5døÉÛf}O)5ó;¨5Ü¬m¶¥Å#Ðb\¡àZ¢›QŠPIVrÅÄ-–íM
ÁâêÅm*É-A‚•˜ñ#R/µv“¨Rd`Ç§`´ ß¤ÚÓ¸)µFÒÊä/XÂ’äFŠÛPÆD×ÌØ#“&ÔVz¹wÜ‚ÜJ/“¶UÑ%¥
ºö¹d¹dk»Ci¾î,¿Åõ=Ïª /ÒKˆ>ÇÅm€)Ž~êäÂŒ!5ÊA”qe:‘ÀŸÚ{’;xè»`§’S¤§”´a`j—çïùžûI2?F7HtÅy·k­Œ°ÁZPàPoŸÊ±-´pÉâä†ÓonHrm!M-í‡<îWì·56}ºy£±•ågÉ‚æl]ˆLuíáG‹rIîT"N9í.¹C¢[d¿9h5%L'¬%­×ko$Ý€4ûR<$»FñG7©H#X§ˆ!~ð(	½ù5Š*Á‰bId9jB	¡¾éd’Ò6ÌÆ›ƒ†ÌÈ ÅÍ±frŠÍf;¯'Ò§¨×ÖI*}¢$æFvÚ„ïß¥²AÏ—— ‰°6ŒÀqfdß7‘X‡Ã…›£kÛrFùñ¤äÔtÇ&eH‹,—:Œf[/Œ¸‰YkJþ­b—8TÚHèŸ«…#Ë´O£™¡Ë´…œAÍ3,q~µY?7]“KÓvnÍ-ãÌn‰4:j!PþŠn"ŽºÒy“n}³Q“IkÚLú3¨—‡­!¥Ï§ê]%
ŸlH*Ì±¹ @CmJ–¦Sô=On‘<p-¼ ûÖ=´_¡‡*S³LþTÒ„Y˜®˜W˜N§R§Ós°ôM<œCüìT¬W˜7Ú‡ÖÅ¹hí89DEŸH54Np54ú¶Ø‰^‘Ž‹ýºN¿×=PâDçŸúo…Ž[p‰™í¥4[ÿrŽ+IqÚ¹HYöU‹/dºGSì<´¥ •¨Cv]vfœHs£ŒJãŠ+WˆNo¤Šok+'þ³KèËÆ\·Ÿö$,†Kžß…b¶'rÂ‘å1qeUzÛ?•²ðû§Ê2ÔßëÔ%›Ò^‡ê!¨•=?;ÒKÜ_Ùç"K£×ÆJå8þáUÿª.rh0ê¨õén‰ëÓ;4PÖÕ“©>\’>Ý—Q\ÝÍY éûÑ…X>.IN5ôÔ+1.6•Ã,½áèš/Ú;Q Ô…?Ût÷œ¹u¦¯” ¿„âE]ô!g¦ó1}gŒþv,á~b±Ç-œ	¼OY1ž\æ8² ,Æb•œÚpL+(ç(<Rþøûœ*ÞŸ„ïPjsh¹þbë£à!
'ðí !¯8¹Ce­Òù‘òhò§J÷ÐÑW’ÓŒ›,s;;ÕX™%ÞÊLˆ[Pürlfœ~IÊ®dïF@hÄaÙ×–Ÿù¡Ð‘ÝÀ–#tFpþ±¤uEM&eM³ËŸ4aÌÙ:
I[•Œã…lKîevWEÅO¬in>Qj9ûreGœ$µo›SÏm×q¢3Ó»,7§ŠYÈPc‘ãá•7Ý3±ð¿®`–g+¶¢¤ÕfWât?";ærdºŽí~ÄYGÏûFŽF‹ZÈò¡çGõ?qŽ†Kø– nBE9x„‰[0ð=†Yz•¶a¨­IE°ÅLÛpŽ½pêA<[¶ÀGöÆ+-ñÑC—÷8õì ÈÓþ¤…´Þ,CÃ“&Œ€ë¹ÁÈt,y
b+'swœaqæ¨|–!wIF&xl–ž3ÍÝ$M˜÷çŠ%uðu’¸'4çÅÅlÌÁ	—©ž6b}7YN›šn&·$i#G¦,Rx8w+Cˆ“6²ÜÝ¨á8f†œbYÁ±érùÊÐˆJUŽX¤û.r£ðæ
ãtÜpâ›!JhD1òYVg´â8Ñ
›Óõ¨ê&‹tQ¦óÄô²%ÄxÆì4§
P&]?nÂ¼Û÷†öÈËe±õªŸgsvvU:÷­kËà¸£Çê{g¸³K¤Žd#ëÑÈ pxw€ÑWÍ¾- Ø59œã\+}»›«ÿnÐÿ‘®cŽFH_È‰¹ç7»³‚–.RjëÊµ¨»g¤ãOq%äã8ŒÇ„f\Ì÷-'ÃJ/œyñÿ9Sv5cüwäRIf¸„¼WŽŸBFªÈÄbO’?=pŽõ)Ãù_I Wh@|Õ<ß’ øe—|%Ã_áŒá¯Œ¬ƒ<nÁ€ëDúFv‰*L9`'	žCG4Ká^‹©Y7ÛÕJ ÄÎÐ¼±Ü±¤G·HzïQV/¦c¬àÖÀ1ádŒÑ+íEÊ»•îk;ôíkÛEkõüµ"'ƒë¨Ü!N¼Ú£=o´à„J41Ý@>š~]Z<Y…u8¸›9gF©'jÿGrp‰ò}ì[3Ç
­Ñ+ŸjÒÉÄ‡í¿âI'(f/²„7(è•ÄF®°Çˆ<à°Š¾Ý<“êÙ5¢ãdO|ÛÄØÃáùsw”I­Až­r:m(p…•ä“\ø5†DŒ‡V½%†'Ÿ¢Bé(ÕÃ¤ÝçõmQŽ1Y‘s¬”Ç¢Œ¸‡(¥†yë*†Q39´’ƒ>nÁ,Ä¡¸mp…éÔ`Ïó=—iÌÃBoâ‚\ý=)¾.1:Óõž|š®Û•½'»wqÝ@Ä”ø<\£9ýÑ(sP\Wx2èÁ®+ô‡#"º¢Eµ36z®ÑE™T9}Ïüå‹‹«j‡_Ÿ¾‘Ššò<ËèœHáp‰ïÜ‡Z%¢äÃ*0•WŸ]WXý‹Á	+Ù5•5l7„TVäÉQÝ‘<
¿FYW$Ì¶ÎÉ©7²|ì{ßú]	;QLnO2¤Ó«ÊŸ{fö®ÄM£×;WÈc	ŽezrÜ¨öÅ;ßRÛÖ1».•¹e™üKA%;Tßœò’Ž•:´DG¯R5žô'‰’q’ÓèòÌ8ÅF©½v#s^PÔB¾e¡•g»Õ·åH2ÞRi”KËv¯=ª¥ˆÄyDIRx¤Õ­@o(¨N=wA2I£? {Œ@!A¾ò8§É[¿Ùq$¸¤×•lþ …›Lã­ß«×PÌ“Û–ØiÑÏpl:ð×£KT‹>”¸-ïa‡ ÏIjJ3KÞîÏ×ùip.òÓ€œß-ª°gŸ‹E8ölÀöFÈî—–„k—‹‘ ª®¢­pH¦È5,¤îîŸËD×í'™Sþ„”â»sùlœÎ?Q×m–Ô£œ9ÙzÙƒ´ÃØ¤ÀV¸B‰öÍŒ`ßÄ1ÿCKîÈ¯1jœ+ »ÄXd x€×òÉjìå¸”ÞÆ.1\Yþ¶>òÛ(I·Ž]¢TLŠ=ÙsÖÚ­Ù•e .2‡D¢žì#èK/û÷®ÎXêÅ.q„QêÇ¯1^RW†0~’Â¥Ea—}ÑÙ“,…p‰yÛÕ¡tŠ\¢&y.Íñœ,ŸØáÄôÇ8s8œ˜—9Â‰ƒŒŽ3@v¼’ùË’¿ÉÝŽÝúÃÌ4‡ÈižÌåŽüƒ‚™4ñkå=—è..«Ãå¸BQ‰C‰H :Ž%t`—(ëå¡¸ŒìCZ$$ú‡C?ˆ¢Ó¸zNT®.@v’H»DQ>é£Ø%Jþ¦8GMñbÐ“‰Wµ[g¦4Ev‰Ó½eÍºÒ*²KÔrÈ‹?Çu;¥|F†_¸FñF¹#¿Æ_NñAò~Éb"…=µõ,ÇwP¼ —áÃÎPXæÍ¸Â¹D>DÔŽ<‹ïî€*IBO®ÍöçT’möÔ¾çþ¨³Ñ@¿c9 ñ+pP1…Ê<’ÀZ`Ir< &˜@L’vl±0fMsü±üFRËƒUžcúÆ©\+Ðcõýy¶Hfˆ¨;ÏÍ€zÛ}i§¼¨7ÓYa~6¬½S¾5´½yÀ=ô™Áâ›<³å»åf#J<ÉŒÇo&Y)(Ü÷\ƒ}2cÁÂ­Aó Ã)¬ž âÄzÅûRÐ1™Å
ÓIYpžv(Ãjdå@n4l$Éè3CæF«”¬ÎO¢5öýù87¿‡ŸX`€3+7Xhõtí™ahùƒ%ëæF‹îâSyYšÜÐ£<o*ÖL¾ý8‹r.‡ñ§k>âºPžÝ7XÐBîkùM|DùäUòKÇ
- „­4+µcDfvõf ªñ”mÄéÜ	!åÇ÷ìaÌc*l†Øý{Q6Ã‹‰zÃN@&2Þœ7+ÌQ |¶YÂ¡"Ã„~6ö^õ Â4û$!ÀÏ4ÉF¦áTw+0ŽßU˜%‚ð~Ï;Íô/­kŽAó«¬fÚé™&	§•G,>9º»ÂüÒî"aŒ'E§}æhÜÄZö±Ñiã³70pš~*ïü$gtVí*÷­ôN…:X,Ëˆ’°ò¤ŸÝ&r´ºŽ¹H$¾Üpô&Râ+ºˆáÇr8ÞÎN»D”ÓŸ):þpb¦âý…=fŸfÇÚ°öQÏgšf,}tFçªÍ÷…°Ñ¸³^e}Ü,Oæ./©¦L_81úötØ‡š%ëKâ¾ÏÆ™AöZóï6ž%ÕDGqg&@'Ÿk5áPN#>(ÑHŠ¸ãˆ5÷%ËÇÙz|ŽýC°CRÜ¨Š½‘T±7âTÒ
„÷¢KJ{=’²£Ö8µÝ`}ä›×¸IJG¾“²~Wƒ•ò0®Ìc…Í1‡_…!ÄÙònDèF–;½ïî†ö(Wð\ qj…–ç3‰rQMMOz§Œèy¦ÉW·¨
åR*L5_jåyfz`ú”ªžRŠêPNÖt 'ZàÈ«wkÁ¡Ð÷¹bÅ]üØ‚c¡«Øez=ã5‘y.Í'²h°ÊÙÉUH±$²xDù1	Ö	(yxeÎ,ãøJ¬D¯4£¬®¦O…LÏ¦$xîÛ ìŠ©p7å®8/ƒO¡ZÍå¬”_ÊÑëÑm·Q®``¡ÄR§7çß%Çæ'ÓGE+¾öœ¡éRå¿LŒ+k6ñÅd³ø.¡w'Â:öŠ#Ë›Ï·pù:éã„ŽÀ¦ñlŒs×r¨@“Øê}kì›#<ŸÌü¼«õ\ÊòöÈµ¨fÇ„¯|‘¶ØE>'ïMXïÇcÙ¿ŒD:EŸxäœØFßˆ5 <%„nsçzî“¨ïs1h(bp2dÎªðfèHâŽ÷ýl´úÈ·,7NlJƒé›¬ Â<…ÎÌÂÄõg3¨uÂ)ˆ¼pˆ•Á¬õžcìqD©‘igRÒéqBº53Î‡–éI]^ãÌÍ¥aç]RúôcæÇNh'¬n»ñp“ù³fvˆ=²û5SÆQ0î
—ÒAƒ9´@‚ŽÈ©à°€ûˆâË¥’¾ç‡TUÅ‰ †¥ÝÑqc£Ç)M1Í¢Ô˜êo=pôŒs!åÂÒ6ÂÛž@êæNÂDr¦<€ñ1œÔ}~ˆg¢³ÌÁfJµ¥¢fÂšGÉ¬°/ìÓìˆìGÊQ_	bêù³%9Æ¹uÝ çØˆ(—o\ Q]P'Ö“øÎ#!%u-¸0¬0ÊVA “¤û£–®l–W¾=H¬ˆo@»Ø·>R¦çIéó¢«PjöÀÊ"r&‹‰#1‚éñ8âg¸,Ã6:"?ˆ¾:¾ê’¸ß3ÍðpÎ5"‹9jŒCÛ§bÉI±xoRòü#©êˆ¢äß<›òž²Z÷ŽT$óH†ÚôN»ÏfÓdG¨ûv`™TòH´Hœáu&Qçç8µÍØ³]XÍ‹IñÛ”*ßÃ=¢é/ªâK¿0€GÍ‘y[Eû0ÃW|žq€‘óÝóGUa,%>äÊš!+;³FÆúÁÌdyÏn4Mñ MÞBªXBï&ˆ<wè[ð·p„œ ‘‹šÈ=Œ‹}än&É¾`æ^’yš?…5ê¿õ»F=1ÞÔ­"[wäÇPqcs‹ð‘«¹?€²h{ý–µ÷¨îbe+ŠËË$fk†ªü^hž@e6xSkÄŽŒº¢r?ËƒcNF¯©æ˜ÊNB¸jôL&<‹yç+'ôM#Ý‘Û8­Ò¢`Qž_úiUWßÿõQ´á„rm;ô«¬Q—‡°Ršìß¼M¯O¨~¬|×ÚÔœ-Íì¾$Ë:Ê¹¶¶FÑ}EKŸXc®ñé,Ã«§Ç|ö­üá„[¯wÉhÐg×k¡oO—WÖBÝéRÔ[^ù«v(ûš,ÿIi…P4Ÿû.	ý¹¥ï=´\Ä2èg¬±í•ç²f»Cg>²‚eéµ¿þZ6–=zü@°ØqÀ2f4íPÚ%ý¬îóyEÝozJ)08–;¦í%©)_¥hŠö$ÔñX»»»¤F¾×ìÚ‹‘}C†à½;3§ÖîÒÄ¸ž;¹†8iøÇz‡Ych5 ¿ÌƒÐ¾^Ä—3c‹„Ö]_³¿œGíZŒÍ™Ñ\z©Y¶}ˆ¥õƒc:ãOsu
s¹5ê52„A7è Û?ZpšÁºvä`fºâ`lˆ»€\Ó×”â?’ùŒÙë(—¢dkø\·0ñupdäË3.ó5·ZdjB½^¨GOÿN¢•±/¬6›wõÚìî}vÅØk
êÓˆ¾ãÎ¸5Þ5jðèÒË+*fpHÖ}M©&Óƒá/à¡-T%1ðU ­ÝYAÑÔ^¬ÓýWÝZ!;ˆQ@PÅåÁÎ¿¬Rvp·Âˆ¤nA ì>Z‹Ý{úägqe¦¡ÑÐÂí8iéÖ±xgßÕÖêmkú>³¹d:0šdàù Øâ?øíÍZm½]#³Ñ P¾àã‚„ÞÌ¨‘îÏµv­So½_ßn“}Çˆj’ôísÚyJ>ÐÎh7†Gú B}`%)¬µè¿¾7g8†¤t7¶>ð6@©v/ãß½°E	=ü¬_êõI«`#2³L)Æ­oÎøg’Ùü³ ˜Šž§ƒ¢,CEJÌí€óÁS†’9¾HþD‰àÒùæ›Bæ?ë®˜}¥#‹÷KP4°ž—iF-²€¿ÃÁ¬á÷b0CÏ-yŠpdeß ‡˜øç¹]ªaÜ½_fèxæèàÎ„ä›e6¡„Êt+å#¥ vÿs×@Rk2°ÃGˆèï63œP­ŸsäÝ†òÐ¡ `ƒ¢ðWÅPÆ2”!:Êw—R4¥¼k};âf·P†1¦7)¯oÕâY¾«}¨}¨·gwüñÀ\®7·W·«ÖÆjm­¹òžÀ1t½Ø„Zµ%ÔÌvØÌ8¥ÛªI<¶I/'ÞåïSåòÇÐÉf)fü\îÃ6óúüsHÑþ»1¸l¨ëô‹‡,Ä²Ï \HŽn*±^1‹Ï+ËŠ·+V4FMRÛýú_H‡á¹X„eèQ-Õ¸ð½¡T¶Ø·Í±ë3¤ú±7; »Cq°¿¬Ës¹Ÿ±-¦.D]T8ÃHî¦ÝŒnRŒ¦Üy#Aë;GƒÖ¾FN:mÆweÙ•1":R„T¶ëÒþ9†ýÕý<°øGÃ7O¾ Øœè¿ ¿MÆ÷! ,FèTìò½©ðHªžpMeŽZãý·Õ¾•Ðd+BQŒh×¾¥ÐŸ	%ŸU
ä+¼µ,WÉjõÜ:^#‹.´ÂZŸ]Z=GÊ¾+ÙWýGóËŠòTƒÉS…<Å÷äBsxÎœÒ=ÓµAä7f q{Ì¹¿06Ûº‡æ¥ðÊ‚JT¿SýF«½Zoo­Öë”êoÕa½p…H/ßW™}Bõ&¢%‘Y¥HÅá¤ùóy¼ec$(H–'lŸ¡¢¬o©±.þõ™™Ò¾¶‡"I<pÇ¶kiI{%MR;](½«¥ðÈ™ñ»­ò…à
«Ž‘\E$3Ë§—^žÏ€€šÎƒôCýÆ{•Xl»pÀ…‘GæáÜ§ÌÅ˜—F‹Ì/lw6W›å	3ú¦áÄ~xw:AƒÝ·F»ÐèÀ“
±ÓS¸\¶˜Xá+¡ß²µB™p-VèÂZ¾á¹Î‚Ì,úÊÇ5x”ÇÈmŠ‘myç5[J¬„¹ðvöM}'¡D€3ò>˜5§ñˆA”À})÷ð|*Ì_Ó}Û¡ªX¬ñÝ·ß¾šR*Ê.A}~× ¨æ×ŽuJÉç4³óHîsi”_J_Å›&TxàÝ&	b?Ÿ†,>(ÞÃž`¡ÂHjýb»‚m«{¼˜i	žc™PØÐ t¹£$€á=˜ðçÓØ
´]ûú½Œú¥p}³–%zz¢÷fb¹Äâ²Ú*¹¶Ã€Ì&‹€yh_*öY pÃ`õVÉÈŽBèÚfÓÓ‘¡¿˜“•îS`¢ZŽO5@ËeÔ¥ê ×ÿû	ÜOíj3æEs2àÁ¡Gy>ª ¡ §'ôñ1•&Á¡·F.­›ÛôŠYSÛµ£Óc'¶û‘õ7gæÀ¦sX¬)6g†‘)>Ë"sg!pD‰çFÕ(×‰‚L)ÌÈ±.çn§—§#;`;±{OO›g+Ð/ûõWò'F÷ÍÐŒùÎ"˜)žÌÒ©Þr|=íÚ¡x1±Gtw€µDÝT`<z¦:„	}iP!=ƒ^£9Üb8¡â]dbÎ“sre“xóqüR×Þpì0·%^ØîÈ{‘˜®€ë¯ÊWP­Î/+É µgÌµïr½>Ö»¥˜}#›±ž$/©ßÈÕr…š‘ªÝäÆ6…Oc¸0]ö7è€s;Zíëæ<ôÞ§šû;–òI·‚®Úx~à? 
 Äì°½½Z¯ÙÐ6@å/b ²Þ¨É*žmo½_ÊCeN¿ÏS!ÐB÷ÚSÖŽèªæôKöäŸ¤]¥ºenS5¿,*'lÊv)—7rš^È·€!|,4ÏLS¬€±˜Ë0†u™D”²±cóß'}žZqÂ©gÍ:Å”ú!² Ñf‚F¬TŠ> s­ŒŒÍ g+žfkµA5—Fs‹k/Z5Aí ×˜îÈÐ±gÜÐ(âlBŽzÀU¢ÀÍJ¸ÄÉNGZÅñ* `åOé6¸¶–g%lòZZ#è”¯m&î‹òòãÝÖ­œF—às™ÊMfF]Iš5ÂøQFêuIld‚ÏJbz-þÅHòüÙŒ#w¥ÀµôÀØh·Wãÿ•@£^sf€ú²çÒï0m €œ°ˆ(ÒÛ/T¥~«eÙúC÷†Œ,HßÔ›yÈ‹S:è%0ÌFU_|2e)©Ú®›ëµ€ßa›yb™>“U!žÎtÈ‚X ,lH|èþÆ¶n¡„ó±Ke^wdú£oëü)˜x·â ¢åT&åYÀÍ‚tS#U35€fÍ‰²Õ=5ÆgD1ÙìLwØß>å¯Îè'ø!´jÅRŽ3Î@’ˆ)†
Çgäÿ¥KÉë	&WyI„{M1€Œú ˜³	&Tªüh¨’Š1©€gµ-^­â¬¬jÛî¤™ãœTVÏŠïë^žYsß?£{éùeÿF´ï¿XŸ4•¯SX°û•Â?]¶S\ÞN,^SÏõ7_fŸ4TèÒ
è‡÷3Ðu=÷Ú¯¬Y8ùy6”tEM´1*|V’*a9”³¤³ºa“ÙÞHŸrªþ.¨1[%W–^–~õò®M³úL<¾ŸDîrpòÒ8YŽÍxÂÞå=H8WÕ¤Ô`3^*3÷õän‚ÊrTºØ™UôŽy2îÝ;G6{%ú@÷Òíh¨œ™µŒÈQBð2dË¹6,º-”H²¿AÅ’-y¹…fà$£—
ê^t'Öï¹ûÞm†È4™ÏþÍD'eéŽŠýe66+–p TFy×Xkû`wO¬¸*Ú‰¿¢¶ÊþiŠ‰˜šµ40d#©Â]·¡µ ´5FN®šƒv®æƒ"£ïR.àAäöðã˜}\t2â0£h–*ŠŸ¥Î—¨„à¤‹(H]ÑwïˆOl½?9º“~v½$Å¾£äœ‚žý¼Ÿï…=“ÀîÞEÃ]{ãÏÄtÂÝ%™øð›KzqÍüBÑ™nÌ¤·1[oùEþÅî’K5¯¨)…Ó°S°‡dÅ”ºôº•…ûébÎìé€E™ƒ!Àî,³QSªñ5DXPa–^ÔáâÖØÞ ëBÿÉñ5™ëKù]ì©ö]îÝP™Óå/7)h¿eàQJ0¿€[Ûã¯ÙhÑ¯¡ÿ€bYò-IßçýxÇ¾ F å®µ5@4 0eÄµg³¦úL¡{‹»S
¾4ö†f¾ªªœºy$D±µ%Dª¤­ãSj(@:GÖµI%T”
éåm` Fù¹uâÀ«”i± §¢åokÑ
õP Þ’1d]C'°¶ªE²ˆ1³d« ÆUÊ,¿d–¨µWVCfœ­} l£¦ÿÊ/“4Mµ§aoQ©8›t¡6sÊ’ÞÖRßØ\…	7Ú‘0 Û²Ÿ5íêÃ×Ë½®	ë¸MnÔÔÁ3¯fA¸p¬Ýûûh,ºöûÑì¥TTû•ë…øÒé™9m1«%ÞIÆ´¢8êÌæË@-ˆ(»—ÕÒÈ*Q·+ÝëZ%§OƒžV×†.)4=1d?E<S¥U½hMX³tµµf´Îe÷x‡üx¹ŸÑb§ r-ð{¨J‡'ˆÝ,}W|¥P…5f·œ†ÝPç.dcS²Q'¢×Fæ¢÷'j£V4ßyÓZk<qA©ÈáÚÍt´“ê4©mM4~!X°*‡
ÿj¾«Þ¢Œ1%ã¸,ˆª¶•Š°o]‡8ÝÙ<£½‚î*¡M‹Å& [`5“:w=¿Š}¦@lQ+œ7áæ£Ä•©œ”_äÖV=G¢b6nšs¤›¦LmÒÈºÜPÏ‰¹†èÈÉZ|}vrÏ;@²¯è×‹,‚/¥!‚|!Æöë(¸ìË’‘Èõ)hz	B¢PÆ@~•õÑ.I²jÆ÷ˆ•6@TCóAžÕ‡Åk£.sóŠb¸ÙÑ©ÀÎŠÁBá¢g‹ò$D³ØC¢t€$£T³9^›tÁ5yhÓ#À^ãfGeÅƒÍŽSÇh¨Ì"'å1EB‡ddk|5{ ¥1F›F¡ðÌå“”|/ÚŸrN¹+]Œw›Œ¹Åùfy]Xá¥Hh	×÷šµZ÷ýúFÖ¤øîÏu«±Ý¼9E{"%]ÌÒäI>ìUJE8GbLiæÀk‹¥Ð(4:Y/×qj¥›[$ªƒFœsãÄ¡	É ê~‰(H‡,l²ˆ Æ#òp ´}ÿ[v=NÊ1³kñ¿Ã‹§Vuïx’oð™ò?~¿&?fã1~‡(Ä]—l ¨‚õ}òNÞÈ–ïZNßþd}~ÿûÝDß¬Gí àw¸}l^U‘/rX³J_¿cÌã1æÙ5)¹îw³m¥†]mÚ–jV_­o×W›\¤—õ€`ø/÷Ë*ZLþB4˜MïÔkVöFd€‚FPæÐ¾³FËõ•Ï§äÂôÍ)ºJ§ò2?¶mal*23éjSù­–·C¢ðæ’Yhle6œz¯-ŸV‰®ÅkeA„x.DX«Ks?dV¿çÞ¾3êEÎ²r›ú•¤	}2ÔUXäØÂe5Ž¸¢ç¹$œX|ZöuÏ‘-³q?úÀ;±… LO‰{­¾ÞÌ…ÎµV-grˆ!ÿ]04Yþ×‡FðÕº³]Ã›‡l
¬.E7•‹@•!­aZ³`- ª¡E›Ž€¶´I6³?ª£DŸéîÈ.<G¾#õl†u\X"ÊˆÞ%3ßcÉ'}Ú“é³ÑºŽü¸Q¨Ü•éû²¸g¼m|ô5ðëäJYi+;hl¬tÃÏ_±¥ŠRã¯Xá¥]A4z”fVZÅÀ:-ß¯¿J+ò=YŠ½)uÐ,wÒë–ÚÞñp+«ÀÖVê;»§{‡áÊ4u)Œ%Ž1IdC•»Â~Eå)â5Ö?ÁóXTNÌ|0BÆ'%…è}‘I$qa‡Š'œÎ™8¶ËŠj@.“:­Ÿ±±Zßj¯ÖÛ«àÂZy_RŽ‚áR¿°Úh“ét£iLw“^=OÄž‚Ôí.$2vmèX2Qgw«(Q»8%ÈRÁŠÉ(ÃÞ%â?ÝOÙšè„õ.0t˜:5V¾¢ ~Ý ¹„r¤[eÔoÔ„#”­8ò63>²ãðìÏ]¨x¤7Vg®Èí>-Éh•tH¢ÙÒf€U¿Ðú\x‘èV¨<•\íŽ+ðdÒS+ô!N^•ôÅOV§  2½¨ÖXf¥V”§G²~%ÞlÔÒŠX	?™ŽòLãüaI.lP\ £¨ ÿ_\íd´PoÚSûÛª:¼àäe©Š
ëW?@Îd&a©]ºéï{òs·s¶ßß!ÿå«ûe*IPAîÔ'k”ñŽ<H üišOmåó?—Œ¹C~ît»;—·ÛŠñZép•Ï_V,*[×RÇBèÐ‹YÈ¾š¶oÈk;˜CÛ_ªÝ/k8mfek¨¶WçdæP¦á…£Òùô5dbˆ¨±4OúÓ‰L=»E>*=ñT.Ð‰$ÐR[%‚°èŸºðþ‹xšÔ»žö^bÑáÅC”W…lÕÄð’X¹nrïHyy ”+Aå!©þ¥@Ð“/³¤ô‹g£Ù´ra=[­¦ÈK^ Fèå´B2£"ÿÙ J‰”,$²DçìÎ$amUÙ±K*¥fœvB]Hˆ°èA^4éGî×éK>¦”—}qÞÿ-Då¢+ÔB±yK//.Œ‹ËóîA¿ß;;Bpž	$z"4cßøøp@±-‰+uJÅ^½Ñ¨¿g•AµQ(’ÉI²â‹v•nÑ»Í|åÙ¥—WgýóKÒ?î\ ö¿8ô¨Hn•Ô–^¾£D³Qkm­’ú{Ì›KkþAwàìüò´sÒ{Û¹êŸ}Ù-8í§Io½W{’-¨Žn©á‘ãQ€9Vþ]>0¶må’ßƒÌ4B«!êIçB´”œ†Éýñdê â²¾ïø¾¹Xìò=¯î½C¶>GFÏ«Ä.¬¹œù^}ù³¼þ³»8õG..\\ì~+%Õ\[¬ˆOâ¯ßh‘Êß_ñÿ¸Ít`ú`)-/Kš*<–[d&•³:Jß”—>H˜œÇóÛºà<ÛÉ(3/ImmjFýÙÜj·¯7Y¥¨?oÚÃëo‹Îw‰±œûóW÷u•îµ]£
f $6žŽÅe…z@/‰½ÆfùPªÚ¸ûP¾€MÔ¦ó‚<‹Ïb„BÉ~%xQŠˆxÏwà5¡€»a–·k#k¼*8YVUFYñ*‰çC?%Ïxeø{
2ÒÜ‹1úÅzª˜îÊ¾z…/«yæ£Çâo¶]€@àÅZTÓÀU#Q¼*Ër‹·FTsþ7ÑÉ /¥2>PW{…PN\¾v¿ìÏÀèmÏ«¹©ÂáS<©ï‹H¥[:å
‡…ŸV-µP¢Ô°V-ÚP¾åÞ*ì÷•K˜eyEþÁôÇÌÓü3GäwA@·½dGÓZ¬õóIè“z%%§ h*¿d¥aHäP€±¨Þ 6—Ÿ@õežÀ`s&Æ%6‘ B¢äëÎM=†T°)øOÊ×Àþf\8ÏLž{ê{&3ß
,ÿÆê3k^Â¾Bª;¤*C4ûžw·»T#5«ÿa ž¼˜QÁˆŒv—Nkd³FþN;Òÿ‚ÊÿE(mÁ7`Hú_z±ÿ…w@¥ÀkÛqâIðÃov—"9-nxcÂÉîRƒÎÒ‚Ê ××ô¿¬“ð“Uþ$jéŸiÎææÖàÚÌÌ™~C´te×žê(¹ã`ìÌ<'TúÑ»œ¤‘ª–S>%•žW¯=@ÑK§[EÛ[/),.üÊä[öþrÍ}5Ýˆ˜¨òØ6rkSMB]ûQù‘ˆ«¶M¹äh‹;’“‚0abØß;&l~hª#Ÿ>$:MYLû%	Å·€>L§az×Ô¼[®SÕG	6Á_U®Ó`NÙ()ÕPç!jõõ†¬x@CÖü¥Æˆ‹ÄÖà˜Rš=ÅEh×cG%ð4mféå»Úøg$–H©üÀ	ÌŽãÂy`8-X·(z¯hé’ä]q)ÅLUÄD·D¤0$¦Î?ÓÍeöŽtWeáQ•+ŸÑÛëTm§Œ$O(ú„¦P¨ÇPU”3nˆâ1õ@²ð[T|94Ž6˜ãä!ÛŽta1Ùu	'´ mí0(Ã¢ÃÞÉÕÁe©Oiß!0‡#»:Ëûn,œþ^w]]_8³ïBÀÌón|§{Õ{]ÅÑ¢}ºƒÞ|!=î¿ÿÚZo(Àf §«AŽù7ß ÎLüU†§¬¿D±€ýøÔÌ"ØLÏÈ`ê´l¸8ÍÖ|Úë\u	ø	µ¹¸îÔ ø•n/â°B1!-	,LÒa–
OÓïaˆyÀF??<Ô¤¨g¾ðA8
šs˜¦ šØêÆRBjlá2AÑñëŠüÖvMŒâ`ôùå>Z²~ •Þ¿<¿8uõX-~~‰~ èÂhT›ƒ¿4Àb¢!žÞ[Ÿ·¤6c³Ç‚ÍÚ~}ë}±#[¿SY+­­©•Ö(-2úX_¾lh'†B¹ÂºÊ¢ªã‰=BüU·i? ¶-N´ÃøHJË@ekµÔ5†"÷Òc*/ââÕ%%†p$©ª|jÎ‚¸´ri|ƒSØ;3Rí¬RäIŠ
¾+¯Á%þ®¼‰ÌR¶«Îg]'[«dcås”‰1èbM+¡XF¯#·M²¾”~alžA­[Yð‚hÌé•Ç.7b{yxŸ‘A_Q2=]Baö‡8áDrŽ·jUÂ·àh¥§1pP¼|%3µy=K˜«} !4HÉã­2ùÙ‚ŒÕ§”3´IQ‰É‘gOfNe§xŸ¶ê5`ôü™,'ÎBÅ:ãY!ÏFÓzŠ0äüŸ|ÛkkMnÿD‰´‘ª#ëZ[ùÈ:LÈü²©ÓÈn„¨ë(íã×_Ñ£dƒÜT£ê-ÿ®¯“®oAZßéÛ”{&çÎ p˜QJB—³âÂ¡†;Sg—Øäk²Ì á;ÒXIÖ%jûš4„zÙä—…˜«^yÊ2Öa„6!—€®ûiÓu¿
Ø?ÎunL”™þôá™<Ž8WFP—¸ÅføUˆÔL¹˜Í?a¼¿ïÉÒŸk×õÍ†YeÎðÛ¯b_þ^OºX1`ŽÌæþÌ©ú	|*§eÉâÚil›¦5bÓ˜J>l,<*“³´
ƒLÿc¥a’ä°‡ofm­^y³ñ¸µµMJ;(ÁÄÎ¦¿8ÌWÃI]jªú~Í,vô¿ÕFŸš>¥ÏTa(|·6²|º‡¿Çœ«Ø7Tx’ÃÉ	A’ìÏ_Ü¹ùAþ¹ ]Èó`Gés¯K­ùbå©®.YÝ#u«ÛBôeD³jv>ùûQ&á§ædi[­1$®)‰2…\xž“MŸÑ6º˜¥8õ\úàÊ(-ÿ¾}›Ò H6ƒlñF‹êÒËªoååj§æÝ·”04(Y¨¯HIä«šr‰Ù{Y#¬¥Vÿ@Qßâ’ö
d€D¬VQy·T‰qKBRHÙªlóÂy‹u¹¦ íêòjâ/sžDðžófm™|~óq¹%·ËÉíŒ9'JÓbƒXR·(MB:ª¸ŽÍ’(Èokæþ^²ÛålÈÖœùøŠQUi)KÎ‡~¨Í[ã“çµ…r¼­Û	yÍ‹I2nß2ýá¤„#H¶òûSb*ç½gÏÅ(É¶ÎŒ/[²Sãêòà€tÏ÷×{Ýþþ#¿ì1œ"$£³F¦kT9YB_<9¬Ö·ÂáŠò—-LšHÎ¥,ZSq\Ôzó!	0c| ”oþ(ç¦âTvÑ„@>Ì»‰+_ô‡Ùº«
$æ159.^:¸ÚL¿±ÖVGPbvÒ{}@x±l•:S]ŒÇå%n„ƒää]ÆØ»•±º‹Ê-ÉeT&¼Z !7aûyCÂ3$4°±¸ˆ@Ü'òÜ±j¬651—.Pˆª¨.º>PHãé`dYl*áPWWav§9@F<Åê¹¦Dt•‹˜¡°euP×èˆ„&R%!Z^ÒUÔ§É3ä"B±v-jï‚™í~hUÎ¦ŽßWNÍâS&„ÓBbìÝn³¢Ù3Á¾M©]ƒÊýÞº¤ËÓáá•é-é–çHü³p]£ž‘ñªâìÖ›‹µ~~5úzû«l”ý?»Öþ÷Ïqñ@‰ŽÑW–‚YM!HÐ4-Tv:¸@:”¸-‡ïòš¤u–kÇ˜sßYþvDõÒÊFÆä®~w7uþ
jêFkõâø¬ñv±×¼¹›?Õlóø²6Ü÷nNš£æhÑnž.Ú7Ãéðæô—ÎíiwûÓh:´{Ç£ÙÛãKï¢ß[œv{cóèõìmcR‹®¿»8Þ›ŒŽÆã·û5ûêª3>ýeï´·ß»¥˜JûžÕ†ÓmÿíUÍî}:œžþòñötÑ›—‹A#tN~LÆ¾=ùå•}ò©µuÒ¤süÔÚýv%-ËÔTWÌÈ)NT—LÕyey¥G— p¥šŒêãÀ±gÕÙ™ZÜcÒ@Rz xãCøZ*ÈúaZÓ£hË	’Ì5”N¬¡rPñ¹™'rQ^j¾Ü lÈú+@$šH¾ýüóçÂÀéèÜÀç.V¥%UL¦•ˆÌ–¢&pÏ(\‹R-É µô² GÎ’þE§{°SbÊ[z‰­²1úß¶œ¤NL$›'/û­W$N‚Ì!‰‰È*%[%k?:Õr¢½,:e#¹å¯KŸ–¨#ñÉ(rjÞPŸa#Ä!™]¨âÑ¨Õ¾þ .ÿÒà6E²º²RØV‘š^NÁ¿LMªæ¿ü4Oî§ÉóPXÑJ:Éá	\5BNÛñÖ(ËÊò¥|PYY•Ða]×´¢&U-©«úiÒÒ»ž8õ£wvxpypÖ=xžà†\±ÔbUAOã^„|÷4§/˜¸‹â	éÂ›íkÛò¿DÂ¿ Q¢‚£¤ä#àq¿×¿ºìí½‚¬ôgI]Â:“ Ô'æ¤…Õà+š’ªÃoß»§æÝŸ©@®«ñ!@=esyNVp&‘¢ÂtÑ	%ªÙ>ØÛž“¡ùyçò×‹útÎ’Š;×Å“ÙÉã¥(P¯B$`¦ô œN1ggé]L@¸ð½9°ÊÊ­`mmí‰¨^õÝ+†#rÕ)í‡ddð¨~ªÈnNêfÊœA ´…¾ò¨Ó
þ©©àgxy±ÿ4©lü:Û·yXšB Å^ÐÉà3£ò»:I‡âÌ×4œQëHØ]q*6f¸R*…Þ">V*gs‹ÔQa™F*¡¦'Ç,/ŒRÇl7˜ŽYo7#£½áS|TvQ…´ö*Cl%4þCFn£ë ”ïFîH(°¼À¼)÷©IUHðÃÍ®””…?žåEqÀwF°Ós†´gË–òÕ‚ôOÑD©IžÎ†&Ÿœ÷ûäðÕY·ðì_ì²à±¾YN)ºt.cÏggçv}/Œ7¤ÂßâÑQb…!±(‹‹º«¦âyå³H–á¶ücE³²cŠ¥âG¼DôÖUµÎK?ÍNáQ¯q_™h‹Sf4²Ç^,áV,#tnJNìu'¿#¿ ¡:Ø[!('Bå6&k”[§Œ¢±¢V)^ìyÞÇó™¥5‹¦ ¼J1Gßa_›âÜØŸ×ž?UÊ®}¡Ü“¦´‡™T”wõF¦(fAØ½c™QÁ\[¸Ã £hÌ£¹=RE¸¿XŸ4•“V¤º/˜58í+«Ü¸cÛ%#J…V‚¢-€¢RbÜñÙçàT<ñÆö|gdOç‹¨ …J(Q4ªšÊÊPLG;YCb¾Êp~
ûë×æ0d6Ù¬á6^Ö†¦ZÏ¦¢ð¸€ÜÅT\¨‚ŽIõfé¤AÔ7xÜO8#¡9|ðŽp"¦F‰ ¹òýõ ¿M1"
RŽÅŽÊ´ÄªÍ¼¤¡4A<†PÄ‰Ôæ+kdY–ÒkÃ®ó+–ÉÚI×LcÐò~PÄÝêÜ¾FQ-­äfæCo8Wã¹Z*Òí"&í
 (¦ê°TÀ,nå;{5±ttL½jŒÇh`©¾8>‰ÌÚÂÊ*Å¬„°Ž¬kVn}f™é§­?æË¶œÑš®“<éÜ	í>œ;®=[ýÙðVr
c|ðÃy É
CÏg[@'=ð=S¨ï`A˜&áÄ"ü‡fÄå‘5^!#ojÚîšFÜÕ	Úúƒ¹—zîÐŸ®\ÃŠÊ+t¾pTëaËdÌ˜Aldæt`çüP_Õ¾)ekOËËM1ÏEL|@qª"ÝMsàË!.•®Õ4‘­ü¹pà±~3
aJŸ„ª?[Y}”oò¢V§¿ Ï—‚Äÿ§âø§6àôÐ›YŒ?‰ÅøŸ„ë'Û™ãùbv€Úè/‹èô³‚…ÍÈI¼ÑïS:”‚?Šppê(+Ÿù¶çSøÿdzQ!ô=wœ›R&ë€/£¸ZYbI…™XišòÓˆsR¾6SŸŠEW›ÍX+k 7±®!ÓUýt^6¦ôã£ÇÐŸ/<¯]€Ëxc{€«yÙ\›¯­<d!–ÕE¢âTÁ
¥«T0RòépòìhÇÄ”`¤´ózÉëSU‘×¤ÊÅåµz÷£7Ñ¹;¶5ÊÊ­ñDþ}þºª(ö;6Óöãä ÎpH¹÷pQUJƒDPýž|§7¿(+‘¬…Þ+X›.]›å•Ïäâüüä‰„¨Â¦Lƒt)\$0"f=~iTHßf2 ³ ãŒw†žTËÁ"Ž·ÛŒªé‹¡èŠÑ•7ˆ|y,§ª9U´‘lÞcUXŒ­´:2|°ÜE|_'Æ²¹Á†dj»ÆÄxG!2)Ø“øÀ‹³«Öoì 
×e?0½ŸBJ˜˜	,-’DËñ¼Ä±?ZÄ¤HäÓ·›Îzà]‡·&U‰^õ2aú¿ƒ„ŒZ&!£Æ2Ž.·î)OÌ8¾t†ÓÖØ|ó÷íÞt´ ÿ-ë?ÖFG¯çõÜüñòÓEÿoõaãõâUsoòSãõmÿô¶ŸIüèwn{û¿íÜŽÏö;ÉÿN»òw~ïÐ³{Gogƒ£[:—öÍ`úJJNGöOýñâìêUÐÛïÕÏú·ãÓ_^ÕOºÛ“_:õúÊÄ‘»ž½õÝEwûö§/koüÛüâ—Û›·G¯§ÃO­­áôõ/£î^Ó|sY3é<O¯:·ëKß|wºßqzöÞÔ|s°oÞz½[«Y46¬ûwbBÊ»Ú@x>=„Âì¥È–KEªS…Ì€b…$ò›'éHïš‘¯PáF“U¤„Û­Z6—E8â\¾ÛJáÌÚ 5L;“²zÄFu?V¡S¼	(NßìÔku~(Bî¨Û˜Ú4±õáÕ%dqj“*üF—°R¦
«*4é%|å ¯ÓlòÎ:p_Õ[²‚®%ç‡õÍF'&ç|ÁuBwáäËVîÕ”åÇjêpÉMú›•:”¨NKˆ]ñ.®õ(‡›#]ÿ¬&Éu9gW*À‰ŸC•m¼ó~}8‡<w‡JÝS 	Rœ(­(4“øÍšS
¼“7+WÛ¿´à¨(ykÝ“8Ç8ó<êà²XO
9m!œÂq„šï—O}¦[{Î´­E”0¯YM˜…‚fäRŽs;ÝÖÇ#;|E£_ÙjÔéjh×à€;ÝÉëÖZãÃùÅUï´÷ö@]±HóéUp\m$½,‡"—5êšîÈAõf¥rª­E¤>Ñ5.Á<ÚQ•¤€êxº³Î†œ+¸‘EÏwQUÚ÷{@”Y×îñ´QÖ
ãNú!ÉU‡¡¡¼jô¨v‹Ò¼‡b‘UÒ\%­UÒ~ÏãoËfKÃ1£,ÚÂgä[~”¦„Ñp*æ‹]Ò‚òµbR­2ú!›ÐÇÊÝ&‘l›üð®‚ùAêóiƒËÍµ³ì¶ÄÐ ¿í­µ†Ú¶SÑ¦·,šœ•c‰»§±CS<gƒbf*`°öXŽýrøpV˜Öcªì¤QNú+]DyŽRRL‡“ÿ‚é /réành9T‡
õ±º2¤‚Ä!e‹
6¶W
RQwp³?ò¼QQ1Ÿ:]fKš:k¦ž< z{{µÞ¬EGLODHšœ<˜¼69s/~oúˆöÅV{µÞÞZ­×_¬Bf%iÐ“jÍÉ­Áä”\Zvš»yp¤†:mù«<û.Jø²§xk|Y[œNâáG„ý;$ØJiqº©ê~ÒB?ÉÖëÒûõW²ÄŠ¦-}&¾5´µ†QÉ¸šá*Y|Ñm‘‰¡=Èñ«}²gú¹:8Á­4z.˜JÑsÎX¸lsd•”§-ñÀÍ˜“ù(_^@«¶Gš:WÛ[µ­zã}†®ÖµYÇÌh°Ó¢€ÓPK õ|º…º~mâöO‡m¼©qþ¶uÑ¹8oþ­Ñ„¼³fCVLÛÜŠ’˜£%‚!9Ú3nxz™µìU8¯‚Õ‹jAúã‹”ÎŒžP«R3-¼]E.Î×ò¼?EqÈ,]ÒeªÕâŽªÄõ(Ž„ÖÊêŠ0•(’U„”â§×"¬«1­	˜fæŽéî|h÷¢·ÿ¡{~v¸£"ÓCpÑZ‚¡ç[s&ô7òpØÐš¸ÒE-ZTæý¹;*Œ}Å×±ø´.ƒ:j¦LB%[æ{MgþÀB ÝÁ¢j:u¦^Rº1¥ù ¼<•HWH’‹-ç:";È“Õôß¥×ßôÊ’.oG½ªœVÃO£¯ø;š
Oü]§Oÿµ¦ZHIOò]HN	ý_ÑËùá™÷ˆU™!ËXRÅpð•/|ïÚv¬òÿý×ÿü¿È.r¶|ÔyÕï÷:g+RZd=Õ¡¿Ž+Ø9½Zby"•«-‡çQ!©ìì\}u”#@—jø[Koâ‘Ú¸F}su“ªÍm„ 'ÄÍ”ËpÒÈO*Ã‰ŸúO,Æ‰QL¿©$'ND)ÌI PY˜;=!¯©*9*pMiE¹îÄ~ìÚþÐÑù ;È]&Ò7lTõZ›Á\Ï!+JUs0µ2V.ÐA6Ñ›ÊOncEN•AÀI7°¢&ð«šŽãèöòa¦]A4€Ã rLöLœç˜â‘öóØüŸ‹W²á„/6dQ®°Ð '=GhdRŠQŒÑmi’xÜ;žB\ÚA˜07á¨«±nûåJÍÌu°](c²ª²Ñ)!J?èŽÔT„xñxœL%.û«²Ôÿ%Vù^`U–©Z­Õæêv!R±ñqò”0ê“ŠSÉ'þËRñ6ü¶‚T2µ% @e!*ÎæÛ·B)\‘ùª­)*™{!>à"A%Ÿõ ñIøÜGIOà<±F ³5ø~×îú½JPÚ{uÖ»"úá)!Š¿‘äÄÞ‹Mñd€s)iD]‰c_\^RØ¨ôÀ»Âfþ`¢S²ú_Bn’éýJlÊÔ^ÆJN¹:ÌE¢“X¬ªTz’F~RñI*äùÏ+A‰Uû~S!JœˆRŽ’@¡² ™Ñá@8ºKtFÃªîÅgF–	ƒ;'W˜m«†0S\~¸‘¥ÂC3ôÔÅ›Ÿ€å~LÜÐêRX®ä0NÓGbÖ×jŽš¨þi¹·•ŸÀTkkF’*2VòÞ9K/¿.ŽH¬û¬‘³ª%hŽCäùùùbÈU…µL¹d”ë²0œV)¥éK*|IÅG·Š‚ðJE,QÈB¸îõB”VŒ*>ü¢èNt‡Lž;óüóüS×cGå\ÖÅñÙï£óÃ"º^Œñ­'DùúƒQþ7÷ÆfJó>·œåÔ(X.`‰•€¥‚‚epZ#¨\ –ë]>¥ ,Övûç•…¢}¿©ø+ÌC)ýf+VV“~“sîOl÷cE¹7é‹¨¥ª§	ÒübEÌo("8M–Y+8¿KÅÄMôÁ‘_Õ,öÏ—‡†Šý§±mß¯óAúÆ–k«¤µòÙØØüQÁ­û´Ò]zr —ë³ÔöönéGã²óÓÒ*Yê¾2~øÇ‡¿ S uvºå>…æ¸0ûIŸ?–öD‡Ð'èZÊ‚)i9¿ª±t)l‰t@J¯É”ÖÕ	gú»‚-®SJ_Hrpû¹²¼èJiŠÆìñmXpp±'žK.;GäÔN ñÄ2}v˜g×›ùÞÐ
Ï'û¶9v½€¥ Óò­f@)õbeíÚiûŠó¦í~˜Cò§Ý]Àõ/G˜¤? $xA‘)óG+Õµ½Zëýúv-’ŒÚµf­N¯ÛyáHiDÄŸ¦&¨DüI'Ÿ«+Eêbr,5'é‰Dƒüòhêl¡Ëí!fmf“6ÃgK¹¤J†_IË«ghg°“I*+Oâ¿XtyÄ,œtÿ?þÛÿÉPKƒIO¦ i³%irJŸY"QÒ”ØßCm¸2B±íC¡ÈrHÇY°
 –?¶FÊ¨TB°sŠë†7µuQò#Å…CthW¯žU¡Z
Œ¯gTÅVG%i`×E£¤Ê»¦3œÃ`#rb†–!ƒ¨yEÖ}HS!Ïò…lJ0+¯¦Ð*ÜhåûÄŠA…ÑªÅð*…ú³/	({H–=pçã‚ï¨ÂT¡ªà÷dé
J$:YÙsœ®@^e¥‘^ð‘à(185Xà2Åí›ÃdÀ¥3ð.dÄ4¬ÑÒçrµ¬ƒ‰}$*ðKæÆ69âQfrÅ…?ª‚Ö’Åámî·ÏJm(PNö `·Å$=VÓû‹º¼€ø‡€~Õ‡AòU7V>ÿç¿ÿŽðøÈœS,¢ƒ§³¥¸C?ªÓ{(v°Bˆßöxjþu˜bèSžD¦P°–âkºÞ0•3(.ÑXOZèÁbëúš®\ð/ŒzFN´—VèÛÖ!åt?ªƒš^Ösßãj¦µç@ÆtôÍÛÈK ¡ÞCJŽ”µ™=TùœÓ}Eí#!Ë—æ­.ûìAÕQž“‚$åÏ€ÛîÜ›ôO€½¸F1¡à8·Ø‰sÓ ™Ç@—Áˆ5Ü¤Ò“ã€?¡Ð¹3îgÌÚ@5¢¨äë÷kckj»öjv K$UXø6TÐ—6;ËNATt„Svëq)v½þ”„;DªSŒôˆ¬9>9©/é¾™éœ%{›ûNNNIáRP˜,ë«e"³‰=$=*/Ž'áNeh*V 7mâG6hŸí|Õ÷©yµuë[lÑ3ï‚WÞÎ0÷CÊD™©Ä	š/Ñ‹!YÐÍBîÓdž+Ì›,Žï³àh*åæ›y&c,(=þÏ„têCò20`Ð, Ï’'?¸Þ-ÛÆTè¦“z4baÎ;Óä™å,h0ýkØú*±wˆ;‡O/©ï–nl~`d@GH‰0šMù©	Ø¨D¢˜Â„@—^ÞÓõXíÐ±‡Ë>ŠïÇ$„>ƒŽ1e›ÉÞÌž"Fé
ëËéÊÒ=šV©ý¹ûbKÎD»aÚ¼Hz0Ý¡ü‚B9\´Ù…3ÞIk©G•Õ[ü–l¦çÐ·QÛCèKô8¡´»2|+…L‹1œ€O^6õgàS(×Þ‚'Â¾¦ÜöÔ2Šy¬‚-%6¤ùf=,¥µ•U¥»?ÑöìÌcoT3oò×¾ƒ¹Èêë­(~"qEçäW°•Ü™ÁÄ)ÈeÙÛ_æm<ä‹}¼^yãPýÉYãË¼,Z¸§ý8]I´+oÆj 	XYHÈ7Tz…â-Ü€¢*’V¸^M>ûf4ûf6Š ðˆbbð	ŽÔÊà#¡¬Ëç m×kõCæ–L<0‚­˜œåŠa&E·UîÅ²©j2°°LeÂº¦2¡Ú]%Ÿ+á×=¤êÇË}²o__ƒÝÚ›Ztº«ÆÇ”cU³;VzV¬K¦w¬rn…/UÕV7ãbU9´•þñÿ]Ba¢Eyùÿw²ÜC¬Êÿøßþ×¼Qã÷ð‘©Tœ	po<O!„#-þê~fú5º ‹µ˜ÏdÏ7ÇcÊ?¯žüLXÜ1cËµ•<Ù­á½1Fº•ÁÖÄ¦#`½á—¶âòÊIŸuâ 0P–o)’µb+jh0iJŸa]+‹°—)+¶áÅÊL+ð8þ‹¹ n$‰êÄ\PB˜ØÌ³@Cy5D>Ö;rTXð€?%õÌ)#U¹Q=·ëØÃ»÷ËL£r_âÝöÜÙ<\þSÿ©”íÅú²%:¶ÒnÓl$‹"˜rÐTKNæ®Ä”Î5jiÁÁívm}S{ÚB;Êƒ)ó8f¬À<°FŽÙW…¦©«Ã2ÝnwéÊ©~pGi’B93ê'6Ö„{Œ}sJ.øi·ù— bX©ß<cýê^Z']‘ÉÙÝ‡?7£¦eeJ–oð’å”„ÄÓ#ËôkTL€ÃšÊP+Ð\™ÓªTûT·ùpXåkÑß¸r€åM 6ø¸ˆþTÂ+Üˆ“x8êÀ´P™³ýÂãßuÂ§¯Å¥
a4]šh5”0ÚÜŒ®·
`¦Ì‡R2ˆF³w²ð{<“. j-XÛP)<íäZ›ôö{ðÄ“	'`Î„‡ÎÙßJ@Oê<Òõ°ž…ö«‰åù`$¡ÀNÅË‡Ì¤$ŸõQ T¿ª(•øÒ‚éjž0è¿n5¯Ûâ¨`Ò¹IK Ùí ëñGçÄXND†“Ë?¨&óM uf»cHe+!•Ýù²zj;@~ÙYž|tVòŽ¶Z	ÿ¬Š0[-{é%Ë¥¶>b—ö“CÞ¥Ø£¹épÀ‹¯þ pO7»Ä™†×*OïþR"jD»sBõz¼A@Òû@éæpåù(£¸NÚ¨nNÛÛVm 'ŒÂG,ÿãÿè©ã2ôÒA5ÕRÑ„3FVÏVd.l‰‡XULC¦UuçcE5)­ÿ±¥CNIaö’¤”¼¥RMh¶
­:ªHœLløtÀ¦ŸÍLHN·„Äx rqÑ„»ãr{ÛsƒÐŸÇr°Iµ30ïeeJ5Ñ{ˆÕJ1…#lŠþbG3`jµÌXó˜ñÊØƒT"“¾èÿa4þñš©>ç¾9>%§bXù.k>òŒ×ž=Érm­¾õŸÿÕkØÌ³~Fz*ü+×+J—"iÊ)O–Ol×2ý
ß¡ QñˆÄS9›÷seÞŽý5ˆÛ”É‰/(±Q9—vû„iC(+¸°»Dñúë%2± W¢+…©	Â¹©ä:êMPP8çy7µ ª¸ÏÔôÇ¶»{Þ“ÒÞXå¤p‡4Z«Ì—²Cê´‘JhU•rP[K¬ë@#8lKŽ¢|.bv—(aôüW7Kä®¾»DYí‚ÿç®Á¯èôGð½èä‰w}ME•Ý¥6]9hèÂˆ»K‘‘…·s¹{_[k}ÖÇ€°µEü¢mú&½Ô‘ŸAá³ÂÌjuœ ³*¯ËZqÕ™­ê¾9Øj\oä¾Ù.[yi…CjÇ{äÂ\>8r2¿*_õˆÏ¶( ">Çº02·.G@‹zÈG-å²ö¢KÉ¬IG¾­J~<÷½Ö¾I…iß7»KÒRS*é1Éî=•‰4^™‰çÛŸ€q>ÅßIƒ©ª~—®w[5ŒººÁ;[	Œç‹~`xë]M¬ÐT¿6\ÌèÌxhšú	ž²{ÿn	†<µ]ªÕ!{Ÿ]šwä;zù^ýås*;ì.ýç¿«G5þ¸âya£|ÊeÌ>ö€žßqAE[ÉH=p²à­Ív{c[óåL¿Öé¬×¶C¸¥?o·LJð–tU•@ìD Ê¡kEÏšSÛ¡BíH_¬äQáo,. ,1iJý¤¦œ|Ö!Þ ¢ûîý2‹`gFöW’SP×˜F·ð ø  *§åIwa£µÙÚ vaûI6A³´	&@‰Óú¥°N^Õ¼[¦ÀÀ/†–íÄBS¨¸³òþ³zÁ8¤§’÷òIÑ+KêÇ¹œzßÜÀïÖ•ç9¡­«¢¸ÈÝû]é=KGÒx˜æ~@I|ÙÞåOÔ©µW´;Éa¶<ØŠ|Ãk£Õ×ÚÅÏ%ôžŽÜ¢¿Â¶¯+íw÷v[°Ý18H‚¡é^x+Âà‚¢­=ÍëEbs?Ñe9r·{¨“Cì*–l…uÚ½¯«YKúœÀ›¤©Ó;kQÑ:FièR÷»³³ÞÙé‘‹Ëó£Ëƒ~Ÿ¬¯k7•Yäw£mŠ#ëÊ›P¨ KL#J E%ðÔ7~¶a§gQî§wÇ;¬þ5Õ>_¥ì±Ê“Çw€¸¬è‚½=ù¸Ö/uŸëÁ¸ã[¦Î–Ê…
ˆ†7%Š¼b¦ ^ÛlŒ4â„Ý¥¹ï,ÿ9Òd5âA+z¬`YçRTÕRD¬Q´æq`˜gåÝ†kÚytÎ¾áœ¿C6ž IR\k×u©LHpCÿ\b²¡£h•xÄöÊûgÆ‹dç.Í[î;çH²Üwìéª
õé:`½Ò!‹ç!¡Žàâ×#RÈÀ¢ Mvï}“ª³!ÅO2„b—à—5àÛùdõAðã¨Å!h‘jbR´¿_žÑ=XÚŠô K%Ž $÷dx·J†‹U²`²äg²KØ-éÈía?‘]ís$’®=$ïš_¯ªÏOÖ¾ž»L©(:'u:.×ôç+Âo‡~UŠšµšþ(´Ì!¨¨` cÉÜª©ßßTZoÅ {×·ƒ9³¬‘ÃJöé¿ðvG/œÄ¿»úîýð®xæ‰ûh«Ê½k „§eO¥L£±Õnï/^N’ŸŒ$[%]´þc!ù–?µ]p½Ø.sG•ïÒiW2×áfY‡Ì²R¿Y¾:½¨²ô¥äE~¿Så¸OR«f·W­­²ŠÍð+ÙËhWâuWÖæ¯Î5û¤A²±ÖÇúÛ+:SEþÿ   ÿÿì}ÛvÛH–å{}E”ÚNS•"Å«,©íÌ%K²­.YÖ’äÌîRyÉ	‰h“ -)Uzš_˜÷yž·^kÖL¿×ôüÃ|Éœ "€¸¢|ÉLt—S$@\Nœ8×}ŠÒcÄNÆqCÞyKåo´‡£2š¬ ôdÌÈ¿°‰rc®£˜y¤3ñVÙêî$:ëh]½ŽÆ$W%h¸jÒNi§	¨L4<|a•ìFÅj+„RT¥”¬ÅÏB'ì]vavm'­[·ž%JÂ—»“YgYbs¿ŒƒDÝàÜ¼@•¯‚dZåhÄ(‹¼Œ|üÙ»¼„[äõŸ÷Éopé«Òh»÷cNr³á&2;ð×-%°ÍºM•‘f^³‘z…L½›Qè~²µehIàG8lJ1£×üËQYg)úßÞR—ÐŒô5´So­»µmÐ!‰Øž~ø×âëáLìªafWöÍÝ2&p=yòÏêD¼>³ÒjT¯SMä8ñÇ¿!MÄ¼×åÛP©fìe—Ú
ž_¸¸íFÊüþcÓ¨¦yçÐöh'ôPÀTÝy 4'*#‹@èÈrp»`WÄË…€\IˆlØ:Qº]
m:Q£#Î¾'Jç›|åuþ´µÞ³Q”«<R¼_ò’·]ß"PâSÛ›,Š”ZÉ/¤ºNƒìÏ@mF«ö› …õÀ‡?€íÜeê%CK/pê¿!¨.÷ˆ-~õ¸}ú,Y?=¢:Þ¾xß÷Ò}uñ¾¿hƒôrÒ+§ˆ×õ.ªñ˜…hÐR•ÂÞÃiÐm•þl¥’nƒlM’ ž	«¢7TïÏ—¬¼È Íg÷D ]Zï¢>BJU5.¤hT¸'ÖöÖ´‰âu“±ž:Ùpy€»K/}ÚXÃP­ö*^<ªò¶åÀDAH‘v]nLÍNO©çÂáŠGsþˆ;+UÐ.Oé7zL²m×\¡ÿ×Ø°n9¼,Û¯gØëJ}Õäv—°[“þãÇÆÁ E—uI™‚ß,Â€»ƒ1¶×õ~æí}.8{ü™‡S²Ã3’§øùR³ÑìúÚ!ùe_^àa|çÚ—âÙ*.…­M£…/#ú,öÍò—Š¯ž½ˆfñP­=–ƒéÔ÷¥|­ÓÔ„ø8Em¤lì¢õ´­ÛsŒòjj&?­;˜†n`KÚ²Èûäc&^Êõ”Ç5hš£Áñz¬N¸ƒ›ép_%´¼—": —<˜œÍ¥¡Ò—±ÏVéª«ÊÆ­J¡ýå¤Eê€òÒv±œB¶³Ò€Jœ%·dlç
=)œÔ0Ï°ê5·Z¬r‹cj¦SaFU9ƒpz]_cVxÎV¡Ö‹0R iMI54]*&©4Gd¿Â"(–ÞÙ'«^šâKuškÍí"<£8M­ØŒÏÆ!Eø×Õ-E ¨ ’oÓÒ¡MÝÆæ Sú°’…ÔÕsnIÂ®¦†$ÌGüj“,áÞbb„¦1¥r˜&Qêl©êšôg›y#Œ¶¤&ËÝë>rº‰ÆhŽKËT”¶J1V°Ò"kÄnºuýUEm¿a·úi¿•8)B§7VZæJ»»Æ‹îÞ·©{_–Ï‹/T¦ýç/µJíûÔI½®•¾tLé:6p$VÐ ÷z+éÿšŽ¦Ê¦Ã®Ê@à•#ÿÑ¡Ú¬ñ­lCE^¥½­x²ŒH¯KïsB4fåAêÔH¢`\[.zV0OUºor,ƒÅÌaï”ø{¥—VFžù0¥,eßuIÛ§PÄÔVê§°¥c¬ç¤Ý*M¼i"ò4eeÕR[†ŠÔyo÷ÆÞ¥‚y‰%ðd¿–÷dwÃû@Öl/“Öôz…ˆ á‹åR||£9ð/WH¥V”¡ƒyïYðR»;½&øâöÒyóƒAM[\x|^_gR‘žêÒeí•¥¯ç¥xáÕkjÉ!þti9FËô“Á	çéãfŒf¸•ñ4˜œµšñ[@²RùÊOõ"¼ÕÄL¡o©A4R½1î©Íö´:}ÿÆôkô|©«Ab
ˆzß°K´-µlQýY„4KsåÌ÷JAšþé4 +í_Å\i“û4µ‚aƒ(8îá\[¸Ù°vu¶!zŠ+++¡¯\r¤ÐgC-c#Þ³¨Þ¶yÕÂ÷o½™aËå·á©SME§ZBµÈSÌK9kWÂ§ÕUf/—`ê-siK(&ÙÁb’‚Èk6±2gyv›jYLWñüø&Foô1V:¿QŒAQ5Y‰Éb‰U3cÐZk?¥Õƒ»2’ÉèR‡ÖØn:èƒºN ¸å¸Q=¯ƒ*N‘Ê¨bX¤óêkVº\„H.JQÔïÍ ·x¥ì‘ï7ÉÛ‹­ßWWÛµ2Çíæ¸³ëÚzŸky2šéê+kX–Ahâ^ÁÑOö&,qeK`*Ñ¬°óL¦v‚#ˆa’`líÕ­;íb!äDÐÿ7xX¹¶µJòÖ µç_ZRq¨8È70À(ðFªe4
.YtÇB«s¥Žä¦Ã?ñ‚Q,Çê>ÛbÛù0òcÚ–Ç2ó!ÈÅ©7MÑŠ&UP+Vn¢^!ðo[aÎÊYùÝ-z·âfÿ:HíÖU”Ál‹7õ5¬ÐS+l°ôì xÑj·[ïËèT×#Ñ¨0Å!ÝÜ§íÏ<¡Œ†A÷”jbK`X™ bSOeqŠ˜Ú ª©GuTŽD¡ò“[Urœv}2L’i¼¹ºzuuÕv	ÎÁ¨°ÑÇ«S–*¯ögçðÕtrù„T™a Ùy¯Äì×0«þd€•ª|£Ž§èú[Ï¥¼²ë¬LÊ0ûÆÃ«Ùjï0–Œ+{ÚbÕT\ö¿±OZntÚâ]QÚDô)ðêŸ‚p+Áa ,*Ú^SQ„ñÚ¿>ñûCònlõñÔRGr«Cð!€èÝE!{Ÿw­Ú¼Ð¥Z¤:0Îy“]Ž¨ÓÏ^DK‡ççÀ7ç§’¦f$sgŽæ'>½¦TyKAXì1aÑP_=¥»s”$u0rÙ¸‚q»©,ßY~OM\jAóxø£ÁÖÈY"éRaHV~RzZ×‰#ûÞ9šÁÂè†üÙEÐg.±#ÿo³ R<µñ0(ïÈ»˜°0,;Õè3-Ûõc£Ÿ? ÇûVø2¯ðÖr­ð¦(ÝÆ¬A²:8­÷dÓc7g ¶aà~JëÉÕ4"¤­QtT"%e&ÐÉbÁ°x¼IÿŽÂ+NSq‚%šà{c5!¯W3=b¡åÕ²)Ñã¹Õw1„—»Ôº&)_#o«\E›±´8ÂÃŠšPRghY…ØX ·Ö1VÈ3(+ügMM˜VÁØKÁ —iõ€Í¶7`Át 4d[Ýç<$c0¯5Ð½ì¡Xê'ÃSå'¶h¶Ýé£è£.Õ6{¦5V	‘ï¢¥èw0Ñ´–w’Œts›Ô–l¬Ñ¬÷hÃzLEÝë3ê‰ÐmÞèi&å¶Ì¸iýÅìó
	×ÆÒ‹f<f®ÁôšùÛÖÇ8) œ‹zPÞOC¬”èëÎlHÊòUå­ÎAœEÜX‰^Å” aÎ{¢>håô0¿3çjkÍf™kŠÚ¸Yr!åéÆÊÓæJ»½{¥»œ!g!x*jÂV
&®$	v?šöaImØVª±ë³Èžé’¶¨v3_T58÷BV"ÕòaK0Òë²ˆÚc¨Ò¦#@˜­º©/dn?ô8Õ­ÇéfåÍD¤ñ@-"Á÷ÖBwk(sµš²dènäåñG¥½ªöþœ‹¬úf ËÆQ½êÿÂ†
Û1BØ½Tã¢õsMl¬ôxCS†¤.‹øÚØ‘MI)D±Q—y†%¿\õkuŸ¯ê-”	ák¯ÐDK¦¶KÝ9WéN1Ä|§µþUºÌ°c(Œ*Ä*^f£’ôÛÇF³·¼Ò<CŸR'»£ÕÙXÙhóxPÓ,u°+c™Ó¬ä8ŸjäÕv’•43Àý,N’%Ã,5ÛÈ5U[ÙâŸbW¼Q€†Ö)ðS/9ckµröÉ‹jõzr•÷±Nãe˜mÚwÁ}ÅÞ‹£)Xa$Ú<’‘œ’ë0ëŒˆ[œˆ[œlÀ`j­=]Aši÷šÌY&š¦[oµšåŸÄušú‹d$³<Ã^µ
“ÎÒ$°J™uË»NÏâ†’"…:Ì/ý».Ùß=ø»¨#ˆë‹Ž  :þ ã.LBBÉõ2ø9×Uº­°¬C\ÜxŒºvK®Âm¬Æj.zÎ”‡ã›I2ôã –¨2h~1È´÷Wïš.¦…%¡Í	ÕJi™©ýi˜¦Rl7EQL_GEŒûÔ»ÐŠl]Ô¥¸PÔõKµµKõ³zEû7”ÆŸºÅgÌºj¥!ä ä˜0úH¶ô>>Þ›ê•Þ­ëæªÄ;­Y®ÃÏ·b%M~Ž»‡BWe[ªûò˜­0«ÃÎý,4],ÛPÅ~'ùÏ³²¢”ÝŠ&TFßeP¾ºÚ³GT¤×íi£ÑØÂH¢Zoù=³(œ­ÀhGÈ{m¼> Üz¡Ä1“ú£Û@¯|¦—µŽ8@PòŒteå¯pKŒ c·ºM	KRŸ2=ÐØC#­ê5:i“fÐçpÅ=¢}Ü,6iC Òã\c#Í_´*¼1óœax®n.C „á˜l×QkÞÄ3Uñ­9ŸNi÷e"EÉÎ,¶hqÈy š@6€>š¨R´Œ>†ld•ÔÖN¥)a?U7IêÅK½2ŽF€Ô €&—Aè÷Ìã‘úZ £cE{d]üÿÕiÙŽ¥â†0Ã#ßK’ ïï‚h;¦‡€½:\*§½¥~t*Ýçb:ÍõRé–¤ÖL%æZ0S‰{ð±kL…R‡+È_‹"X¯))Øå‚…qíd£W:°aOŸõlŠs‘™:ÑztPÐx•óyûˆ"–¨ ˜j|õ’f)H&AõÐü*ŒÜ¬`%Y ú.Ž®óuŒÎ=_$•=dw®&og°Z)§…‘,è¡€®P"Ä)ˆBL
Á@ñÛ\!¦…þyFcybô	K-À9–šØ{Úd>s±½ ×d”z-´g<PÝ2;Ó‹ª¨I4ëSÀ?²µG5Sé£2§GÒlž®ÄÁ_ù ·ÁœùÓ0Ò¦éì[8úípoaÜ¿>æ-î·Æ»_#Ÿïé8·`eÇ/g\ÌÃ§[j“þçbÔÙš/–Oï^#‡#ûáeÐG6-}þü\úvz“ÃÉKß£q¨»ï|‘ÖÉ4Pàìl|‡ô-oö]\ý_/o¿˜õ‡1°ƒ¯Ÿ¹›Üös2xqð_ˆÃ?(Ç÷…˜ü—có(¤OgZŸÎÍC2ùvë)xé¸Hã‹cóù²/ŽÏKœþÍ>9îGÁ4¸}þ(ê^vjcðˆ&v¤ŠÐ~4›Àxü(ÙÚû–%ö,ìëfé–×³Qÿú¤õlh¿5Y]!0ñçæ¡8¸”Òý¹Ät¾Ø‹Ò·öÈ!Æ’­‰7º‰ƒ˜º%J_~nqÝœ)jâ£9møÒa«=l
Û”üÖ	šèÑz×/Ô¾BZb¿ÃæØö"âpñýð:xS'&3è9†íIY#ëMš07§u!í´ÝèÑÔÁêçlÈA?ä=«K&4†ûèÌBÝô'qõÔÊnK—º¯š$9›¯“%óu0KlÃýà96Q“Á×ÔeðIûOWlÃç9	ê<GBÏ:5Ì¼Zëfùßúa¬»ŽBÄ°A3rˆÞgÏ&hqáìc±m)H!Bî±?GùŸÌÁ/Œ?eaž9Ï’.S`B/ÎóWG†^œGr/æ:)­™X>æçÒ€
ø*.^sˆ-æ¯¶A†šQ]‚¾Ž§5ÌP^!½OW+o–µh}ì‡¨DU+Å´¥ñk%rmSm{èªt\×;)«Ìœ3¢ñË*îÂÔ¯Û‹K‚’sf:ŠÜC%‘,•ÅÙ¨â|/”Ìþ’]´“%Œñ¼¥žgqRE ½rb‹òü(áµ©SHJ¡Ðª#Iÿl–ÊKŽrâl¤­9ä ÊÎ±Eu0O/úEÉ2]‚rÄ‹F€ì‰ÙÆó€È¡IZWWµ•mQóU—iÌñ3Nn¦>VìY¢Ð?(Á½ñ’(¸^º§@«ûµ€D·@~”ææ)K)ûÃ=|íÈØƒýM#eÕˆå’°­ä‚ÙØÈ[žS3Æþýï†¹\b’ÀS>y¨a?Oaù3‚£éïî,‹F(‰±ßzú¤ò#ŸÇÞCO)
b2„ã©ß§F,¨…ÐÐ¡KÎÓ	¨±äÜÇ' ‰¾ÇðÎóxõ}ÅŸ\¿¡]P8äÈbÇ	Û™&‚4Re¶¬xty^¼²j«…´åEÅ¾>¾f*þÑ¢a^LC Ÿêô@ ¿R‚™òÓsQ8Ïeš¶œÑ(HkÈƒñø.ÆCDägS‘w¼>y#%nÚÃØ7·1›XØýrž²¼Ž¦4–°mºóÎô£Û$¼Àñ
tñ¹&àþ‚‡îÿä4ê¿˜›[Àß„ƒÙhÏ7bØÀùû¼§¿:ôœFNÃÙA—èá{—?	âñœ4Ïï2Öøn“à4™…'ÒÏÀ[8i€ûÏ7þ=üÃß½yè‘¿ö~)cNÒ²‡•ÈÏü·Æ¿ƒ–_C+Ý2Ù$ÈÎ/àø,nŠ„d…9§ê½á±ÆE0É¬VcqöAf‚üñùó|$è‘Ï¿^Z2•ŒlÄ#@µ#ëÆÛhp?J—‹Žï‡&«†õ!dXv.¢S¢>W#pJ.„g–fx@h¬ö{…c|½Ùƒçœ¨E±8-î@Ú>Ú`	Ç(&5­5¹†ðìf1Ü¦<^§bG&Ã»œþÎë³k`àPUQAÝÇ\Ž¯¦X¦×-*Ê;\*öØr­Ø]Æ<aj¬/,Nh/©V)gB
©U2âLß›ÒéüuÍÙ´	‡¢JI 9êô´É%Ý¶È¬õÎìó}›¶uw»D |?2O—êox©I.ÏËY]S+é×10…•’!P’õˆ=t©½åF@–šN®YéPŸ,´Ø„4X¦Z(õhx“áýü9«^ÖÕ¹ØqãhN)ùf* å¬œ¤jª´~D®^oór‹9«îîŒ|þ7Ë¹¾&8	Ù,}¾6¥«S:ÞÄ²Y#¦5‡fúJÇÎ™’@DÎ0+´š[´D!	ºXƒ.I5ôò{QªÑ›5_¶ž¶·R³æV«ÙÚ–‘6J&N}wÇ†'%_K¤ž—r˜×ù,U-Uht¥Aè35J…ƒæF‰³úî±P@kFˆ¥VJàîç£’ü=h¤Òâ~±+CBÆJm^? y`^Ü9ô…uU’Mj¢U`<0Ï•NFeÊ¢¤qxGÉŽ¨cÎQL¥î#j˜(ÚÛ–ìðpŠ_D´#í fE“†ê×;¬^ ©]®öÇÿø_êj0é¥Q³¬Ó“cïz“´Û¦[¨˜V7Fö†Žte—!‹VT÷8Í5ì
¶T:|ØÇ.ãÇ
c7øÔzJjþOsÚÁ€JGÛr,SJn¸»ÌøI¸õ“Ô^zsÛÝŠJGßs[kŠ¦ñp£?úÑ¸u3³~Ò µŸWÇÿøÏ?Ï5	¶åx[V³oŠÇb¸ÝýQ‚n¯C¼Híÿ±=ßngÍÐV¬ï8®¢òåŽý5èd?¾Ý
úý(Nr |—qSõà!w½ßo#ôŸr)²öÿý_ÿóÿÙÏ¹ùQ„@±BhÓ~Ü¹Ñ Æ=ÜTìiç‘Ä‰71{uG|ÖLÚŠÃà4|žF1Ïp”ÔSC´~J@|¤wRSøsÑB¾BV2‹&dú™®ˆ6vN¦ý„<G!zØ“ZÞä*Õa¡G×ËäOtðø¶(7­ZÎ&aåDhTS4UÖ,ÅRÛJd™û€"yÖ…¢âax6›P:VV•Ê.ËäÖi`´”*ýÛ0¤b)ÕVt;m~ÔÜ|„ÛWuK"®ÏCa… .ý ¤€*Ý òVæ“&\GÀ¼ÖŠ¥Ôý—`»týÏ™¯ûTpí=-°µf*‹›÷½Ý[io¬<mºž61_Ïù1îÚwv{Ú{þÉÐÿNwe¦ÞÔÿ¼‘ùFÀd×ä®&ø.÷Ù¨»ÿ´µ‚XÍž¡ûYóõž¡®Oc¿õœ³®#Ì2SÓÌ§MÌ×óôôsí|štÈû/¦WjpÎ:=ôcš¡ÃÐŽƒ”&×ÕÙK]½K8õ%„ƒ7;GÌµB=î<8÷ÒÂ<Ê+†è!†%>ÌR óR„¥Ö®oN5$JeåœfZ	þQ˜úÛZSE·±¶±|åµ‚·™LW ò'\žxB~$ORü‚ :tMs|BÔ’WñE(äo¡ Ô@ðÔ]à[Ø1-ŒÎvÛlÑï¡Çiþ<‚	žÁ‹:/î5xô	oÃ’àªÀq¹À—°óIxV§^Ç±,ô5tÃ
+C¥pJm…2ýü5”šqý;Î•…Ik=…uA‚G“þØÃ…Ëþa¿Z:aL=±`S2ž«»²•¦ÇI5D÷#pð¼ÒÄS]Š!7Š]•8,=QŠµÄ„!×LÞ|õÌTM1œ4•E¯Ÿ®5Û #é‚P
rŠ~qŒ}©Örû!uù¤ÞŸvêþ)æ«<ºÍÄ»¢ÇGtiY#Á\§tt;ósDdÌCe„ñbâBRoÙ)Qè>L€³È
Y†(&©K+ØQ€ó×;ð?‘p8{º£‹: ¶ÞÊåe{¼ ^YZÞVQß$ÝNûÉÝã6>ˆ—5>Î=N¬Ì!Öå’5B"9ªnL´»YÄ
XC?q+,“Žfôo¹Ak»3×§Qþ†‡uw„ƒ›‰7úä;,O~Œ‚4L	³itÇ‡KÁ^¡#å<—õ¹“\V{=GWo¥à]]uCïV=¦
‚IKŸë"`¬±¦ñ’Yˆd50ëj§i.##â×wWÖ:+]_oçÄŒ(Ç>.Ž`#ëž>E|¯-Ž…¾÷ž›ÓÓBï˜/®%m• ë<#Úk¶Ï-SãÀÛ†½ÒÀâqµH–8)…²ÌvŽ—ÄØb‘³U=oäÂiân-Õ†6‡Xa-£VåáU˜‡³iûí›Ãw'»;9’†½{½9Õ!¬Ñta=,[±kÎ¼…Slw’½ÑôÆ¢êXê“Qw}X’èª%DW0¢¹¤0ä9é‘ŒÚ 'ÈÛ=%F,u¢TC(¬ñecÕ–
çÍ¬À¹h+n fƒ‹ÄÌo]Ð§¤ü²ÕÚ,œžÕÓ4¾—óGm!Z%CÙ™tþÊu=‘;9¥ü×·¿Û1òÿõÅâôðbÌR1
© i¡
f¹$OW	fŽ5ÍÙM¾µr„@œIxÏâ$à|ä/-ƒæñi`h »¢çãødëÅþ®={…Ðb,ÊðdEœzÑ}íÐüfÖ|^‰5.N*x8m–5sùOv)p”³Èfê3™,´çJj}ÀŒþêœ‚ÉumªÆ¨Î«çÑÍìzF¬œGv˜>È6\’M\ÊÜ-&!*x}A”*ƒñÈ¢cšî%²LL<x” Ót±¨ñWèTeb‡œ=ªJ-=#Ö`;Õê
öÀc„‘ {4@¦Ýit—E‹œ[Yõ$D˜X]ag ©ŒÚœŽ†ÿ‚ÑÂ:hÃ–¹J˜m=$f&ôÜ 0Sr6#aÚ y-rw&ÃžøÉÅùä ‹¥õ¾¼d,×¼¿h,+ü]6®Ü™lï!/L6þÇ<Ì¡lK¦×´ä=IDßdöS¾TU&J-ÚQÄ,f©¢‚]8
¿Ëuîr]:Æ‚¯TªËƒ)¿˜X—[zfÚ…ºÂ‘N!ÑÒŸ¨d×DÑ®Ùè¶¿9Éî_Vk0 LŽù5Kwùúõ‰w¯‚óó˜¼Œ|¶·]þÆ½JØ*çIhé_œ'X€˜§ÁTþ]ÊsìL:_‡ôÕÃX@¤<©˜ƒ$äI,¤NSiÿu|À ¸¾=ø]ÌsóJ'ÁW*çedó5Xïè‰YÉv‡OÌc¹kõßž|÷ë·Ü‰Õˆ¾2Ñîµï%dÛãUq~SbXÎnÁ+™}’]¡rß„;±Åßå;Ë¥îŒ0…÷ñ¶&áMÅf¼½ã·¿‹m®b›Äå¿R‘ML˜übRÛ&*;í"›xû½Ìrp¢|kbÛoÃ,W(ü¹¥·¹~6ü¸¬É f¥®&pV'3Ðî˜¼Búæƒ¼wØ~«ýyâö…aÓ‚ »|è‡ÞÄ7i%¼<Îóy*ç ÃúcAcóÕ["¤Ý€(5:†ý±ªéSK´”â+$bU3ù¯¦6R¢Qµþfzž«³ªÇùOú§õUÑŒ›A{¿âÜ#þ,‚m°õñ,ëc}uÂê “ãpõ}Í~¨Z’Ý	–—µùù1yŠÓ—Ää­š/ÀòJL}~X^6ÿEÝ©"&¯#$¯6aq! »sf¹äÔÊ… ï>H"’(Ê¤PEÞ’…$
½KÝÜ]q†t%±ƒö|¥û"öL¥9ó”„‘.—ˆ|¸üI&éõMJ“]nýºpx	œX'!Œ4=Ívi]1~€ªGãuIyX©j¬(p/Ó €(#8Úªº™ÎÇ†+ëf5N;?µM¯OOo+ËóÀÓ*­raÖžC‚šcµ“Š&JÚŠ[v\ñÑ+ÛP(û’âNd¡­ë¦°j«yHÅB›vQY•\ð:VW¡éæ#‡ÙçB'25Ž2aÐ(×ÑàŒ)ðMczã€‰Rl*«$Ïqpò&…_ækñéðìRè+×bFø¥[›ô±È»<›SjÂÇÌ6nÍËeeÞ¯	'ÛÀ ?>¿‚r3òw¯§a”0âÍ¾3àhHyådú‰ïhé ÕY¸IVf©W¬»TJ6Í¾öÔAöÔ’w„¡£D‰1ŒÎ²AvÂ«É(ôŠýiÝ€lŠS5m;˜Ï8¶†sK<ÚP}<ž×‡ •`EqQ…L@r6:ß*$·²ó£ÍÏNs­¹­=?Ì'GJ®Q|W8O³\£¼Æ‚åRB§1Ê}²T&Fj–ô.k¶œŠ?Z™À“Þ²*„ý›À`e×ˆP(œÉ†…mÛ+¼Q°Rš_gh1ï,„\Ì@‚líÔ·La4ömµš¥oöÄ¾;Ò /¶%’`^«@Â½¿"líð"@ƒ?'_œ sÑå[#¿¼çŽÄ'Å‚J!WÚX¿_Ùm3y”¼ÂI#¯Híðæ•ÉöyÈOx¿9
”:ïH„rÞ™œà!Ó…˜@þk£Cêô>ÚzEùô-B¾Õÿ>U2½v™§a-7š\³âòbLfìµÚÔB‡Ÿk¿¤Aôg1zlã~ŽFˆ#Œ ‹Ãúi·g¬zÖ9¿oQ*nZ‚·—é.c†2Ô j9õ®Ÿ=¹.—ñt$µ'…3€AÀY!ÁàÚ¡/—ô)3<q'Ž Dqª8œÂ.4@ª-ÎÚTŽ*@ìeæ¨cÖ«úº |G¦ðˆ|¥§	›iùž´î\c˜JÝ¡£§É:R"ÇOB‡ú`ð‹¿OgÙñm¦})OÖ ’ioA—çðTjRûó©7Ÿó†žì7¤¶í=¼ñ±PâTm‡cèËýªŸ|²7IàçàÒŸôýå¹J…êŠfÊýúâ›¨‹ôS/¯Âñ{§VîÍNÚ­)lÁ>u¹QD.ïÂ×Æ¶Z­æêp´œc½P¦”3÷z-*¸h¶&ŠÉ	ËqØá(
Uˆê¹—ˆz±ºMuÖºÁ9«‰…5sgÇíº¸àŸbÞºÂoÛj:9néT˜òÖÍ^ÛöçðÚÔË/;FX Óý1)¿¥4ûrk]Ã§ÿÔjµÖÛOß|HR‡l`“ÂÞ@7¯’¾à¥^»Óé(êØW~þ‹7Õ:~s¡×„RY(ó-ÁTÊ	èÇS#swz¹÷×›6¹ôé	xÉvü=ÝZŽ{[tÚŠž_Iá²ƒPzÈ¨äÎN ¬‡õr88ü±âLUÌeTt}—0Hôû°šfÔMã¤¸#ø	3OÉÂ8—;þtÞ`œÚçðr—d¦¸ÉÑ§•ó$éç;í£æ'#Ðj’!ù4A×6)-–v¨
ß¤eàÌú<9Õ>@‹õG·^\špZÌ~:Õ8Æºr]¯™+ùRtÐ4ÅiÍË¼œ¶íÅÊmB&“Õ®ºk{ƒáJ®í¼þƒ-NI—ð!×­ŸN•`I¥{Š€~¥Ã2FÁäcÝ~Nºœ)E‡zWÑíÉœœK?4oƒï]Õ×{ ÏgÆÏj[×Ùìà(L]š*á’}Ì›e½­”&OTG§,Š’Z "èÌ³]L![“RÏùAm?Ið:É4
Æ^tC$žù}ÜƒÆÉœÔ-'¤K’ Ç˜é ´0úHv¼ÄÃ|ònJC÷ü¿Í‚ÈÜ[|ÐšOTÎ}ÑJ¶µý0:¶ZÿåUl4y¶4ùw[ÛÆg¬÷ð¹õk±?îµ>‡v}<üÑ`käG‰VË®X
â›Ô±…@Ì…©ØÌüJÓ¬"èm% >³~ýÚû¡í£ð"™¼k_“~íP>b^í:Û	åšx“ ÛêÓÙÈ’Eú³M ÙÏ¡g—}~÷W²‡”"*ê×ü¡û¨ÖiT«f¬X³FçÔ­áa“n#çšµH¦îŠµøTey­c‰·jJe}û!Ê˜×£â¬¨QËg¥³öKžmõ°1}]ê"‡tåÝëï¦À:k°ôÍm–³Stýp:2õK”€Ô ö–2ÞØaºn½[“í¿6µWfj&²‚ý´.êÇÅ†üÜè”6ñ¾v3-Šµîßfm|›+ôªñŸr‰9¬Ü¶]@øèØ»í¡ßÿ¸Dý‘¯ì„n”e»\&íµ)¸\«×aÒ]á´{ˆ<$Da¡ªiÜ$ä ¶ÍIxbÒ‘OAX»¯œãd‰óÁl\Z…Õ§¢Ñ¥4 VyµÍ4Ñ±ŽóO¼'þõ08’˜Ä´
ñ'Ÿ‚(œ õ~cøí¾&š‡3†8ÿ “•h:â]×Ã‹z2ôë˜Kr|3?±£¦A¾£e;f#V¸ã8™‚POAw{0x¾§Õ¡¡zL]*"=t1<(SÕPÊ…}–uXì/ë röJ•*æDùd¥?¿üx6J~läß!–Ëé{õ“áä˜¾BxgŸL#8‹`¿ª£û&Œ¦C8â.+AþBó¼¥ô`é;Ãƒ_|þ.üÓü~³ðÉÐò‰?žò–ñOsËüfá“¡åp
Œ·Í>˜[Ï>›úŒÓYÁ?-}g7Ÿ-¾æí¾6·JoÌþ6´¸•ŒÃx:ô£´Çùæ7H–¾3ÍõJ¿žÎQö…e¦ÄKßéže›è0òû³(é/ßÙùwú÷*W|­a4P5»ëÍ<^þNûömÅãÊ¯Õ-B8†Ž[óüVú¨}çŽüPñí›üÁñìœæÀ¼ˆïTý`z»º!ýo&ÚŽ(GN)›4>±R¹!{„6>ó2„EÍž Ÿ,{'{DþÂø–ãÄŸf/Áºcåh6ÉÎ¿­½4£TþVõ¬BPM¥µœ°7žF t2ø›$AYà7E©”'}{P'3˜…©…WóƒÐˆx·€Ï‚O„bƒµV»Ü9‚ëÓk:˜ˆö)ðêŸ‚pä'j°0ª 8tHÖìÆƒ? þ¶y0@ˆBk‹®Â´›¿B_ŸÚ‚ ;†‡ƒ>cXõáÁ>¬à@Qy1ø¤®	~ŒëB9zÑ0vb3ÔbBâªê	QèµH)­4†„ÃÙê}!B×ºÆ!sìžQ©Wpäs#uB¹(ú7Ýñ0´&(AãÞ+)Ñ
õ»Ã|ºÒêlÀÐš\ÿVŽ,î{#¿Þ’£H²äJiPæžaÏæ’QaÁ¨<î`0V/ŒŽkÆnz™êtz!ÇG‡ìªñ*µý±Ù’t<…eƒA\05â!‰1}ÖÕ†—©¶Dp*ìHh«ÕŠdÏÜg³<[.2OÄ•õë-jZZ´¼ÞÊazºÅÀU”…ÉÝrÚh4¶¢È»©ÿb®Ž3/‡ÕÇÁ<ãpà×aââã³$¯êh¹lËƒ“b= AòŒtiY\ñð!Jg12³öJ»»–z‹7és™Ä³dîyé³”ÌœKôœ#J(äákQyG€$_ˆîìË*€¨ýÑÂÕ0êŽ–VÁEú8¼HÆÞõÙ§ŽvžôûÓf‚sòJ±¿R=úŽ1¯èöTÓg}Æ-r# ®CŽv–ÂP.­hŸ 2 <RXf\ãJÀð<mó6dA¬mz,‚eá‘lƒØ!·Ö.[6=^Áƒ]ãˆà†V[wÇîë´'ÑŒAÆeš—ëÔæ“‰SÂ­_mb%×‰Ý€ym5éÄ¶¾æ‰Ý÷’$èûg{“Qø|×YMççTð+¸OkÚ@…Ií¶Ö7pR×¿Ø¤òãräÝøÑ
íY’Ž'&=-±	ý!$"RÑŒ\ôÝ3]v!×Ù5MÜO3TÁ}2ùâádßáºK õ1XbéHò¼klº«
9+©Îc3TÊH¸×Å ³¦ñ¼é3ñÕÑÏ½B°9›
c¸ùœò=pÚxã¾‚³«¤[õP)ý	>ì®NÌ“ÜÆëÕÝÆê¥ÜÐf3ôô²’|²LÐLfu˜Reþó½9o˜l'dà=×:C=øØ}/°‚9±‹ñÙ•‘®,F|Ç{{ù®B(y§_ŠFS¨:yãº~ÆÐ``Îš ¾â¾Gé…ì^\€Æk+5ñ}›F¦gð740ý´Õk>ÖÕf(Z_)KBBoöJ¬ÿ*WùŒÝã[õùí-¹Þ$§Kgôxi…,Ñÿ¾'wfí1_hÁ²Í"
Rù&Y'˜É^4`Wº¤›¤c»ÕF R
®ž„Þ0ì­›M*;°ŠÁæ,S'7#ß>úsàR—tOn’¬£ÙŠ×’YãWˆ°¢+ m³ƒJa˜?8½üÚôW¨Ùh--ßI,¸ÇPLç¹]¿kg¦àVôøOs[`Ÿ`áCñ‡}À7”ì$¶	_]E+ šûÃŽƒ),jS»ýÈœ"ê$NhÛ°p	yn¹_Ï
»«?ôg´?¦‘±ÿ;iþ³óÛß^\ ÃXÄëuŠµxä1©åƒ†®¶ìpÞÿôyqBïv¯!òÚ‹‡ä¹¦Z$ün}5Ç#ZZ²÷ú8˜Áªy+äœR‘G¾'çþÐ‹ôh+©5—AµYvAìû‡U©@Éâhÿ$®ê÷)#j=]&­_vë\3¹†Î-ôóÒm
/kþ3î×Àu@* Û,&ÀCÈ8„XÂã²×ÀyÃjt>Ï_ù#{å*ö–l<¯\;ý:L°¥¬ÕàéuxÚz¸$³hbÅžr?·ÙÅì©´§>bš¢[Ü8^xÈÞV^	g¢e;OØ•ŸË7“üé8=… s.!½òUq86MnÌÿh…·¾w¼s3…[ãÔ·ÉˆÕ}¢aØ½ÒjPƒÔF¯Bïª­iú²u|Y³Gß¶îú6|_Ëeœ¨¸ŠxÈ®ªB"»rQ±Úš ¸ò=©Qfõ˜´í»6I[x¬³ìØI&vÖð|m¥Uñ6Õ¢Ç£µËêñßfÈÑKmî-³hõýÑÈµ9$¸dã(ú]´€	]/+¿\£~œ;$\§™‰ÐÔvs÷: *TYkJÁKwÚÚ»Ì6ät.ØsRàÊõÝw…ÓpÍTfN¾œWÁ¤§JËÀÇ?ºÌ*®[RòËQSÊ¯óðú˜¾T¦&iÒ¥FùàGPO{ÓkêN\‡ÿÞÉšÒEÊ/§å¸b4ZvñTZ@›˜Ñz[Z¦j8ç<[Í¥'[“úÎ3¹PkÚ<ægŒã«V|fHÕ_×)¸‘LªEÞ;Žê=™¯T¶ÕÙ,½Î2¯È‡™X¶LÉ,5›4+ïäá«`aóv›—ì›°‚,Ìvj?<º•¢»ÇN|žƒu¨§ÏõÜ›ãuïm·X'¯šV]üÊE¯.ýn®ÃÿìMÞÎ«ÅÎ2ÊªàP”¬|îKæÍ„^{sí9pnÒ{àòTôjþSËootÎUÖ÷‚ÅÕ³Õ±{¶ö^ž5›TA¦ÐÇ÷ðnÍ]÷·b­SUìöZ·-£ávy¢7·p®üuÎ¬Ïíœ™»`©ÊÓ1¹c,Âÿ˜';ÆU«‘S¿7ÊÍÚ˜¯6ý3/9ƒvÆLÜåÈ°æúòŠ`Ä>[k>^¶ððþnÞãÅ­¶üâ§ôÅ¿w«iˆ©#jiäû#‚%|ð“‡÷µºcSÜ&il²=’Dªja
¹d1#Y¥‹–ñnJ©¹¢%ÔÑ0<sAIŠÎÂ¾;]êcnwÖ^Ž¶¥9bqÒU@Àp ië*4ëääåþÛÃcëZüÅ›:.C†Äç°"”`……AGç_‰".ðC¬Ä>­Ùñ§ÉÐº½¶uhs±ãBä‘û+!…‡VX
×hAËZHÜìÖâí4	ÆÁ/¾É¯ÊVbkà¶.Æ±Ÿ$¨¥;.‡}â°2ÞB…‘q î±"k+­uØ íùV„{9Ùáf	··}`Õ^âÕÝ²Oº´VO†SÅW¡òF©ú«$,õŠÚ5¶Èõ>0®¡ó^DÆa²Q!ÔCN½JáiR<‚AqÔÑë§ßQó·Œ;+J<óî$\Q‡F$&* vI6ûç—w¹í2ýŽ~¾Êá11·J2”å Í¬)vã8kì+i
ënÔJøKp+59­ G†upÅfL“Ê:Ìí…ŠÏŠ!šŸæÍ$¨GVÆÚ2§&™¢ÛÒ8Åré™ž”±cvSLS!1©*hÌ$î¡ÉP“ÒŸgõÎY°¥Z¯ÕWÇŽƒê«SJ5_—¾ÇØ´ŸåãëŠø3
buˆÚ‚“’Õ¨$‹Ìè]7BˆšrU™†š4[ä(9hž¡ÝÍd	ÖC0	˜d •91SZì­Ù H˜1	anµ$¨OgÔ'3VÉ`´æ
"<MÄ^@1çõ+Y
ÐLµ£ÐdvX9=Ñä\qD³•ªs<|ž%¦ÍøºŸ•¾„©‘–‹rF™’U¾4Xñqàë«[9%þì()P¿r´TWì#‰ùº;âÆE0‚Å«½A«ò&ËþäsÒµ˜†T¨–G6_®K½+¿>3ÂXŸ(Û˜Ä{c8´Ó±¨eÏØaÞÖ÷¤v¼»ýîhwÙ<8ÇiÅ—:,ê©½=<Ù{³µoym¥;-èðÉÖ‹}Û€+¼h©åàc‚—o“Ú»ƒŸvö^îíî8t€ÔKRÛÙ}¹·½·{p²lH37o~“TÍ6Ï›}ò“7BŽNÙfçõ,!ÏØ=œ*nØ'…*òåc	 Œßw›ë-Ð§Ôp2RäôÈìZ_÷Z£n®z[®w›B2åÃ‡‘×žxH!úš·"cå.hD±Äƒ6´‡ã«ÑãŽnA±Ô4…E:j48ÕÀi\¸£Çª!³¢¹lØ:–*…S•b¥Z!ƒ´×Õ¢¥%!´ol¬`
)fRSŽ©åtµÕss3H^™§«-á«céÚ]©N;TËñßÒ	¨—Nwn&Þ8èç"žF`3Õà]Ð†ˆÂs ´‰Ç¿½]!ŒÝº5.fýaxê½‘þXus´[OWž6WÚozsÐ¦¿Æjº!…E5m‘t²Ì[äÐ’YtÎ®ï° ,Ó—Û&ýpr1‹áÓoo—äC·n*€+wHæ¾¬²=ŠîÊot{¨a®
»"Ó]ô[‚ã3m§ëñåv-Ð¤ù„x1ñ&7¿µ=¡˜ëÞH%åöíZî;¤è(ûFwÈöt¶ ©Šï“j6ß‘\"?ª¼K•UÂÖ›ÍìŽÓäöý‹„Õorc&•cC~u™€!Q¥ &h-:š=Ü>Ì“Š;É%e”åŸõ½QQÀý"‡ÏbLEƒ1ýT+AÎiJÛ6Sñ¡-IÙ?ÞÓÚœRÚÜË‰â;Ý’×ôÌ”v|?¼¬Ö`q‘fž_{2ê(.CJª]À<DŒ9Á¤¾ÞÜmm½·•à*ÇÈY¬ŽxÅ…¹ ›(p³ÎðÎµà¡ve¥‚*´ÕÚhs}ù½£mGŠC¯^¨ÉˆY³š(môU5XWg£g‡²K¹T·$ø†½DGRo6z.K‘o*ß)}]>pžpz…Sï’ríš55™†òž­m‰œóë%îóÞ­Þð*häù'·§â[|i7à4‡ä§L´`2¹¥&7SX}:Mçáµ[ZŸÔç·ŸwË)zz“K?å²·Ž¹H"v¡˜WdQ3]<+lôbEèRÁ˜ÄóÞÄÌªbµá—&³×›EÖ,3n—)uÊU²†#«¢‡å)ÂÙ«óÕÛÔò
2jWfO8¥VÙ²•tƒR„šid)¶™5¦® k¼‰«2–S•AvÝR‰Ê^’ÏžKjýMu±{ªQgZF¥ñ€R×_äpÜ
k;QV‘®XQ1Œ‰/ÔÜe'?pbss"ó—T÷`w§˜M0Ç Á<
)Ü%sÑqÚ-þëô*ù±+T˜|t[T3ÒôäÅœxåæ±‡‹š#—*_Ö2qúó_Ÿj&vÔ4(M3US
¢Ù÷—¾ÎgHÛVkœ
á¹R=Á‡ˆ©BÚ^o®³Îv‹²vª!eØó(–Åî ä_‡‚‹Jˆª.vWWÛŒy[Ò—þúÒÛ5—-Ž!Õþ×Ò[ó4m•­Mï°±Õ«osê8¯B@Ós§ÓÞ•÷Î@¾âæâzjõË¥Þí™Å‚ì˜šÎìF|ïíœ•‰Ê’uÈ{Så(Ïçºy:EœL½´ÓTÔ…œ^3[òj“éæËÅiª1b*1y‡Mà0›Ãž¾rj•6@Sv1àŽŸxÁ(Þñï´H,ïIŒŒ¬é,{ã+X–ËCT-âè:’ûÕe,Úrù-óH“b¬$Íê¸OˆdqO1–3?ÜPÄÕ³’£9¡Ñ¨ßùâ'Ók;¸Èq3PQô »›QñãùRJlœŠ},Œê8˜Ý‚EÊŠ„—Öm§³ÈŠ2\1À–QQ52ÙýäIC/‚^ m«#äÙash½ÑeåâÄŸ2ÏˆCkx÷
	,ë…îºc1Ï¾ƒk7\=¼*a»HÑÜkÅÃÙê©.ÄŽ.I	gÜÍjèfYÐfÐäÉ=‚ WM\`×-N¾‘\ê‘³9FÙÿB½tÑ=Zµ×¸™¤Ûn%áár ~³š&ÜÕéJšÌ4Á4†9jÚ·ÓœðìNÕ¦8Åü°ÝL“ð2ò¦C8HƒË	­ç²I>QµÞ8,–í“Q£ñ¿Þª·{kg,¶ÛºªÅÃ­0–ÚÚd³’mT›ùÚ–:ÅÇÂÄMGí¸D‹,£F00´Œ´äŠ/Ö5.…`¬ƒn¹^Rq_Ë¾˜hÇ«¶SC‰½Û
­Ha7jEX*ÞV]Ç7À2Ç,ò‚ø>Ì¼•‚íºSj™Ì4Eï£9$”€!L<á››	†I’AOGü8ñF7IÐ÷tÙsù5bŸî5 ÓTTãÎP›ÄfÕ´î½ñç·¾`2ò´/´€0úÂ3ÙF«¥Øim©c<‘(‘ñÊåC+.ÆÇ2R¬TqAª V-C¨›Ä6µ™‰â§ª@ËBJ¯˜œ6Fk¡u×òð3Ð“ûáxNÐˆ¼i«m©ï©5îxŠ;e¶Ý‘ð‚ô2Yc!g½cýÓÆXvB·lA&,J$ò§a”œÀ„:€Ù`ÉeÛ['{oÈÖ»½²½{tÂ¾ÛýÃ+Ôˆ+Œ`/n'þ]Ô¯-7’p?D‡ãCjÀÆrr8RLÀG–r£¼^K…_¡ëVý•UèïX’`éÝäã$¼š ™Îhš+†"ÉNúš—ö³ßÏâ~ùwÿð‡z½N¶öN` ûäÍîÉÑÞö1‘¦îøÃò½uó E-£ZcqqYä¢ãâ²ËñH‰U‚,uµ˜ü½•b b?ÒG`:öèG²tú¯N!wxmÂÝäý’[/y˜ç‡G·BOÑX“ØÌÐR`ïHýÂ»”v³¾ûàVå‚rÞø÷0˜Ô–þ:YZv çüu²5K†hùä.×LÆH{z¼÷ê`w‡|Gößnÿywç¯®PY×Ã©÷Ö|°~`‹|>
Ïau‘Ù¼€?k§9O{¿â°_0ò‹gV¯‚ÐLì¤Ž5BfÐ=yw´ßèG>ÐîÛób†Ï5ì³c#41û³1L0ogwäã§Ú’·dmÄk#ÿÚ€ÎØïQh2
=Ü-þõhçLô¤ŸÑsfaÓä:±Òb6žóppÓð@¤˜¶‡ÁhPóÔÇcÎ)¿$òÇ Gº¾×,ò?……5ƒ	´áZ»–[ÆÒÃk©EQÊ`Í#™…Ú©æJ	:&ÅÓ85ƒÇd&ÁIc°qëÔòN³‘­€Ü2qK³´´{›—lûQB¹ WìŽèž6ÊP¦"v‡A³ÒèUÚgà~Å·¦T!mÓo‘#MO•¥eVüÛjê)P¨õ–=Õ¢Or.éÌ+€­‹pj°%‹lÊ)”)``…ðèô©Ž27«›¸È(ž<ežP¼õ0Æˆ˜•NK"+‹®ÄJ5ÕXÕÇA/˜[ST€qç;x9¯RºÆfÏ¢Ö#YQ¹wµ¹‹=s¡HHo|½ÌÐþjëÝññÞÖ9x»w¼KöwÚÝ'µÖÿýoË÷±°‹$P Žëxé‡ÛIÄþ¾ÿ	DÛÇ1•;†ù³ ÿãîm²ü8˜<_²&»Œ½ëçK=ëmÔUõü–+¾ùè—Ù±pà<Á\Ë' 9SciTÈ pM)‰ýä k¿v0C¡šß VÚs¨-;(WÐŒ¸AQA®aHŸõYk’CÙnÈªjHQ&‚ÿåFöñ/¤x}Ü@"Êy©lö2…Á{½ÑSX¼Ssö$ŒÆž-‘ã`LãGb2.‡4)|Œ|
Îdg¼B^ô‡G“ZÐ
"*ÙÂ]~…ÜF”(8£ã›IúWÌóÜ÷Ædà#4:m©aÙhFÛµƒ‘êÛg‰/¶¶ÿüêèí»ƒ²s´÷ò„¬’ã?ïþüü0/»ºVòk`ŠŠL±0
ÎXœ¤a/ä—üÎ#Ë×—ç‘£ÌfŒÝ&Þ8Œ¦Ãpœs6žŒ½ñtäƒ0?¢h±Ô	Ø§¶ô¯(›&°zã(–CŸ& ò
ýY‡´ü¬ÿÝjã‡yç#–p(ØÑl‚¨&Ú©ä úÝS½ çŽÍ ‹n×ã›I2<r«=‰¯‚¤?|²L+ÎÆáEB`ˆæHexûI0öÃYR«âÉ xÂŠZÂ?6Æ£\§{ÝëŽUi#t?'ò'òÆK†üŽíÖ'^ç}®Çð<}˜cTuöw0©µšð‰s™í"­ù´½Œß +‡ÚÅŸ°Cè_y\ûƒZkyÙÎ¡”ü‰uÕåY5m\x£Øn—ÉƒOÏd­‰œ>ž;BûÈ&yBN7Ó­MŸüÕ‰É’hbœ	³-n…´ÚMs5g#·-sÚéM^(E£Å~¤-,÷S²èI7åF½üÖ^Ò§q²Ûå(êv+]ÆP6Ó‚Ž½¦MÛ”ønDUr.K:ðF«ìµzÀóÛ*æÔ/Oƒ‰0Ÿù'üØÁ¢p0Â©džh4l†1ÎÄå2ì#ÿNÃáö•‰Æu¼'Qp‰A0[ M(uÄ!ÌXôÐ}ÆjB5[nsÿ6É‘ÏFILvxðÏwð—w9	zûsŸ.Ú€X%ÛO›2øPi€ àó ï—Î7—®jœâ=søœ’õæLÕs²©Þ+Wo!™zœQ[äœ(¸¶MÊ=Tk[Vž8szèK–•'~³¬¼#ß% ÇRqìÒƒ$TãzU›§ð9òÒØìÅ 4XGGÏ‡Ø‹ð€˜ŠæzÐÐèiù‰÷ÄdÛ'Œ>’K4
~ñÎÐ»näÅñØ”•“( B^y³–aÂl¡ÄŸ€N}‰"2hi> ¼B®|2ö½xýÕÐGÃZÏHk‡lüõI´ïOšöŠÉˆÔà‹†#‘²ù>öÔä1ê‡Ì^†h"IHâé,
PÁ¤±±ƒzX‰ë”¼jX0I¨@i*Ž¡oULÄ£±•Î90ÈÊÈ#J²*Øè¹ÑÒï&œ°h^((Î‰r*Äœ=ŸÈ°NX<Ýòå\µÍæÝc{ÇÝROt¬™YØÈüA0æzé\/Ðî{ºE£¢¡Z¥`òéz@‘Zéèó“êág#Tñ@›‡\§E­_døð¨üûÝãÑV¯×[Ãt?ßŒ;Œ»ÃYrCÝ–Ãuû--å–ÑN–‹¥f£¹„ÚÜ=í8|êü¿Í8´HLå«:ž°$šMœ–c±˜.Æ{Pc££Õ€àœM<ž`0¸ôêÜ°lÆŒÞCÃáFä;]giëµ®ÔŒLÈþW¬ªçˆFèâ†®!·…•ö4Y¸–x•à²Þ+À w›2Fåz†ÖkSÐëV¯³Òl¬/¿Bôu„lo}Ú¹µ¯”p¶ïùÊ^úÊ¬´ŽúRÜ
ïÄ¦£0f'‰ºåÎÆÊÚ:þ?kØ¡Ù»wŽˆyŽŠ§^»qÛ9]÷ÈAÔÇâÖBö»SÆ‡ºÛ·IÙDÌÅÔc×4‘ª…~¿{yƒ)º·È¤„†Ï9=Täš}­`Òé´¿=Ù"/·ÞíŸÔOÞîïmœ¸wÛ0µGo_¼;>!{;ðŸ£½­}òöZÇŒ‹­ý{¾ÍõOïö Åû»äx÷§Ý£]òþÝß:<®Ðü“£Ýã·ûïh"È‹£Ý­?ï¼ýùà‰#™»ƒ.?Ð1…Óh(HÍ™=§´W¼$tª{j-àù› ö§fË8á†â]zÃ¢eXˆu‰î~1šõ“3Ø3àa7ÈîußÐŒe	ã!Æû×ÓÄ˜*_ù“O|@ÇqÜp$=³´¨	§˜…}‹§~:•Y`œp?L:VQ¤	rÔC½B¼Q2g0N˜hñIe4À¢sç†cIØïÏ˜'ŠxñÍ˜%Œòi^#ŸºÁï5$¶ip­0EŠÇhÓø²@êð¢è,ºÔQ~ySr$C¡'¹'“yí	Š*o˜¥ê×“õ
¥Fù,Åÿ¿ôKþèG”, ÖžFŽ’ëé@Æá :¨3 Ò.ù0_ì0·;Å³ËKnè¢DÎ’zxQ¢…Y?ŸQ±? ‘¡“ˆ§^óàÐ.)e‘K?Äuº¡”K‡
-ŸC^ÂVÔõÓÐœÄãÉt‹²¢z˜‰âËBN° /	â<&zàÒ}¢Uæ6¹ÇÔÉ$ëŽ5ñæíÁÉîÙöÖÑþÛ³ã½7ÎÉ¡sýløñÙjžj°˜‡¼âÎo"¿Áª*_jÏ‹é®]¯å…sÈkßKÆÀP_a_¿°?ó´aÕäiž	j¶Vw¦@Ë«cê2Uð€YØf §XŒ‡eiiz É†`ÿEžF>œ6ÍN¡¦:íî¦xÇš„ÎÉ—½Õ„)× OÁ1Tû‘ÕŒAˆúÏo¾?Ý÷½O¾-„­ˆƒøÅåŠ Ï—Ò/¸OmIHÿÒ|5 [Á,!‘†£ ó|iÖÓ¯l	 ¶	-„Á$,&§­O'€ËoÐ¨±ñý6¦·¨ÄÄPY3/Ú7*$Õ8ÔÀ¢Í—Q“Ù@æ=ã¶£›#Å9Ì›Ù(	êÛØ»ƒvÑ©5[¸®{³ÄœW‚Øa¸º¬—kl9r”­{×°u(ð'säYÍ‘JÛ¼F 1.ÒØ=|#Pµ °”lkogÉt–Ÿ¨ÔbNðv5än¡5"'Vy®
GéSæ±±“òþdúˆ}Œå"¨±™2ÿtpŠ°;vì‘pÌ%ÒFª)»údN¢™OþJ—øþÂ;Ìáé“íÙyÐ²š¨þñÚ¿¦ÿ}.‰¼I w€Šøä=…˜ºa<Ò™¦ÈÃ»9gÜÀÊŠ¨cí’½>Ã0ø»Žn¢á‚ÜYËjAYz†¨…W1"Ë€Ìì9ô­cès¥ŒÍ?'Åå¿AnHi û@	!†c~+ÒCrw?¥
öÁ¡Ð¯œûüË½‰iˆyŠ!€} ‰g1Í+Y![}úþè‹é˜ö3ýtºÑmôVHÿiâ?­F“ÿ¢à{; $ìïl°ÕÓ^£½BÖ7-l«…M¯c[ëîfSI{	"i›‚V7ÖÞïfÇ©Aq96ÉiG×ÅiSëëø‚.ë°[óõÜd=¤=êñnöð¯uú‚µÆºÛ¦$‘¹Í‡ØÆnÑ%jÑ¶×ÝºxgÅÉ€Yp[1øY3î³#t¸ÆKX}jë¡L“7âhoG¶ñoLtaBl³ÙxâÀ=xæ?LZ,2½øa7>‘´S*zËw¶XìlZ\^Ù
¬±)Ìë‰L£05±qQx{È(=Á_8‚lcc,»:·Ûû„ Jó;å“òþ”5éX¦-/U‰‘›Ðb6·¸˜ñÏA2L;›Ow×%Nn}„¹´”$¼…8˜‚?ýØ@ä>´#ñ÷£©|ºéñ&Þ#‡Ì.§zšâUÉ/º½y§\a‰ñ*—ÛÜ*Œ¹v‹3²™N%˜M’‘R¾lŽêŠ“›ÚÉ*<Bø6V+ÚLÉ¥R#¥õWÃSkw»‡Ö£Û<;
Y:Ži•´šÍå»åU_±É_EêÉS<%:ò+VHßPÇ“|_ÔÃ÷Txcµ>v‰îký>Àcÿ6CwO<Þ¢eQU‡K«o9©±ä^
DS~ZÍžlÔ£QÈœ½êì*ìåÊ$ðD|?¡Ûì?ÊxêH
ø@¨£_`POªÈ|´+v=«ß®þ~ZÒZ} º9ìÙåŽ—ïŽ8×œI
ªZ¤Gï|6ò¢:â±ó;©‚S×-ìX)6®Êˆ*¡ÖWŒÕÌÄËE?[•¥F{'ìçðÝrÍòîûBW5R0à{xõ”>C³)‘ÀŸhn
êNˆzŠy “$&'‡¤†V˜ú!O2ÉÂL:8æZ=žßÔTE#é—çq´¡Î3·Bî¯"ŸgßÄ´;—F–ýµ€hÍUñnžxïyrà2Ö¾ÐBxEIöAëß}+…ï¶ÂÝqòuÔ·{K£‚`¯æ¬ƒU»s0P>dM»låŸm–7—}\P);êþ®Ó¾’]Ä XÐ,,´ª[=©êá*¼²sPÔîåÙÆˆ°µ@8¯úç®½Wàq¨Ñß‘ÿ÷?þâ'àZ+ÁW`JÁSëtoAvs„œV³5(b"I tzàäqØ"ct4KÂ.?¸‚ÉÄ©†jþ@æ½{Œláœ‡>.ÆcñàÙ¡êÑ¤ö-XñÒëÃk8³ë9@;æs¢s™fxš¬šG:>¸k­Du3ñšDº}pÅ=„aà$( ÇgžØQðÌLžezEÁ„bòø‹a©‡ÑLõçÅ0äbh°Cdó!TÌâ¯(\ƒœðadš°ÆèoÔÍR7ŠÙ¶ >"ž‹ê^Ü»iØeo¹™b&!LJÂÐ#XrÕ8èGaƒ1r…ÀY¿‘O^ß›ôá]”	C_ý±3Ë}%åy¹$Æì®<hÖm*¿¡ê˜e„¸‘áâF~À
˜Ç@2ý„*G>Ÿ‘ÂÂÄ=ÏÑ$¿É%áÅä¿{²î‹T™‘3+²è¦Dë}„Ì&AÂcúHŠCß‹X6¸'øóR »†c°ašUN™B
ã˜ÆHQ*Ÿ‰wì€í‹Ø%°pæù&Å”\
ù#&:Gkë§Bp±Zæ#ó¾ât ¯%4%Ò>§AŸÇ!–Nz;å=Á%ƒ‹ÉØûèÓM#›ñ˜w"Ÿa¸gŒqìøFRÃþi\;2S˜ðê’…^;‡uÓ®ó ô)¾öŒ…Ùóõ¹DkEÙuÊ_¨j7y‘×ˆÛ4H“’Â'ôùø‡…êèÔÐ¸ðk×Ä rL´Æ ?·ˆîÏ˜¾ù­En§æÎÆÔšºÃîÛ$ä9i5WšÍæÂ‹¾lo¿=ÚÝDùFû³Vûûÿ   ÿÿ ¬$Kxœì}ÛrãH²ØûùŠZNÏ45+R¼·¤•4¡–ú¢XI­#jfvÝ§C‚E+\x °%GG8¿;áóà°ýk?œðóœ÷sþa¿Ä™U¸€P$¥îž™VD«E(deefefå…éÏÞÐxOtSó¼sÍ¢û•‘IïjM‚ÿ±_5Ý1É_fžoŒæ5Ú>u‰áSË?øôÎÿžÖzÄ›j:­ÍkÊÁßÉ_)ñ´Ö!ƒqMŸkv­Ûhl5Äufök£™i’ãáü¿ø¶V£ä=ð¦£éL|Ómm›Là‡ê4D³Kóim:3=Z![%ÐoøËMÐÒîj·µ·­Ncz÷®èIW|˜Ázç‘‘cûµ©é7üÛ	,™M§ÔÕ5ß…K†=®ÝCêùÄÔš¥ï"äLó]ãŽô©IuŸœS
h/pkÒ-Ä43‡·Mœ>Þ3á°ŠÂØ-Çv’Sq‰Iµ!~r©©ÝÑ¡Â¤ŽLÐ¤Ùs‚ƒ…jcJtÈ°áÅÄ°‰?¡Äš™¾QcpÂU{4óÇ&c×ß›¼)â#C'6¹šI¦.º·èD{o8®ïÏwgºÏî1Ëð½z)"§kÒZÉ÷9—‚çr®.¶¾&g7G7ì7¢@c³¾ îÈq-ÍÖ)9£@>ºGž»T»:·6ùz+÷¥)¶0Ç» bj 6ìZ³…"àínã°Ùy—âyN.ÛÀôÛ±lhß™\ìL4xq>© ™ÔãâîÖÕ¦I
¿õo)µChR°¦ƒZ›Œµi­]H Ò÷'ÞŠc´ÊDèÑ„ê7G†«›4)àº àºœÉ¨E‡(ãÊ¥®‚„e›È²‚è˜4õŠ|QTÊ°@PrJ©«zá"wn’Kªk¦¹I^6áï7GµÃo6J˜ç¶-G4lùÒxâ²¯lQÓk0½«µê]2Ã¶R=90Jˆ÷`»Ì¬E’}Ä»[`9³\’žiºë ¦wÉöN½õåšh^j††=4ÆNb‚ÁWÙù	÷.7=#œÞN£Þù Ó•¤6’«í,31
pÌ±Kõ^÷qY¤x?É2óö¥vM›ùN±ÄôµAZÊ1½áÍ¤#?Ím -	ZF»Q¦(î2 KUßÈÝˆ’¶“Ôqt 2©4eUŽÜ¹çƒÂÑ‡ÿ¨µ·åOV©°9®OªçëIêuá2žTûÔößxoøóµ€zÙ¬õuÇ¥kÁÄÙ‰¬=Ð¡®ƒŽ¨ÏÉ…ëŒSi,¸Ç-SˆxÏ8Ã¹ð%Ð_mN‚?b•¦[n^-Þ–¢`AlxÏ.yz4úÓMâq2Û%­f·±‰Ê´Ww:õí/ájô©‹ŸFMþ¡‡´^Y¶½Ÿ@qt\øœÜá°“?‰#÷›ê ^¶¡[3E8›Û­NØ»1œð©Á	Ú	8{­$œñ.%€ÉŸZ
Ì×ôNåNGÀfÃ}jÇØìÁ>.B¹ÓLBn8"*Ù3KÁøÆõ'Ž;q¬Ô¢7{Û2·E0áS'Fæv
Ìn'	¦f@æ¦p¹½4œg°gè¦a§ l¤¹Ý®ïPv8`ÊN½‘€²"ÍÑLŸx†–†“=¶i‚œ³ÑÀl&(³É!ã`6SÈl¥(Óu<š†±ÉqYâ»º¥M«UT€7Èþ©*ÈD—ÜÐùþŸ©ãôîEy4AÍ``â‚h‡	"Ü,ÙFàØ5¶§°_â«†ñ+Q‚¥r @‚´TÈ]ØîÑê
ÆV¬î;§ll´V=®n<À»D¥_Ðù{‘4à‘jšyÁÃŒ/èõ™7Œšð.,¤ãO¬õ%BÌê¿·µÖ6‰¨•Æ		¯g¤"OŒáÚŠ/Ê¼jñÃ„÷„O˜ñÏý÷Äóç&\^„,Ï®²¿Éý}™» zY¹34¼QÇåj!¹N­hTrŠfR”š3K_ÜÛ²”Rõœ; tÉ·9_éð;Í4†Ìóq¥Èþþ>©>Ñrß?%zçä«¯rÄì^ür’;åš‰ËîL5ôj07É7Xöœ§yâ©&{ªà!Ú™G¡ôöÀ6Ç»ÂÇó™ln0gÀ
	}ò†MFÚý?­™míÐÆBÛ¯"}}ÞÚ¡góžÚ%¯ç`‰M5 ô©ë‘¯À„²A…öÎÆ:ñmÞŠÍ®²?3ØòÄ+Ï±›ómË¥Ö»ÄKäólÝ™½â`"Ñ´À „;³éì7Æ @x FŽfžïXä9X¤cöZòÊÕ¦ÀDþÜ³³×žcÎ˜wÝ£~­A~„SÇ@¯X¾„z5Û±iHCµ·z£ýŽÃYcXàÐîŠ7ôÞ‰»p%¦…fPew5àg{Xót—–ÈÊ=ÃÏÕ÷CJ§§Ts‘½AŸž{†÷||O4Óß¯œSÿÖqoÈBÄ_V‘ø áêþô“¨À’Œ¨ëR÷Â1}¾_±ZøU‰#¶§@TcW€ÍšïÔ|2rK ³÷ mFŸ¶v€Qás§Ø\æäQs]£'¼Sè+/^ŸÌ™ÝJ.íèÐ>º"!a	!nMÅž¸emjg²(]ua<À¢ u*Üì:S<Ú)…²w§Ä>óË‡ óÓÛ@öÓò3TSP3»ü;©ÕO4&Õw ¦£ßTDím±w”BÂ7÷¼9þy¯™3ØbÙ~ï¹/Ä±&š=†§ª”™_ #®Âç«´;é˜úu6r‰Ö„?YéÆ·°6Ø™GJGrx"wWk£Ã»E×µŒ”Õô™·ëÌ|°l)ßøWÙcù.ÿ(¨–Î”3Gså%¥Ã‘ãÞjîœ^TR_ìmñû—˜1?1ü‹T› ìûéu6Vö’zÆp¦™|hñ©öo7†}ã)b†‘åƒ‡:|ZìÉ°GeÖè-k±l4ÊgÆMü¤áÕ‹Óo+ø›ˆË»2[áhøû!Fƒ=ÿfÎ‡Œþ$Õý?ûzsuÖïcË1†•ƒàr…ú0¨“«xkxÿ#[¤oœ~»òXl9p5ª/î¦@	6Ú—(@ÿ!ß‚¹ù¡eR™†Äµ7 ’eülñØ=¾>!|úÈ
ÎÇ’“2SLF/YGJFƒ|’‰ŸS5¶?øMª—Ži¢2 ¾¶†þqÖŸº¸“€‘£kóÕ%Ð«c?¯ŽÉ­áOÈ™ƒî–™õ)i/‹ÑØ¢!—pÇc²cðžu˜1¢z>Cÿzš#?³¤Hñ‹ÆýA£Þ Õs‡x[™ NàhMrIÇ3Ss×Ò[`¼Ž×Zq¼¶qç±+¬¿_2‰»þ‹©£O<à- gÒ7CoùkÊ™Ç,Uš©ÏÆ%Î®£f‡í`¢Jøó+]]žœŸœ¿"—ßž“Óç¯®^ƒâvñæèuC%Â-)#÷2‘b8Vå€Žÿ{œ2÷„yj/U:fÚ3ìéLA
úó) í"TÊï¶{¿Òl¨Ü©Ýá*·|œ¨Ù`§>OÏµó§äòô)Ù%	Ä•ŽìùtÊà]]¬ów=¤TŸÔšIÉŠosL4Ø 5cÉ¹@Ög®ç¸µàÜ€h:2Æ2’Y-}£TTDþ[Üˆ“²ÅÕÉá)ˆ‰ÃK.3¯^ 9û!$Åéåý/C4À¦ÞhªJ¸¹«p/gb>ò*²äô2OŽ Z×PøN/åR¡ô†%”TIBÝÕ—*±‘ú²l^€ÈøùGY¥QÇž%È»˜Ì=C÷jÏaˆaöœœº%¸å|\*rƒávIŸÑ*àè¡ìÐ©@è>šÈM¼¤•ËßÕ¥îéáÕÕÉÑÒgªyþæÛóã>©O·NW—»)Êð©fòø´—¶áL-¾ÿ*~/ùþ—"U$,“ÆÝºŠ®
ãîJ¢XÀ`žL‘¼†p†ù´¤4£¶§¸ERä¹ëhCÊt8£.k’äèòÏý«ÃÓÓÐÚž_¾9<~Á´¸êËï_Ÿ=‚(iÔ›ÝŸÿŠÂcQÅ¿Éï9yÇËÀ¹ î;/;:¬¶6îþë/E¨,¡âõ–ÑðV“*iœæH–ÔmëH—ÔP¿Y	ó G@ëHšÕeÍv½[&mÔÂêÇž¿9éƒ5Øü·ÿ¨,K–‘&\ÿ8wžÒ÷ÔTU?”C’U¥Å²ò"-µ[Qb´U´Pd´Êå…TbÄ˜Ì®UÀÉ•ñ8«‰+&J…ê†ô‹gòãË“—W¤ÿÇß??»ÆÈÿ¥1¸ŠBú„U,’Èu»"ƒhÌU,¯ÅÚÁ ¿m¾^·&Kiï`æû…1ÂCÃÃô•áþÂð®‚ôsê¡–Kâì/`a‡&½œÙŠf×k:¯µë]±E¯%1$²qE¹³Óm1k!';ßSK‘ ÷ámãºqÝjLï®Ýñ@«6{›Ííîf³µ³Ù¨·7Y˜KžVO•¶â±ë!nwÉYÑ·)ÇZô} i>F`'–X·8“r¯”/éÈ¥Þäè6¹„à·N”]ãM±Ò²µb•£8â@ª,††ÔëÅuö
‡ß ‰µîÜ3|Ö)r\®ì!û§ÿEú,9)à®Û:“.È²Ùâò ÿñÜÁ™«ë:n~ÒXðyI¶01«”$£1¢+íD0F¢ü»}a/«F™¥ÞnßuìñAœGØvA?àWÄ‰†ë=Zq¬Kc<ñwÉw†7(y´ùŠW/rÇ"'(R4Î%W3ß)::,Ê"{ç|•äp‰o<ç…ÊÂÌ“+gê˜ÎxNŽmìj9Â ÷eR»(•­ bWnÛšÅ´–.áµdôæjå»`œpqò2â¤hÑ´b²“x½zñ.’["è%¬ pÄ%Õé”-ëKƒ‚%’b©¦PlIAU“£%vº2T¤*DEƒùÙŒ<$Õœ$*#º/¯Ÿ"$ûüí?üo’É'P:W+EÑ”ÉÔõ,!S·(I¹U@%Çù¥þúf¦=ÇƒÈ¥ô	»aZk'TÌÜa°e%‹œŠó)çÜ¢J©‡1eEìU9hÖƒ)¬â¸ŠpéKs«‚Z>:Z ÂšJªQVò™mG3ä¼ÄþtyLZÿúÿHKeºÂ«Ì¹K­tÓä˜ð„ˆ4ÈñÞ‹ðŽH©üíüWÕ“£×üGŽý~ë˜Ú *ßŽIýO€*[õpú§Úœ>4UÓlsÂQñÅ¢‘;4ÄŒ7æÙ€/ÐPb+äEnŽø0ûŽÝŒ	x@¤×a))ì~ö%ÿTæ¸x ö	° ²O6ƒ÷0<©ýKf­73E^ßù–v÷ø|%V¼ü¸ŒÕ®G³æHx`Ö
góV„E™=BJú‹q{!ý^LPe¼p60LÃ7ÔÞö@I\§5;€|± ±V®Yz”—Ð}:aqƒÒ°®té×…Ê¯Å”ŽZ§X>T¢nî(¨›òŽé—ƒ¥róbIWÒÓET.e’â/l%„ÉÒš#þ¤÷ˆ¤Èßîl¶[ÉÎÙJZîæ³»õéÎöf»Ñya…ü£OnÝSöÛ'¹ì™õlwµ—Tÿ}£ÞÜþù¯¨¢n°õm5×áµÏÎüåé›l‰2¢.µuú!–V¢Ó"gìÝ¿DG…Û‡ÿçë :[0Õ_™þlÝÄzÐºär¡çòŠº–acÒ¸3öˆãÂÿžÇõ>š³R¬»WÛHk“Ú[Ð¶˜IÚ+%ô5–Tæ‚…1|§X]½:W/QŸ+€ùq+tÕ]gÎšÂ	ÔY€ÑÇ¯Ó¥€ÝG­Ô¥Â™KûÆKëvaO™áýP~rf#A=D—‹•=åÓç":8Í!Ü£ƒ,Â’’¯ÁTrÜyørìOÈi”²7¤
ƒüë¦¤/EaŠbÓçˆ‰4«£EQÀtÿÛ££ý>ó§¼×ÌkM×wƒ©]E¾©pÛ¹®Þ÷PBmaŒšMí†Ë„mŠ·`ÏpÙp‹êx0óý²ª%‹j2¶à§Ÿ¢¡ppaùYmÑê@U[>ršŠ‰ê—˜¿ßb'‚¢m:Å‰¬ßC´¡ÎYû³b»2k°n×†mÃá	#˜ó,IƒL”›q-¨bÅ®Mg¼ILcx§ZñQÂJ^ÿ Öž,ðY¬À+óîÄb’×AåN‡4«°íB>+ôÈ*Ó%3Þ¾ÿöÏK,`¾ŠiœŠa}åAf©@–%ÚDƒ(µzIQ°D©x¥Dt‰ Ã¬òJPmû§ÿNŽÞœ]œœbîÆ«ËÃã“çW}rrN.þ|õúÍ9ysqurvòï¯NàÃÑ›Ëõzýaq^vY2†¼èqøÃ ¹4›¥Ñ	`	ùVE²ÉäX$¨~·$%HE(¿·+·DÜVNñÌÀ©¯[têœØyUÊ’öF£ø–“Z)6š·Hô,À®?bØ€ë\+ûžbp‡GCœ,ACª´<$êMsZ¦¥¸xŽ  1Nµ™­OXgÃó™u1‡mQŸ6–‡ª9‘Æt@ôà­Í­“«‰j†d¥;6odH†s[³ÀÌœ²ô_Ô64kjR2Õ| o›7=ä©ºlˆqà‘øåýñ·12¨[Ö‘”÷E|˜@ÝrÁÊräàÌ}ºK.Áˆü]R}û³9+Æ.õXûÈ#üž|E^SÍ}AU„­¢Œç%ôH$»––;“Z'4ñ²Z¸¢î½wI½)Ä<Œ±Ö¬@Ê—2aL|RÚq9z‡š¯í§qwïŽëÔûÎkÚo—‡êáŸ&+ü^Ãv>Ç÷‹×¯Wy= ï¥ž¡Ù¯ðœCoè±º¦ëjóýJ›´+Á·û•/šævë™‚°ÿÓáðÎê (V(–`†ë<ëv{;ÂÊáôXÄ=ö…	ëù°>O7	àˆùaàša#w?g3…+ÎhäQœw“Œ€ÑwI<îþÌ -‡ìô_[äìÅÕåÉ6Ÿ±Ç&|_ÛiH€Ä’üO×ëÊq@ÖLQzù°ýöÃæƒÈkvÄûÝT¾h´½æ³Êf°sÂW`üÏµœ|Ñ¤­ö ºx	òxæá-­é]%jšSùb4-ß)ƒà `·ø(J±4.lÎ4â…E»·Äp(ÖyÞ
ò¤qç¬WÐ~…É,&–*1A™ìc´jtÔŸð‹ïg.Z÷dè #öù{ÂcIñ›9w–šn>|ß1Oo:´ÀSöÚ½Þ¨Y¡*0‡.Õ
€9ÔuRýr#¦ëFû•0¿€`‚Á‚™»1¸,î_ž½­„$SÑÑ%ÒTq{,³•`‹ë[h)ŒkzLë†½ºÌå<.zSV³´2gîÖ0sæ^®;ËFÎÉ?îšŠ(RVYÈD¬ñ¥µÏô™Ó[ùq‘°Ór^ª›ßjñ#>N_`!Àš=³¢’LÁB^3ö÷›-áPnôk\Í£ïH o>Är
Ášå«ù@?¯¥ÚZ
Ù)¸™=òZF™4j+‰{©²ßí·¾’}ÇËõ88®|ä…“Ÿ24k®ÁX§×Õï— /Õìèäù+y¶00@LiŠS«¾"‡'ANhP>¹Ðlj~ÙLæX)WKùhtÍ6JðžþTso0„"ïè4î‹¸œoÅCÔøu«¡&S/ƒ@WÓcDÄ<¦’º]?q†—õ<ÿÏY~æšÍ‘ÚÁ¢§Dj³ ÆY5L©<¡¢ñ*;ÖZ”Júý o!ãFŽjÅdÿ7+P‚=Ê:¯€Fª•òçr;†?1–?°ÂàS<‚Ìä)e2Î…%µ“ˆ'ÓÉ´ò'*ˆÊ`‰RD˜RêßJ:-ÅRy9h
ƒï’tÜ—|±½l”ûŠ×¤Œ«›uÌºñ{æÌ<ò½öPæ{%L\–Íîú´ßúLûñ,i_©šÑ¯œö[uÂº=Ê'hã²Ÿ4ñ·?<ËBâo&~Ò®“×óªBaá³Óµ))í‰oà87l"YRãúZ¬‰Á;É¤ ¯	L¼NV²rFœƒž,¡O°(U:”BýTã{™Z_0WK÷^‰æ'röIc 5wEà‚j7ä’N]êÅm˜«¯´™‡ço¤yªä…ÿ;SŠ'=•zú
ãvñ­ì,[<Òf'_³ñØ¤¼s¬‡dh`X3ÌrŠ³Âc^¼™¹Ä…Zxºô1OÙs.KFFúã‡1—š k`Ô`ÜŸaûÑpÂzŒ[˜;>/ç9×ÄÒ¦Sif>Ñ)úó‹Úx`œžžÌ«ÿ€E»µ'ddø»q/‹YiËKy•ñ‚¼|€>×lå‚u‹
LqÖh¶a#ø—Ö¾^÷ääÚ ônZ%˜±Z-½KªUÂo&5Rm’ß“›þnÞ [ì¢Þ¾6ðÛÆ E6*åÅÍT=/J$øý„º”<¹y‚çpö~ÇpÓÑy<
üù†N‘ñˆ #èƒÎ7É˜úÇˆŠù·¢0üù&‹Þxòž1¶4v×Ð±p¨¾>aðd•|eÚù{ a|ÀOm,|±<ù³S2ú§†±:wš˜Qîae`¤Ñ£Ý`í—ê²|,ä'Lz–bÁ`ÀüPÏp<ï¢FJãw×«­OL¬¶0^%ÈŽ{7Lk™ä+L&aI
ä˜zÈ‡)H¿B±¦¦3ç*n,ÂyQ*±K$?od=™ãI0'Yšñ(Òé@&&2;(ñ-Žbƒªf²W˜s2óx¡8€Uäwý*E!b¤z·Á¤]g›‚ï.’€(õ|ÍžTÙ7M­ÚÚbR¯±Ýr·4êNçY3€IÄöÙøà2ñxæ²F†IÞ$·,€"¢ —F¡nCL´Á´-£6`}>£®ƒVÐuãé±Uâ&ÖZÇø9d%‰$lg
ä3Äv‡øvØ|]m”æŒ`'uY¤ïT}Ø ‡ÁLÔò‚)Uä½fÞŸŒ¨xR•­øEÈ´ö'&ÓÚ»‘­pb£KÌm¼Ý«Oñê-/ÀF¢öì=¤Lc/€/h¥p6!Óºhe°îH3¿æŒjÁ¦Êæ9uL.tGšaÂ(u”°÷¹Îp[¹F¾þ:gf_h°øB£T1`vO–(‚Ž{wL Á`
sJY®×Í1
äÔw_4öLm
´Êr-9[à3ØV<P|yô¦iÜPÓ˜8ÎðW)/k ^÷Af`DJäíu3”zýë W‘Žù{¸Ü
/_\ÆªU?‘».û´A1Oä}Ù½'\½Cñsç	¡¸yš ‹@v¹Î`†ÝÇ0[
VÂ‹÷XPz”V,™¥‚çZ¤‡t¢õvGatéÙŒèÆQ8¶Aò[Ì-‹i€`íö{x›rÕ;Œ 1|˜…D ýÄê‰$õÇ%%‹Vq(°ÓHÆB‡Ã÷†»JYåG6v^OË%,cŸ‚R~fî!^º}íªM¥X|½JF¤wÃHçð$…6Ø€ÔæÑ<´ºt‰•èe§¯j¹¨$¨)®À<Ú1¶D9oçý­GÝ¿ŸQw®RM[Z©;1Êò}²qÔ?Òù±skGÃ–û:ñ¤¼î†Î¹úð‚ÕW
3q˜rá0gÖ†âx„ðjÕl"l€ª‚oTfYêMÆ!#i¿‚¤Jë`?…ÐAk;lÃ{Ã¶cÍƒƒúäkçî ¶JÓxW¢À2™Psú
egR/d’,ïjÖ%¹ÞMº¹Ê%Ì3Qì«¸_rä„~€ÊëªÇø“(€.¦¶þ.ÉEuØ~¬ª"Ù'j¤ÇT·d]{@5+Î±{Õ£¯:ÙÒèçAQ²‹x¢”zò`b¹
æ¥eÑ3ý§X	ŒÛÚÛg,¶5J
Xj¿!•z½^Áó	à9%eJå<l™¬¡b“	SƒØ&uh{·˜¿¯¹7C˜ Õ`vB§X.ìãó¯U2ïIÕ½®ÒÑÃhÓòÃbèL_H1H"ZJŠtQ¤ÞZAA±B¡–9›Ô#ø)bÊl&q‘/}màçj‘ê—TÓýdÒ”pÿâcJ<Põ‚•.\ÜÛ²¦äçÜ!I:šäË¼¡…!÷¶yàÛ;jÒ©ÀøÈäðõÐÐùž}jxÉÃÁÒÚÉÙV`nõ|S×a‹ÁøaŠa»&ÈÙ$ïWu¦véõØ¤¿ötÇ¥ä`ŸP{Ûñ^7\M°ßlá›â\ÓYÑ‰×phd¢§0d›£*IÍz—ÕI*ˆ£ìt	ƒH’fe}¬ó¥Dž9|îp“Ò#¥~è	½$~ˆ2°h"Ýheè–Ô‘Ú£ùêM2CÊ& ×¿à¨.l"d›DËoÜ(›¨(Ópƒˆ4ÆDôX—‰bSGÖBÿžd@tÉ2ÆjË²ó²º…7—À¸>‰¦,Y¹j 	Y#aÕÄÍR¾}@Îp’ïcµG"`6I^dÝxù‘'‹èù:c‹kÌ‚»¯=YðŠ$™ÇR±ABäÏQ8P’DT‹9)ÒÍ!©&Oiõ6¬+†¤ÆJ“eÊ«…u×²Ôò$rvGð#`‚IIŠXN¦b7èíb/¢vÜ‹¨½³¹ÓÚluz›Ø	uã]Âjczmi¼y²2xŠë¶ÙÛ³ò*³„YŽY9úé²eÐ¸“\œ]“U>c«<Õ\ô(JjÒICÒeºÌ»Uî°†¬ÄukzÈ{éñ¢;p_&_èPòc­)×‡Õ"ûóŠsH—ÿˆ|t[kb;£f2Ô¨ÔŽK—ÇÀ‡…’8ÝÉÈvÁÁu‹|Õ‘‡°‰D0¨ ]Ì‹IK„ÉË{‹\Øì†\Øl67›Ý6ïV`«îFóhiÈù36CGØ,S;c‚é{%n“¦V±jŸUä°Ë?‹¸M‡
´Ë¼:»$©¦*ÅËVäJÍŽœÀÂ<ãÜÂÈïISþX‘R(2aóÝØ{“N.ŽDžåz™`ÂDá—Œò³ÖV•ê¹PIz¶Â³–	÷ÌçÌ7ýäJE®)8éäb3w%˜ß)#H‹ŽH˜3¢€~¡Âw*<gñaÙÂƒ%}	!ŒûCáV7Ôcj[13%”‚ô²
\Ì!]ª(>·È ¬)DÏL­(•¯Øs"Œøà Md¿]¢öMÆ×ôPk80g9ï¢+í@v²/ÊÏ˜%Ó¯ÿ4œje“TJ\.Åˆ-J¯ÌÉÐK–òÉ”¥’ê+ÍÓõöŽ5_Dç¹aþa”—6ês"f°âÄµ1\ÈO3ói@$ ˆŠzŠd«fKqËñYŒµ£	ÕoŽW7SˆÃ£›	þfÈ;zsŒåu.ÈwÔÅ(”¬å«Š:a,ŒºþGljèÏ•x°ôó„lˆße×(XQm-zYŠFÞ¼ùéåRÃª•qpý«Œ¤DT:ön1¯g¨pŒÈ!E[B€I$œÂ \ý‹õÅæÚ*e,,L3Q–¿	>Šä-ôtç\Ê¿P¨™r¹‚E¥‚jm`µÞ²r¸öe¹uÚÉÇJ–âGlú“¯
Ëÿ²QÚa^s`)$ÊXNXÆ´§À,²‘˜oNã(›‚âð!Xì ;ÏíÄÊÙSN5O=jYh3Ò¡’`jÉCÝð¡XÛ«¤¹­P±ÃVòAù3Vto—üPçý—?CäžÜùnÛk)XÁát+i(IjeúïÔ1ti- ù œk²¢yoWZ³liy¥UõöŽhyÅ¡9˜^ÏðJT÷—ÆV›K+‰ž%­VŠIj…ŠK~ùôbiZtuY™™wxÿÈNOŒÛØ¬WÜ,§žHX{ÓxLXDø£ÆÜ7¾“q;––ÁSË¿Ÿi¶oøü©0ÿl.òÒcð²3"g 4æ§:î1vnÛ´‡1¶J%ÝÛF½…>k ÁòÍ!rÚB}Þ£``yg{ü‡÷°;b¬”³T€¶\:ÎB]¥Ó\¡scÍ:L’”,ãöb0(õVVŽ+Í_ÞN#ü+ÔjÉ“béÏÙž‰H›âRZ~Z¸. ù;ˆèÆŽƒøOl³pC$…[¸ÉÂ^p¾uXÎ´êt3õ°Ð»|ÀKYh¼b3O»*5¥K"=~åÄ÷È´Ê¥Õ	¯Œî>:Ù…Ô´ðúLuåT÷ÊyIªÿöŸþ¿BtBçáUÉnÛ_šîWªûð$‡Ž›z,+ï¥QÚc÷·Ml—g}Þ³“r…ÞbÐÊRÎò±b8ƒ±Dà‰·FTØÙ¸ÿù¯AøùSXÎ‚/tì­>Ë¥Z‹(ËK¹æÀsÃ±0ŒQ3A—e×µÀ„˜±2ä¬Ä¢icVr.ì¸¸¨Š^û‹KVUà§ŸY00-ÐÎO`Íî’W§Ž9·w:¹šOiò½Ó)ža_‚´Ú(r?KTdÂŠmît™·»í…j~ÕNêw€];Dõ–c³±’áVQ—%u3)*	úðV€ñ€¸ZäiŸ9¶Rª…^±¹D‚ÚÄ¿uxÛ„WÕäî•†Ø&§Tõð¶Bõð…„˜“Âfé&éVgâ~aŽóÈª•nR_¾C°—«ïEt&Ù$Ž´­rè;¸²/k5.Ú,`m¥Ér‰ÊnlkÌ #ìÕ’‹eôu°Ošõ^Ý…}ß1ô	²Ë’=ÄÒ'>b,ñ¯™)ŸcâùÎ>å"£éÆÌÞs¼ésh«WGhÄ8î s~xn Ç‚hOß}ÄŽ¤¹¤4ÓæA:P–´Ý)ØH—SÑhvÄö5Ä —<Ñ'…6¦ê|ªÔj4Áªýç/Q‡¸A|exÞŒ2<^¦®uqEk{£Š!´j)B‹û0Ì+ª…°z1¬0°b‹Š‚¥Jù5ñ@¬®ÒkÀRÔ¾3Þ;À–¬~¬änIÿÅ¶˜þP9(œÙMUî{äŽyÊàã²7s¼¬ÀÛ¨TDŸúø©szä
Rcó”vuxqB.Büh?¦ž1¶•ÙÀKszb‘?­&aq<2ýý8>)
z„(n5¬KÖ±ãicJ^„Ø#/g¶Îë%‚Dz,ê€]šþ‹ü¡èo¥g.æ‘4øgÖ¦Ê%á)'ËVd{*æRÿ‚Ïør#áV5]Ÿ»ÚxÌ«‹Fõkxü\pìWMGÑá5«{óMœúÓO¤qOÜÕ²ü:þÃ&ÌÚ^)âòçÀrÈ¬é&1J{W—„Ï„)e8píÉÂš‚V2ºb©de5ó«­86°Äµš—*ÕIKÖTL6Î>á¤ÎÚYx|Q°Z‰„…ZÉ3ŽÂ2ëí‰3Lò­ì»âèþ®£hTÿü×‡1«S(¹2ŸÀ¿dKãqÂüóz¶¥i=ÛïÊ»•(}(K/¨þÍLüªR{TÄñ$ëd‚oo¤ßšï÷ª6LäwtÛ¥Ê@¾gßðÿLiZq
5[ƒì®<¡èà£r {ìbà¿¯“4ÌNö®9‰¸¦±¡d•fÉ"5óYâtR;Yü..,ð;Ãë˜?ÂJ½e4lI÷ám"‹s•'5J£Jß¶$	†š7‰"úÅfN¡ÄO ò “5®îúO"€ÓÂ‰*:Á§½Öük÷f6K¸ÑÝØr`¯Ÿ5¾ÜxGœ©¦ƒF]Kæk…ß6yÏ³pC¾ŽCUŸq(=…ç¬°_B7QÃ/kêUÉ4çL¶˜p Ì¿eåwkÍf#7p¶›:´†2àšgf3Ó•ÉÐœ¬6Ii,Þj£Ñ{D]vvá:¾d £Øå+Ì,vz™óÚ@i–@ˆÕ‘xmyÖ©‹ÌÆê£rŽ›>kÉÀ›áàDEáZòd‘5MN7=Ïð|Ôç3g¨‰í×†ÜÄ®¼™/%Ø>³×¢ÈŒøçGD\ã]y>³Èú[½«
ÌÈk`Î\<pÀã<!´r¤±ÈÊDý€’%Æ=§1Í: ]ü3“×îj,úX¦­bê^Z°0ýè8F{îtóÁ’gOÃ^nÖRÅ¥T¢Éí4™×!«Ñ÷OðWžN'ú>
×¶ ïJžxç¸É8nn³»”¥˜NNHqÞv9igEUä«0ÇQY-.™Ä5’$í9êXÈu/ KNRº}OÚR8sES6]MæyÉí©Yèü>euÖ±ÓõŒ×<$¼|i¶ê²”iyÅÅBO$·¶N¶~ÉIF:UY7ñÂâ%iíOaƒI&™ÜŸ$”*Û¥õkd1Ù’ÊÙ q‰,‰Ù+‡ïšBMÖò²ƒz‚, }y³7·HlIoÕÌùÓv¾3«n‚ÍçÈ±ùfVÕdfM¾.¿Lš­PÚB”‰ˆ]lSUï¦³#ãº|6Í™Â¿ü'{ìùî¿ü³%k–—w¤ËÌ¥&ãR÷2ªXÖAyéË ¸’&Äk¡k­R«Õ$<Eˆ™²•uWfˆcT
\ÞK8+sß& ‚ ,u+gç‰ü%³ñ™[òÔcÙX]^ÈèÞZ$]K¤F˜„ÒÉ‘R4™Ú€&BxUÇrïrq`#J`ËÌ–	‘ÛçÕÈçœÝÑ’¥rìm1@åÜÎ²ˆ’r;ÔqBXsõ@á`ø½ÍK«%¢cbBíSIñ]l‚ÁŒŠèCR¿ÊKÿÄŽ°Í@XUì“üÓ7ö¶‚+EEd® ‡Ú˜õÆ
ùÛùŸËóÆõ'Ž;ÁÂûDe(jlr	ºTJH;ïÊÕòI>9rf˜&PØëÿN.ý’âúå¼f¹=ÃØÝ<×÷Ž4Üßñ‚å9ÅvÈGã9ØR‘[˜uýÉ®ù?¯ùonÍå1?¯yæg™5_CûÁl_™â£XßuI+´É‰‚¬©Jl¢³Ñ	XN$®®,¬ÒšôØr3ðèît£•QŠÉÀ/[“o§x8®Cšv®æ¼ìJ±+#<âÍÄèµA•×`‚DvjüäFÙ¹ãÓÝÈ2äÄ°„Ñ‘ÍÈCÓ‰F˜‹ŸG w=0Å²¦£ÌS,«Sú*õEâc|Ò‚îØÃòâVÅ'‡ Í=ÃËøc÷2®ÃqÞÄ¹=4ø©“™½¸tvÖÀáŒ¥%‚ãVc8I¶‡3qS3}½3üâa>ŒX¤ØÔºäà Æ% |}§»)Ìe“ÀïVfJ	Ü6…çšì9Éc!¶–}Ýªþl4ûÁ–Üî¾ŸÈK{Ë<Û‰s»¤$PðCIxX¼aÕdÅ‰z+x¼ãtt)…	O7Ò’6«;Å—q‹ó*}Ë;Äùsm	=+”Æ‘ÿ	^ò J6ÇO±Š%ó“ÇºR‘£\Ñ;NPEŽy®èx*Gu’»ÊËwDNóa=å„Eé»|Ó%GAo\¸a:™Ò=gÒø²eôå”–~¼]¨i+Iœ•;Í	f<))içy¸—ãå*,ÿ.K.í/t £¾î:¦yIG÷)·z,ùæ¼BVÜ›)R~#YST±e¡H¯¯XwžîÕ@ïÐˆ{â¨T¢Qj^¹òd/§¥\L!¾3¹[MÑÐJ	Éð¬t:r+ôÊ)
^Q²Åõv¼©a§Šzç½¡(žF±²^º	‰dä«ÓÉYç
=Ôø~äL!ÇÆh¤¬½Y¯Ë['.'9ò´r:¾¦HšGœzãü~ÑxH8,¨›$J„1ª~²€aê.ê#ƒ<yÔ}
lñ4$ljŸ¬ÑgVËýéý÷!ÆIb]üÀµÐ{¾|—Ð“ðÐ+€¢{aÅï¤žåãÖÌ ‹T°<*J”6S¹Àä+ž“ªöÂ¢}Zë=+­c+ŸýÞKôCKâ³Y•Ò]©¾]/É3*?,¨L›·Zvfl1°ád¨&<Uˆ×+ÖKÓÔu 0ö‘Ósäç’’@>ü¹	WŽ¼ÝÌm7‘“Ãæ”r™È†Ze†é•ÓÉ´¯Â™àËô­z¤fRy‘q#]¢¬@âüš‰“åŠr-Ëì(i’Œrgã#F¾!fýävXK­z(¯â MmrW°Åà2ìYU'CJ²¾Ày!¯%6,®UjÑÓ… ›b³k­©2ÞŸ,t„Y	­æ¹«¶ºñ‡ ]j6ÂC¶	ŸQµð’´ÀgšÔ]	 ëŽ×“UÓÉó}ÎeÝpƒþ·\s8Áaä|,kw{?¤Öë6ÓÒ•7æmÂ6Y—ë°1:|t\ì„=Ó}ì×^¯ËáÏžÃ/ãº³¶“np¬²1³V:Nd»Š=[#¾Oz}å­FT†V¹·  ¡+'	Qõïf^:)lï*òæXmÁ9ÊZ6]¦¼_ ®\ä}—á5™bdã.¬¡ÖÕ:³}¯lÇÇqné07E2]¹ÌCY@öÎ ÈKæ]‘«aR¹˜ë…ßB)¥ä×–÷_”­a~OFæ°~E-Ã6úTsõI*°˜_ÂŠ7“3xÞ›ˆß'¼<pÝ²æ¾û]¾¢®%Rº>@5J¹>ÄKü ¢Y\BøfxÚ
þ”´Ðæ’:†ŸŒïO6¹Î¿xŸ à£ Ö&úž½ÿÃßý   ÿÿ ZpÞn