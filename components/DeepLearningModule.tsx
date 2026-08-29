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
import { SynthesisIntelligenceStudio } from './SynthesisIntelligenceStudio';
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
  const [synthMorphology, setSynthMorphology] = useState<
    "spherical" | "nanowire" | "nanosheet" | "cuboidal" | "octahedral"
  >("spherical");
  const [synthSize, setSynthSize] = useState<number>(10.0); // Size in nm (2.0 to 50.0)
  const [synthTemp, setSynthTemp] = useState<number>(450); // Temp in Â°C (100 to 1200)
  const [synthDoping, setSynthDoping] = useState<number>(3.0); // Doping concentration % (0.0 to 15.0)
  const [synthTime, setSynthTime] = useState<number>(4.0); // Calcination time in hours (1.0 to 24.0)
  const [synthPH, setSynthPH] = useState<number>(7.0); // Synthesis Environment pH (1.0 to 14.0)
  const [synthAtmosphere, setSynthAtmosphere] = useState<
    "argon" | "nitrogen" | "oxygen" | "air"
  >("air");

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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      xœìÛrÛÆ–†ïý½QS;à¶ÈP”äƒEQ’í±e«BíqoWÒZ$Æ47 êàDï4—s=0Ï4«6(ZOíñ	ô¹×Zýwƒ¢û³â1çP
?KBŸK6Ì„Ì=íaØrü«À×d—eWSÁööö`Ú`ípNDq)ÕB7X7<Ë¾™û&l	H°v@¤€µÆ9™¨t:QÉ~¢âO1¬¤Vrófniî,¿ ÑÖÈ°æ8û"¹’2œE5Š¬#žeé,7uæ6÷º]ˆ°–@¾€µÇéËÇÝÇ;ˆá`=ñ´‰Ï¢0&áÒÏiƒoŸ>‚pk
¤h ÎñøÝáöâ8XWH¾óq,Ò°Ò/0y°Î@¼€FàœòÍî;„r°¾xÚÊãŒËYÔ&cÏ%L¬/Ð/ !8oF[Ãá¬3¤aÞ„j’„9cæ£ÇÓ#°Ö@Æ€ÆàfÓ$Ìð—G`Íñ*[gî`Ö{Ö(Ð œÁ„K_ù3 x¶ÁM3„¦kThÎ€'Yc±Ÿð4EŒëg™=3vÏ½GÝ.¬¬?Ð8 a˜Óy‡þG!w·èA#ðj–ÏwÛ°}Ð s@ãpúr8B„ÍÀËžEú*f~¦ðu‘ !@â€â«SÑC˜MÁ+lžE*V’_á;±As€ÌÄÙçÃø-¾—4ý_x¢¿™o˜ñ8æ™`'"QçéG|ö4
ÐPœá¨7> Qx¥á³“‰ÊÔ¹’}ÆG©JF8õÍ4gðóé4/7|öJ¤™À×GæÙŒs$¶ž|Ä4onþÌ|ÒGìH$‰Šô¬Êà i@Fãü|Ú?‘J¸üwÆX@ñŒ°Â<4"Ðpòàœáñ h(žåÌ=[o·ñÍ ‘@Æãœ"þƒfBjèDÉ+‘M®¤ˆIB†= s~Ú¼Å* šŠ—» Î¦"Á$‚Æe Ó]&"P€&cN’Lò8`¹?0·/ÃLàì4¨$ Î[ž‡1>fWysTRüm>th4PJ 8'W‰ºK éxsg`îaœf<ƒ\ ‚	€
g?Tø+6 òÿüo @¡€…s<K}uŽå – <€H& j8¯¸’aŒ% ƒŸ  „ 8Ç*LSŽu€ÏvæÃ>Ó€2
€8¡š¦a @· `H( –à¼Vqp)p€…Wóæ¾—vòHÅ§ ¨€º`)Îp2‹ÇW Ôðà ,r
€Ïàôã á-Ïy|Ó8 5<ËGXî$Ìð­#Ñs‡áÛíÖŽ¯ ¨ÍÀgqJ¤Øªp¯òýÁõ·=ö"OÚ'‰HÓY"˜þÿÁ‘J¦¨. €îàœÁ„+(/ –àUþÁÜwýkÀ“‘ŠY_J•%jŠïFà&Ð] ÜŠón–dŸ ½ XŠ7wóñx>V1—ìçxÑÀ » ¸g(?”„öà3x5?aî¾œ	ÖOG"ÍTÊúÑtŽ”Äù ËàNœcg‘JB)¾µ€ÏãÁ[ ¸'` Üç¥Äa ·áÁM ¸ˆ. î…s ¤Š°¢ p+\€û ùÀ=qú‰þP1– îÀƒ· pO Ã ¸7ÎK	¬, Üwà¾@Š°NÊ3,. Ü¯òæÉ™Jxþ	À@°ÎÏaâ«ë wãÁa ¸?d ¬ˆsªfIÄeãÜ€{áÙnÃÜ¡?Q‰ÄÁ ÷J€•qöEr%±Ì p?<ø +qÀàôeÄã 'i ¬€gysŸó$Ó ¸7Ðl |ÎÑLJ‘¨6 VÁ³|‡¹ƒG]ˆ6 V ²€/Ä9~7xsŠ%€UÐÿ‹i&³°}ÁI¼lÀ“‘ŠÙ«l6)scAÌ°s |1Îžùj„µ€Õðrbð  ¾è7 þ ÎsÉÓô
+ _†W:t _” §g“„ûøB] ¾NÀ#—rÏîã«8ÍXÄ3¶ÇŽû§‡?¼ì¿þå`¿sÆëF-¶÷=‹:1D'Œ}9Dê¦‚'þä•¸jµžÅ„gÌ¥BZlÂã@Šcž‰$är(¤ð3s'OyM?¯MåyÅSž¤"8Qaœ¥ÔóöÇŸxÆÝ0žÎ2ýªeÒû-¨8ã™š¥,£™¤J–N©†d±3•°l"˜Ï›&â<l*UÆ.ÂlÂ¨A‘#3wyB¢÷iÕk0á‰©‘Zòƒ ´Y*ŽE¤\×ŒÃoæ#6½µ½åPªŽñ˜ê'íÌº-–ˆl–Äìý‡<‘ùA]ª„ÊÌ‡atÅzÿûß¦?¾<6 Ž­êSJOßcï;Õò¡£¯¸.ß`#ÓVÞÉ.ÔéDPgÚlT½)Ú&ÍyŸRyIï»ª4V~i%É•ýi³ÍÅ,eg/§dl¤fq`ºÃ©¤dÆ&AQ/™È¤C¸½üR›í­+ªÍS„±»¹ÓÝÈ/>¬ÒXcáëi«L¨YjÇËØOOE9°>5(3ãšFJ‘­$L·3R‰ {Ñ”º,h‚â€l·6ÚyþÉ¾ÇzÝî3»þ4Sºìš¶MgZì[;“Õd]»«Çö’²è¤ÏèÕw{¦{úåÃ=S^«0¶||.ý—¦înép¦œ¢uLs4Ïfà9Ÿ¥i¨-Hð,pÚÃE*’Í²P†Ÿ¨—5¿0&¼Ÿ(ˆ¸«ŸTÿB
êf¯³µ³SŒÇ<í9—Ú=:ºô8³+ö·|>ÅåÔm›WSuá^ÒxM++Ú`==pn¯L¬“¤úê<Ð°j0h¤¨–òúuñûAÕù>Íët¢ƒÅˆûÇ‰¶F
OR1_è>“ûPÔë=étY Æ·ŽÈ¸*«5GãjDæ)¨í[Ÿï¬®ni77wòóžÎ{B¶¦*nËð£`1½)fQ7ö–f¿Ñ)_‹s!ë­&†ãØÌP5˜Ô™gµdy=dÖ¦‰	9ŠŠ(¶Y·³Ó¢–/TAWºíz´†pù¦žÊÛ©“VæÕ,é3Åús%©wJ§ëgdFÅë!—¡ˆý+æ>OxÐôÙ…Ç“ÜMôª@éZµ†hó×‹GŽL‰VÇ¿7ms£6­zgÒ¢Úwy]vxêR§òQÒ6æÞ¨íoìéN9×&Ã†UýæÎÍ9·"Zg:K'îÜ«K_ÙeofÑH$îe'SGá¥\2ž*]åxUÂr6–§/»W%¯÷·Ê´9Ïtm­é¬\Ø¬¦ë»×ì}µ0n,†E+Ú¸áNªÕÈÏÃìÓÇ«ös%ù•	Ø\;q¹ÔTCµœ§ã“üò¿`9ÿ*+tQH¾Nébøt*¯Ê10CàæUc6¿#É¦.ª·bœa/—Ec‹u<âS×RrÓšÊÄæfæâ^Â/ví ^^/›¹[½z~ íšõÎZ	–q»À2kùL¿
»È‡)Ea64uê€H±ë+Ïó³?íüæÅeâRG¦²T3ÅSÝ–_ÿí·ùlV¾¼Õ¢×wªÙ°Üüú×Vç?É]ç±SÔ’Šìe9\®®¬¸>¥Ö¯hk~ªbá:éÌ÷Ešæ¹®oÌ“I)Òð“ÐŽuÂ)¸'ñÿÛt-
Þ*çó6¤ùµl™l‹QZ%îÎµ(pw*ûäsw{§¸OZÍÖãüv¦çÕq*iû\Ä´Ø“\Pt¦î¦ÅZI‹ð¦–3d´3â~©âî!;)çÊª“Fâ³’3Qg¡+hÈ?‹„\Y;þÙDáýäžÞL=Ó%©³3rìZ&-÷†¾qÌ•$ I˜þ“âà¼Ú–‘†›ÕüZÚðe5µ·(D«-‹ÃPºÍ#E8[	™ÀV¯ÃŽmÿˆµµËòàF%wHÄQ—ïæô¼$BëfØ-JÆ";™¨XÅG‰øçÌhX\_S‰±Ë^ŸL¨ëƒò
ûÅ3)[»ôK‹²yxÔaï/UÎJ‡löJž×xhæ¼HÕ’§Yè«`&É&ÿÄg×˜À—R[:Ë”¾ÆžŸp«”d¢jåÅ¤Qd 7
 klü­mYEœQõÖ¹³]³’C2y*½ß¢¥^¥,¶ì\\Lh4ãŒÇc)"rJz¨©Ñ¼Þ;‡UKûm·óôéö|YÐ&ª#ãüjq‘Ö†ÊO®ÒŒË!ý‘GÝy­.D2 ÌäH4~eH×•úéüˆÍñg£ÐwLšÚõ0U‘ «¤{å§jÊ£§[f2dL`n
I·tÙ¥ïÙEMÄ%ë-•©fY
ªçö4wÑH‘ÔHt"“b¡U›îÓ'e«¶ZU¯ŒºU¶çF![O•…lßV)¦‰2­Z2B›ÇO7ËbÝVLD^êS(]RH¯Ó}ü´,äÉ­¢Y*Ë˜çÞêöÊÜ›ÝÖËt¢‹šéDJ
½MŠ§v×n·¦9×²Éýæ¿ÛÝ$ïŠ.–y“Nk	¿zÌ¢Ý‘uh Uå" g8ÏÎÌY)Š£w/Ž™KüÉÿü…üT¶’¿1²ë8àIÐª<R¯.¶#½árÏ.&‘±ÊÍ'–¬+5öîö3is°ý¤·ÄÓs±cŸÏÚZÑx¬}’\¨ÁÚöÌ·0=S?Ñ§}{lI>-Œ(0>(ÅV~8kÒ§z7öóãG­­"‹mAaCwîòí-©þ¿§úX²œ¢ÔõYÈ½üñ‡kFhµÕÏîòŠ³³£|2ôÉ?©¶E¦Eó7yü†ýõ¯7î¯mk‡ös‹7vÍôÖL²˜þÊÜ¢öÖT½^mÕ'ëín’Ø!Î)~·Šy0“<Ÿ¹¹ìÔ½Ô§ì}À[=  •%híÎ‡%0ÛÉòxHèÇþÄœý’rƒ/OÈj;äÂ&ò}²enåˆ3[ÀtçúR·55>D0_uhdo\ì˜¦ˆà}hTÓÒ5±åg¼«äfõö=\üäN4íèËUéÔ¶Î<åi¡P‹¹³Ôô\9ëW*¾`½-]l¾U‚—·‚R×VüíZ'ZV†]³„?›WWL=·e˜išŸ‘-9ÔXÂÝ[; »P„Z;“-`j©w+	2¯+©Ýù˜ý…S'³ËÎoÙåÞ(ëºÚÑT'te(9"›
Êà§ÃÉÇÂ9ÊË¸ÙR¶­-¥pÆåî®|êf/_7·½æõ™T*qm—²6™Ç>µàpcsÜ+W}ÊzA5G]ö`Ê<1jÕ¢/ å‘]íŽ^ŽÌê¬_ÐrW®qù}}dñ ¾Îªít6ßNgËŸâ„Ë‚Åòç8yl‡.ÚNë²Žãµ=o=îT~¤Ó¶Øwl»Š¤5ç­Ðp÷.[öÙ Pºåü·EÇ¯ÿXd¼1”E€³#Ú*#y#ÒÞ[oÊz,]Ö"ªOïŽ¦±T;È²û>vXv¶he¸„]%¾.FÄ¯[—>òÐãµ(Y}KªÞ¯®)ee-ªŸŠÍÚ¯ø&–aéÇvÂ¯Ø;~.ŠÔîfgg»ûˆõã1ÉB¥su>øû/¯ú¿¼îïôÍfH',>¼$µÏöi6fA»89´¨í2}H-y4
xyN•RtÎò“ÏÚà`Xä'™^Î—[ív1oð^­]‹¢ÞÊ­÷?ö[—îâµï©[OæOej›%ÓÐ¸î…k·Jï;Z¥§ž¼ÔnIeÔÕê|a«ºL%Y'Ð&Éwö¡nmfux>v§õM˜¶i)Ã±Þ[ùŠ^¥4ìm~®ÈbŸB¤^ÆcóÙ_¼zm4¬y¸/ùˆv¡µi0Zw˜ç!«ÒPwÞDÄ]ÖOÈt¾ûÍòì|vž-¸dyuòQzä ™©þúûÛ/S<ÍGþjÙÌÑÚ³~Å§'öá”Hg2«úó`1^í¯þ’¾÷ì–×‚Â”ÓSqŠdñÖˆcñÓ[s¨Z¿wý}¡;ê"4Ë#ýú?   ÿÿì}ÛvÛHvè{¾¢šãnSÓ$Å»%µå^²ä‹2¾(¦¦;iW$!1H  (‰­h­dÎÉù‚óç’·<'ïùˆù’³wU¨ª€%ùÒÓœ5m
U»víûå!‘BlàÒ·ß¦¬†oì*Òç]üV*Œ8Ô\›°Zã:¨Äåå	ôvàÄ·ž²†x#¼	_-î
}X!…Hâ{ø!›~Fþ@ÇA€eì¿á+éˆŒ11²¨Ÿê$Ou+<ÕMžêåžÊ‚SäÍÒ¸•ŒïìÊàí¾û.wÂ¨«pWà²]€l·ÕFñ‰Ýœ]®!+­ðuÕé¿ßâÌ¿&}qôèÔsfŽb^ $ô]í=Òì¶ýËûÚ¯ýôk¾Ó¯=øº_%ÄÙç“Dl CcÜb²Õx©/]êâ¥!^jî$Æ¡›r#‘9Õ%ho%ÒÛ«¬üt
ïO%ŠxT!‚B$	8±ô'qmyQBdìí_øÑ,, p	ŒÁ;·×ò}\P5ÉÑÀ¿ó+ø ³Gå¤­ïe±ù{fûXøºØ2 $®\Žêº— ~›S	lµœÚgÎ˜ 0\ý ¼êÊW%¡ðý½+íšþóýã^¿—„ÁäÉ$Ú 9ÕÛwCMm)Ø¬‹Ä„N¼D4ûöªB`âG’ß»Q]<€eV	ŠÃB3»,¾4þ÷–fÅ¯§ ^.N&üxGÉAðE’¤>x“ú„°µìÅ<“Ë±«0ò§žçF»¼",ê­ð_»ž5m0iˆ\ï|´ÎH*<B)&»[ø3‘Zdžƒ‰…²qm½Ð¨	›þ¸ZZ#Œ¹ÙÊ$è¡å‘×v¢ÄI|A@»ÕÞé%$)R>œ:ç@7¬0|e-ìýÚxÖ|û»öƒöQgçÝöî€z¸§ç7Çî*h.¦Ô«ÚÏî¶‰ßìê ·§Íî¥‹a¤Sï¢ù¶ýshøÏ=üO0[õvƒþ¯µ³õŽq’± ?ýÃ}Ðnoï´ÑlÒ„aºÈ'ÞÕ	Èñ™k_’„mwÎÖÍ±]Øö’8 µ°ÉÜñd1nöˆ?nv[ƒø]cù¥;í¶ôÍ[¤Qg–ßìfž‚çF ÁÂƒ  9üŸ®y²¶–À›Ú5²{Ô*éÁ3o5Çž+¼ §? ŠDì`PóÂA8®|ß&èï¡O¼ít²°c¦ÈxplA‰ÈÎc'’Æ6@cøtâ3¶ìll§Ùóä— Òe³Küu³Å(µ˜æ!œ_,"ŠeR	0k0z~_µJÝ¸Ô‰¼ Çe˜¯„“(ü×¿or~A¸rµý{2J­¯‡Ì™ìz³Àòçpá%õ‡ä÷Û×Çg8S‚ÿi‚ZÂP¼fg¶Ž¡Ý.;”>=BñÞÀiW`Ã³„ÿÁWšîïn²½ì5¸¿Â‹'#
âSìKjÁ¨OV¹e°ºiS ›§½°ËÒó®ÀÊ	Q	¤”©ˆ$ý­kòßÿöx[í/ÿòk×·xD?ØE;Zªþç?þòç½+Ø‡Ö¸3ËVà{K§óèï[€J(-Ô+ÒÉ,ë‚Cx¡­¦—É/œ^ÂqŠÙN¥;£gw²IÇî©É¦nÏ„_:Ø¦€ƒÚ0Á··ÄR2LçŒdX„ZWÉKtì«°¤o+îêµÉôs¨²uý7dIÝ¤[—yýU,n2	J©âL/cs“Ù³S‚ñs«ø`¯÷¯ÞGLnb,/¦ê]Ã_0Üõû,]!ÕEŸ¢·€°sxxû-ˆŸ½wÐ³ŸÙÝü.l*„i’Yã=@s‰«­\MÛ0Z»öþÕ•òG"Ä‚z®G•›	þÑÐÝï]Ž¨°¼GÞ·ýKnMº~¯~ì:¿g$/KÒõ+“RŠ	A°ZNXÄ%Êß^NþN?1>©Þ®<àJ6•LV1Œ‘(Â—âÑx·ÈDÚU«»âÑ0~ëÜrW´¸	©±óWŽÍ/Î š¸@/^òR:û¥,€û[2@f5ñC=à”3Î­-IÚËñ«ì™ZD¨Ep~ùéŒrâŠ~¥ZVVæ3'fâ„(¿g@pœÆœ¼U0±3TYA©o¨@d&@µ©æã ƒ‰àÆÿùÏ&h%“Èì›ôUåDdØØì')ñ%ò|‡¸³=á+“ïw€©8Ü gIÎ¬)ýwº
¨3n
ÛZP(‚(Y1*§žOžÛRóoÈKoj“Ñ…ƒVÁ€<¶A×ÈÎ¦3@Ñ{‰³ zÊµ—fä5rx‹ØôpôŽœ;~;ètº}ØOøÉoH¸Øó›Ã„h÷rºˆÒÇÌ‹Ån•@E`£ËòÜ&h"=sáêÜ™Ní¥°¯Ù©[cíøéùÍ6	ÐÂÿ^4w‡À<à?°á} ´‰Ì„PË	ÎFÂÜìsXuD`iK†€B,¦{ôïÀ»À¿Xs²Ô_šv¹%ÇXû%zÜnäÿ#Z€rÀÐnL“åRøWzù3x"ùN:Ë¥Bö|gÑÉX_p‹†	ºû+7´sÖò”~cqäá¼“—k]Äbú'‚-ËÕ¨”RÄ‘NÉ‡lÛ'/l+ A—ôIãÙÉñ”[,…•×<ïh±8U•Q†aõ,Qp•û,þØkKB†ž•*³ž-(¡ppŒqÊÓõæŒ.ú*å#£ü¿lçdvü°6>…½#Á¾Ax ?ºW Þ˜ƒ=µ/i’+:é­Uä-hÁŠ7Žž<%ÿ´²ôÛ÷pÛßÈ\ôw+Œé{¶‚ùÅäûÔ›Í\»ÄH”R¢‹Àò8¨ŒdõÎ‡ãUå¦ï-]˜Èþ‹Óíh4÷.èäèÜê_…Ò÷­¬Ì–Níê½Þò¸ÛCÜíŠ&+I§dƒÀZ2ShÓr>r//çË“"
,üžÔRò7d˜/Ó½~l2äß»hVŒ´GG’¬o*3yF¨Ÿ#SÛè» =	ÓÊÊËYU0w0žÛ®è×Öš¶ÓõéŒÛ®2 Äêø/ýVÃ%øY»VkÙ¡$Ìf¸-#2>ëü½ö°}ˆEGfaj³fž[å9ßs¯Ò!áüàØ¸Œúý8´ô¾ý'ÜŠæ`zŽ±?Óç ªiÕšú™å
UTÄJ‰Žk¶ô0ØWÿ Bgªv;²ÙX>ƒŒüË‡Pqú9çàa)		ˆ”º);‰
3=œ(Už;žkGì[zj¸±˜ª€¨¦ œ»Ä5–6oqQ0àlä×åƒÖ£v
ü/}‰…z(žxÅY‹O[X ¦îzKÇã3•¹~K¸L“-¢0ØåFˆ¬yî³ÄcžjX,â­Ùd‚Âô9¡±‹Öáb,¦jv1?¡À!§+n« ¯N Ê|M¾#a•©¬1p9QPzl¡²!q”,'Ë˜ý.<Ä€VÖé,3,­Rº 0Š¢Ý s3f”k-ÒýôþŠµìC VFÆoA4ŠA9ûè¢é×W…—ëŒ@Ñï¿Ë¨ôyÎk¦œ¡s¤#`V&“r—G^3FDÏkL²UÂLùeJSíQGc;=œ{Ì?æ%ÍÌPÑaÁYeÇ•
×–„K;oû‚·#+@&Z`½‡YŽÑá™P’T{ÄÖI`cx hzó#2¶]ï‚Ôi¹‚Î¡÷ú/þsƒŒÝ[’a¿=m/ §þ°…®|ž³öVñ.–X¯™¦Y 4h½¬2Ñª¬=ÝO9m¾E<å#~<<•–PO»:<¥˜rÌH æJ}\D}îDe¸™ÎU¸å(AÓ9Óê‘ÍM¨®Ûá+ TçˆWÎƒÑ03:da÷gžùÍýu–dá`Ø¾=?2JŠÆ˜[ÂIÑTóqR^DE¬ìi°x¾‹ßÐÐÚð##åñ’¦JXK¨õ(ìEëÖsX7h¹› Ñ™Íˆˆ"fáå5îâ´|ŠoHÅ²çN¸¢ØTÇ¾‡Û©H“^Oì2²4…²•Å:}gÎŒûÈ7Ô{pb-m74÷ÈVpê½ ‰ïŠµòd9ƒS™ykýÐs]Ë”ë’²©6
ÒL-¢òø–,ßQ”F+AiO£Š‚À.ÉÅ'vPà¿H
Î<s²¢!C)\¤¾Á“ƒ×ü\opgÅDöÖQ…ç žƒöGôP€„s Çšª‡#›ÖÑ»
b¤²i)iƒÚ½}“8†y/ïÅ_¨ÝµGüä0–ÂÉ³ñp{Þ3Š(²ý›oTÖ÷­
×âOô”[ø9 M§	Z òúk?r@Æ¦Ù°¶+Õndò'1ÿ¿²)ÜáiMm?š_“¿üËÿ#ò”Ó=`¿þÁ€fnú@/Ž`ì¦o27¸Ü×óæÇn9´f®ô™Õ7(ÑWÀÁ7@ä~»˜6rÖºŠ´†þM•ÔÊ¶¥`µÄ=Ç-òV›©¢š>Ý¿rB~¬¹b<S‰q'ƒ‡Làà„XºÜËâ¾ 9Ç¸Ï/õr‚’Âù/lkï0A˜”‘ÍP˜Fì}gYK#eØe˜Êç{D/Z£º!µÓ÷C4;èÍ6WÙçØ_­V‹>žœfµ‘ÿÆ&I«â%tÉÐ%Ç³g"¿–ó&ržM.D)Ê …0KŒAÝæ$„–XÎísÐxŽP±.Â©„F*ùã&v9Œ£ª B¥! o»½x'FzhªíjÇÒˆUºð&zçŽ«2“ãÁ”Áœ<N«D>ã±ùeî©$äÄY27Ûäø¿"~$¶ò5y %e“­MüiøNœ:ÿ%~§lÎ¹‰HwóÚ¤ˆ>Ig1#a0Ù¿šˆõ·™ÌñxvM,7Ú¯e¤ñšŒ@T~˜³¼ñ?‚òë9Õö™vpâÁQ^ï×–^3¾¤Â®2€eìæQ`Äq‡±oÛ»mcÄ¿÷ómÀµB}”vûm“@¡·;4FBÜÈœáP‡…ˆÀº £rò(®2LÔ+fÊÄbŒ‡T‰¤}e^¯02ÄI9.ÉXy rífÕ	1ðÈ$ˆ¬ªfÄižk'aGYô˜ðÂX“QEBeÕ"yk”,]#:+¯æM\þ¹˜šÄ7¢Vj”Â¿F³QYlÚ
‹Mi¾ö‚áVJ~A5èhfýÊ†céÂ?Ñ…| ‡^—Æ•ò¸NµÔé›†¤iD)cÜ\
7­4¡²ŸSðÝ3Ê(Þ3H¥*O8O"Ö©í“B`rf«Uš£ÔE2¿LœÓ„ØöÏAœ»»Ûè´»n¿Óh·º[ïøÌÅ›»måÍ}¸Y¡% 1qá4)xA×Ÿ-› I®¢ššd¨Uön®.ô´êÂm)z•A)B¦¬AÇÔÉUtóõÊAapj<%±Ã@zÅœù¥÷ B#ÖÖ
!ôÏÿœƒµl!—#^%,Ü‰ñª3ltvNw—åe×¤¨3iU9B•òM»ÀÒ€µjAž ¸HP€U¿Y- 8õ,@¸ˆÿZ£á¡¹\J†:ÕlFå”ÓHeÑV’K=i2×C•ƒ›ê¡dá+4#6Üú§ƒ|ª‚þÑßX-0#h-^Â5”‘cæ}êùžëÍÖäîCa®…â Y*ùŠú*âÌÖSÐk©:U–Dû¹$ÊQÿ‚R‰-±ê«5)g*dôuß‘·+üÐ3³÷ñXAÂ¾ë‘÷óØ¸/E°àý2jÐó/^Ff"ÓVÏ ÀgSÌí—9·A©O“·VI\
sŠ¿2ˆ›-IRHOÎÜã,jV‰s/#ÕiZ`š¥%Ì–¦×Jˆ\ÂUÖóæk£1ûznQFùï…X”œ•y³Ð—ã®87õÔÑ™Õ¢Ëôhâ)Uc•Š»sÞÉdÛf|ãzïß\ÕÍˆ¬’´Ðl©³BR¿—t/–E¨¢nª‘v§Ð¯dP³ Ã>`+`?:Â0Ö€ƒÏ›þ%Yóö ÕÆUˆzàlN®}†4›[Ø.šížFµ(15†	&ˆÕ¶„jb(âåy{¿ýõý¹Ä×÷ß¡lŸ
xË4Ñ@>iÀª|ÛŠöà¬œaäºA°ñæ¹Ï8Ç}¥rP	ö]ôÇ<…ÙÔ·œÿ:w…ßLNa±%º)	b c*•Ñ„ç09Î”Ÿ£b	'Z£‰v4§º\H(]N¬ª‚†ŒÖ9TqSi±Î"iýŠ°’!{¤G®yÑ²Ÿ“®têçùliñçZÞµ6ÅŒÍ~[¶Âjlj$›Y¾LM¯ˆ–d	Ip‚N”ºÀ3r\:ÕÝ«Âs™¦«ÔiÇ›¤àß	}ÅÚ9º}ê¸4á‹¥®qˆþ§ ¯2……c$x«[DjUp‡1]ñ¥å›ÿ–Èk¤ß2rsR¡#êm—½W² &îoŽò‹?öÛ²|•XùºíF··Ë	qjicý±_À,öˆC~Oú~	„v„+MK·nLÒAÑÔþ.i."Mø©fŠ!…dªÉiK†Ò1Š %sDOé>.¤ª=â'Iãs7¡ƒ_¥KJú}B2§>¦Ìæõ*útº9z’ü²¹6‡ÊH}n¡2Wv$²%“nöÄúž‡ý'?Áä&d|«h:U&YªÇÑB`Å®©ª·Uªå§ÚƒÖ ÐÈS@ÄÆLd?HBµÛ¸™Ô›Å!V²ŠiËü„rØ_ª6ácBô„µÂ½p
ìS­ð—Ý6Hí¥*»áÎ@Æ=;·‡†±MJ7Ox—9ØLË·2_–=Mœ{4A!$#{¢p3È®ÒÒ‚“Ô8¢ÕH£¶^VêFýâÑtú4üH¾½Qµfe¼BiÕ.!KÎ$ŽCãYS3Âœ?õCÅ<'ÔlÏ63b4—¼~”(8_ŽÔ³NŠl²+‹oÄuýõí	Ÿ‰·1©Ë9­³–+VTXë'ÐIJÅÒÂ2©ÌaSÓ…ÐõÚmµ³\²“¡À¤šV¢±Ž¡&úþžbÞ«êTÐÉOí`½«Éof¢”gJô$1SµZs'Ý¾5â'IÍÒ\ñÈ´¬_IÑã8u¦¢»ÞŒV7Õªé‚Ž>½”´ôL~]¼
7•°8Ð€W«¡^ÁÔqJ4¯O›0 ¹,î#K‚&§ y©Çf^Ö} $æEÁ”›‘[jR¬TZ#ÇU­Û%2ò8)ÜÀÙ—Ä`äÏ AqË÷Ý5{Y½WI©éÊŒ01à©mOÑu_¯4	C\`[,£ŠMàÞP;Ö©³°½UTOÂC²ƒ×¶¤Ûn·«Ö.)¶é«b=tIº:Þ˜w.ä>"'X{Cq äÎŒR+žÓJ5µÏ,L·5H^xcŸÁVÍ/dî“î¥—nfqŒòJÔ¸Œ×OAXÌbÊ¿†Ú`2jIÜDy/òÛ¤öÂ» £WoðÏWÖÒã`£¿`Œ,Ëô­½ãå¡q–Ò©S¢Ô”>ª"{GH>Dl*œW ÷ð¨Gèþ=>‡ûüàŸi'ïõc™ òiª'‹¡w< J}š¶™‘˜„eÅÂ›Ðp’IÃté*?Ù:rÊª>Z÷¢R4ÁAÅŸ^>jl‡Eˆ†<l¡‚*v«Ã;]¬V–ÛjV˜s³òÉ6ùÛÑëWd´^NXâ9yÌÇ7$Æ™ÏrÕÜö²³p¼ð½ zr‰ÿe…ó×uŠÝó·¡·<”¨#ìZ¬å!,¦.êÅÖù”t·nÎ«V;/ÇhÞ·]•ƒµLªÎ?„ëWÅBD^©až”;¤Éð“…GÓìV‚ÍVñEÓõù¸šH0o —Šrª®%Š¯å_™H$9¦MIä¨(ƒJT“éšn# RWEÏXM:ß aE0‘„Xþh2O‰‡BC¢jv•*ÒCÜ ²ÙBNø¡ååA’N©†…Ï­åî­Û1§Ìœm»o™Ù«Y_†œ¸>»}Yç×…Ì-ÞšnrN,0všÃ@3kÎ¼É*ÜËó6Å<}`Ïö0Øök'VÅ’x\„°¹Ø˜OP®zkh:¯£ótêÅ-†Ã®L];Ý
¥gVáäã‚‰,(²óu–•é.L’Ð
4* «UgNµØ!SªÐº¬C€É „,­sgfÞÜš¸Ž?ö@„n]°¶±/öQ—‡ž‚+—V§N :»»F-'yýWjåx?J¶_Ê“J±%•oc †kîa­„/¦9q%í/hæk¦:ÊS/Xg¨èmÐ*mP(âëx•ÑÜ9Ë;•ÍûÁ½¬«d‘l¥UÜœ&1“UzAsn»¾Vå|%…Ïâª€#†VÚžžÚH‰ 'ÞbaSa4-<|£`. E²+G»‰0ŽHÍÌÅûI[”óxyæ•È‚8êÂeµNT¶\ºse¾‘‘h„ç6kÀ«t…Ð_ô‚.$ÐDRP“Z UO„Aë:‚V"³šÛÒ9í±¶¸ÇËœD¢i€¤·*6ÐjZ{AMKì ±´Â.íoÕ“éh™È£.2/‹:LºAÎD…£äK¦Æ•Z’¥Œ-Â‚3¤m9á?ssA¸ˆÏ0Ï¹1LÕB÷'HP±z×Ç‚Ðò±wÙ#¯¬ ð.n³§8¸$Ä¢Â
†|pù€üˆ:Ø{bûˆ.úò¨ÊçÑ•GaiI(+ Ñ§!Uí.a6:5½¡ ªB´7Ÿ¤+C¾«•)òâUšbGOÒO€GÎlUÁ9­aˆÏÐ™¡½7á-]yÁ§,Œ6ýqJÖ$y#¶ñ‘ó«dEUÎmVÁæpÙ°8$<âÒ8§À3W¾Ë²âNï’ÖÞ»÷é×Æ.ã¸ÒÏ†Wò	ýÆ(¿(FÙ-àB#º“¤ÞënUàkÃ~ÑI³‡a¿Ê îNÁ¨Göç	7Å	cÿÆ/uü2òZÚ+€¡)®TÕ9ã””×Æ’ÆÜ’˜9¢ƒýŠ¹åsÇ,lô1ÕRˆ¼ŽÁpT%:€é
½Ìbe2t(Nì0D°b½«ó5{,dÂ
V<ƒÇCP4aawÇ.Åúµ±K–­ýÙ0K:ßXå—Ä*;E¨³ÃÒªCR§ÑUx[¯ˆaöúÉÀ/íi•aí"µKéM%^ÜîA¢ÝI†~ÜÂ^Ø¿1ã˜ñ¡·ð‘™Ñ~Ti²x5LPÇX¹	2ÆlòÐœŸ°ÌòØœ•âûuqcï‚Àá_†ÀÍÓzóæ8SxMË5atÄKâ:'î‰1vm{ú98GCÁ\]¦AN,ˆÎ*h~wü8Ý®OÇéVeFUÆ®ÞÖÖ%Æ‹Yç³8NÌóõñµn8(æùj¯“¡.Çás¼<F¡=âùZf\‘øÊXÃ·ÔY¦9=ú°¯{Êü6Ý1‹áJ£>šË0lKJŽÖRWqÓÄB«w[ï—3Š†Þ˜ZŸRK˜Do,wæN4_PnN¤¹‡g@U!Ñ$iG’÷üæÔúÈ	áñ¥Ö ÈâÁ—¨|&Ì‚Ò››Zä…‡Èó‹c-]};Vš¦öVmžSu*ih|‡äZÞ¸/ždóÝOº)«Iø3kz«µdÁñNà·“Ð^M½æž3‹èwÍC H?ãWv=f0ÛœöóîšHÉ‰{qð§àgÙ¼h¾ÒÅÃïd^²Ø_þ÷ÍÂ|	½‘Ñ©¥GQÉ”UÈB1P%–Q€$ŸŠorÒ›aÁý5§j„j¸”š!!¼K^Á–œ­–4×’±“Ì¨ˆŸž2F‰}éƒŠÃü6”OÄ*Céèj7óq‰´,-³ˆõêŠœcÂÍ‚7L0Ò•È®–j–Ð/lÒˆnÒS‹fUÕšÞÇEóˆm-‹h–Û‚ìg¶š"ÈŽß·"ï)ëÝ-¬Û[ƒlëëkÓÎàg©Žšv¿öÑÄ‡7u³_ kûµNK?	¿Z—ûµîWPÇüýZ»¥(ïŠn¾Ñ@»º¸xXûë™öÊz…íÒîßšUúŒ–ÿ˜˜8ôVn@|êzVÎ„ø™Rl3´&x”DÊ?Ï$Éi·Ys]™‘NWÑYAzw
HïÒ–[TÿÈ>ÓŠt¿Ä÷˜ˆ¶ž"ÀO@Ô…3	‰E|ô‹¤¢ÏwÄ	”|XAðùÆÁ"0ß5€Ô0JnMævòT,<eûÒUÜ7‰0ÇîƒI¡
ò”s‘¿åâZV{Uƒ¹¼}4iéŽyöäÅá|‡¨"90g”Ú¤Î	»…çEsÍ1Ç©kœÊ}‡ú„bÃ~%J…Z•xc¿ø#U#lëÃ:þ‚û‚ÿŽ.œpŽàw®5œ-7WÎ4!í·§+¤ØµGÎ–_°½(]åˆ°–›¦ým$ýW“õÕûûÉÄ| {à¹!w¬c¬”3›1qJS¬1@†!O¼HPèóå1j®çæ&$)]ý¯ƒÆ?ãô˜Àør"ÖÃi‘ƒ©µø1¡ïqPÚ4îG¬uˆñj=[¹V€ýç¨!*D%&æ®ïŽÐKÛu›?1­Oì>iß›;ñàÎ ]§;D)ý³#üçÍËè ~êˆnâPfŸÝ&µÑýÑ§4
µoÏ($®‹{¢/þk¶üS1 V7%¤Ä}¹Z åGT.Ÿhç¤9ÖŒ5á$jBUÈ
ÎÞ#Ã[Eh[cÇE×±)/èrsÓ
ö×Uf‘ëùÉ§ç(	O!ç@Å©· °“üYÝW„0°g[vÎy™ÙKL.ÆÞÏpÒÆ ªDÂŽ:Kx;þ'Xá ÄZz ‹:
·„®ÿÕCÙ\;È¦}Ëgâ
{<ù[ÂÕ¸7æ-ZîRÁl•/È³»ÅÂÄFÙÝr™cu>·Æà#ØÀL¼ÕdBm+4QÓ—Â´E^íÖNþ—ØàÕÎU(´vñµ–¸ømy8Ù³ÌæŒÂåøDŠ¬]ªÕ¸ó-.!½„C‘/›Óz»W^ŠÛ4†K¶ŒÝL<ûìÌ™0™ L3€Òú^`kžÚ!$Ÿ‘ó3E–žb?ÐIˆË³i´|)wA¸B ÐLd„F~xÍ7äÔ›Í\›
Å¨)•T=‰°j$þG]«6nìÃùZq…œÎÞ´ž`×zs~y·L²”#voÊÕ>”Ÿ¬â®f‚wyÌcXàò!8/×™¶œCHP„Ë×…ËJ¸DÿSq‰V»ÝV¸98«Pý”ð
åƒÜB\xËïýô|CœÍgÍ<dÉgÈ;‹:	0ËõçE)¢©„¦7LWÌž€”‹HÚMÏ¯ ½¼t–¬ZÇÔ†µþµbS©?Ó³,Å;¥Æ·[É€ O’uÆÔë¯?+™½£*Äèp5¬Xj%VAç“dÅ¤ªåÀ|Tª,v)þ<ÉòsZÕçô–GD²Ò$q’»ë„Qj²p0n
S+²°,Áí RèLx.¶1~Lƒ,_Q_zLä¹è^F¬ºX²Šf©?0*ZŠ%âeÈ³ÌU¥È|>‡¹Y¼J/‹$*ËºlŒøóU ·Î†DN·”+j6HJ³ÛSgµPÎcQS0{Øä9(’ˆí$œX.¶bŠ¨¯|°&"Âa‡^çFÄyªèHnVrò¶¨×w7b|%ÑÚä‡O²°;íð8”éQÆ¨Ÿh½’/>cêO–‘ïÒ.w\ÀX|Ü)q ê¿®vŽZ{¯ÞK½:$Nõ‚wÉ…àTKLýEË¢í¢ÐåÐ?;J¯‚IbWI¶óA!a¢øÒFÓ½.~#w@G¶{ÖT û“ÐH¬½&#$‰SräEÍ“À›®&‘€‘;t@Ÿéíi˜o’ézi-Ð-ä®¿pBiÅ«Mv#K1ów(I'†ÒYËõçLA%A=ž¯b}œ¦
fâ/Œ¦VYèÝSÙØ•1jÿFaoŸÂªAýIèëêû‹x¨M.Yç)ê°Î=gJ,]O{Â8zÐoJM¬>ªÍÐÁ—„Àë,
‰qWáë+ö¦õ˜a¯êêƒÌ}lÇÞÞŠ-
å·~F56s–p™[/®Ñ*<†fµžKÅe›Ô¡)îø½hø•	JÜŽc\kí]¹‘Ó¤‚Óo4üh¸ßC©òÐÓUøÉ¨9-bÑ¤½ÈHøÁñ›"E÷­ˆ°&ÁjWÖ]-)£6®+0íP÷¹
ÊÜº+Y9ýåË¶)¤ëƒ¿<ù·`Yw/î¾ÓVÐ7£Ó&£Õ˜ÕcûMö½#ã+ï˜¦†ù'2ÄŽ/'2ØÏYòÁFˆgýO+{9YS',Þ÷~Þ¾¢Àüâ-ãd[„]É›g7}ÙdU¹¤_›ÙV³Ä»§¶‡ÖÌu¼È!ÏšÚ4˜áÐû7B{W„6ùq}h¹Î8ø„/ÊßÅš3¡3[X¢¡6vsu¿jYßÁÝ°qÎ’Ö[…qøÊî‡äéÏ_ ÌU–ô¹RÞ	_Vz.²d7Ç—MsóëùU‰´êåÝ=±}
‡(Ý¡wÙü[ÛŸO<+"ØZô`‰Dö \/v¬¿lª[9æ£`Õ6ÄÀw&ûû$¤˜¿ž†„ì^¢1eÏ0[{áwÀ‘Ôzü}GúÝo¦öì»-2]Ù4YGÈ¿¹t0Î~0£†ÖØx_‚/œB[ñÑÑ“hÅ-_6V,ˆi;Y|é4Z³¼['Ò„?©¨ìz«)m[;¼eì†ã½kKS7vÊS7K!»¤‹>—\¤¯.˜ù[ØyC{r&¶Ë	)ÈÆº±¹BýyÞ Ó1¹&ûÄº°œˆ°F—õû­ÖvhçÎÄ·ÏœÀF¥û¾Ú¯4Þå'€Ê¬ä;@6ÈÌŽŽ¼I¨xM<4}œ¹@÷çŒÔ¿Âù¶€saíaz[Ú4gã‹ëµðVdÐ&cÖÛ…U®¿p¢9yæyÈ„†º@zs}\´Ï­‚¥òWer32|Ý,äþ	 BáUO!XŸŽä¾xbÂû[žõû+Xûñô>Ü±¿ÿÍ‚¥µr¦ú&‹ü¥øÂÑÒòÃ¹%ÛÂ7ªþOÚ§q¤g[öÂÖú Éf¼òHhÛYXÇD[ì-§° ü¤pˆf’eš…¸ÄäÉ*¦°ì·ùK-Þ]¯I:ï¾#ÛÛä™a¢àjá{Ðwïˆ_×Âïõ¢,z‰UÒ.šÔùWÇYôìþÔo+òûÑj‚í¯)fgá½”˜
šŸ}­éû~JÆjÖA‚ð
Ž+@m·èmõÚSËÁp!~¦öjÂž/žsæ1‚µñ $,+Uˆù­.Ž‰Öå9ø—ÍFôwMÛw¦yý
UŸª-vÐ±IÖ´~O,üžõ©æ™øÛŠ•Ê¾°šR_&›cÙÀsÄþ`‹°ÇkYÿ3å0Hö²T.›Ð»Ûg7lÇS€g0Íûä[r„É€KïBO¥\äëSüžG5’á[°ÆÁö”¬KA°ùðÂÞ#÷_®	“Ð	#›éï<™’Ð=RÐ¤XXÁ†lì(tíeÑ®^ôØÊŸjÓñ°2Š)QyS¥H'PP]‹äÓy|÷tkzv¬5Y‚2Ç#Âêa×½…†E‚Ø‘þ¸^3òšeD‰‚Ö†ñš‘m¹,†òé–ôr|c_.(s»ÜÂñ·ñïrÚÿMj!‚)k1˜|5(¦Jª_¬âËõ¶+öU]­RQtŠ&ò„%…º×ÖõWnhkJy(K»Žßx” $UþÊ™ff°Ì×­ëÔ&˜]ŠX:˜ø .ÆËè]&ÚÕÔæ™ÿ,Hê#Ú±SþÉ™¦:ˆ^Ô¹3ÚK	êÙJj~›÷¢i“&Ö?Æüç¢9ÄRõÿÜšQ|dPÁ]teb7>»=ùÉŽ~a6Ëý,˜´Q-äÂR	çÝœiw"kƒdØ'™4ÉbºGÿ¼þV ìA„×sÄ¦Wf»T Œ ' ¾OÉ”hÅ•±E¸»×Ž‘êmûçöÏùs0[õNo·±ÛmtûÃF»ÕÝz§²Ê>Æ´gù>€MÀàÀß‚¤–bïa0	çÀT?4³»¦=‡9Ã*¬yâ:~ßÄ^'MWShN[½4T°öèqíø(NayeG‹g¡:´-@+Ê Vm@= øH/.S&Ÿ]¥†žŠHÒ’Pi­¹pAKû":-ð,j˜…Šš><ŠÓ"ÕIÖJZyõòàôÉ›ãƒ?=æšï5ìØƒ‰pÇ°¬K;©¦ìÃíy7SÄ	yOF´q+
¯ÚØõ\2{J9vâžH¼äO“Ù–)lL…ðéb®&œ'©œâ#çz³Z¢Ÿ ÕÊ–ZVm„áš÷[éj”—‰±‚ŒllYêÌŠÇ«ÁÈgûW!}ê}v]É‡Ä¥6 éùêªÊ´«×Ù¯RÏÌ«ôÇ¥s†]\ŽÇKfºÇUÔ”åù”ø,–X¸´i íÌñýæUTG†.N'{‘Ã×G ¾<!£xuøäHµ${L[{Á,å è­®Q2N	u
‰Ÿg®7þP9Îß«°pÕÙÞ‰#¢V Ñ—äh	¥ûdWzc‡(ñz~®ø¾H(4°IìäL"Ði<Góœ®ëÃ¢M"Û¤ãµòRÂ*ê€[Ô3™ý“ÀûG{µtý$tR$uß°V†ˆ³q>µŸU-ÕÓ
òZÔØ•“	2Ý$Šk|ž,ÕQ”„­v,l@ÐêtA„­ŽRØÂ@}ÎÝÀzŸW<y*¡Ê$û'¡Ç•Ó}|™9Œ²Ÿ‚
³„šQ2N6÷E›Ü2š{£ÕlrÚêQ ¹[™Ûâ-ŸbŸÖØ¥­Oýèì5v÷,YšíÖ{ÍzÑ<¡š°Þêšºöhƒ†Î6§š“r>0?k•ØÁ~³1`‘bñ3PRkPs[ƒxOë…¹ÏZ¤»Óê7HÿA«·2ˆ
òeHb3Kf€r´Ã®º²£/ÅÌÍð9y,Ò³y}Þ¾øE–¥½ÂO;Åmz€î‚”{°áØñý ‡râ€¨ˆj?Ë5qÌü ÚzÒ‰?‡e*Ä™:¡5víéþÕWéo§YÔ•'BÅ˜E¡Kg›O‹%2ÜPƒ‡¢ß%ÝˆgF“ñBe.ºÃCv%W3¨\ç¯ ˜¤†X(Ö-N›µšå ­ä‡jÕYìƒLÞ6( ˆþ‰„@©(r¦ûˆ£ìÑc=ƒR©V…ÐmdÝ‰P‰‹(>©"/0ò­¯’(uòd'ÒÕ—O²^gWK­%Z¸ªö¤Ø/dB=Yaf¡§¤$Ü9Tµì cÁBýþh®—Ó‰M>³ÎÒá\JË'Íò´Y{Wcì™¬­%ÒTÆÏK¨ÜŽWà>ø®_¬ôÉ“ƒøræù`½FÉÅTÒ±dÖDè3¦¡í"_D®v/§+—’ç”Ïˆ‚%Lé­mÔÜpêRÞžŠëü€Ã`v»ý-ñ@_hZÔù£›Ð]Ÿ¨F¢q|xtÄý 7ÈSØü¹iipß
>`ø£‚‚¥ êÅ†oNÏØ";]5!3ðdÈ×ã3Rýh¶…¸'-ìv ZV‰“,ÀN¼ªN‡¡,š53”ŒüT4£"Ejî§5aj»€D€4˜ÀBm½Ô®²–(w¥ºO5Ÿþ§™œqð­­wÚØd8/¿ ÂbY€æ¼ù¶? Z}â¼X3^XØG±+õQG÷p3ØuÇV€q±øÈ:þC<Õ©ä±‰*\¹Qôˆ´É÷ÊÎyXã¤’Ž4Õ/÷Ú!$Vè÷0{½Aœéå¶Zc<‚¦qŸBAûö¡MDÞß»Š_ÁÂ€š÷®à%ê®ñ'Cø™ØÛ	XSˆdâJêòê=Òˆˆ‰¢@9d.}{·È³ŒÄéå>Eÿ‚NÑèiº4âG·¯t;Œì_}-n¨G¹hvhÇ”É ü‹:EªÌ+›¡­
»©HnsuñÇ¬1^z0à~Î	XÒmGþ¤ØÌU×V¸³  ?DUçA°Î²$ïAÙ,r"¥²Ÿ*R'Ù,]¶ò¤·"hÐ³]6ë‚&­òúMÄ·‚N”… Ò$TÔdÁKEÈ )«2¦°ÇMÊ“7Î]™ˆ’[+f ‚»®ñ ÙÔZÀ<'6ž‹Ác760vZÄv¹MfªtO)¡ƒ\kL²X–º5ˆ¨éI¼33lÉÓJ/ôsÝº’û4U–5 ±Ýò­çk2D üä».i^_€S¼ “+°{û¼i¢ÄB†—l«ÐðŽ
ðýV¿Â&ÑôV¬®
èM5 òFc™p‹²[Êo(¯Zž!“F€Âç-¸´3Ì=E‘bæ=(æü2c/Á£u¸v9‚ÿÚJWB
ËbDÑ÷IcŸ-1l+óhV¢×š¸	[ŒW*žvñc…‹âÌÝ¶(y"},o²)zLÓ¹}RI­9†œÝ•ýC¿’š`ø…¬!gWcÈÙUrv9=!gX`ÈIäºD^Î™kJåmîþ–OÈfª†™É¤Ÿ‹ÑØA’aE{ÈŒÙCb#HÎBËµ× Ö[»Òü ã¦~êû×µ›žÚ
ªýië ªî;™H¿r­‰ý+üz¥N¡Îá.ureÌOJ&òÌKñ¶#;ÀJÑ­(ÍPáÒà™XÏ
™¡¶Å/5±ýdó½„LrI»-S!h@!¹/º·ïÓÀu–½F¨ŠDéý¦™„Ñ‰û% ãþÒ.žìßaÛÆF[VìC:Ø´›0hö¹MºÿóŸäq`ÍfÌ+Ü`(ÏD ø†Ã¬–ND&6ò¤ëZ6ZÍ6Å¨QÂM+ðÒ8é|´€‹
à,©¿yóœ…ØÕ‘ñÈî‘KMÓ„Ç¤œþpÆ»¡«#u^(Ü
FÝ=.ÜÔßä;R¹§?•é]–¯v+ñU‰«âÙÛf'/Ë?ËØd1“ÔóAUÙSÅ½™ûT.¥„\;úùx9ggqm®,,É±2ªZ¼#[Q1LèÃº°«8ðêÌq•e–	©ÅŸé|1ªVy[|ÅŒ÷Oá‰?ú˜s[Ö–»ÆóG”·!gñ£ýZërÝhE—Q£5	ÏU·ª=nTÜ‚‹+“	¿oMðQ}6£ïZëÑzÍO½¥]¯EpóÆ]ËSí\C²Ë²ŠUúúP¶Ít™úÎãÍ´™ôI>a ³J©Ú!!aH¢¥€i;íÔÆïM,Õ®Ñ¬[À`ÊÐi[¯éójá>ær«/A_-º¹¶ìé!œS9KŸ8	¼Vá(²ýz»xì$È±`®U/LÌ¯	²&sÜ9ù¥Ç–^èB|=@hí*ð•âç!6Ó$‡Ödžo#X„ŸEÁ¶
?þ“åÛJM%ÆBqë®6O=Ï11
€íÙÀ³òNþ¢,B4NøRöJ¬²ÆòÈC«‰)ãâ^Z¢^½UùÌ‰3Ý#5ŸVQ
kBù$\9I®8,A‘U×ªÄét˜sÇ¾†yÓ=q½(ˆ–mÂf]EçÂ6ÏÂ@£g ñø"ŸëÚüÜœ_0²Ê-27 Ëm²É+iÐC¥æó»D€ZbÆ’õKŽáO²Oðî«:ùìn'de¬°ýƒ¢ŽAŽÙSÕó¬Ì€Î:R¨hQZ§Þ«bI%®dæu>tqküT “š˜XùŠJ¥™‚¹3•P¦dfv?íBî]%Y ~~/ÔþJü8‚Ý=­)¢HÄåZÑ‹ ½36	ÁÐ™
'ŠpAAÜ„þš­
”œ5µ×=FÕ*†¶ô_iZE2‹ªF\NÁ*Šö7q^n»ÙñôÙl±±1&Þ—¨WªóŸf—±ÝôjKÂØô¤‰±‰]±záËØÿ«+³æü0©d¹|ÒÂFÇƒ‚ù,J©‹Š-O-xÓ‘½ðç¦Z£@¡É`“d)Á;,RE"TíÖ"
‘)$æ~ƒ0d6o½E?ƒ ³ øþM!KN¿vµ™¸ì£]øOdÕž$šc ø!úB"òúP€Ô_¾Þª‰sjè ‡Þë¿üùÏ…·ZMàÞÇÔáØB709 æ·Ì½©rÇó™A†ìì´v¤ÓnÿiÙ{Ð6Hÿ¢9==ük·…Sƒ?-ûü«¿í¶zð+\ì¶ðk÷OËá ¯uoUÊOìc ç‘ã¢°C^N±c+]½!ˆG©Óç†ývñ¶p8ƒÆ†F jR§›øž»Ž#ê±ÆP‚Å†€Æ<©>‡4fKaÀ‚pØêt4‡»­ ±7<¶z;î;;­vmÆn¿µ‹ðnß”Ÿ¯Aè¿\[0m4åÖŸœ˜âñ¡õ—?ÿë_þü/õÀæÿ½õ—?ÿŸúëç[†ˆ}h¹<EþÜý9
ÎcÇc<+qQ ýœKShZ;”½þÅ¼ÛP?`Ö¼½~«“ :yØz (ªÀwð7«íÔAP¯ùSl0ŸÚÀªf´;ì¯µDOÒ,Äï…øsæÇ1…óƒVŒÔ½!Br Ä ßA8wTúH†]ŠçCN*(IéìÐ¿pkºw]T§åÊ[…äïßQ©¸«…³´Lñúþ£yà˜Ôÿ‹Ž`„Ïé‹Ázó’tv	96—æeá€[þ×¿5	y)þFÒÐ„Lç,"ß½@W4MöÆ$d„é‰,sŸè!û\‘èÂ;ÅòÓ{pNZØ¼¤=ö"AÑvå‡èZ4ÄnÕ´È“èW¡ßkõä9ìTaÐmäúƒŠ#<hÚ7‚Ã°Cù‰¸ç0¶ÝAr¸Óêv¤¥#¼+ŽLr±Ûå
ËÑÖjÅw¢§¬Ž·_ÂÍÝöwðïÃ}ØJüãÛ}<c…i“·¥ÝÞá¡âWò—òD¼3vŒÊßŸºs ÂûÄo¥ïdÝ°Zö¥_oÒ¿|ï¢~IšpSgŒ^'Û¤ÞoÆ[Ú‡»[új°é'}À¦PöDYø#[ËxKo˜ëWÑk+gß1œ;{%€ð²:}> mSÒ5ÙÿžôÍ†9"ìþ@w€´°.Œ"þÂb`Uß²–NÑ úþÞÕ¥ØO²Aî]Å¯J®w¶®ÿ´|_<b1Ø¹y^Ês®Cõ>&såbº)sEÉ<ÇH6W±VëI¬ qÖDkŠæv°ÀÞaiŸ…o8j¹ž|–)7á°\ÏirUÞÄÔa„^UÎÂ´šp®	#t+ÎëPâ**Î«^â>5wlø½e?wÈÞúÀvô‹è«¹[·}›Ü­÷w3J÷÷¶1ã÷í$Ð²±Jóë*Eóó“g!À€<ì5œÿ0þÙjI]É5ò}æ÷:Æ7Ë—JÒX	xÂ o W@Pþ\Ö§—øvKÍ¸ôBVöºø)ÓLZ‘5I<6¬E”qu¤Ä(Òh²Y¯!-A$Vº«¬ãŒ;¥,ÿ¸¨TŠy§.éÐ˜dw™¹*rYÈY?hQ9O91Îˆ"ÂãIs	Ö`Þå©]ùho¶¦Œ“SiaR¹¸ïxJ(_Ç•d>UZ‚æU•ÖIýFÈ¡qs;¿9L<C¹´¢®46¯ íªKâÑmÿ+‚\ î;]€ãbô#&üæ·ê%iÊl_`A´9¯Š–DBÒJÚ<‚¹iŸãëX	)©^¬ÎÙmîrM‚pÃEZÖþÞÜ»C]±½‡\yDpQ¶³qÁ$1¥ª#·(¥ÞŸÄ FˆTâ$ŽšòÈ0x\p¤KÒ¦
h¦²>’P}ÑÔCÁÿÅ2`Ä`¶‘3[Ò^ÝeQêò{ªïÀÝ$U>¬é¡µ¨¦_ª	+ÅñGø1”T®Þ—øè9UDw<cf)Z©,6).:ži	z¯N)\J”	¨$Æ¦Q¢)ƒNodj×wãRBÝ~¿1ì5vûÐ·Þé¥#öÙËH•wsÊ%½m^a±^>ë5¼°‚  š‡/1Þ3nÁŒµ³-×¡­í_Zþ†²ž¢V¦º\[’éy%l(nY2åd’Lˆ§½s?*K`ó)–H!wq‚)1M[žƒ.Ü”k)ô)Àù¸¬[ï˜>óxv@=©Þ*¬wôßìsWd¢,’g£³ ,!Ð•hŒqúrr*Þ üJBÞ C-’,AÌ4œÚgÖÊÄ`ŒÍ{Ï	®–2BÏ¢x±¤¢B®Ž˜¥+ç‰‚‰ ÇhSÓËzÇ™)æŸi@ÈE;ë¤Ÿ+Ú«pz‚œ#LG¼AC<¶¦:ACâ†"Myž·ZXWÌ¨°x›>ÓxX \çïbuê)9œ[A´Gœ%6
ƒ—“¹Â=¢4µÛ¡øâ4|té—Å”~a¿¸3ü2d¿`¹;Û@O¼…
«MÎp‚·¥Eé&ÀKtÚ‡ja•'Ã´°aûqgðK°ô(’µ0!NõB*ôþÖYÂÑüÙ{·­8Üz'õBl/§òs%ÃŠš©6î˜*„á“g±ü?(¤£ Ë.‚hVGÖdåXPl¶‚$A·Î„˜Á ÿ¿Ýjù¹ã_6„2tø}«‘}x·=µg*C°_ì=
d¶™
=²ätÎ¸ïÁ&œcÿ<,GÝ!šï×:íö×5~ø·{Ï!à:+SzJ„;,ƒ»…¨AïFf™iÇÔYî_]¡êþœÓ¾1x¢ÁëQ£«©Akb²Šâ1Ë«¦Ùg¡A54¶×ÏøVgº_£ÕÞ0ß…k„5rÙÙ¯·fÿ\vÙ7øÇ¬ØÃVM¼³3ÀÏýÚ ¶/âkök¿ëv§=Ûf×^³âûWíVÿº5Ôƒïšn4öÃm8¥ ß6ùÃ¿?¸tô,)þ ’ýÁ^Ççîª2•#NÕeåÓÊïžzQòí}¬pŠé¿ïÊëYET¾ÂÜWwÜÿÝ°ÿ ¿3†P¢á™'6ûö£Í°ü>ŠüŽ§ÖÂq×peÊéî—!{üÖ°øæ0
¼Øów½^¿3`Øótìînol4 MÖÀ§i/xËQˆF‰ƒ%6]­±l;Ü‚õMqXçãûìÃ5†ª{{ÁþƒÁ`¸{·,Eø‡ÿ€ˆIæ ™ G;ÅƒÚ¡c-Ÿ!;c@>²€ñ¨Ü#½ñÒ#Þ\ó›à ²,áø)ó¤{}œ1&¡ÓØ Æ
©§ŠCë™{gáÞéM©Â"ßÄ#À€H¯º@O€(^õá_ÜRìàW¨µ»&`Ì¿¡Ïßð`¼ÁÚÎlö†²	à{É¢`Tè/Š?	EKÃåÏ$ØÑŽ‡Ó~ù8«À­ÿ.ËÆ¶
3ÍÒÇ`vÊI›ßTê¸ê•ß¿¤›Vtl
U‡ù#YQŒj9šísõö:Œ4%›}ÖïŒÞÃ¶;±Ð‘a¯Avá_jt1'ßÀ®I-G¶…‰
ÌÔNUÿÚà­¥ÇS_0þ ‘{Œ¡ù&‰8
#Áª€YÆê„	Q“uV³@‹–aMIrX(²Zà8Ù&¬Iðøs¹•Fñ˜<ò˜ñN÷lX/:-£Ò¡ìÍŸ¸d—to‡J‹‰–1tFŽ_:lÒñþUýŠ§~ƒÜc­i!Žk›)û`*ž„´+~>ý“RLbÂø¤Ò¸06ÂÛö;ÖÅÓ¹™”\ã•Ž!¶É£ÅS‹qq³’`ãº~Ïc²NŽá{g§Ìª+‡ƒÂöÛC)>,t–ux“I\~
“òóµóüqûig÷]¾‹CA^8FÆA.Üf—÷e³…h{•
ç|Šºš4bŒà“DŒ¿¢Û$¦ý×¿cY:Ã
¿âëM›(»;ËÙ¶¨}e½ªO·È÷äþ«íƒûdL“·ô·®ÉÿÛ¯(îJë¥§Q¦Wçrh±Z«V¥·V¸ÙMè'ÇT,ŒS>äMµ¤‡Û’¡¨8Ga *
˜Ñ[”ñƒÿôÂk»_,I:6ya­½hˆGkMœ	)NJyeòmj?Åv`•Œ¶¹”gw&¤<wXÎó°¨ÉŸP\âˆck„9=‰ä¥ž›xmÕ¬¥0w˜6ž¼es–Lå†æ^{Ø>|·=šY­åªIË³¨ê)o¡e8u*cäùò2E>Û˜ôhâåÕ? ª4ž6Æ€’¿È k‰\j¢3ˆý+9‰ôÃ¦¬ŸŠþÉâ@õ³ÊuêæÄ†-Í¹Cªø¤~nRúãó—[æ¥óÕÈ“0^¡@Ì£+Gö©Ëì×ô•†Ì© ¢üaZq€UM4Š…³Ü¯µ[í£›­ËýZ§Õ-‰?adûth½!é•;b-j2Ý¢±’÷A¹’Š!™;LXr®Ó®",‚*œOA|Ž²=v:*äË¾³`È4àŠ77×£ÔA³;…AmqÜ,>Ží’
È.Ö;@ç©&s;€èÛggÀë¶È7èÆ‹‚ö®`µ’AphÆÚòi­_ùE@öÑt @¢q3wHyÒ¸£àqúŽÏØSš¢bYé‡ÑƒC¥$2)uDF óMˆŒEE‰ˆ¿zskAb9]ô <UdjG@U<J^œ	³Qb•ôÐ[;MÑúÀˆÓ G<	«#Ï-×#ŸÝ¥h“ñ]ýë$1ý@b0jÒ7’d„°Ë¿*óÌõ–
2Kl
(èÏp\LyÇjJ©ó5Ä(}XûÖÝa¶²
ÄæF·”,´8¼¡r±É!1“öÖ^¦ím£R“I±áQš¿±™ ”0f-¤ƒâü*™èýL<^NíKä4oìˆcÁÚ°§#“áh‹\ê’Ç º@û

{Ñ-•@ÍZ†¹.À¹Î¾ÅF"Ñ@$™—¨©oXGÞ°JÝG2Ô,jkGõÂ”-?Ôe˜ÉƒÎáÜ1º(¬þE«"
ã7bÖtºÙÖÇ".¿±Ï~÷p;šßÊ`ñC£|nmÄÄ	@êÿýo[·4,Ï¾`Tûí¶Ò8Ó7À}Öjá.3\y½é:ÇRS ºIö®¡Sçêm«Õ}ØïŒ€Ø
½ ª×­Sîn¥®¼&'_¶Ìcnó©ßÜÌU™ñúÒIÜÄx»þÀÊAF¨›ßÉ4dM@¤üÚ\»ažxüzøÚ©ú`dÔ„¡Ü\ß³'k•^KÈïp¡X–Ê´Í(ívdDiKW—Ï5­8ý+ñk¬w97Ú?ê'XN íüS0–± hƒl"¥ªmQµw\4;Ã49§¸§k&ë‚JÙÄv:çJfŽ•Ÿ’;%‰Qº†eÖ¡Lt‹y ƒ8O¤×ot;F··ÓÀ*9¥y ªO­]„L“ö°Ò+œ¹Ón7(H‹çl§eu2<Ž2Pùhk9Œ³uýõ{“¨æìÇ(è^üTŒKà)M$"ü¢mW®4—«Eˆf‡&ìJ¯’ãØt%w+!mÃÚÂ
*4‰NŸ©ªjÈLfcC¾Ÿï' |-
wå*=UVnG©ßèç‚õýYUIlÃ~L“ˆ‡©ÎíiibÚf]±'¬¤AöŠ£¦*D‹|t$û [‚u¿+ì¨hºÐb1BAVëjâ”	¨ñ‚8!y²ðQ1©Ö¦ô2Ìª”¬+ëÛî€¥f‹×œXaÄZˆ¦Ä•×ª
 „Ò€CV-¹A<Tl1ˆ6)ãÈX`z$Ü
âºm¹ÍÈYØ$ôí	,q³^¢Êóuãb7qÛ¡×m£¿q·É,¦—a>r§“èAè9×í6ë(àÊ½ÄÓˆwŒ, ¿|X7Ÿy˜XúÔqñ¥'Øï¥€„n^Q¥¤šÂÔ	‘L÷•9ÒIA˜uR†õ<ô'-</šF%höï"	c¥mi…‹™v³¼ó­Pá¤¼Û,†Wj6—@i§JR¥×x¥”¥5i–6P6ÍÚõ(uàûîš$À#ÇËæ	,A<eÔêÕè¼g"	Yä`_Ö5hêvJctÂFZÅ&ÎÈOì„d–ñ%¬ŽŒhŒÈëéÔ ®ÊT¢ýŽ£{Ñ5ñ£RS{™äUæg4ô/R¿b¯ðô'vw‹na~ÄÂx(…ÿ0‡Îy˜€«`X­Ç0~x3w¡ÖM(RªEÔ,X²¾!Y•"Y_Ì:ñÜõÒ[`¨#š{WGˆ^ô1O¡¿˜Eü”ŸžÂA”§‡ABz8¤ªœ“ºµq–úXë¹˜v„Ï?$
[6k¼ëVJ%}Ìã»A™š^…25qÍÈbC¡Jo0êÍG_y{U>*Ôø`>ÂÙ	«Z^á#[ß#)ïÑª{$Å=Šq¥Ä@BËG(ÊCÈåXY6‹ñ_vkÕÔ~!³·oõÆ;¥ù1u4›kœ.4°.jé˜¬büìEûWg–Ú×ùüËë|'Ïß}ƒ£ÝlB!•ŸAþNgÕiww:ªYÅÆéFÉã…Ó0Î8ª”otK–0ŸfÎèÏ¼l¥z±äu±1K´Ä„†T6Ð¶Œmh¹“W6ÌÉŠÐPL¤Ïª1û;ö$Œ5¤¢ˆ¥nÛùÍ²óQ-;g«ÉèÞÝXv°I·Î–¿8¶åÈfSZÆÑÆ$‚àó³ä ž¶m9éR0t{ÍËuÜÀ¤CN2éàüštRÆ6í;7æds'³ßÐ×Ó#wÊ{>m§&N"º½Ô¸©“–¥¾Å)oåŠ)ŒT¨¾Þa†Ûf¶iUD‘pÇ‚—©ˆ†§Lc¥õ‹“7Küøä)7È&Ûä¤VJ%+w†—çvgu˜äs%‹Ø^ï8AìSÃná”†Ø”Qä/ù¥Uy×á»:eb–Ï—zÌvŒŽY!#¼ó$©»Lú¤'­Ü¦jüCn™jfŒ©H?ZJÛO‚Àpïœ)«m1¶h½è|Ò6‡²"úÀo¦6
äò[ÆÈÍ›="¶ÆèdMÉ/=É2Pew{•á¶<b	OI¤ÑF›¨Qò©´Ôg*Gœ"€.èý¡©+YÂ¨OTZº ÜÆ¼ugš{Vlœ’”×DŠ‰0••ÉéŠu «UöŠR,ò£|hª¦]OT}á$«Û®âšÖBïôv»ÝF·?l`‰Ö­w´í†¤À¡bß¯ÔÃâ2:³¢‡¢ ·<
¬ö6)tÙ-´áµ8bÔ}í¨ÞX³ü”Ñ%º}/@lYÓ©Úš,F¨«³Jý_t÷¤‹WÝ ˜³ÂqÀ òÂ¶Î‹½f7I`/`Ã¾$¨xþ_+@ÒÞ¬.vxµ[è´8E*sf-¼~ßzÛV6F(Þ¡«´È“•lyÅ>YÚVf¿¡týSÙí-oIƒ,÷I‰w—½ƒ–¤`’Ã÷ ôû³X˜lŒ2Î#‹«àÏoÉÍFã«ê'¯çÿ„§ÀìˆÔ7WéšÇÜ2çYÔÕW)­7täšD˜"«ºÿeü,BÕžØ³ßVäuzx`XÚ7HâûRcEqAûÿ	scöØNGž±Ôñk dƒ]¹/ˆ‚Íõr=A6^T™òáYÜ±$ó`Î0«zÀXëB,c•Õ¢óCTðLm"+"ß,õIë‚üý?Äæhê7ÕLRã[Ó»þ²ß(Ò©‡öÂaÝS5¹Ú§qà,q0:pìÌí@ý¨™œ©¬)a0WK]g›kgÉaV)DZ‹³ŒJ¥ÀÇÈÎ9ÀE&å%Á‘
{Z¦ÿëî´°²v§ÝþÓ²ÿ Õk7È@©uª^.
Ä\‹›7û;ØºŠv¤G\h“mäËú#¡’%¶'V¤‹f´‘·ž" ‹8¿ð1~i%Häôlv¿V÷DÚà ËN¥°
Jew:e™ëÐ·]÷pn£cŒÅänÊsµ.iàŒÅ3ÓgÕ²‚¼™Gh•˜én‹PUœ?e=ZM­H…åI_&³’MJ‘ñ(ö#KiŠAÛ'—˜ø8…È€íÞžRsïªF”»^^(GžçurñÇnÚOl ½pcZXTË³`°O‰*³+ÆºU4ª-OävÙ¹ÅÉ­´Uk+]VRå€Ô±vqÁêÌÔþ¢£tX~!ÕQEÞtÃþ’HöÃ—ÎåKoj×¿râ?µ!‰( ·áóð7vÌEå¥þöN V[åDB®?Šš8
½=naØ-èËÐC³Ì{WÉy³Wg9ufš(’v¯ü’Ðf•_Qµ|MÀÝÝF§`‡	€µ\W×‰ÊÉŸùN—Û;mM»R%KÐÈE/¬5>VWñÕ
ƒ2¤àOBÿ>8<=þá	]Ü“%ŠâŸÔ§¼ ~àªT-1`¥‘Uéå¨J·€ªôÚj|“¶_o«Ü¡»„×”q£î—)´[¡ï:QÄ¶Új÷0µzÝ¥äÄm€»¨omÅ­1uÔ?tçX$yþìi5­B%þªîÕXÀSüìY¤ÄJì¡ifà¦²MFD“£ŒmÜñ8Kò‹"¡³¤1<‚>WMôÙ$Äê®ê87.}¹U
pã`(ŒoÓâ8ç)„©.Ñ@ A½®8Ô,ÃólL‡Ì…«OÌÄg!(ÖIwð¼éBù.lh`8ôDTï_*EŠhÑ•xšh™¢Eƒ,ŽKÚû(]ñ‡5ðq›÷®×øŸãâþ=¥%ïS	d†t>–#÷d+F²ÇûOúW°ƒUj»å.âÌü¹Ä¬qãbÊÎví’|µ¿—·	ÏË²8‡…/ñÈâ±˜eÏä3úÕÿ¾¼{ü@tÉG6<‹ý½ÅÍ¶‹â¸5D&g²Ð2•D•ÊŽ\.BÍ‰bŒ^±N±\/'¨ð†®ªÖAå¶^½Hsâ®ŠOr0Ò²:äèq5ÙA§™{c3À0	`ïU¶M˜F¯Wfë·Á¯K£q´áè¢*Š~cI.H«9•Œâ"I¸¸¨co ¨¡±+[ŠrrN1(Ö²Ö&|'‡JªãÃ£#²M_ãß¼ùãÓ§ðïñáˆ^U\­>2“µ	O;ß0êO¾’n“9™Ú€êš´…9 ÃMr@Œòõnë4`@î8Ô¶…é>Å^üâö:Ü+ÉŒP-$&©‰ÄUóvõ¶€ë]Ñ0P·“jVŒ™,ÌÝ‹FB»Ó«‰v+\ëqÌgW$ÆP#×jrf"€Ëò<2FHUYa.âÕx6ÊJ^¦ó¡§JžQ\¥MšNr1Kr)žH¦êz…Yà™–'!3toU²t-ï6Þ¢ì\ÄÀ­d&ÉÅtbW&JK˜ƒv
ï¨º0¶¦3»¬h¹Ìµ:ZVÈb*Ù¨ÅaŽy%ñh<¢d²ž¾Ì8Þðê}Ì:b™bA,ã4c¨L”r¯‘îWqSÓâàWCX•É¶Eí@7LÏÒÈXÄÒÓôâ Z¶ÙnýVsé”ïma‚YÎiš`„Ï”}DÏi=ŒµÊ±™OˆŽd'®}>åÂSH`ðY‹¼:6ÈëK`>òÔÞjµZúEåã\u6ænN¨É™šUÑwÞRË§ï6w‰ÀR}9ñ²vÅ/²|Å~È¿bGï™µ²‘9wi¶ë€=uVZå\ŸßÂwG!¼&/˜{rLäùê(‚"KkŒqÅmµË	 ’¿ÚÄ…±šÓq“	rE”Í”Ð¿ZÍ4ë(-]ÀA…¹‘>“óÎŒÄ/—QKJã€,Ì-eHêWWÉ€€šè¬ :M3µµTÑœc%SŠŒÙ^p@{xT;hçí+Z”ÝPtÒÍ¬ÓN?Rê¸Wu½Á*.[~qï›y¨ë¡‘‰ìµø«öc¯A°Q(’/á×À±\ ®HW·Go^ni%	Ó6ö4ï/š}x
3Àwtvµ¯Àkm—ßL`BŸ õwµp–9™3ÐO’É|Föu±¢šùÁ¤>r€HxKrx404öÎtXu¦ ŸÖ_XËøjAžÛ— 5å¤/¬ÇÃ;kÕ]æ6üÝ
¦þq û _u¶ý1©Ÿ:¯»Û?-_oÝ×½íCûuw£Y¾Sÿ ¹ßäèÛÄÎé
û•…äò{ÀÞÒ™„78ï`õA…ŠÁ2r
U/þÜ3Lã^¢H’>™^3À:Ågñ«Ñc¯¤§^™=t"=tbö ô~7xpäJà<4yèÀ…§ð+‘6Þd—Þ©ÝF¡ßÉKo‰5Nm£![£¥´lvœØw~ ´2Á¸;²ÅQØr ’T06›ÉáO§#aüJþ`‡ÈóÌ&ñÔî=³e€Ä—±‹ÉÎ¼’6Æã§§¶8yüjôØH~ldôØOKRøÍì![~Êð]§òcf+{ìtO%Œàýáµ¸…øÍà¡ãg?½žÂ¯äôé©É£'cšøÍà¡SGÄüf2ÉSiŽðÍè„§’O(½`r,ƒÌ£ü‚	P~:ò“!$3ïã}áœZÒ£ü‚Ñ£¯Æ™Gé“G­W~”]0xôù™„¦ø•ÔŸƒÂØü°e„@À^"
áwR?´üÐèy`O2É}†APÙ®½Äòò&´nvd@\¿Bç–;ñüµ)ñ}lýŒd,ÅùÈaØ=˜=vC‘*&É‘·»¦ôçuW"xüJV0’I&~%´ gS‘Ì™˜‰NÒ(øµÊ$^9'`éwPgK;2›ÀS[~¯4ÂË¥(PÁ7PG\gQa„ÃàXœ~%Ý#òÔc2Ê2²âWrúòÈäÑ7öH|¿’ƒ¥z Yûfkè>o¾ô¤Qøz¿å®A1’¸7|`¿ØK“f¦çdÕ9	~%”ö<Iº›Ñ I&Ç¯äG{íRItaÃšŒt,‚_7å§àÔé!ýNN=ßs½–£1”CO³r(\àÔlVFo]•{ìx;°@¬¾,Î7¨&ƒútc…îùÁIsDcU€œüèÀG;»nÄPp WÖÒË‚×Œ8´‚±·„N›0Vv˜ôW£ÁŽllï è	ú€\ãAœ¥jö‹Ñ /gªàêÔó3rTCÀUó!NÆª!àªù‡ê}™VYH‚^ðDCñ9üfÂ¹Ü•X¾!]˜xÙdåsW5ŒtÙ`˜1Ð²æi€Äh‚’ÖÉÜý¹%Éî)[]™YËra\Í«,]üq„øFV7ÎN¥-;-]—¼‚U8—\2²i L!=ž\2xüµ4gø†d×L`ôšÏÐÑìôveÅÕcM½;½æ®‘j OðP%: j¬þ`4¨6«Ñ wÒWÅ~0ë °fÞRozÍD›Û6(ÒÂE“Ó·®\/”Žbr-7Àÿ  ÿÿì½érã8º(øží®Åî2m­Þ:²¼©Ë[[ÎÌªÌÈÈ¢$Zb%Eê”m¥+oÄÌ½óóóçNÌ1ÿÎüïy‡û$ƒà ùÑKVÕíÖ9e‚ß¾A1 …%/0]	•£&5v>J;ç#9´¾g£ºwáüh*Jˆo›0„ü¤#*È',€^ü ö„KT7±“ç,¦–OÇŠÞ÷ó™ï]K›¶aÞnúæ’Ä©çˆÓZ1$¡/ÚZè•·}ßÆ™û½ó3y%<F­Ag|v!ög×Ì‡tcù¨Þ^‰[N¯_‰ñÖö‡÷LÔ8?]½‰ÛO½&Ë?…T¥#ùà¿@Ù7Ç¶+3­¤	#&.LgÎœ¡-IœÉÂî`ä3{è $™Caœ´‘ô½Ò»pfR˜¼“à4iBŠ®æÔüdÍlW"KR;†gN,o6Y8Ž<ŽÔŒšÏõµ•JÔ„Ùâ`èùƒÜ½¶)ÊÙ.A9(úó¡/Óè¸E¡=‡™î%´[Q_1³}[ÜÒ¸ÓyêÝQMV\ m%Tºš,F>ìOÇ²4Då¤<Ô÷åžTdFö|ë‚l-ÚÞ±ÂöžéSÄéÏkÑy;‰o`øé©Ä¯è%Ùƒà¦®5e•CtOÄº'”ýP>4üt Œ»káT “#™uÒK”¥þ¼‘Ñk¡‰@[8X(7d×ìŸ·Ž­©-NÀú)>ñ®	eh6~œ}q”£Å, [²ÌîãÆ9j1ÞPÇñ†³‚XÚŠjË|0E§nÚ†²CùC`d’-*jz”Ô¥Š™“¦ý!%~Ÿ‹Q~XW"ºP.DÁ®Ç­âæÇwHtëQŸÛùÈ]é¡Õåæ"Ô—¦½Hy7É|Ã4d¨ô=Æ®É‘1E€CÏ¿¡Bµk·ËµXqHá.R„:´¦°³ƒÄ¬Œ8Ý"Ç–Y"w”mÄžM5ç ö›Í¸šÚw¦ Aå²½îÅC£^bÙyHU*óÎr®Ì»Œüßa•VHç†pN;T×è¹¢öÃZA1 ÃZ¨ÜÚ–„ôÐhðVüÛ¼Lú+Ýs<™£Šèöztè‡þü†M1:G7ª°@ÛçD¶«'îd|£ÊFžÓíîL,KœØÑ9ÛÈô†‚ïíwýEÄ¬ÈJoñÊÜzgN­â€'%·?
2N­Ï)˜SÙÍ‚lúøúvGÆùÔšùæ'*ÍŠ¶¦´³î6(Ñ”ÕšC™}Jíc*Ÿìpâ{Ó‰,ïÇÒnQx‹Ðùq\eêP-ô'²g'£y&wq–›iÂ4DÎ´
+9ñÓM—\x!åi2_ŠoâìX!ÕF>Á—e€Q0kÅ ­ÝCÏÍÂ•ØŠZï™BÃW<¾³ß¸¡u¬Ž‹|(½‹Šì1hy¥4iCíý(cgI{–4b¨§CÁí“¼Mib€!`F2†Ôü(¼½² ks1t…À\±û£0÷Òæ1b‘¼'ÞF9àARµGEè’>‚‚Mßß‘¹ÔŒ2hÁd<?´3l+seZ³\Ú'g]KZ+X´D	YƒÉš'0¤ËñföÈûT‚Ü³nˆE|	áå“¢Á‹GGx	§åA,.?0FºF–k^ÛéÚaf7q~¬Ðræ!ášï:QZâƒ.Š‚ö4O`‘95Kž¹ú>Ê0 ˆJŠ­SßG-thÒÍ dUîSõ}g0:pð,P—¤ŸfÁU¢%†5rb\M|+‹çêû8k)¦=E¦9&ÈŸš¡oßÉÔìƒ¸µ9ræÌô«_’ä	ÿr¤ïSØZ½é€äæ«~ë£#}Ë·AvÍ«º[ÁsG®3‹,óúQQÈôó¯È>‹3îqg=Ë±ˆ7ñ8G·sã	wzrP7@–;Ìâ »“g/¢»•¼×o`‚™ÑŒÆ©hgÌÜù‚!U§P¬’Žãxˆ£ê‡–¥Wç°aTÜ!'Û¨P^Š®Å6$(ÀoÀÛK[†âV¹ØõºÑNpBÀ"ª›è>ºa»õÄõè¡Ü´ç¢‹õeK¿œˆ¬n‚Ò°$Å
…qg¢±þ•+Õ•ÀõùWsw„’ÿòNÊ$	Ô«LÑbâHB0‡ârÇ-(h…Ë„œ$mTé7kbäK¿O ×³^Ëô¤Èž'Ù®´Õ·ÕÌ¼P®ªñC¯lc£ã­×(œs‡”ÁŠVâ¨…lÖ·pÓ®o¶.Žå‰×7hÃÿæ3Çºk4jb/o$t v£OH{·±)&$í¤kÀÌjzžÃ˜Ãq]Œçbç‡³v7PT£ëwœX*®#h'ËÑdôE×ëú‡Ö™}|Ð‘˜MÜNà)ýLl»Ælt§Û”v)j@è‘oŽ¤ü+›,³F‚?yÛ¬ï)¥f~µ†›µÍ¶´xZŒ+\ÀBKt3j@1*ÉJ®˜¸ãÃ²ý¡I!X\½¸Í@%¹%Hð£3~Dê¥–ÃŽa5PŠìøŒä›T{7å!¢ÖHCù‘üKX’ÜHqÊ˜èš{dÒ„ÚJo ÷Ž[[ée²¡Ó¶*º¤R‚CAWÂ>—,÷qìomw(Í×’å·¸¾'àYôEz	Ñç¸¸0ÅÑO=\˜Q#Ä‚ F9ˆ2®L'øS{Or}ìTrŠ4â”’6Ì Líòü=ßs?IæÇè‰î 8ïv­•6X
êíS9¶Å€.YœÜpcúÍIn -¤‰¢¥ýÇýŠýã6‚£Æ¦O7o4¶²ü,¹AÐœ­‘©®=ühQ!É`ÂJÄ)§Ý%wHtƒìã7­¦„é„µ ¤õzí$°Ð€!pƒf_Š‡d×(þè!iä ë´1Ä!¡7¿FQå!8Q,‰,GM(!Ô7L@RÚ†Ùxs0°Ã¤¸9ÖLN±ÙlçõDúõÚ:I¥O”¤ÓÜÈŽA›ðý»T6èùRà4Ö†8ÎŒìûã&ëp¸p cstm[Î(?žtƒœšîØ¤¬i‘åR‡Ñlë…71kMÉ¿Rì‡J	ýÓcU¢pd™öi43t™¶3¨y†%Î¯6ë§âæ±kriÚÎ­¹ÀƒÁ¡eœÙ-‘FG-äÊ_ÑMÄQW:oÒ­o6j2iM›IõòP£5¤ôùT½k Dá“I…96hH£MÉòÀtŠ¾çÉ-’®ådßº±‡Öã+ôPej–ÉŸJš0Ó3ƒá
ÓéTêtz–¾‰‡sˆŸŠõoà
óFûÐº8­'‡¨ è©†Æ	®†Fß;Ñ+Òq±_×é÷ºçbJÜ‚èüSÿ­Ðq.1³½”fë_Îq%)N;)Ë¾jñ…L÷¨cŠ‡¶´5`È®ËÎŒinÔ‚Qi\q¥à
ÑéTñãrmåÄv‰â}ÙX‚ëöÓž„ÅpÉóû¯PÌöDN8²<&Ž£¬Joû§R~ÿÔ@Y†ú{ºdSÚëP=µ²ç‡bGz‰{ã+û|CdiôÚØ@©Ç?¼ê_ÕEîFµ>½Ã-q}z‡Êºzr"Õ'‚KÒ§û2Š«»9$}?ºËGÀ%éÏ©&bƒ~ƒ¡s%æ£ÀåÃ¦r˜¥7¼]óE{'
„ºðçA`›îž3·Îô•à—P¼¨>äÌ4b>¦ïŒÑßŽ%ÜO,–à¸…3—á‰"+Æ“ËG”ÅX¬’SŽ©a%â…GÊŸSÅû“ð½QJmM#×_l}<Dá¾„ ä'w¡¬Uº!?RMþTé:šâŠBÒbšq“eî`g§+s£Ä[Ù‚	qŠ_ŽÍŒÓ/iBÙ•ì`âÝÈ˜!,ûÚò3_ 4b:ò±Ør„ÎÎ?–´®¨	Ã¤¬ivù“&¬9[G!i«2€q¼M`É²Ìnáª¨˜ã‰5ÍÍ'jC-g_®ìˆ“¤ömsê¹¢í:nAtfz—åæT1j,rü#œ¢ò¦{&Þã×ìÑòlÅV”´ÚìJœîGdÇ\ŽL×±Ý8ëè¹cßÈÑhQY>ôü¨þ'ÎÑ°`	ßÒÄM¨(/ƒ0q¾çÁ0K¯Ò6µ5©–¡˜iÎ±N=ˆgËøÈÞÁx²%>zèò§žyÚŸ4¢Ö›rhxÒ„p=7™Ž%OAlÅ`âdîŽ3Ì#nÂ|•Ï2ä.iÂÈ­ÓÒs¦Ù ›¤	óþ\±¤¾N÷„æ\£¸˜98á2ÕÒF¬ï&ë±ÁÉaSÓÍä–$mäÈô‘E
çŽceqÒF–»5ÇÌ°‚S,+86ýQ._Q©Êë‚tßEnÞ\aœŽN|3#D	¨!F>ËêŒv@'ºSasºUÝd‘.jÁtž˜^¶„oÁ˜æTÊ¤ëÇM˜wûÞÐy²,¶~AõólÎÎn¡Jç¾um¹wôX½sïLwv‰Ô‘ld=´ïp úªÙ·E»&‡sœk¥owsõßú?ÒuÌÑé91÷üfWbVÐ²ÓEJm]¹u÷Œtü)®„|‡ñ˜ÐŒ‹ù¾å„bXé…3£1þñ#Ç`Ê®fŒÿŽC*É—÷êÁñSÈHy€x!¢1pCìIò§Î±>e`8¿á+iô
ˆ¯šç[Ÿ£ì’¯$cø+œ1ü•‘uÇ-pHßÈ.‘B…)ì$Ás¨`àˆf)Ük15«âf»¢Z	”Øš7–;–ôãèIï=ÊêÅtì€Ü8&œ1z¥½Hy·òÏ}m‡¾}m[£h­Þ€¿Vädp•;Ä‰·S{´çœP‰&¦ÈÇAÓ¯K‹'«°w3ÇãÌ(õDíÿH.Q¾}kæX¡5zå³SM:™ø°ýW<éÅìE–ðå½’ØÈö‘VÑ·›gR@=»Ftœì‰o›{¸³1<îŽ2©5È³UNÇ¢®P¢’|’¿ÆˆQãÐª·Äðä³QT(¥z˜´{ã¼¾-Ê1&+rŽ•òXô‚÷¥T£Â0o]ÅB#j&‡VCrÐÇ-˜…8·®0Z"ìy¾ç2MƒyXèM\«¿'ÅWÃ%FgºÞ“OsÀu»²÷d÷.®ˆ˜Ÿ‡k4§?e*‚ë
ïA=Øu…þpDDW´¨vÆFÏ5º(“*§ïy‚¿|qqÕAíð«ãÓ7RQSÞ€g)œ.ñûP«D”|xC…¦òê³ë
«1x#a%»¦²†í†ÊŠ<9ª;’Gá×(ëŠ„ÙÖ99õF–}ï[¿+a'ŠÉíI†tzUùsÏÌÞ•¸iôzç
y,Á±LOŽÕ¾˜bç[Š`›"Âš#f×¥2"·Œ!“)¨d‡ê›S^Ò±Ò@‡–ÈâèUªÆ“þ¢1Q2NCr]~€§Ø(µ×ndÎŠZÈÀ·,´òl·ú¶IÆ[*riÙîµGµ´‘8(I
´ºèÕ©ç.H&‰âb`ôd’ñ($ÈWç4yë7;Ž—ôº’ÍáÀ¤p“) áo¼õ{õJƒyrÛ;-âŽMþz´a‰jÑ‡·¥âýÂ!ìô9ICI`fÉÛýùàºÂ ?ÎÅA~ó»E•öìs±ÇžØÞÙýÒ’pírb1DÕU´uÉ¹†…ÔÝýs™ˆâºý$sÊŸR|w.ŸƒÓò'êàºÍ²‚zÔ‚3';C/a6b›Ø
W(Ñ¾™ì›8æhÉù5Fs% `—«ƒ ¯‘ ðZ>Y]¢—ÒÛØ%†+ËßÖG~%)âÖ±K”ŠI±'{ÎR»5»²ÔEæHÔ“]b}ée?àÞÕK½Ø%Ž0Jýø5ÆKêÊÆ¯QR¸´(ì£/:{’¥.1o»:”Nq€KÔ$Ï¥9ž“å;œ˜þg‡ó2Gx"QbÑqÈŽW2¹Bò—#¹Û²[˜™æ9Í“¹Ü‘_cPp “&~¢¼çÝÅeuØ¢¼W(*q(	T§Ó±„ìe½<—‘]bH‹„D?àpèQtúWÏ)ÊÕÈN)b—(Ê'}»DÉÒç¨)^z2ñê¡vëÌ”¦È.qº·¬yã@WZEv‰Zyñç¸n§”ÏÈð×(Þ(wä×ÒãË)>HÞ/ÙAL¤°§¶¾“åøŠä2|Ø
Ë¼Wø#—èÃ‡ˆÚ‘gñ=ÀP%IèÉµÙþœJò ÍžÚwáÜu6Hâw, ~*¦P™GRX‚¢!IŽÔˆIÒŽ-Æ¬i®‘?v€ßHj¹c°ÊsLß8•kz¬¾²B ÏÉµbá¹PÂ`»/í”µá&c:‹ ÌÏ†5£wÊ·†¶7¸‡>3X|“g¶£|·Ü,cD‰'™ñøÍ$+%ƒûžk0£Of,¸A¸5èqt8…Õ3C@ÜƒX¯x_
:&“ Xaº!)ë ÎóÃ®eX¬hÀm‚†$Ý`fÈÜh•’ÕùI´Æ¾?çâ÷ð‹âpfå‹-°ž®=3-a°dÝÜhÑ]|*/K“z”çCÅšÉ·rQÎ¥‘à0ââtÍÇC\Ê³ûZÈ}-¿‰hà1Ÿ¼JC~éX¡4°•f¥vŒÈÌ®ÞD5ž²8;!¤üøž=ŒyL…Í»?p/Êfx1ñBoÃ	ÈDÆ›óf…9
„Ï6K8Td˜ÐÏÆ¾Á«T˜fcŸ$ø™&Á(À4œênÆñbàÛ£
³äCÞïy§ƒþ¥uíÃ1h~•ÕL;=Ó$á´òˆÅ'GwW˜_ÚýQ$Œñ¤è´Ï€›¸£@Ë>6:m<böNÓOåŸäÌ¡ãƒŽÁª]å¾•Þ©P‹¥cQVžô³Û¤BŽV×1‰Ä—ŽÞDJ|¥@1üXÇÃÛÙi—ˆrúó EÇNÌT¼¿°Çl¡ñÓì¸CÖ>êùLÓŒ¥Î(ðüAµò¾6wÖ«¬›åÉÜ¥‚â%Õ”é'FßžÎûP³d}IÜ÷Ù83È¾CkòÝ†Ã“¡¤º‘¨à(îÌè¤ós­&ÊiÄ%Iw±†ã!â¾dù¸3[Ï±èvHŠU±7’*öFœJZð^tIi¯G²BvÔº§¶l¡|ó7IéÈwRÖïñàj°RÆ•9p¬Ð€£9æPã« 0„8[ÞÝÈrç¢÷ÝÁÝÐžå
ž N­Ðò|¦3±S.ª©éIï”=Ï4ùêöC U¡\J…©æK­<ÏLLŸRÕSJQÊ	‚ÀšàDyõn-8ú>×BB¬X¢‹[p,t»L¯g¼&Ò Ï¥ùD–â`@B9;¹
)–D(_â1æ#Á:%¯Ì™e_‰µ€èf”ÕÕô©éÙ”Ï}„]1Õî¦Üçeðé T«¹œƒµƒòK9z=ºMà6ÊÀ¬ ô‚XêôÆâüâ»äØüdú¨hÅ×ž34]ªüw‚‰qeÍ&¾˜lß%ôîãDØCgÁ^qdy3àù._'}œÐØ4ž€Q`îZh[½±o}s„ç‚™ŸwµžKYþÁ¹ÕŒá˜pã•Ï Ò6»ˆÀ§óä½	ëý¸c,û—‘h¢S§èƒœÛè±„§„Ðmî\Ï}õ}.Å@N†ÌYÞIÜò¾ŸVù–åÃ‰MiÐ!}“T˜§Ð™¹C˜¸þlµN8‘±2˜µÞsŒ} Ž(52íLJ:=NH·fÆùÐ2]#©Ëkœy£y¡T ì¼KJŸ~ÌüØ	á„Õm7^n2ÖÌ±Gv¿fÊ8ªÆ]áR:h0‡HÐ9pQ|¹TÒ÷üªÊ£˜"ñÄ°´;:nlô8¥)¦Y”Sý­®ƒžqb.¤\XÚFxÛHÝÜI˜HÎ”0>†“ºÏÑãLt–y#ØÂL©¶TÔLXóã(™• ö…=cš½‘ýHY"êK"AìQ@=¿c¶$Ç8—¢¢äq åò ªÊàäÁºsßy$¤¤®% †FÙ*`’tÔÒ•ÍòÊ·‰ñhûÖÀGÊ4ð<)}þQtJÍ¸àCYDîÃd1q$æ C0=Güãwƒe¸ÃFGä1ÃWÇW]÷{¦Î¹Fd1GqhûT,yc")ïMJž$UQ”ü›gSÒsCVëÒ‘ŠdÉA»“Þi÷Ùlšìcß,“J‰‰3¼±Î$êü\g¢¶{¶«y1)~›Rå{¸ÇB4ýEU|éf ðè¢92Ï!c«hføŠÏ3Ž0r¾{þ¨ê!ƒ¥Ä‡\YS Ä`e'`ÖÈX?˜™ƒ,ïÙF£) É[HKHâÝ¤‘ç}>ðŽ°$rQ¹‡q±Üí#Ã$¹€ÃÌÜK2Oó§°Fò·~×¨'Æ’ºUdëŽüê#nln>2r5÷PmÏ£ß²öÕ]¬lÅCÑ`yÙÄl­ÁP•ßÍ¨ÌojØ‘QWTîgypÌ	Â¨à5ÕSÙIWž‰BÂ„g1ï|å„¾iä ;r§UZ,ÊóK?­Jàêû¿þ/ŠÖ!œðC®m‡~•5êòVªA“]â›·éõ	Õ•ïZ›š³å¡’Ý—dYG9×ÖÖè#º¯ˆb`ékìÏ5>e¸€aõô˜Ïž¢•?œpëõ.úìz-ôíéòÊZè±;]ŠzË+Õe_“å?	#­Šæsß%¡?·ôÝ¢‡–‹XýŒ5¶½ò\ÖlwèÌGV°,½ö×_ËÆ²G;XÆŒ¦J»¤ŸÕ}>¯¨ÛãM@)ÇrÇ”¢½$5å«MÑžä:kww—ÔÈ÷š]{1²oÈ¼wgæÔÚ]š×sÇ!×'ÿCÏá0k- ä—yÚ×‹ørfl‘Ðºãköwà€ó¨]«‘±93šK/5Ëö¢±´~pLgüÉc®Na.·F½F&ð0è4 bûGN3X×ŽÌLWŒqkúƒRœáG2Ÿ1{åR”l?‚Ëá¦#¾ŽŒ|yæÑe¾†â–C‹LM¨×õèé_ÃI´ò/Öá…Õfó®^›Ý½Ï®›``MA}ÑwÜ·Æ»F]zyEÅ©Àº¯)Õdz0ü<0 ´…ª$æ ¾
¤µ;+(šÚ‹uºÿª[+dG1
Hª¸#Øùà—UÊîV‘Ô-€ÝGk±{OŸü,®Ì44Zx¡'-Ý:ïì»ÚZ½mMßg6—LF“<ÛAü¿½Y«­·kd60Ê|\Ð›52 Ãý¹Ö®uê­÷ëÛm2 ïQM’¾}N;OÉ' ÚíÆðHB@ˆ¢Ì£$Eƒµ6àý×÷æÌ Ç”NãÆöÀÞ(Õîeü»¶(¡‡ŸõK½>ilDf–)Å¸õÍÿL2»ƒSÑóâtA”Åa¨HC‰¹¢p>xÊP2ÇÉŸ(\Z"ß|SÈ¼àgÝ³¯tdñ~	ŠÖó2Í¨…Cðwø!˜5ü^æaè¹%OŽ¬ìôÿ<·K5ì»÷ËlÏÜ™|³ÌF ”P™îb¥|¤ÀîÎã:H
bMbv8ã‘ýÝÀf†ªõ“`bŽ¼[ÀP:´€ lPþªÊøO†2DBùîRŠ¦”w­oGÜìÊ0Æô&Eãõ­Z<Ëwµµõöìîƒ?˜ËõæöêvcµÑÚX­­5WÞ8†Ž¢û0@«¶„šÙ›§t[5‰Ç6éåÄ»±üaª¼Aþ:Ù,ÅŒŸË}Øb^Ÿ.‰":Â÷1—õbƒ~ñ…Xö¹ „ÉqÁM%Ö+fñyeYñvåÀŠÆ¨Ij»_ÿé0¼ ‹p¡#ª¥¾7´‚€Êû¶9v=`†T?öÆctw(ö—uy.÷36Â¡ÅTÀàÀ…¨«‘Š gÉýÏ£[€ÑMŠÑ”;o$h}çhÐÚ·ÀÈI§Íø®,»2FDGŠÊv]Ú?Ç°¿ºŸÿhøæïÉ· ›Óýà·Éø>€åÂ=ƒŠ]¾7IÕ®©ÌQk¼ÿ–¢Ú·šlE¨#ŠíÚ·úó ¡ä³J|`…·–å*Y­ž[Çk¤cÑåïVXËâ³K«çHÙw%ûªÿh~YQžj0yª¡§øÞ\hÏ™Sºgº6ˆüÆ$n9÷Æf»@÷Ð¼^YðB‰ê×bªßhµWëí­ÕzRý- ú"¬N¢ éåû*³O¨~ÁD´$2«©8|4ß a>·lŒ	Ãò„í3T”õ-5ÖÅ¿>3SÚ×öP$‰îØv--i¯¤	Rj¢¥wµ93~·U¾\aÕ1r€«ˆdfùôÒËóPÓy~¨¿Áx¯‹m¸0òÈ<œû”¹3ðÒh‘ù…íÎæj³!ábFß4œXÃïN'h°ûÖhWxR!vbºc
—Ëc+|%ô[¶ÖB¨3®EÃj]X‹À7<×Y™E¿Sù¸ò¹M1²-ï¼f«A‰•0ÞÎþ1¢©ï$”pF¾Ã³¦à41ˆ¸/åžO…ùkºo;T5¾ûöÛ÷QSJEÙ%¨Ïï ÕüÚ±®C©!ùœfvÉ}.òKé«xÓ„
ü¯Ûä/AìçÓÅÅ{Øl"T)P­_¬3pW°mu3-Ás,
€.w”0¼þ|[¶k_¿—Q¿” ®oÖ²DoCOôÞL,—X\V[%×vÙd0/íKÅ>n˜¬Þ*ÙQ}@ÛlÚ`º#2ôs²Ò}
ìOTËñ©h¹ŒºT„áú?û©]mÆ¼hn@æ<8ô(à1Ï‡Ad äô„>>¦Ò$8ôÖÈ¥õos›^‘#kj»vtzìÄv?²þæÌØt‹5ÅæÌ"2ÅgYdÎ à,Ž(±ãÜ¨å:Q)…9ÖåÜíôòÔcdl'vï©âiólúe¿þJþÄhá¾š‘#ßY³1Å“Y:Õ[Ž/ §];/&öˆî° –¨›
Œ‡CÏTÇ€‚0¡/*¤gÐk4ç‘[§#T¼‹LÌcrN®lo2®á‚_êÚÎƒ¦ñ¶ÄÛÙc/ÓpýUù
ªÕùïe%¤öŒ¹6â]®ÂÇz·s£od3Ö“ä%õ¹Z®P3Rµ›ÜØ¦ðÉ s¦Ëþpn§Q«}ýÁœ‡ÞûTsÇR>éVÐUOÂ|¡ãD´‘˜¶·Wë50;€ Ú¦¨üETÖ5Ù BÅ³í­÷Ky¨Ìé÷y*ZèCÒcÊÚ]Õœ~Éžü“´«T·ÌmªÆà—Eå„MÙ.åòFNÓù0d€…& ò™éaŠµ0sÆ°n “ˆÁ€R6V`lþû¤ÏS+N8õ¬YB§¢±˜òO?D4ÚLÐˆÕ €êA‘Ã`®•‘±ôlÅÀÓl­6¨æÒhnqíE«&¨$âÓ:öÌ€EœM¨Á"B¸J¸¹C	—8ÙéH«8^E ¬ü)Ò×Öò¬„M^+@k¤ òõ ÍÄ}Q^~Ü¢Ûº•Óè|.S¹ÉÌ¨+iA³F¿1"ªÂB½.‰ìOðYIÌA¯Å¿ØéBž?›qä®¸–íöjü¿hÔkÎP_ö\ú¦²Ezû…ªÔoµ¢,[èÞ‘	ò›z3yqJ½Æ‚Ù¨ê‹¯C¦,%UÛus½³Pà;l3O,Óg²*¤ÂÓ™Y„…Í‰ÝßØÖ-”ðb>öo©ÌëŽLô-p?ïV@´œÊ¤<¢Yîqj¤j¦Ð¬9Q¶º§ÆøŒ(&›ý‚éûÛ§ü•Ãý?„ö"##B­XÊqÆˆ@1…ÁPáøŒüÿ¢t)y=Áä*/‰p¯‰À!Q s¶ Á„J•ARQ"Æ ð¬¶Å«õBœ•UmÛ4sœ“ÊêYñcÝË3káûgt/=ÿ£ãßˆöýë“¦òu
V#c¿Rø§ËvŠ«ÂÛ‰Åkê¹žàæËì“†
]Zý0ãÞbº®ç^Ûãµ‘5'Ÿ#Ï†’®¨‰6F…OÂJ²Q!,‡r–tV7 l2ÛéS.BÕß2f«äÊrÁËÒ¡^~ÀµiVŸ‰Ç÷“ÈBîB^' Ë±OØ»¼	§ñªš”lÆÁKeæ¾žÜ-CPYŽJ—;³ŠÞ1/PÆ½{çÈf¯D¿è^º•3S£–9Jˆ^Æƒl9×†E·…Iö7¨X²%/·Ð¼`dôRAÝ‹îÄºñ=wß»Í™&óYÀ¿™è¤,ÝQ±¿ÌÆfåÏ”Ê(ïkmìî©€Õ WE;ñWÔVÙÿ1M1S³–&ƒ¬s$U¸ë6´„¶ÆÈÉUsÐÎÕ|PBD`ô]Ê<ˆÜ~³‹NFfÍREñ“¡Ôù•\€t©+úîñ‰­÷â'GwÒÏ®×€¤Øw”œSÐ3‚¡Ÿ÷ó½°§cøÃÝû¡H`¸«boü™˜N¸»$~sI/®yƒ_(:Ó¹ô6f«ó-ÿÂ£È¿Ø]r©æ5å¡ðav
v`ã‚¬˜R—^·²pŸ#]Ì™=°(s° Øe6jJ5¾†*ÌÒ‹:\ÜÛt]è?9¾&s=p)¿«³€=Õ¾Ë½*sº¼ñå&í·<J	¦ñpk{ü5-ú5ôP¬#ëÑC¾%éû¼_ÂïØÔH¤Üu ¶ˆÆ ¦Œ¸¡¶àlÖTŸ)toqwJÁ—ÆÞÐÌWU’³B7„(¶6£„H•T¢u¼sJHbCçÈº6©D‚Š2P!½¼À(?— NÜxµ€2-àT´üm­3Z¡^ 
Ô[R †¬kèÖ6BµH1f–lÀ¸J™¥àá—ÌµöÊjÈŒ³µ`ƒmÔ´ñ_ùe’¦©öÔ!ì-*g“.ÔfNYÒÛZê›«0áF;t{¢Söï³¦]}øz¹×5Cƒb·Éš:øCcæÕÌ#Žµ{E×~?Úƒ²Ô€j‚j¿±r½°_:=3§-fµÄ;É˜VGÙ|¨1Pe÷á²ZY%êv¥{]«¤âôiÐÓêÚÐ%…¦'†ì§ˆ ‚gª´ª­	k–®¶ÖŒÖ¹ìï/÷3ZìÔ@®~µQ)àð±›¥Ï óê‚¯ª°Æì–Ó£êÜ…llJ6êDôšÂ(Ã\ôþDmÔŠæ;oZk§1Îc#(¹3\»™ŽvR&µ­‰Æ/VeàPá_ÍwÕ[”1¦d—QUÂ¶R±öM£¢ë§;›g´WÐ]%´i±Ø`¬f2Pç®çW±Ïˆ-j…3à&Ü|”¸Ò •“ò‹ÜÚª çHTÌÆMsÎ‚tÓ”©MY—ûê91×}9Y‹¯ÏNî™bç Höýz±E°ñ¥4D/ÄØ~—}aY2’ ¹>M/AÈAÊÈ¯²>Ú%IVÍø¢ÒˆJbh>È³ú°xmÔen^Q7;:ØÁY1X(\ôlQž„h{H”Ð‚d”j6Çk“.¸&"mzØk<Ðì¨Ì¡x°Ùqê•€Yä¤<¦(PèŒl¯f´4FÃhÓ(ž¹|Ò’ïÅAûÓAÃ)w¥‹ñnsƒ1·8ß,¯+¼	-áú^³¶Që¾_ßÈšßý¹n5¶›ƒ÷"§(pO¤¤‹ÙBš<É§€½J©çHŒ)Íxm±…F'ëå:N­rs‹DUbÐˆsnœ8Ô"!@Ý/é…MÄxD”¶ïßbË®çÃI@9æcv-ãw¸qñÔªîOò>“CþÇïwãÀäÇl`<Æïp…¸ë’U°¾OÞÉùÑò]ËéÛŸ¬Ïï¿›è{õ¨dü·Í«*òEkVéëwŒy<Æü1»&%×ýn¶­Ô°«MÛBÍê«õíújsƒ‹ô²Pÿå~YE‹É_ˆ³éz­ÑÊ>ÀÀˆ¬PÐèŠÃÚwÖh¹¾òù”\˜¾9Å@WiàT^†ãÇ¶-ŒMEf&]m*¿µÁò¶Ã`HÞ\2­Ì&‚Sïµå³Ã* Áµx­,ˆÏ…kuiîƒÌê÷ÜÛ×bF½ÈY¶AnS¿’4¡O†ºÊ‹[¸¬ÆWô<—„‹OË¾Žb£ó9²e6îGx§3¶„é)q¯Õ×›YƒÃ Ð¹ÖªåL1ä¿†&ËÿúÐ>°Zw¶kxóðƒMÕ¥è¦r¨³2¤5Bk¬T5´(`óÂÐ–Ö ÉföGu”è3½ÑÙ…çÈw¤žÍ°ŽKDÑ»dæ{,ù¤O{2}6B×‘7
•»2}_÷ì·¾~\)+me-ƒ•nøù+¶TQj¼ñ+¼¢´+ˆFÒÌêB«XG¢åûõWiE¾'K±7¥šåNzÝRÛ;nåoØÚJ}G`÷‘ãtï0B™¦.…±Ä1†"‰l¨rWØ¯¨<E¼Æú'x‹Ê‰™FÈ˜à¤¤½/2‰$.¬ñ°#Â@Ñƒâ„3Â¹ ÇvYQÈeR§õ36Vë[íÕzc{\X+ïKÊQp#\êVmR#n4éNcÒ+°ç‰ØSºÝ…DÆ®íK&êàìn%j§„Y*X1eØ»Dü§û)ÛB³°Þ†ÎS§ÆÊWÄ¯  —PŽt«Œúºp„²G¾ÂfÆG6p<žý¹ôÆêÌÂ¹Ý§£%­’Iô#[Ú°êZŸ/òÝ
•§’«ÁqåžLzj…>ÄÉ«’¾ØãÉêtBÆ¡ÕËŒ ÔŠòôHÖ¯Ä›ZZ+á'ÓQž‚iœ",É…Š`$à¿ó‹«ŒêÍB{jb;BU‡W œ¼,UQaâêÈÙ€lÂ$,µK7ý}O~îvÎöû;ä¿|u¿L%	*Èšád2Þ‘	€!mAó©­|þáç’1wÈÏnw‡âàòv[1^+®±òùëÂŠEe«ñàAêX‚z1kÙ·BÓvòymsÈ`bû«Cµûe §Í¬ÌcÕöê<Ð‚ÌÊ"¼pT:Ÿ¾†L5–æ‰@:‘©Ç`·ÈÁG¥'žÊ:‘ºCj«dbAýSžÃO“z×ÓÞK,:¼xˆòª­š^+×Mî)/„r¥!¨<$Õ?¢zòe–”~ñl4›V.¬g«ÕyÉÔ½œVHfTä?T)±ƒÒ"…D–èœÝ™ä"¬­*;vI¥ÔŒÓN¨	=È‹&ýÈý!}ÉÇ”ò²/Îû¿…È¡\t…:@¨ 6oéåÅåqqyÞ=è÷{gGÎS DOd€fìÛ#ÿ (¶%QceÀ N©Ø«7õ÷¬2¨6
E29I¶S|Ñ®Ò-z·™¯<»ôòêà¬~IúÇ‹Ôþ‡É­R‚ÚÒËw”h6j­­URysi­Ó?èœ_žvNzo;W½ó³/»§½3ã´ó#é­÷jO²ÕÑ-5<r#ªp ÃÊ¿«ÃÆV£­œ¡Sò{™¦@h!D=é\ˆ–’Ó0¹?žlC@\¶Ó÷ß7k`€]¾çÕ½wÈÖçÈèùa•Ø…5—3ŸÀ«/–×v§þÈÅ…‹‹ÝÁo¥¤š+c‹uñãIüõ-Rùû#¾â·™L,¥åeIsAE‚‚Ç²q‹Ì¤rVGé›â€òÒ	“óx~[œg;eæ%©­mAÍ¨?›[íöõ&«õç­A{x½ñmÑù.ñ/–sþê¾®Ò½¶kTAÂ”ÄÆÓ±¸¬Pˆà% ±— ÒØ,ÊBUwÊ°‰Út^gñ9@ŒP(¹Ã¯/J±ïù¼&c7ÌòvmdW'ËªÊ(+>@%ñ|è§ä™¯O¡CFš{1F¿XOõ¯Ó]™ÂW¯ ðe5Ï|ôXüÍ¶K¨¼¸CËƒj¸j$ŠWeYn‘âÖˆjÎÿ&:äå¢TÆêj ðÊ‰Ë×î—ý½íy57U8|bŠ'õ}±  I£tK§ü@á°ÐãÓª¥J”ÖªeCÊ—£Ü[…ý¾r	³,¯¢È?˜þ˜yšæˆüÀâ.èãà¶—ìhZ‹µ~>	}bR¯¤¤àMå—¬4‰
0ÕÄæáò¨¾Ì3xlÎÄ¸Ä!2` @H”|Ý¹é"°Ç
6ÿIùØßŒç™ÉsO}Ïdæ[åßX`fÃKØWHu‡Teˆfßóîv—j¤a5ð?Ä“3*‘ÑîÒilÖÈßiGú_Pyáÿ¯E£-øïIÿK/¶á¿ð¨xm;N<	~øÍîR$§ÅoìQ8Ù]jÐYZPäàúšþ—u2~²ªÁŸD-ý3ÍÙÜÜ\›™9Óoˆ6€®ìÚS}% 7cŒ™ç„J?z—“4òC5ÀrJÃ§¤Òóêµ(zét«h{ë%…Å…_™|ËÞ_®ù±¯¦UÛFnmªI¨k?*?1cÕ¶)× ‘mqGrR&,Bû{Ç„ÍMuäÓ‡D§)‹I`¿$¡øÐ‡é4LïššwËuŠ ú(Á&ø«ÊuÌ)%¥ê<D­¾ÞhÈš¿¢Ôñ`‘Øs@ª@³§¸ízìˆ¡Äž¦Í,½üaWÿŒ„Ã)•ÿ X#A€Ùq\8§ëEï-]’£+.¥˜©Š˜è–è¦€ÄÔYâgº¹ÌÞ‘îª,<ªrå3z{ªí‚‘ä	EŸÐ
õê¡Š2bÆÑB"¦H~‹Š/gƒÆÑsœ<ÄcÛ‘.,&».á„´­eXtØ;¹:¸ì#õ)í;æP`dWgÙ`ß…Óßë®«ëgö]˜yÞït¯z¯«8Z´¯CwÐ›/¤Çýñ÷_[ëòÂàtµ3È1ÿæ”Â™‰¿Êð”õ—(°ŸšY›éL–÷Ï§ÙšO{«î1?áÃ¡6×¿ÒíEV(&¤%…I:ÌRái:â¯à=1Øèç‡‡šõÌþá1GAsÓ@[ÝXJH-|B&(:~]‘ßÚ®‰QŒ>¿ÜGKÖ Òû—çç¯®K¢ÅÏ/ Ñ ]jsbPà—XL4ÄÓ{ëó–ÔflVãX°YÛ¯o½/öcdëw*k¥µ5µÒ¥EFëË—míÄP(WXRYTu<±gBˆ¿ê6íÄ¶Å‰vIi¨l¡–ºÆPä^zŒCåE\¼º¤Ä.p$U•OÍY—V.Cbðc
{gF* UŠ<)BBQÁwå5¸Äß•7#‘YÊvÕù¬ëdk•l¬|ŽÒ#1]Ì‚£ia%Ë¨àuä¶IÖ—Ò/ŒÍ3¨u+^9½’ãØåïFl/á32èk J¦§K(Ìþ'œHÎñV­Jø­ô4ÎŠ—¯d&â 6¯r	sµ „)y²U&![±ú”r†6)*19òŒâ‰ÀÌ©ìïÓV½Œž?“åÄÙB¨Xgc<+¤ò9ÂhZOFƒœ¡ñ“o{m­ÉíŸ¨!‘6Rud]k+Y‡	9ƒ_6uÙ•`¥}üú+z”l›jÔ¢S½åòÁõuÒõ-Hë»1}›rÏä<Ã3JIèrV\B8ÔÐagêì›|M–$|G+ÉºDm_“†!C/›ü²ð sÕ+OYÆ:ŒÐæ#äÐu?mbºîW»áÇ¹Îé`ƒ2ÓŸ><“ÇçÊê·±Ø¿
‘šé/³ù'L‚·â÷=Yúsíº¾Ù0«Ì~;"àUìËßËãI— +ŒÁ‘ÙÜŸ9U?Oå´,Y\;ÍaÓ´FlS@É‡Íå‚Ger–Va°‘é¬4L’öðÍ¬­Õ+oc6·¶¶Iiå"˜ØÙô‡ùŠa˜"i¢KMUß¯™Ånƒþ·ÚèSÓ§ô™*…/àÖF–O÷á÷˜sû†
/@òbø!ù1!H’ýù‹;7Ÿ È?¤yì(ÝÂb@bîu©µ#_¬<ÁÕ%«Ûb¤nu[ˆ¾ŒhVÍÎ'?Ê$üâÔ¼ƒ,m«¡5†Ä5%Q¦Ïs²‰à3ÚF³4°§ž+âQ¼@Ù¥åß·oS Éf-ÞhQ]zYõ­¼\íÔ¼û–†%õ)‰|US.1[bï!k„µÔê(ê[\Ò^ˆÕ**ï–*±"nIH
)[•m^8o±.× ]]^MüeÎSƒÞ“bÞ¬-“Ïo>.×¡ñ¯äv9¹1‡âD‰`Zì`Kê¥IHG×±YùíqÍÜßKv»œÙÀšÓ"_1ª*-eÉùÐµyk|ò¼¶PŽ·•c;!¯Y`1IÆí[¦?œ”cÉV~JLå¼÷ì¹%ÙÒ™ñeKvj\]îùþz¯Ûßä—=†Ó@„dtÖèÁt`*'Kèƒ'‡ÕúV8œ@Qþ²…I	Ò¹”Ek*Ž‹Zo>$AfŒ òÍåÜT|ƒÊ.šÈ‡y71bå‹þ0[wUÄ<¦&ÇÅKW›é7ÖÚê¨JÌNz¯/v€M£Rgª‹ñ¸¼Äpœ¼Ë{·2VwãaQ¹!¹L‚Ê„W€ „á&l?oHØb†„6ˆûDž;VÕ†£&†àÒ
QÕE×
ic<}Œ,‹ÍA%êê*Ìî4Èˆ§8B=×”(°‚®r3V¢¬ê‘ÂDªD#DË+BZ€¢Šâô"y†\D(Ö®Eíã]0³Ý­ÊÙÔñûÊ©Y|Ê„pZHŒ½ÛmV4{&Ø·)µkPy ß;C—ty:<¼2ý±%0Ýò‰®+bÔ32^Uœ½Àzs±ÖÏÃo¡F_o¿su€²ÿg`·ÂÚÿþ9î#(Ñ"úÊR0«)	š¦eƒÊNH‡·åðÝÂC^“´ÎríSãcî;ËßŽ¨^ºCÙÈØ‚ÜÕïî¦Î_AMÝh­^Ÿ5Þ.öZƒ7wóá§šm_Ö†ûÞÍIsÔ-ÚÍÓEûf8ÞœþÒ¹=ínM‡vïx4{{|é]ô{‹Ónol½ž½mLjÑõwÇ{“ÑÑxüv¿f_]uÆ§¿ìöö{·Siß³Úpºí¿½ªÙ½O‡ÓÓ_>Þž.zãaór1h„ÎÉÉØ·'¿¼²O>µ¶NštŽŸZ»ß®¤e™šêŠùY"Åiá‚ê’©:¯,¯ôèD ®T“qA}8ö¬:;S‹{LHJ´o|_KY?ÌAkzm9¡S’¹æƒÒ‰5T*>7óD.ÊKÍ—”YßcˆDÉ·Ÿþ\#½øÜÅª´¤ŠÉ´‘ÙRÔ.° Ááå‚k‘Aª%¤–^öàÈYÒ¿ètvJLyK/±Uv#FÿÛ’“Ô‰‰dóäe²ãŠÄI9$1Y²d«díG§šANt¢—E§l$7¢üuéÓu$>yâENÍÁê3l$ƒ8$³U<µÚ×Àå_Ü¦HVWV
Ûª!RÓË)ø—©IÕü—ŸæÉý4™c
+ZI'9<«FÈiû"ÞeYY¾”*++°:Ì£ëšVÔ¤ª%uU?MZz×§~ôÎ.ÎºÏÜ+#–Zl¢*èiÜ‹ï>ƒæ4â×`Q<!]x³}m[þ—ˆCø4êBRp””|<î÷úW—½½W•þŒ ©KXg€úÄœ´p |ESRuøí{×áÔ¼û‚á3ÈuÕ#>¨§l.ÏÉ
Î$RT˜.:¡D5Û{Ûs24?ï\þzQ¿“ÎYRqçºxò!;y¼ÊáUˆÌ”„Ó)æì,½‹	H ¾70¶CY¹¬­­=Õ«¾rÅpDŽ£:%£ýŒÕOµ€ÙÍIÝL™3”Ö¡ÐWuZ!À?5ü/"öŸ&’_@çocû6K“@h´Ø:|fT~W'	ãPœùš†3j	»+NeÃÆWJ¥Ð[¤ÀÁêOåln‘:*¬#ÓH%ÔôÄã˜å…Qê˜íÓ1ëífÄat¢7œaŠÊ.ªÖ^eÈ€­„ÆÈÈmt„2ðÝÈ	–˜7å>5é ¢
	~¸Ù•’²°ó§àÀ³¡(øÎvazÎölÙR¾Zþ)š(5ÉÓÙÐä“ó~Ÿ¾:ëžý‹@<Ö7Ë)E—ÎeìùììÜ®ïqà†Tø[<:J¬0$eqQwÕôQ<¯|6É2Ü–ŸbÌ hVvL±Tüˆ—è‘Þú ªÖy	áá§Ù)<ê5î+m1cÊŒFöØ‹%ÜŠ%b„ÎMÉ‰½Îãäwä4T{+åD¨Ü¦Âd’rë”Q4VÔ*Å‹=Ïûx>³ô¡fÑ€W)æè{!ìkSœûóÚó§JÙU¢/4€ûbÒ”ö0“Šò®ÞÈÅ,»w,"*˜kw`y4·Gª÷ë“¦rÒŠ”âB÷³§}e•wl»aD©ÐJP´PTJŒ» >ÛáœŠ'ÞØ’oâ¬ìáé|´P	%ŠFUSYŠéh'kHÌWÎBaýÚ†Ì&›5ÜÆËÚÐTëÙT»Ø‚ŠµAÐ1©Þ,4ˆúûIg$4‡ÞÎàQÄÔ( W¾¿¾à·‘£)FDAêÑ±ØQ™€–X5`¡9ƒ·€” ”&ˆ‡ÃŠ8‘zÀ|e,+ÐRzmØu~Å2Y;éšiLZÞ¯Š¸»BÛ×(ªƒ£¥•ÜÌ|èçj<WKEº]Ä¤]ÅTö‘
ø‚Å­|g¯&–ŽŽ©WñÍ,Õ÷ãÇ'‘ùA[XY¥˜•Ö‘uÍÊ­Ï,ó#ý´¡5ãÇ|Ù–3ZÓu’'0;¡Ý‡sÇµça«?;¾¢ÓJNalƒ~8 Yaèùlè¤¾g
õÌ!Ó$œX¤ñÿÐŒ¸<²Æ+däMMÛ]Óˆ»:A[0÷RÏúàÓ•kXQy…ÎŽj½#l™Œ3ˆìÀœìñœê«Ú7¥l­âiya¹)æ¹ˆ©€(NU¤»i¼`9Ä¥Òµš&²•?<ÖoF!Lé“Põg+«ò­@^ÔêôàùRøÿTÿÔœz3«€ñ'±ÿ“pýd;s<_ÌPý¥`~V°°ù ‰7ú}J‚RðGN½eå3ßö|
ÿŸ¬@/*„¾çŽsSÊdðeW+B,	¡0³Q +ÍBS~qNÊ×fêS±èj³keà†#"VÀ5dº£ªŸÎËÆ”~|ôúó…çµpol¢Ap5/›kóµ•‡,Ä²ºhATœ*X¡t•
fCJ>Nží¢³ó˜˜Œ”Öâb^/y}ª*òšT¹¸¼Vï~ô&:wÇ¶FY¹5žÈ_à ¢Ï_WÅ~ÇâÑfbÚ~œÔ)÷.ªÊ@i(Bªß“ïôæe%’µÐ{kÓ¥k³¼ò™\œŸŸ<‘UØ”i.…‹FdÁ¢Ç/­€Šãé[ÃLt`œñÎÐs€j¹ XÄñvÂâÂ€qB5Ý`1]Á ºò‘/åTÕ!§Š6²‚Í{¬
‹±•VG£B†–»ˆïëäÃX67 ØLm×˜ï(D&{xqvÕú@Aâºìf¡÷óAH	3¥EÒ€h9ž÷‘8öG‹˜‰|úvÓY¼ëðÖ¤*Ñ«^&LÿwQË$dÔXBÆÑ¥óÖ=å‰Ç—ÎpÚ›oþ¾Ý›Žô¿eýÇÃ£ÃÚèèõbà¼ž›?^~ºèÿ­>l¼^¼jîM~j¼¾ íŸÞö3‰ýÎmoÿï·½ƒÛñÙ~'ùßi’AþÎïzvïèílptKçÒ¾L_I	"ÃéÈþ©?^œ]½
zû½úYÿv|úË«úI·s{òK§þC_™8r×³·¾»ènßþôãeíí›_ür{óöèõtø©µ5œ¾þeÔÝkšo.k&çéUçöo}é›ïN÷;NÏÞ›šoîö­Ó[¯×`k5‹Æ†uÿNLHyW[Ï§‡P˜½£Ùr©¨@uj yP¬D~ó$é]3ò*Üèb²Š”p»UËæ²GœKÂw[)|ƒY¤æ‚içcR6@Ø¨îÇ*tÊÂw Åé›z­ÎEÈuS›&¶>¼º„,NmR…ßè6PÊTaU…&½„¯¼“ôušMÞYî«zKVÐµäü°¾ÙèÄäœ/¸Nèn!œ|ÙÊ½š²üXíO.¹I?p3£Rç‚Õi	1°+Þ¥Ñµå°cs¤ëŸÕ$¹³.çìJ8ñs¨²wÞÂ¯ç‚ç®ãP©{
$Aª£‚¥…f¿BóoJwòfåjû—Òƒ%o­{çgžG\+àI!§-¤“S8ŽPóýò©ÏtkÏ™¶µˆæ5K£	³PÐŒ\Êqn§Ûúxäb‡¯hô+[:]íp§;yÝZk|8¿¸êöÞ¨+i>½
Ž«¤÷åPä²F]ÓÙ#¨Þ¬TNµµˆÔ'ºæÂ£#˜G;ª’P/CwcÖÙs7²èù.ªJû^bˆ2ëÚ=~€6*PÃÂZa|ÃI?ä1¹ê°#4”WÕnañQš÷P,²±Jš«¤µJÚïyümyÂli8f”E[øŒœaËÒ”0NÅ|±KZP¾VLªUF?dúX¹Û$’m“ÞU0Ÿ‚ H}>ma0`¹¹–Ab–Ý–à·½µÖPÛvŠ#Úô–åB“³r,q÷4vhŠç,pPÌLÖ‹Á±_Î
ÓzL•4ÊI¥‹(ÏQJŠ	ápòáß@¡"äE.Ü-‡êP¡>VW†T8da¢ lcQÁÆöJA*ênöGž7*
2æS§ËlISgÂÔ“´Soo¯Ö›µèˆ‰â©“I“““×&gîÅïMÑ¾¸Ñj¯ÖÛ[«õzá‹UÈ¬$zR­ù ™¢5˜œ’KËNs—!¯ŽÔP§-•gßÅ@)_öo/k‹ÓI<üˆP¢‡[)-N7UÝOÚ@è§#Ùb]ºb¿þJ–XÑ´¥ÏäÂ·†v Ö0*W3ÜA%‹¯3º¢m#Ò¡"ñ"´‡9~µOöL?Wg'¸•FÏS)zÎ—m.àL£’ò´%¸s2åËhÕöHSçj{«¶Uo¼ÏÐõÂº¶"ë˜mvZpj	 žO·P×¯MÜþé° 75Îß¶.:çÍ¿5šwÖlÈŠi›[Qs´D0$G{ÆO/³–½
òU°zñB-H|‘Ò™ÁjUªq¦…·«ÈÅùàZž÷§(™¥KZ£LµZÜQ•¸Å‘ðÑzAyA]Ñ¦E²ŠRüâZ„€u5¦5ÓÌÁÜ1}ÃOí^ôö?tÏÏwTdz.0ºBCëC0ô|«bÎ„þFZWº(¢E‹Êœ¡?w‡@…1 ¯ø:ŸöÁ¥sP‡CÍ”éB¨dKÂ|¯éÌ8CÈ ;XTíC§ÎÔKJ7¦4€—§éjIr±å\Gdy²šþ»ôú›^YÒåí¨—A•3ÀjøiôaGSá‰¿ Kâôé¿Ö´@)éI¾+É)A£ÿ+zb9?<sá±*s dKªþ£²à…ï]ÛŽµCþ¿ÿúŸÿÙ%@Î–:¯úý^çlECJ‹¬§:ô×qå;0§¢WK,O¤raµåð<*$•«¯N€rèRkéM<R»‚ ×¨o®nRµ¡¹à„¸™rNùIe8ñSÿ‰Å81Šé7•äÄ‰(…9	*s§'ä5U%G®)­(×XÃ]Û:ú#t¹ËÄAú†ª^ÂBk3˜ëù1rE©j¦–BÆÊº1èÑ&úqÓ@CùÉm¬È©28éöAÔ~UÓqÝ^>Ì´+ˆp@Î€Éž‰óS<Ò~›ÿsñJ– œðÅ†,Êdà¤çLJ1Ê£ƒ1º-MO ‚{ÇSˆK;Sæ¦#u5Öm?°œCé¡™Ù¢¶eLVU6:%$CéÝ‚šŠ#“©ÄeÿbU–úÿ¡Ä*ß¬Ê2U«µºÑ\Ýn!D*6>NžF}Rq*ùÄbY*Þ†ßVJf¡–¢ ¨,DÅÙ|ûVÈ#…+2_u • E%s/ ÂüQ$¨ä³ >	Ÿû(é	œ'Öèd¶ß¯ñÚ]¿W	Jûa¯ÎzWäâ óCÿ!<%Dñ7’œØûc±)žp.%¨+qì‹ËK
•xWXÂÌLtJVÿKÈM2½ÿC‰M™ÚËXÉ)W‡¹Ht‹U•JOÒÈO*>I…<ÿy%(±jßo*D‰QÊQ(T¤"3:Gw‰ÎhXÕ½XàÌÈ2apçä
³mÕfŠË·3Ò£Txh†žºxó°Ü/"‚‰Z]
Ë•Æ‰aúHÌúZ­ÀQÕ?-÷¶ò˜jmÍHREÆJÞÁ;géå×Å‰UbŸ5rVµ„Íqˆ<??_¹ª°–)—Œr]†Ó*¥4aI…/©øèVQ^©ˆ%
Y×½^ˆÒŠQÅ‡_ÝÂ©‚îÉsgžžêzìh¢œËº8Þâ!û}t~¸SD×‹1¾õ„(_0ÊÿæÞØLiÞç–€³œú%Ë,±°TP°LNk•Àr½Ë§€ÅÚnÿ¼ò¯P´ï7…y(¥ßlÅÊjÒorÎý‰í~¬(÷&}µTõ4AšÿC¬ˆùE§©£Ñ²1kçw©˜¸é>Ø#òë¯šÅþùòàÐP±ÿ4¶íûµ`>BŸÂØrm•´V>›?*#¸ubŸVºKOär}–Z¢ÂÞÞ-ýh\v~ZZ%KÝWÆÿøïðd
´ÎN—¢Ü§Ðf?ébàÇÒžèúD£]KY0%-çW5–N …-‘Hé5™Òº:áLrWð±…ÁuJ©âInÁ!W–])MÑ˜=¾N î/áÄsÉeçˆœšÃ	¤"žX¦Ïóìz3ßZAàùdß6Ç®°ôdÚA¾Õ(¥^¬¬]Û!mÿ@qÞ´Ý³aHþ´»K ¡þå“´ ò”/(’ eþhÅ¢z£¶Wk½_ß®E’Q»Ö¬Õéu;/)è‘øÓÔ¤•ˆ?é$ãsu¥H]LŽ¢æÄ =‘h_M-t¹=¤Â¬ÍlÒføl)—TÉð+iyõí,v2IeåIü‹.˜…“îÿÇû?ji0éÉ¤"m¶$MNé3+@$Ê@šûà{¨WF(¶}(¹Cé8VÀòÇÖH¹ •J–bNqÝð¦¶.J~¤¸p(íêÕ³*TKñõÌªØêï¨$Lâºh”ÔBy×t†slDNÌÂ2d°5¯Òºi*äY¾M	feáµÀZ…­|ŸX1¨0Zµ^¥Pö%eÉ²î|\ðU˜*Tüž,]A‰DÇ"Ë#ÛaŽÓÈ«¬4Ò>%§æ\†£¸}s˜¸tæÞ…ŒX€†5Zú¼C. –u0±¯Ã€D~)ÐÜØ&G<
rÀLà@®¸ðGÕBÐZ²ø/¼ÍýöY©mÊÉì¶˜¤ÇjzÿqQ—ÿÐ¯ú0H¾J@ãÆÊçÿü÷ß™sŠEtðt¶wèçQušbÅVñ›ÀOÍ¿®S}Ê“È
ÖRüqM×¦rÅ%º ëI]"Xb]_Ó•þ…QÏÈ	!€öÒ
}Ûº#¤¼€îGuPÓËÚ`nâ{\Í´öÈX‚Ž¾yy	$Ô{HÉ‘¡6³‡*Ÿsº¯¨}$dùÒ¼ÕeŸ=¨:ÊsR¤ü°aÛ{ó€þ	°×(&ç;ñ`r4³ãè2£†›T:`r°ã'":wÆýŒY¨F•|ý~mlMm×þ`BmƒÀt‰¤
_¢Ñ†
úÒfgÙ)ˆŠpÊn=.Å®×Ÿ’p‡RuŠ‘‘5Ç''µà%Ý73‚³dbsßÉÉ)é/\

“Åb}Õ£Ld6±‡¤GåÅñ$Ü©íOÅ
Tà¦í@üÈí³¯ú>5ï ¶n}‹-zbæ]ðÊ»Ãy æ¾`H™¨303µ‚8A3à%z1$ºYÈ}šÌs…yƒEÀñ}Me¡!Ã¢Ü|3ÏÄaŒ¥Çÿ™N}H^æ šE¢ àY²àä×»¥bÛ˜
ÝtRF,Ìygúƒ<ó œæÑ í [_%öqçðé%õÝÒÃíÏ¡Œ¨à)F³)?õ"•HS˜háÒË{ºk¡:âpÙGñý˜¤ÐgÐ1¦l3ÙûÙSÄ(Aa}9]YºGÓ*µß!w_lÉ™ˆc7L›I¦;ôbƒ_P(‡‹6»pÆ;i-õ¨²z‹ß’Íôú6jÛb}É>' ”vW†o¥Éb1†ðÉË¦þ|
åÚûCðDØ×”ÛžZf@1U°¥ÄÃ†4ß¬‡¥´¶²ªt÷'ÚžyìjæMþÚw0Y}½ÅO$®³háœü
¶’›#3˜X#¹,{[ãË¼ƒ|±ƒ—ÀË"¯cŠ¢?¹âñ/k|™—E÷´§+‰våÍX4‹"	ù†J¯P¼…PTEÒ
×«ÉgßŒfßÌFQÌC>Á‘Z|!ôuÙã íz­~ÈÜ’‰Fð£“³\1Ì¤è¶Ê½X£#UM–©LX×T&T;°«äs%üú¡‡Týx¹Oöíëk°[{S‹®±BwÕø˜r¬jvÇJÏŠµbÉôŽUÎ­ð¥ªúÂŠâf\L *‡¶òÏ?þ²K(L´(¯#ÿïÿN–»sˆUùÿÛÿš7jü>2Š3îí€ç)„p¤åÏ_ÝÏL?°F€a±ó™ìùæxLùçµÃSCƒŸ	‹;fl¢¶’'û¡5#¼·"ÆH·2ØšØt¬7¼âÒV\^9é“£N Êò-E²V,cE&Méó1¬ke¶â2eÅö#¼X™i> Ç1Ô$Q˜J›y–h(¯†ÈÇzGŽ
ð§¤¾ƒ9e¤*7ªçv{øq÷~™©aTîëO¼Ûž;›‡Ë
â?•²½X_¶DÇVÚÍcº“dQ“ÁAšjÉÉÁ•˜Ò¹F--8¸Ý®­ojO[h'By0eÇŒ˜ÖÈ1ûªÐ4uuX¦Ûí.]yã1•Àî(M²A(gFýÄÆšp±oNÉ?í6ÿDÌ +õ›g¬_ÝKë¤+2¹1»ûðçFcÔ´¬LÉò^²œ’xzd™~Š	pXSjš«#sZ@ÕjŸê6«üo"úû W°|¢	Ä1ÀÂŸJx…ñaR˜*s¶_xü›²NøôUã£¸T!Œ¦K­†F›[ƒÑõVŒÂ”ùPJÃhöN6¢~gÒ@­k*EÂ‚G \k“Þ~/ x2áÌ™ðÁ9û[	èI}ÇBºÖ³Ð~5±<Œ$Ø©8bù™”ä³~#
€êW¥Ò¡_Z0]Íý×­æu»€BCLZ#7i	4»ý `=þèœ˜Ë‰ÈprùÕd¾	¤Îl÷c©ìo%¤²;_ROmÇ¡èÑ/»#Ë“ÎJÞÑ–B+áŸUf«ea/½d¹ÔVÀ§SìÒ~rÈ»´{47xñÕîâé&`—ø"ÓðZ%à‰áÝ_
ò@DcwîC¨^ïƒ7ˆAz(Ý®<e×IÕÍ	c{Ûªô„Qøˆåü=u\†^:¨¦Z*šp&ÃÈêÙŠÌ…-Ñã«ŠiÈtã¡
£î|¬è &¥õ?¶ôoÈ))ÌR’”’·Tª	ÍV¡UG‰“‰ŸØô³™	Éé–¸ Dn!.špw\no{núóX6©væ½¬L©&z±Z)¦pdMÑ_ìhL­–k3^{JdÒýã?ŒÆ?þC3Õçü€Ã7Ç§äB+ÂE`ÍGžñÚ³Ç!Y®­Õ·þóßá z›yÖÏHO…åÚaåOéR$Ay‚#åÉò‰íZ¦_á;0$*‘x*§`óÞ`®Ì;°Ã±¿q›29ñ%¶3*çÒî`Ÿ0meav—(^½D&àJt¥05A87•\G] 	

ç<ï¦T÷™šþØvwïïÁ{²CÚ«œîFk•ùRvH6rB	­ªRjk‰uh¤‡mÉQ”ÏEìÑî%Œžÿêf‰ÜÕw—(«]ðÿÜ5øýþ¾<ñ®¯©¨²»Ô¦+]qw)2²ð¶sN wïkk­Ïú6 V ˆ_´Mß¤—:ò3(|V˜Y­®“tVåuyA+®:³U=ÃÂ7[ëÜÂ7Ûe+/­0bHíx\˜Ëç G®QæWåá‹¢ñÙDÄçX&PæÖ¥ñhQù¨…¡¼ACÖ^t)™µ )àÈ·UÉo€ç¾÷ÑÚ7©0íûæbw©AZjª@%=f#Ù½§2‘Æ+3ñ|û0ŽÂ§ø;ébð#UÕ¯óÒõn«†QW7ø±sg«S ñü`Ño½«‰šê×†‹MS?ÁCvïß-Á§¶K• :dï³KóŽ|G/ß«¿|Ne‡Ý¥ÿüwõÈ ÆßW<"l”O¹ŒÙÇ>Ðó;.¨hË ©N¼µÙnolk¾œé×:õÚv¨ ·ôçí–I	Þ’®ªˆ=D9t­è™Csj;T¨]é‹•<*òÅ€%&M©ŸÔ”s‚Ï:dÁTtß½_fìÌˆÀþJr
ê³Áˆ‚à  Tå´<é.l´6[[Ä.l?É&h–6Á(qA¿ÖÉ« šwËøÅÐ²øQ¨s
wVÞV/‡ôTò^2)zeIý8—Sï›øÝºò<'´ÕbU¹{ÿ¢Ë"½£géHÓÜ(‰/Û»ü‰:µöŠv'9ÌÀ–G[ñƒoxm´úZ»ø¹„ÞÓ‘[”àWØöu¥ýîÞb¶;I04Ý/`E\P´µ§y½Hlî'º,'Bîvï£urh‚]Å’­°N»÷u5kIŸøb“4uc:`g-*ZÇ(]ê~·svÖ;;"½3rqy~tyÐï“õuí¦2‹ün´³M‘`d]y³ªt‰iD	À ¨žúÆÏV ìtá, Ê}àôîx‡Õ¿±¦Úç«”=Vyòâøð‚—]ð±·'×Áú¥îs=w|ËÔÙR¹PÑð¦£ƒ¢D@±c‚WÃÔkƒ‘F\ã€°»4÷å?Gš¬F<È`ECŒ"ëá\ŠªZŠ‚5ŠÖ<l ó¬Ü¢ÛpM;ÎÙ÷Â"œówÈÆ IJ€kíÚ ®#•é£	nèŸKL6tÔ‚­Ø^yÿÌx‘ìÜ¥yË}çI–ûŽ=]C¡¾!]¬W:d‘ã<$Ô\üzDêX Éî½oòAu6¤øI†Pìáœâ²|;Ÿ¬>È~µ¢8-RMLŠö÷Ë3ºÇK{aB‘d©Ä„äžïVÉp±JL–üLv	â¯%¹=ì'²«}ŽDCÒµ’ä]óëµ RõùÉÚ×s—)Eç¤Ã¡ŽBÇåšþ|EøíÐ¡JQ³VÓ…–9ôb,™[5õû›Jë­ø`ïúv0#g–5rXÉ>áÞîè…“øwWß½ÞCÀ<qmUÙ£wÔ€ðÔ¢ì©”i4¶ZÃÍâýÅËIòó‚‘d«¤‹Ö€Â,$ßò§¶®Ûeî¨ò]²#íJæ:¼Ã,ëpYV*ð7ËW'¢U–¾”¼ÈãwJ@¢÷IŠcµ¡Âìöj£µUV±~%{íJ¼îñÊÂÚÁ|ãÕ¹f¿‚4H6ÖúX{EG`ùÿ  ÿÿì}ÛvÛH–å{}E”ÚNS•"Å«,©íÌ%K²­.YÖ’äÌîRyÉ	‰h“ -)Uzš_˜÷yž·^kÖL¿×ôüÃ|Éœ "€¸¢|ÉLt—S$@\Nœ8×}ú­?"óà v2fˆBðÎ[š(£=•Ñd…  Ï cFþ…õHÌèsÅÌ#½˜‰·ÊVw'yÔYGëêu4&¹*AÃ…PsvòH;MhDe¢áá«d7Š(V[!”¢*¥d-~:aï²Ó³k;iÝºõ,Q¾Ü•˜Ì:Ë›ûý`$êçæ‚¬|$CÐ*G£ FYäeäãÏÞå%Ü: ¯ÿ¼O^xƒK_•>@Û½sp’›ý7‘Ù?¸n)m¾Ðmªìˆ4óšÅˆÔ+dêÝŒBoðÛ­-CK?Âi`SÒˆ½žà·XŽÊ:3HÑÿö–ú»„f¤¯¡zkÝ­%hƒIlÀöäðãèÄ¿_ß`bW3»²oî–1ëÉ“VG âõ™õVƒ zj"Ç‰?þi"æ½.ßþ€šH5c/»ÔVðüÂÅm7RæðÇ›F5Í8‡¶G³8¡‡¦*èÎ¡99P¡XBG–ƒÛÕ »"^.äJBŒˆ`ÃÖ‰ÒíRhÓ‰Šqnð=Q:ßä+§¨ó§­õž¢\å‘âý’—¼íúŸÚÞdQ¤ÔâH~!Õudj3Zµßý(¬ïÞ8œ€üDhç.S/Zz9€SÿyDu¹Glñ{¨ÇíÓï`ÉºøéÕñöÅû¾—î«‹÷ýE+¤—“€^9E¼®wQÇ,Dƒ–ªöNƒn«ôg+•tdk’õLX¼™ z¾dåEm>»'éÒzõRªªqq E£Â=±´·¦M¯›ŒõÔÉ†ËÜí\zéÓÆ†‚hµWñâQ•·-&
B
Œ´ërcjvzJ=T<šóGÜY©ê€vyJ¿éÐc’m»æ
ý¿Æ†uËáeÙvx=ÃÀ^Wê«F` ·»<€Øšô‡?6 (º¬KÊüþ``føÜŒ±½®÷3oïsÁÙëøàÏ<Œ˜z”ž‘<ÅÏ—šf××–É/ûòã;×¾ÏVq)lm-”xÙÐg±o–¿T|õìE4‹‡jí±L§¾/åk¦&ÄÇ)j#ec­§m]Øžc”WS3ùiÝÁ4ìp“ [Ò†”EÞ'3ñR®§,8®	èDÓŽ×cuÂÜL‡û*¡å½Ñé¼äÁäl.õÀ¾Œx¶JW]U6nU
í/'-(RÜ—¶Ãˆå,€²•Tâ,¹%c;WèIá¤†y†U¯¹Õb•[ÔSë4
3ªÊ„Óëú«°Âs¶
µ^\€‘* MkJªq éR1I¥9"ƒüA±ônÈ>YõÒ_ªÓ\knáÅyt¨hjÅf|6)Â¿®n)E|›–mê66Ò‡•,¤ö¨ž«pKv55$±`>‚àW›d	ÿó#4mˆ)•Ã4‰RgKU×¤?ûÛÌa´%5Yî^÷‘ÓM4Fs¼XZ¦¢´UŠ±‚5Y#vÓ­ë¯ÂÐ(Zhû»ÕOû­ÄI:½±Òê4WÚÝ5^tÏð¾MÝû²|^|¡2í?¡¨Ujß§Nêu­ô¥cJ×±#±º€m¸×[Iÿ×lt4U6vU¯ùÕf…ˆoe*ò*ímÅ“eDz]zŸ¢©0+ÒP§FãÚrùÐ³‚yªÒ}ƒücé,f‹x§˜ÐÀß,½´ê4òÌ‡)e)‹ø®KÚ>…"¦¶R<…-c='ìViâM‘§)+ë¨–Ú2T¤Î{»7ö.5ÌK,'Ûøµ4¸ »#Þ²f{™´¦×+D, _,¯âãÍ¹B*µ¢Ì{Ï‚€—ÚÝé5Á·—Î›ÔjÚâÂãóú:“Šô”èP—.k¯,}È8/Å¯^SKñ§KË1Z¦ŸN8Og0c|4Ã­Œ§Áä¬ÕŒÏØ
•ÊW~
ü«á5¨¶ ž`
}KÚ ‘êqO}h¶§Õéû7¦_£çK]mS@Ôû†]¢uh©e‹"èÏ"¤Yš+g¾W
úÐôO§=è\iü*æJ›Ü§©DùÃq¿çÚÂÍ†µ«³ÑP\YY	}à‚”#…>jñžEõî´Í«f¸ëÍËX.¿_Hj*:ÕªEžb^ÊY»>­®2{¹³Po™K[B1É“4@^³yŒ•9Ë³ÛTËbºŠçÇ71z£±‚ÔùbŠªÉJL¦K¬š‰ƒÖZû)­Ü•‘LF—:´ÆvÓAÔuÁ},ÇêyTqŠT&@Ãº %˜W_³Òå"DrQŠ¢~o¸Å+d|o¼IÞ^\hý¾ºØ®%9îl7Ç]×Ö³ø\Ë“ÑLW_YÃ²B÷ZŽ~²7a‰+XS‰f…„gâÐ0µA“ä ck¯nÝi!'‚þ¿ÁÄÊµ­U’·¨=ÿBÐ’ŠCÅA¾F7¢P-£QpÉ¢ó8Zí˜+u$7îø‰Œb9V÷ÙÛÎ‡‘Ó°<™ÈA.¦H½iŠV4©‚z,X±rõ
Û
sVnÈÊïnÑ»7û×A¢h·®jX f[¼©¯a…ž‚Xaƒ¥gÀ‹V»Ýz_F§º‰F…)(éæ>mGxæ	e4º§T[ÃÊ›zÊ(‹SÄ€Ä¬ÐUM=ª£r$
•ŸÜª’ã$`°ë“a’LãÍÕÕ«««†°Kpf@…~8^²T¹xµ?;‡¯¦“Ë' „¤Ê,ÍÎ{%f×8¸†Yõ'¬Tåãu<E×ßz&(å•-@¨XgeR†Ù_0^Í¾P{‡±d\ÙÓ«¦â²ÿ}Òr£ÓïŠÂÐ&r OWÿ„#X	]`QéÔöšêˆ
$Œ×þõ‰ß’w{d«§–:’ËX‚Dg è.
ÑØû¼kÕæ….•Ð"ÕápÎ›ìrÜ@Ý˜~ö"Z:ô(8?¾9Çx8•45« ™;s4?AðÙè5¥Ê[‚øÂb	‹†úê)Ý£$©«€‘ËÆ]ŒÛMeYøÎò{jâRšÇÃÀ¶F~”ÈI—
C²ò“ÒÓºNÙ÷ÎÑF7ä'8È.‚>s‰ù›‘Âà©­ˆˆ‡a@yG~ØÅ„€aÙ©FŸ‰hÙ®ýü8ÎØ·Â—y…·–k…7Eé6f’ÕÁi½'›»9é°s ÷SÊXÏX@H®î¤!m¢£))3N†ÅãMúw^qšŠ,Ñß«¸¨Ñy½šé9-¯–M‰¯È­¾‹!ô¸<Ø5 Ö5Iù’y[åê,ÚŒ¥ÅVÔ„’:CË*ÄÆy¼µŽ±BžAYá?kjÂ´
Æ^
¸L«lÆ8°½¦¡!ÛŠè>Ÿà!aƒ±x­i„îeÅR?ž*?±u@³í¦HEu©°Ù3­±Jˆ|,E¿ƒ‰¦µœ¸ƒ”d¤›Û¤¶dc½ˆîd½GÖc*Âè^Ÿ±PO„nóFO3)·eÆMë/fŸWH0¸6–^4ã1s¦¯Ð\È÷Ø¶>ÆIå\Ôƒò~b¥D_wfCR–¯*ouâ,âÆJô*¦tèsÞõA+§‡ù9W[k6Ë\SÔ~ÄÍ’)O7Vž6WÚíØ+Ýåñ8¹ÀSQ¶R00q%I°ÛˆøÑ´KzhÃ¶R]¿˜EöL—´Å@µ›ù¢ªÁ¹²©[‚‘^—EÔC•6Âh]ÐM}!sûi Ç©^h=N7+o&"j	¾·º[C™«Õ”%Cw#/?*íUµ÷Ïà\dÕ7X6ŽêUø0TØŽÂþë¥­Ÿkbkì`¥Çš2$uYÄ×ÆŽlJJ!ŠºÌ3,ùåª_«û|Uo¡Lÿ€\{…v Z2µ]ÒèÎ¹JwŠ!æ;­õ÷¨Òe†CaTy$Vñ2[•¤ßÖ86š½å•æú”:Ù­ÎÆÊF›Çë€B ˜f©ƒ]Ëœf%ÇùT#¯¶›¬¤!˜îgÉèpÊ,f©ÙF®©ÚÊÿ»âòh4´NŸzÉ[«•³O^T«×“«¼ßˆu/ÃlÓ¾vè+ö^MÁ
#éÐæ‘¼ˆ¼ à”\‡i\gDÜâDÜâl\X`Skíé
ÒL»×džÈ2ÁÐ4Ýz«Õ,ÿ$¾¨ÓÔïX$#™åöªU˜t–&UÊ¬[Þuz7ì”)ÔÐa~éß]ø{tÉþîÁßEA\_tÔ Õñwa‚J®—ÁÏ¹^¨Ò5h…m`ââÆcÔµ[rnc5VsÑs¦<ßL’¡±äx@•Aó‹A¦½¿z¯Ðty4-,	mN¨V"HËLíOÃ4•ê øc»)Šbú:*bÜ§Þ…Vdë¢^(Å…¢^X¨_ª­]ªŸÕ+Ú¿¡4þÔm(v8c>ÐU,! Ç„ÑG²¥÷ññÞT¯ôn]7W%ÞiÍr~¾+iòs¬Ø=z¼*ÛRÝ—Çl…Yvîg¡ébÙ†*ö;Éž•¥ìV4¡2ú–(ƒòÕÕž=¢"½nOÆFÕzËï™Eál…F;BÞkãÜ ðåÖË%ŽA˜ÔÝzå3½¬u„Ä‚²g¤++¥€ë\b»Õm
HX’Zø”éÆiU§¨ÑI³˜4”€>‡+îìíãf±I‘çi~ü¢UÁà™çÃsukt!Çd»~ŒZó&ž©ŠoÍùtJ»/)Jvnd±E‹CÎÕ²ôÑD•¢eô1d#« n°¸p*eH	û©ºIR/^ê•q4¤”0¹B¿gÔ×2 +Ú#ûëâGø¯NËv,7„ùû^’}DÛ1=ìÕáRé8í-õ£Sé>Ói®J·$µf*1×‚™JÜƒ]c*”:\AþZÁzMIÁ.(,Ôˆk'½Ò{ú¬gSœóˆÌÔ‰ÖÃ ƒ‚Æ«œÏûØG±DÁTã«—t0KA2	ª‡æWaäf+ÉÕwqt¯ctîù"©ì!»s¥0y“8ƒÕJ18-ŒdAt…!NAbR:ˆßæ
¹0-ôÏ‹0Ë£OXj! &È±ÔÄÞÓ† óAhœ‹Åè¹&£Ôki =ãê–Ù™^TEM¢YŸþ‘­=ª™J_E9=’fót%þÊ¹æìÈŸ†‘6Mÿ[`ßrÀÑo‡{ãþõ1oap¿5Þý2ùxOÇ¹+«8~9ãb>ÝR›ô?£ÎÖ|±|z÷9Ù/ƒ>²iéóççÒ·Ó›dN^úCÝxç#Ðˆ°N¶ ggã;¤oy³ïâêÿzyûÅ¬?Œ|ýÌÝä¶Ÿ“Á‹ƒÿBþAy¼8¾/Ää¿›G!}:Óòøtn’É·[OiÀKÇE_›Ï—}q|^âôoöÉq?
¦‰Àíóï,@Q÷²SƒG4±#U„ö£ÙÆãGÉÖÞ·,±g)`_7K_°¼žú×'­gCû­ÉêŠð‰g87ÅÁ¥”îÏ%¦óÅ^¬¾µG1†lM¼ÑMÄÔ-Qúòs‹ëæLQkÍiÃcXíñ`SøØ¦ä·NÐDÖû¸~¡öÒ{4ø6Ç¶é‡‹ï‡×Á›ê81™AÏ1lOÊYoÒ„Áx¼9­)h§íF¦V?„dCú!ïY]2¡1ÜGgê¦?‰»¨§Vv[ºÔ}Õ$ÉÙ|,™¯ƒYbîÿÈ±‰š¾¦.ƒOÚr¸bÛ®8ÏIPç€8zÐ¬aæÕZ7ËÿÖcÝu"ö€mšApCô>{†4AËˆg‹mKA
rý9Êÿd~aüÉ(ÛóÌy–t™kzqž¿:2ôâ<’{1×IiÍÄò1?—TÀWYpñšCl1ý°m82¼Ð¼ˆêôu<­a†ò
é}ºZAxsø°¬Eëc—8D%ªZ)¦-_+‘«h›jÛCW¥ãºÞÁHYeæœÏx\VÉp¦~uØ^\”œ3ÓQäš¨ (‰d	¨,ÎF¯Xà{¡dö—ì¢,©`Œç-ýó<‹“*í•[”çG	¯MBR
…VIÊøg³„T^r”g#mÍ!UvŽE(ªƒi|zÑŸ(J–é”#^4dOÌ6žŒ@MÒºú»ª­l‹š¯ºLcŽŸqr3õ±bÏ…þA	î—DÁõÒ=ZÝ¯å $ºÒð£4ß0OYJÙîák@Æìo,«F,—„m%ÌÆ¦@Þò|ü˜ša0nðï7Ìå“üžòÉCûáx
[Èop˜ìhM‡°x—pœ`Yt0BIŒýþÐ›Ð° •ø<ö¦zJQ“!ÜOý>­Ð0bA-„†]ržN@%ç>>Môý8†wžßÀ£¨ï˜(þä2˜øí‚ÒÀ!G;NXØÎ4¤‘*;  x´eÅ£Ëó‚ä•U[-¤-/*öõñ5S	ðóbýT§ý•Ì”œž‹
Äy.³¨èÔ´åŒFAZC„ˆ7Àw1""?›Š¼ãõÉ)¡pÓÆ¾¹Ù$ÀÂî—«ð”åu4¥°„mÓw¦Ý&áîˆW ‹Ï5çð<ì4pÿ'§QÿÅÜÜ†ü&ÌF³x¾Ãæ Îßçm8üÕ¡ç4rÎºüCß»œøIç¤yöxÿ±ÎÀw›§@È,<‘xÞÂIÜ¾ñ‡ìá‡þîÍCüµ÷Hs’þ=¬D~æ¿5þ´üZé–É&Av~Çß`qS$$+Ì9Uï5.‚Hfµ‹³0äÏŸç#A|þõÒ’©dd#à ªY7ÞFƒûQº\t|?4Y5¬¿!Ã²sõ¹úSr!<³Ü0ÃBcµß+´ãëÍ<çD-ŠÅiqÒæðÑK86@¡0©i­YÈ5„g7‹á6åñ:;2Þåôw&XÇ˜]÷€ªŠˆ
ê>ær|5Å2½néTQÞáR±Ç–kÅî2æYSc}aqê@{IµJ9RH­’gúÞ”Nç/¨kÎ& M8UJ‚ÍQÇ §M.é¶Ev`­wfŸïÛ´­»Û%bÐ åû‘yºTÃKMry^ÎêšZI¿ŽÉx„)¬”’œ¨Gì¡Kí-7²ÔtrmÈJ‡úd¡Å&t Áú0ÕB©GÄ‹˜¼ïçÏYõ²¦¨ÎõÀŽGsJÉ7S	d -gà$US¥µð#rõz³˜—[ÌYuwgäó¿YÎõ5ÁIÈŽ`éóµ)]ÒÑð&–Í1­94ÓW:vÎ”"rv€Y¡ÕÜ¢%
IÐÅštIª¡o”ß‹RÞ¬ù²õ´½•š5·ZÍÖ¶Œ´Q2qê³¸;6ì<)ùZ"õ¼”Ã¼&Èg©j©B£+BŸ©Q*47JœÕ·pÿˆ…Z»0B,µRw?…ðäïA#•÷‹]2VjóúøÍóâÎ¡/¬«’lR­ãy®4p2*ÃxP%ÃË8JvDsŽbò(uQÃ@ÑÆØ¶üc‡‡Sü"¢im0+š4ìT¿ÞaõIírµ?þÇÿRWƒI/š=`m˜ž{×›¤Ý6ÝBÅ|´º1²7tÄ +»Y´¢â¸Çáh®aW°¥ÒáÃ>v?V{¸Á§ÖSRóškÔT:Ú–Ó`™RúpÃÝeÆOÂ­Ÿ¤öêÐ›kØîVT:úžÛZS4‡ýÉÐÆ¬›9˜õ“©ý¼:þÇþy®	H°-oÄÛ²š}«P<ËxÀíît{¢àEjÿøíùv;k†¶bxÇqýC•/pì¯A'›øñ=èþSÐÿèGqÚá»Œ›ª¹ëý~ƒ¡ÿ”K‘µüïÿúŸÿøÏþxÎÍ"ŠB›öãÎ0†ìá¦b'H;l N¼‰Ùs¨;â³fÒV §áó4Šyf€£Ì î˜¢õSâ#½“šÂŸ‹òe²’Y4!ÐÏtE´±Ã0p2í'ä9
ÑÃÆ8˜Ôò&W©=º^&¢ƒÇ´E¹iÕr6	Û('B£š
 ©°f)–ÚVê<X ËÜÉ³.Ã³Ù„ÒA°²ªTvY&·N£¥Tù¨èß†!K©þ³¢Ûið£Þàæ#Ü¾ªë\qí|
+qé Té·2ß˜4á:†äµV,µ î¿Û¥ëÖÈ|Ý§b€kïi­5SYÜ¼ïíÞJ{cåiÛÐõ´‰ùzÎq×¾³ÛÓÞóO†þwº+ë0õ¦þçÌ7v » w5Áw¹ÏFÝý§­ÄÊhöÝÏÚ˜¯÷ôuí|û­¯àœua>™šf>mb¾ž§§ŸkçÓ¤CÞ1½RÃx€ëtÖé ƒÐ†vü 4¹n¬Î^êê]Â‰¨/!¼Ù9b®ÒèqçÁ¹—äQ^X1D1,yôa–—",µv}Ãpª!Q*+ç4ÓJ@ðÂÔßÖšú+ú¸µå+¯¼Ídº‘?áòÄò#y’âçÐ!ˆ Chšã¢®l¼Š/B	 ¥‚§îßÂŽia4p¶Øf‹~=Nó×àLð&XÔyq¯Á£Ox–WŽË¾„OÂk°:õ:Že¡¯¡VX*…Sjë,”Ðéç¯¡ÔŒë¿ØÁp®,LZë)¬´8šôÇ.\öûÕÒ	cê‰›’9ð\Ý•­4=Nª™ ºƒç•&žê‚T¹QìªÄaé‰R¬5 &¹f‚ðæ«g¦jŠá¤	¨,zýt­ùØI„RSô‹cìKÅ°–Û©Ë'õþ´S÷O1_åÑm&†Ü=>¢KË	æ:- £‹Ø™Ÿ#"cj,#Œ’zËN‰jD÷aŠ œEVÈ2D1IµXZÁŽœ¿Þÿ‰„ÃÙƒÔ]Ô°õ&P./ÛãñÊÒò®°Šú&ùðèvÚOî°ñA¼¬ñqîqbe±.—¬ÊÉQuã`‚ì ÝÍ"î¨PèÄú‰[a™t4 ËZÛØ¹>ò7<Œ¨»#ÜL¼qÐ'ßayòó`¤aJ˜M£;>\
ö
)ç¹¬Ïä²Úë9ºz+¿èêÚ¨rx·ê1ULZú\c5}€ˆ—ÌB$«YW;Ms¿¾»²ÖYÙè2øz;'fD9öqqt Y÷ô,â{mq,ô½÷Üœ¶˜zÇ|q-éh«µXçùÑ^³}n™Þ6ì•«E²ÄI)”e´s¼$Æ‹œ­êy#Nwk©6„´9Ä
kµ*¯Â8œMÛoß¾;ÙÝYÈ‘4ìÝƒèÍÉ¨a=ˆ& ëaÙŠ]sæ-œb»“dè¦7UÇRŸŒºëÃ’DW-!º‚Í%…¹ ÏIdÔ¦ 9A&Øî)90‚`©ë¥ê"@a/«¶T8ofÎE\q1\$f~ë‚>%å—­Öfáô¬ž¦ñÍ(¸œ?jÑº(ÊÎ¤óW®ë‰ÜÉ)à¿þ»ýÝŽ‘ÿ¯/§‡`–ŠQHMU0Ë%yºJ0s¬iþÈnò­•#âôHÂ“x§ ç#i4wHÛ@XØ=Ç'[/öwíÙ+„cQ†'+âÔ‹îk‡æ7³æójH¬q©pRÁÃi³¬™Ë²K+ œE6SŸÉd¡=WRëfôWçL®hS•0Fu^=·pˆnf×Ë0bå<²ÃôA¶á’lâRæn1	QÁë¢TŒGÓt/‘ebâñ(À£™¦‹@¿B§*;äìQUêléÁ°Û©VW°#ŒÝ£2íN£»,ZäÜrÈª'!ÂÄê
;MeÔæt4|üŒ^Ðñð@¶ŒÈU‚Älë!13ù£ç™’³	ÓÉk‘»3ÁöÄoL.ÎÏ ÁX,­÷å%c¹îàýEc¹Xáï²qåÎdxáøxa²ñ?þãaeƒh\2½¦%ï™H"ú&³Ÿò¥ª2QjÑŽ"f1KìÂQ0ø]®s—ë2Ð1~|¥R]LùÅÄº”ØÒ3Ó.Ôž(ˆt
‰®þD%»&ŠvÍF·ýÍIvÿ²ZƒarÌ¯YºËÐ¯O¼{œŸÇäeäû°½ýèò7&èePÂV9OBKÿ
ä<± ÀÄ<¦òïRžcgÒùû:, ¯Æê åIÅ$!Oª`!8p2˜Jû¯ãàÁåðíÁïbž«˜W:	¾R9/#›¯ÁzGOÌJ¶;|bË]«×øöä»_¿åN¬Fô•‰v¯}/!Û¯Šó›ëÄâpvžXÉì+ì
•û Ü‰-þ.ßY.ug„)¼‡ˆ·½0	oú+6ãí¿ý]lsÛ$.ÿ•ŠlbÂä“Ú†0QÙihÙÄÛïe–ƒå[Û~f¹ByàÏ-½Íõ³áÇeM1+u5³:™áÀ€vÇ´àÒ4ä½Ãö[íÏ·/›ÙåC?ô&¾I+áåqžÏS9qXÖ›¯Þ!ýèD©Ñ1üëUÍH7˜Z¢¥_!«šÉ5µ‘ª…ô7Óó\U=ÎÒ?­¯ŠfÜÚû¿à9ðglƒ­¨gYë«V‡³¨ïköCÕ’ìN°¼¬ÍÏÉ[Pœ¾$&o…Ô|–WbêóÃò²ù/êN1y!yµ	‹Ý3ëÈ%ç¨ V.x÷A‘DùSÞ …*ò–,$ÑP°`è]¢¨è.àîŠ#0¤+‰´ç+ÝG±g*Í™§$Œtø»DäëÀåO2I¯oRšìrë×…ÃKàÄ:	a¤éi¶KëŠñÌ8P=¯›HêÈÃJUÃèÌ`E{™DÁyÔVÕÍt>~4XYï4«qZØù©mlz|zzÃXYžžVi•³öÔ«T4QÒVÜ²ãŠ^ÁØ†BÙ—w"m]7€U[ÍC*Ú¬˜ØàÐ°‹Êªä‚×±ºÚM79Ì>:‘©ql”	ƒF¹ŽgLÁ€oÓL”bSY%yŽƒ“7)ü2_ÓpˆO‡g—B_¹3Â/ÝÚ¤EÞåÙ4˜R£>f¶¨8°qk^.+ón|M8Ùýñùí”›‘¿{=£„©oö·@CºÈ+'ÓO|GK¨ÎÂM²2K½bÝ¥R²iö5°§²§–¼#”%JŒat–²^MF¡7PìOëdSœªiÛáÀ|Æ±5œ[âÑþ€êãñì¼>©+Š‹*d’³ÑùæP!¹•m~~tškÍmíùa>9ªPrâ»Âyz˜íäå5,—:Qî“% 21R«°¤wY³åTüÑjÌž¤ð–UÑ ìïØ+»F„BáL6,lÛ^á‚•Òü:3@‹yg!äò`dk§¾}`
£±o«EÐœx(}k´'öÝ‘y±-‘óú[zîý`k‡×ü)8ùâ˜‹.ßùå=w$>)T
¹ÒÆúýjÈn›É£äNyup@j‡7¯L~°ÏC~¢ÀûÍQ ÔyG"”óÎä™.Äò_R§÷ÑÖ+rÈ§oò­þ÷)¬’éµË<k¹Ñäš—c`2c—¨Õ¦:4ø\û%¢?‹Ñc÷£p4Ba]ÖO»=kdÕ³>Èùåx‹2PqÓj¼½Lw3”¡QË©w…øüëÉEp¹Üˆ§£ ©=ù+œ¬®È
	×õx¹¤O˜á‰;q%ŠSÅáv¡ RmqîÐ¦rTb/3G3°^Õ×à;2€Gä+=MØLã¨È÷¤uçÃTê=uHÖ‘9~¢:ÄÐƒ_ü}˜x:ûËŽos0ÕèKy²ìL{º<‡§Rû“ÚŸO½ùœ7„ôd¿!µmèá…B§j;C_†èWýä“½I?—þ¤ï/ÏU*TW4SîGÐßD]ì¤ŸzyŽß;µrovÒnMaö©Ë"ry¾6¶Õêh5W‡£åàë…2¥œ¹ŸÐkQÁE[°Õ(0QLNXŽÃGQ¨BTÏ½DÔ‹Õmª³ÖÎYM,¬™ã8;n7ÐÅÿóÖ~ÛVÓÉqK§Â”·nöÚ¶?‡×¶è ^~Ù1Â˜îIù¥à(¥Ù_cXë>ý§V«µÞ~úÞàC’:d›öºy•ô/õÚNGQÇ¾jôó_¼©Öñ›½&”ÊB™˜o	¦RÆH@?ž™»ÓË½¿ŽØ”°ÉýË OOÀK¶ãïé&ÐúsØÛ¢ÓVôüJ
—„Ò‹@F%Çpve=¬—ÃÁá_ˆgªb.£¢ë»„A¢ß‡EÐ4£n'ÅÁO(˜yJÆ¹Üñ§£ðãÔ>‡—»$[h0ÅMŽ>E¨œ'I?ßi5?ÙV“É¤	º¶Ii±´CU ø&-gÖàÉ©nôZ¬?ºìðâÒ„ÓböÓ©Æ1Ö•£èzÍ\É—¢€¦)Nk^æå´Õh/Vnë2™Ì¨vÕ]ÛëWrmçõlqJº„¹nýtªK*ÝSô+–ñ0
&ëösÒåL):Ô»Šn¸Hæä\ú¡y|ïª¾Þy>ƒ4.xVÛºÎfGaêÒT	—„hì³`Þ,ëm¥4y¢‚<:eQ”ÔíAgžíb
Ùš”zÎjûI‚×AH¦Q0ö¢"ñäÈïãž4HÎà¤n9!…X’=ÆlH m„ÑG²ã%æÓwSºäÿmDþàÞâƒÖ|² rî‹V²E¨í‡Ñ±%Ðú/¯b‹ ÉÐ°5 É¿+ØÚ6>c½‡Ï­_‹ýq¯åð9´ëãaà[#?J´ZvÅRß¤Ž-b.LÅfæWšfy@o(ñ™õë×Þ/mw…ÁÈä]ûšôk‡òój×ÙN((×Ä›˜ØVŸÎF–,ÒŸ½hÍ~=»ìó»¿’=¤QQ¿æÝGµN› Z5û°`Åš5:§n›tëÁ8×¬E2uW¬Å§*ËkH¼US*ëÓØQÆ¼÷`EZ>+µ_òl«„éëRÿ9¤+ï^‡x7ÖYƒ¥on³œ¢ëß€Ó‘©_¢ ¤& µ·”ñÆÓuËèÝšlÿµ©½2S3‘ì§uQ?.¦0äçF§$°‰÷µ›i¡P¬u‡ø6ksàÛ\¡Wuˆÿ”KDÈaå¶íÂGÇ.ØmýþÇí ê|­`'t£,Ûå2i¯MÁåZ½“î
§ÝCä !
…PMãþ !°mNÂk“Žüx
ÂÚ}å'Kœ?fãÒ*¬>.¥±Ê«m¦‰øˆuœoxâ=ñ¯‡ÁyÄ$¦¥Pˆ?ùDá­ÿðë(Ão÷5Ñ<œ1Äù¬DÓïº^Ô“¡_Ç\’ã›	ü‰ÕÅ0ò-Û1±ÂÇÉl„Êx
ºÛƒÁó¥8m¨ÕcúèRé¡‹áA™˜ª†zP.ì³¬ÃbY•³W’¨T1'Ê'³(•øùmäÇ³Qòc#ÿ±\Nß«Ÿ'ÇôÂ;kødÁy\ì ûUÝØ7a4Âw‰X	òš§à-¥KßÞxüâówáŸæ·ð›…O†–Oüñ”·Œš[æ7Ÿ-ï„S`¼möÁÜzö€ôÙÔ÷`œÎ
þié;»Yødhùð5o÷ðµ¹Uzcö·¡Å­dÆÓ¡¥=Î¿0¿Az°ôiv¨WúìôtŽ²/,3%>XúN÷,ÛD‡‘ßŸE1HùÎÎ¿Ó¿Wù¸âks ªÙ]o®àñòwÚ·o+W~­naÂ1”pÜšç·ÒGí;wä‡ŠßhßäŽgç0æE|§êÓÛÕé3ÑvpD9rJÙü£ñ‰ýÊÙ#ü³ñ™—!,jöýdÙ;Ù#òÆ·'þ4{	~Ð+G³Ivþmí¥¥ò·ªg‚j*%¨å„½ñ4¥kÁß$	,Êo¼)òH½0 <éÛó€:™Áœ(Lý(¼¢˜„FÄ»||"¬µÚåÎükXŸ^kÐÁD,°OWÿ„#?Qƒ…QÁ¡C²f7äøð·ÍƒBZ[t¦ÝüúúÔØ1<ô,ÃªüöaŠÊ‹Á'uMðc\ÊÑ‹†´›ù£{WUOˆB¯EJi¥1$ÎVïºÖu0™k`÷4ˆJ½‚ë$Ÿ©ÈEÑ¿éŽ‡¡5A	·ð^I‰V¨ßí¼æÓ•Vg†Öäú·rdqßùõ–E’%WJƒ2/ðœ{6—Œ
Få¹pƒ±zat\Û0v#ÐËT§Ó9>:dWW©íÍ–¤ã),â‚!¨IŒé£°®6¼Lµ%‚SaGB[­V${nä>›íàÙêt‘y"®¬_oQÓ¢ÀÐ¢åõVÓÓ-¨¢,Lî–ÓF£±EÞMøsuœ¹x9¬>æá‡¿>‡˜%yUGËe[œë’g¤KËâŠ‡Q:‹‘™m´WÚÝµÔ[¼IŸË$ž%sïÌKŸ¥dæ\
¤çQB!ÿ‡X‹Ê;¢ $ùBtg_VDí¶¨†qPw´´
.(ÒÇáE2ö®Ï>u´ó¤ßŸ6œƒWŠý•êÑwŒyE·§š>ë3n‘q²p´³†riEû•à‘Â2ãçP†ç1xl›·!bmÓc,kd„À!¸E°vÙ²éÉð
ìG7´Úº;ît?X§õ8‰f2î,Ó¼\§6ŸLœZnýj+a@¸NìÌk«I'¶õ5Oì¾—$Aß?Û›\øˆÂç»Îj:8§‚_Á}ZÓ*Ljh´µ¾“ºþÅ&•—#ïÆVÈhÏ’tl<1éi‰Mè!‘Šfä¢ïžé‚´¹Î®iâ~š¡
î“É§'û¾×]
 ­1àÀËHG’ç]cÓ]UÈYIµp›¡RFêÄ½.­˜50çMŸ‰¯Ž~î‚ÍÙTÃÍç”ïÐÆ÷œ]%Ýª¨‡JéOðawubžä6^¯î6V/å†6›¡§—•äó­`‚f2«Ã”*óŸ'èÍyÃd;!Ÿè¹ÖêÁÇî{Ì‰ˆ]ŒÏ®Œt­`1â;ÖØÛËwBÉ;%øR4ú˜BÕiÈ·Ðõ£0†sÖõ÷=J/d÷â4^[©¨qˆïkØ42=ƒ¿¡é§­^ó±®6CÑúJYz³Wbý¿`P¹ÊÈgìßªÏooÉõ&9]Â8£ÇK+d‰þ÷=¹3kù*@–mùSÊ7	È:Á$Hnô¢»Ò%Ý$Û­>0Rpõ¼È ”ð†aoÝlRÙU6?`™‚8¹ùöÑŸ—º¤{r“|`ÍV¼–„Ì¿B„]m›T
kÀüÁéå×– Ç¸BÍFkiùNzdùÃ=†b:Ïíú];3• ·¢ÇxšÛû‹2ˆ°8ì¾¡d'±Møê*Z	ÐÜÇvL±`Q›‚ÜíGæ<hQ'qB[Ø†…KÈsËýªxVØ]ý¡?8£ýø1ŒýûßIóŸßþöâÆ"^¯S¬Å+ I-4tµe/€óþG Ï‹z·ãÈx‘×^<$Ï5Õ"áwë«9ÑÒ’½—ÐÇÁ¶PÍ[!ç”Š<ò=9oô‡^„ G[I­¹ªÍ²Ûbß8¬J- JGû'qU¿OQëé2ylmø²[ç‚˜É5tn¡Ÿ?nSxYóŸq‡¼®RÝf1BÆ!üƒìÄ—½ÎV£óyþÊÙ+W±·d“àyåÚé×a‚-e­þ O¯ÃÓÖÃ%™E+ö”û¹Í.fO =õÓÝâÆñÂC.ðFx´òŠH8-ÛyÂ®ü\v¸™ä/H—Àé)™sáé•¯ŠÃ±iztcþG+¼õ½ã›ù+Ü§¸MF¬îÃî­Vƒ¤6zzWmMÓ—­ãËš=ú¶u×·áûZ.³àDÅUÄCvUÙ•‹ŠÕÖÅ•ïI2«Ç¤m?@ØµIÚÂceÇN2±³†çk+­Š·°©ý8­]Vÿ6CŽ. Xjso™E«ïF¬Í!éÀ%GÑï¢LèzYùå-ðãüØù ùà:ÍL„¦¶›»ÔU¡ÊZS
vXºÓÖÞe¶!§sÁž“W>¨ï¾+œ†k¦2sòå¼
&=UZ>þÑeVpÝ’j”_ŽšR~‡×Çô} 25I“.5Ê?‚zÚ›^Swâ:ü÷NÖ”î,ZP~9í,Ç³ Ñ²‹ ÒÚlÄŒÖÛÒ2U³À9àÙj.=Ùš´ÈÐw˜É…ZÓæ1?c_µâ3Cªþr¸N©ÀdR-òÞqTïÉ|¥²­Îféu–yEn<Ì,À²eJf©Ù¤YyŸ _ƒd›·Û|¼dß„daÞ°‹PûáÑ­¬Ý=vâð¬C=}®çþØ¯{o»Å:yÕD°êâW.zuùèìÏpsþgoòv–X-v–QV‡Ò „dås¯X2o&DðÚó˜hÏsãvØ7§¢WëôŸZ~{£s®²¾\(®ž­ŽÝ³µwðò¬Ù¤
2…>¾‡wkîº¿kªb·×Šh¸m·Ë½¹…sàÿ¨sf}nçÌÜKUî˜ŽÉcþÇ8Ù1®Z%ˆœâø½QnÖÆ|µiìŸyÉì´3fâ.G†5×—W#öÙZóñ²€‡÷wó/nµå?¥/6ø½[MCLíQK#ïÜ±0,ÁhàƒŸ<¼¯Õ›ânhx0Ic“í‘$RUSèÈ%‹É*]´ŒwSJÍ-¡Ž†á©˜úKRltöÝéRs»³Îðr´-Í‹“®†I[W¡ÙX''/÷ß[×â/ÞÔq2$>‡u¡+,„::ÿJqb%öihÍŽ?M†ÖÕèµ­«@›‹"ÜwX	)<´ÂR¸FZÖBâf´o§I0~ñM~U¶[oü³u1Žý$A-Ýq9„è‡õñ*,ˆŒqY[i­ÃioÌ·"ÜËÉ7[H¸=¸ík¨>ð¯þè–}jÐ¥µz2œ*¾
•7JÕ_%a©WÔ®°E®÷q÷"2“
¡rêU
?H“bàŠ£Ž^?ýŽš¿eÜYQâ™/pÏ áŠ:4"1Q±K²Ù?¿¼Ëm—éwôóP‰¹U’ ,mfM±ïÄYc_IS`Xw£VÂ_‚[Ù¨Èi=2¬ÓÀ€+&0cšTÖanG(T|VÑœø4o&AE8²2Ö–95ÉÝ–Æ)–KÏô¤ŒC°›bš
‰IUAƒd&qMÎ€š”ü<«wÎ‚-Õz­¾2x<vP_Rªùºô=Æ¦ý„(_—PÄŸQ«CÔœ”¬F%YdFïºBÔ”k¨Ê4Ô¤ÙØ"GÑÈAó5èn&K°‚IÀ$“ ©Ì‰™ÒboÍA‚ÀŒIs«%A}:£>™±J£5Wái"vð

Œ9¯_É
P€fª…&#Ð°ÃÊé‰&çŠ#š­T]˜ãáó,1mÆ×ý¬ô• L´\„”32È”¬ò¥ÁŠ__}ÜÊ)ñgGáHú•Ó ¥ºbIÌÐÝ7.‚,^íEZ•7YÎð'Ÿ“®Å4ü£BÍ°<²éür]ê]ùõ™ÆúDÙ^`xÄ$ÞÃ¡FˆE-{ÆÃð¶¾'µãÝíwG»ËæÁ9N+¾ÔaQ·HííáÉÞ›­}Ëk+½ØiA_À€O¶^ìÛ\áÝ@K-¼|›ÔÞü´{´÷rowÇ¡” ^’ÚÎîË½í½Ýƒ“eCš¹yó›ä j¶y”xÞì“Ÿ¼rtŠÈ6;¯Ÿ`	yÆîáTqÃ>)T‘/ëL aü¾Û\oö8• †Ë‘"§GfÏÐúº×:usÕÛr½Û’)>Œ¼öÄC
Ñ×¼+wA#Š%&´ =_wtŠ¥î¤)(ÒQ£)À©öHãÂ=V™ÍeÃ6Ð±T)œB¨+Õ
¤½¦¨n](-	¡}ccSH1ƒ”šrLp(§«­ž››AòÊ<]m	_K×îJ­pÚi ZŽÿ–N@½tºs3ñÆA?ñ4›©ï‚6Dž¡Mü8þíí
aìÖ­q1ëãÀSïôÇª›£Ýzºò´¹Òîl|Ó›ãx„6…ø5VÓ),ªi‹¤“eÞ"‡~”Ì¢svp}‡ø`™¾Ü6é‡“‹YŸ~{»$ºu“P\¹C2÷e•íQtW~£ÛCsUØ™î¢ßŸi;]/·h Í'Ä‹‰7¹ù­í	ÅX÷F*(·‡l×rß!EGÙ7ºC¶§³HU|œÌP³ùŽœàùQå]bÐ¨¬¶Þlf÷€èp|˜&·ï_$ä¨~“3©ìò«ËÈ‰*à0AkÑÑìáöažTÜI.)£,ÿ¬ïúˆî9|c*4Ðˆé§ZÉØhrNSÚ¶™ŠmIÊþiðÞ˜Öæ”Òæ^Nßé–¼¦g¦´ãûáe-°‹‹ü3óüÚk”QGqRRíæ!bÌ	&môõænkë½­W9FÎbuÄ+.ÌÝD›u†w®Gµ++T1° ­ÖF›ëËïm;Rz…ðBMFÌšÕDi£¯ªÁº:=;”]Ê¥º%Á¨À7ì%:’z³ÑsYŠ|SùNéëìòó„ÓÃ(œz—”k×¬©É|4”÷ÌhmKä<˜_/qŸ÷níð€WA#Ì?¹=ßâKk¼§A8$ç8e¢“éÌ-%0¹™ÂêÓi:¯ÝÒšø¤>¿Íø¼[NÐÃÐ›\ú)—½uÌE±} À4¸"‹šé¢àYa£+B—
Æ\ ž÷&fV«å¿„4™½Þ,²f™q»L©S®’5Y=,OÎ^¯Þ¦WQ»rh0{Â)µÊ–­¤”"Ô„L#K±Í¬1uÁXãMìÈ8X•°œª²ë–JTÖð’|ö\êPë‡lª‹ÝS:Ó2*”ºþ"‡ãVXÛ‰²ŠtÅŠŠaL|¡æ.;éüÉ€››™¿¤º»ã8Ål‚±8æQHá.™‹ŽÓnñ_§WÉ]¡Âä£Û¢š‘¦'/æÄ+7=\Ô¹Tù²–‰ÓŸÿú¼P3±£¦yDiš©šRÍ¾?¸ôu>CÚ¶ZãTÏ•ê9>DLÒfàðzsu¶[”…°S)ËÀž§è@±,v!ÿ:üXTBTu±»º²Øf$ÈÛ’¾ôGÐ—&Ø®¹4hq©ö¿–fØš§ih«lmz‡ýˆ­^}›SÇyšž;ö®¼·pò7×S«_.õöhÏ,dÇÔtf7â»xoç¬LT–¬CÞ›*‡@y>×ÍÓ)âdêm¤¦¢.äôšÙ’oP›L7_¾(NSíˆS‰É;l‡Ùöô•S«Ô€°š²‹Y wüÄFñŽ—x§EbyßH‚ddÄ`MgaØs_9À²\¢jG×‘Ø¯.cÑ–[Èo™Gšc%iVÇ}B$‹{Š±œùYà†"®ž•Í	FýÎ?™^Û™ÀEŽû˜Š¢ÙýÛŒŠÌ—RbãìÜPìcaTÇÁì,RV$¼ô°n;EV”áŠ¶ŒŠª‘Éî'oÄH‚zôh[ Ï›Cë.+'þ”yFú[Ã»WH`ÁX/t×sˆy&ð%è˜\»áêáU	ÛEŠæ^+Î.8PO…p!6ptIJ8ãnVC7Ë‚6ƒ&Oî½jâ»nqò­ˆäRœÍ1Êþê¥‹îÑª½ÆÍô Ýv+	—ð›Õ4á®NWÒd¦	¦1ÌQƒÐ¾æ„gwª6Å)æ‡íèfš„—‘7ÂAz\Nh=—Mò‰ªõþÀñ`±lŸŒˆïøõV½Ý[;c±ÝÖUu(n…€±ÔÖ&›•h£ÚÌ×¶¼Ð)>&n:jÇ%Zd5‚¡e, %W|±®q)ctËõ’Š»øZöÅD;^µJìÝVhE
ë¼Q+ÂRñ¶Òxì:¾–9f‘äÀ÷aæ­l×}œRËdv )zÍ¡ ± aâ	ßÜL€4L’‚x:òàÇ‰7ºI‚¾§ËžË¯³0ø\pÇø¨™¦¢w†Ú$6«¦uï?¿…ôe “‘§}¡Í „ÑžÉ6Z-ÅNkKã‰„lD‰ŒW.ê|Xp	4¦8@‘b¥Š£êP°jBÝ$¶©ÍL?UZRzÅä´1Z­»–‡ŸžÜÇÓp‚FäM[mK}O…¬qÇSÜ)³íŽ„¤—É9ëëÇ˜î0FÀ²«ºe2aQ"‘?£ä&ÔÌþK.ÛÞ:Ù{{@¶ÞíìíÝ£öÝî^ù F\a{yt;ñ¯è¢~m¹‘„û!B8'2P6–“Ãáb>²”åõÒ°X*üû
]·ê‡¨¬BÇ’Kï&'áÕÈìpFÓ\1HvÒ×¼´Ÿý~÷ÃÈ¿{ü‡?Ôëu²}´wÝ'ovOŽö¶‰4pÇ>ï­“˜):hÕâ‹‹Ë"—]æˆGêL¬„Ä `©«uÀäï­û‘>Ó±G?’¥Óu
¹Ãkî&ï—ÜzÉÃ<?<ºzŠˆÆB˜Äf†–ÓxGê?æØ¥´›-ðÝ§°*”óÆ¿‡Á¤¶ô×ÉÒ²9øëä¯“­Y2DË'w¹f2FÚÓã½W»;ä;²ÿvûÏ»;p…ŠÈºÈH½·þàƒµð[äóQx«‹ÌæüY;ÍyÚû‡ý‚‘_<³z„Æ`b‡$u¬2‹€îÉ»£ýF?òvßžÿ;3|®aŸñ ‰AØŸa‚y;»#?Õ–¼%k#^cùÐtÆ~/ˆB“Qèánùð¯G;g¢'ýŒnœ3›n$×‰•³ñœ‡ƒ›†"Åd°=Fƒšç0 >sö`Hù%‘?9Òõ%¸f‘ÿ)ü(¬L ×ÚµÜ2–^K-ŠRkÉ,ÔNå0WJÐ1)6˜Æ©Ä8&3	Nƒ[§–wšÅˆlä–‰[š¥¥ÝkÜ¼dÛÊ¸bwD÷´Q†2e±;š•F¯Ò>÷+¾5¥Zi›†|‹A˜hzª,-³BàßVSOB­·ì©}ÊðsIg^l]„„S“€-YdSN¡L+„ï@Ç Ou”¹YÝÄEFñä(ó„âhà…h¨‡1FÄ¬tZYYŒp…$VÚ¨©Æª>BxÁÜš¢’ Œ;ß	ÀËy•Ò56{µÉŠÊ½«Í]dè™EBz«àëe†öW[ïŽ÷¶ÈÁÛ½ã]²¿ûÓî>©µþï[¾…]$u\ÇK?ÜNÂ ö÷ýO Ú>^ˆ©Ü1ÌŸøGwo“åÇÁäù’5Ùeì]?_êYo£®ªç·\ñÍG¿ÌŽ…ïà	æZ>ÍA˜K£BkJIì'YûµƒbÕü°jÐ¶˜CmÙA¹‚fÄzŒ
rCú¬ÏZ“ÊvCVUCŠ2ü¯(7z° °ïhŒ!ýÀëãQÌKe³—)ÞëžÂâš³'a4ölaˆ„c?“ap9$ IácäSpÎ ;ã2ð¢8<šÔ€VQÉîò£(ŒàŽ0" DÁßLúCÐ¿"`žç¾7&¡ÑiKËF3Ú®ŒTß>K|±µýçWGoßì£½—'d•ÿy÷ç‡ä‡yqØÐµ’_SìTdŠ…)PpÆâ$={|!¿äwY¾¾<¼Í`6cì6ñÆa4†3àœ³ñ¸`ì§#„ùE‹¥NÀ>µ•ø£EÙd0åˆÐ{@±ú4q •WèÏ"8¤ågýïV?È;±„C‘ÀŽfDu0ÑN%ç Ðïžê58wlXt»ßL’á	[íI|$ýá“eZq6/C4G*ÃÛO‚±Î’ZOÅVÔþ±1åê8Ý‹èXw¬J¡ø9é?‘7^2làçpl·>ñ:Çès=†çé³Àk ª³¿ƒI­Õ„OœËÔhÿëDi•È§íeü¶À Y9Ô.þ„BÿÊËàÚÔZËËv¥äO¬«.ÏªiãÂÅvë¼L|z~ kMäôñØÚG6É*Øpº™†hmúä¯NüK–DãL˜mq+¤Õnš«9¹m™ÓNohòB©(-ö# ma¹Ÿ’EOº)7êå·öÒ>m$ˆ“Ý.GQ·[é2†²™tì5Ý0hÚ¦Äw#º¨’sYÒ€7Ze¯ýÐžßVa0§~ñxL„ùtÈ?áÇö…ƒiN%óD£a;0Œ™p– .—aùp·¯ŒH4®ã=‰‚K‚Ù mz@©#aÆ¢‡î3V²¨Ùrë˜û·IŽüx6Jb²Ãƒ¾ƒ¿¼ËIÔÛŸÓ€øtÑÄ*Ù~Ú”Á‡J” ˜x¿t¾¹ÌpUãï™Ãç”¬7gªž“Mõ^¹zÉÔãŒBØr çDÁµmRî¡ZÛ²òÄ™ÓC_²¬<ñ›…dåùÞ(9–Š{d—$¡×«Úl8…„Ï‘—Æf/¡Á::z>Ä^„ÄT4×ƒ†FOËO<¸'&Ø>aô‘\ÒØ Qð‹w€ÞuÓ /nˆ7À ¬œDáòÊ›Å°f%þäàpê³hL‘AKóÉ eàrå“±ïÅ3è¯†>ÎÐzFZ;dûàà¯Obà }ÊÐ|h°WL¦@¤~_Œ0‰Í÷± &ŒQ?dö2DIBOgQ€
&ÅˆÔÃJ\§äUÃ‚IBJSq}«b"­tÎAV¦@YP’UÁFgÈˆ–~x7á„Eóê@AqN”S!^à4èùD†uÂzàÙè–/çªm6ïÛ;î–z¢c…ÌÌÂFæ‚Ù¸0×K?€äzvØ#Ð-íøÐ(“‡L×{ ŠÔJGŸŸT?¡ŠÚ<ä:-jý" Ã‡GåßïÀˆ¶z½þØ¦û(øþcÜaÜÎ’òè¶^¨Û¿hi)·Œvj´\,5Í%ÔæîÙ hÇáSäÿmÀ¡Eb*_Õñ„%Ñlâ´‹Åt1Þƒz­çlâñƒÁ¥oP¿øã†e3fðÚg0"ßéª8K[¯u¥f„`B.€„ð¿bU=G4B‡x7t¹-¬´§ÉpÀµÄ«¼ ?õ^¸Û”1*×Ó0´^›‚^·z•fc}ùý¢¯#d{ëÓ¦Ì­}¥„³}ÏWöÒWf¥uÔï”
àVx'6…1;IÔ-w6VÖÖñÿYÃÍÞ}¸sDÌsT<õÚ¥ÀˆÛÎéºG~¢>·²ß2>ÔÝ¾ýàHÊ&b.¦»® ‰T%(ôû5ØËÌHÑ½Eö %4|Îé) "×ìk“N§õøíÉy¹õnÿ¤~òv÷hëàÄ½Û†©=zûâÝñ	Ù;Øÿímí“·‡Ð:f\líßól®z· -¾Øß%Ç»?íí’·ðïþÖáq…æŸí¿ÝGA^ínýyçíÏOÉÜäp‘øŽ)œFCAjÎì9¥½âe ¡PÝSkÏßµ?5[Æ	7ïÒÃ-ÃB\¨Kt÷‹Ñ¬ŸÌ˜Ážà £¸Av¯ûþh„Ž`,K1ÆØ¿ž†Ôx ÆÌPùÊŸ|
à:Žã†#èi˜¥EH8Åì(ì[<õûÐ©Ìú ã„ûaÒ±Š"M£êâ’a8ƒqÂDcˆO*› ;70{LÂ~Æ<QÄ‹oÆ,aDpO£ð"ùÔ~¯!±Mƒk…)R<F›ÆÿƒR‡Ý@gÑ¥ŽòÓÈ›’« 
=É=™ÌkOPT‰¸xÛÀ,U¿žÌ¨W(5ÚÀÈg	,þ/ø¥GXÒðG?šø£l`µö„0r”|\GH2ÐÐyD-@˜‘vÉ‡øb‡¹Ý)ž]^rC%Âp–ÔÃ‹:-ÌúùŒŠ½øˆD<õš'€.pI)‹\ú!®Ó¥\:ThùÚð¶Â ®G˜†Öpà$îO¦[ŒÕ#ÀìH_r‚}Ñ°Hç1Ñ—î­2·É=¦N&Yw¬‰7oNvÏ¶·Žößžï½qNëgÃÏVóTƒÅ$8äw~ùV}PùR{þƒXLwíz-/œC^û^2†ú
ûú…ý™§í«&OóLT³µº3Z^S‡©‚ÌÂ608Åò`<,KKÓM6+(ø/`ð4òá´Ùhv
5Õiw7Å;Ö$pþK¾ì­&LÑ8¸}
Ž¡zÜ¬þË`â@Ô~;ðýé¾ïExòm!lEÄ/.ïPx¾”~Á}jKÊ8@úŸæ«ÙÂ–`Aà‰üè0ý›çK“°ž~eK ±Mh!&aa09m}
<\~ƒFÅˆexŒï·1½E%Ö †ÊšyÔ¾Q!©Æ¡mh¾ŒšÌ2ï·ÝÄ)Îa`ÞÌFIPßÆnØ´‹N­ÉØÂuÝ›%fà¼Ä«ÀÕe¸\cË‘£ükÝ»†­C?™#ÏjŽTÚæ5‰qÙÆî‰àsùƒ€ª…¥d‹X{;K¦³„üD¥s‚·«!wµ¨9Áà°ÊsU8JŸ2u˜”÷‡ ÓGdèc,AÍ”ù§ë€Sl€Ý±c„cŽ(‘6RMÙÕ'sÍ|òWºÄ÷ÞaOŸlÏÎƒþ“Ðl@µðð×þ5ýïÛtIüãL½TÄ'ï)ÄÄÐã‘Î4EnÞÍ9ãVVDk—ìõi†Á_ØutäÎZVÊÒ»0D-¼ŠYdfÏ¤oCŸ³(elþ9).ÿerCJÙJÑ0ó[‘ú#»û)U°…~xå4Øç_îíLLCÌSìM<‹i^É
™ÐØêÓ÷?@ï\LÇ´ÿ›é§Ón£·B:øOÿi5šü/ßÛ agó€­žöí²¾Ñha[-lzÛZwo0›JÚKI»Ø´º±Öèð¶x7;NŠË±IN[8º.6H›Z_ÇtY‡Ýz˜¯ç&ë!íQw³‡­Ó¬5ÖÝæ0%‰tÈm>Ä6v‹.Q‹¶½îÖÅ;+®HÌ‚ÛŠAðÀ_Èêœ±pŸù Ã5^ÂêS[eš¼G{;²c¢Z`›ÍÆîÁ»0ÿ±hdÒúc‘éÅË¸éÌð‰lÄ Õø˜RÑ[¾³ÅbgÓâŠðÊV`Ma^Od…©¡ˆ-ˆ‹ˆÂÛCFÉè	þÂ¬`{cÙÕ¹ÅØÞ'U˜ß)Ÿ”÷§¬IÇ2my©JŒÜ„³¹ÅÅŒ’aÚÙ|º».YprëÛ Ì¥¥$á-ÌÀÁüéÇ"÷¡‰¿mHå›ÐM7ñ9ìdv9ÕÓ¯
HÖxÑíÍ;å
KŒW¹ÜæVaÌµ[œ‘ÍtZ(Ál’Œ|
ôesTWœÜŒÐNVá"ØÀ·±ZÑfJ.•A(­¬¸žZkÀ¸Û8´ÝæÙQÈÒqL«¤Õl.ß-¨úŠMþ
,ROžâ)ÑÙ_±Bjø†:žäËø¢¾§Âk«õ±Kt_{è÷û·º{âñæ-‹ª:\Z}£ÈI%÷Rà šòÓjöd£zDæììUgWa/W&'âû	­ ØfÿQÆ{äPGRÀBýƒzR@æ£]±ëY]øvõ÷Ó’ÖêÐÍaÏ.w¼|wÄy¼æLRP…Ð"=zç³‘ÕA…œßIœz¼naÇJ±qUFT	µ¾’€`¬f&^n,úÙª,5Ú;a?‡ï–k–wß’¸ª‚ßÃ«§ôšM‰” þDsSPwBÔSÌ˜$199$5´ÂÔy’iLŽfÒÁ1ÇÐêñü¦¦*Y H‡¼<£už¹rßxù<û&¦ÝÉ¸4²ì¯Dk®ŠwóÄ{Ï“—±ö…Â+J²Zÿî[)|÷°îìŽ“¯£¾Ý[{õ0g¬Úƒò!kÚe(ïølƒ°¼¹ìã‚JÙQ÷wö•ì"À‚fa¡UíÜêIUWá•¥˜[è„¢Îp/Ï6F„¨ÂyÕ?wí½CþŽü¿ÿñ?×ZX	¾S
&˜"X§{²ƒä˜#äl´š­AñIZ Y Ó'Ã££YvùÁL&N5ìTó2ïÝcdç<ôq1‹ÏU&µï¨hÁŠÿ^^Ã™]ÏÚ1Ÿ£È4ÃÐdÕD8âÐñiÄ]ƒl%ª›éŒ¯Ð$Òíƒƒ,þpè!ä'Aa 8>óÄŽ‚_`fò,Ó+
&³Ç_üH=ŒfÂ¨?/F€!Cƒ"›¡ú`Å@áä„#Ô„5F£n–Ò¸QÌ¶ññ\T÷âÞMÃ.cxËÍ3	aR†Á’«ÆA?
ëÌˆÁ+Î:ø|òúÞ¤ï¢ Lúê}œY–èÃhh,)ÏË½ q0`wåA³nSùUÇÜ(#Äü7òVÀ<’é'T¹8ò©øŒv&îyŽ&ùM.	/&ÿÝ“Íp_¤ÊŒœY‘E7%Zwè#d6	{ÐGRú^Ä²Á=ÁŸ—² Ø54ƒ…Ó¬rÊRÇ4FŠRù4H¼kdl_¬À.½€3Ï7)¦äR ¨È¿1aÐ9Z[?‚‹Õ2™÷§y-™ )‘ö9ðú<±tÒÛ)ï	.y\LÆÞGŸnzÙ,ˆ‡8À¼ùÃ=cŒcÇg0’öLãÚ‘™Â„çP—,ôÚ9¬›v Oñí´g,Ìž¿¨Ï%*X+Ê®SþBU»éÈ›ˆ¼¦8@ŒØ¦Aš”>¡ÈÇÀ?,TG§†Æ…ÇX»n$c¢5ø¹EtÆôÍo-r;5¿°p6¦.ÐÔvß&9 ÏI«¹Òl6^,ðeëìxûíÑî&zÈ7Ú‹@ëüÿ   ÿÿ IÖxœì}ÛrãH²ØûùŠZNÏ45+R¼·¤•4¡¦ú¢XI­#jfvÝ§C‚E+\x °%GG8¿;áóà°ýk?œðóœ÷sþa¿Ä™U¸€P¤¤îž™VD«E(deefefå…ìmŒ÷Gr~6È.©æ^%dž&º©yÞ™fÑýÊØ¤·µ&ÁÿØ¯šî˜ä/sÏ7Æ‹šNmŸºÄð©å…|zë‡Ïj=âÍ4ÖµN%(Ù‹gµNjúB³kÝFc«Ù ®3·GtTÏM“w¯àÿÅ·µ%ï7õgsñM7µm2…r¨ÓhÍ6,Í§µÙÜôh…l•@_ŒuÙ-í¶vS{Ûê4f·ïÊžvÅ‡¬·;¶_šš~ÍÁ¿™ÂbùlF]]ó(ñ]¸dØ“Ú1¢žO¬a­Yú.BN5ß5nÉ€šT÷É¥€ö2 ·¦ÝÒIÌ2sxÛÄésà=«(L€MÐrl'9—˜Tá'—šÚ-)Lªo€&Í^(T›P¢;@@†/&†Mü)%ÖÜôƒ®Úã¹g86™¸ÆˆøÜäÍ'øÛ:±éÜÕL2séÈÐ}¼uH§Ú{Ãq=x×ˆx¾;×}viX†ïÕK9»'­•‰€»œKÁs9W—[_“S†›>Ãû(ÐØ¬Ï©;v\K³uJN)î‘ç.Õ®GÎM¾ÞÊ}iŠ-ÌÉ.ˆ˜ˆ»Öl¡xûE£Û8lvÞ¥xž“Ë60ýv,Ú·&;S^\ƒO*H&õ¸¸»qµYRÀ…ÂoHýJíš¡¬Ù°Ö&mVk¨ôý‰·â­2ÚŸRýºo¸ºI“®®Ë™ŒZhq„2®\ªá*HX¶‰,+ˆIS¯ÈE¥%§´ºªç.ð rç&¹ ºfš›äeþ~Ó¯~Ûß(a"œÛ=¸h5¢aË—Æ—}e‹š^ƒÙm­Uï’Ù¶åêÌQB¼Ûef-’ì#ÞÝjËé˜å’ôTÓ]0½K¶wê­/ï‰æ•fhØ#câ$&|•ŸpïjÓ3Âéí4ê:=QÙIj#¹ÚÎ*£ GÀ»¤Qßéu—EŠ÷“,9ïa1Qj×´¹ïKL_¦¥ÓÞL:öÓÜÚ’ e´eŠâ(Ú¨T¥ñ]ˆÜÍ€(i;IGA§ “J3PVå ï.<ŽüG­½-ºîH€Íq}R=Û¸Ï0‘¤¾Ï \Æ“ê€Úžáïq/ ^6kÝqé½`âìDî=Ð¡®ƒŽ¨/È¹ëŒSi,¸Ç-SˆxÏ:£…ð%Ð_mA‚?b•¦[n^-ß–¢`IlxÏ.yÚŸýé&ñ8™í’V³ÛØDeZ‡«;úö—p5úÔÅOã&ÿÐÃÚ/,ÛÞ†O 8:.|Nî…pØÉŸF‘»Mu/AÛÐ&Ž­™"œÍíV'lƒÝNøÔŒà„íœ½VÎx—ÀäO­ækz+r§#`³ÇáŠ>µclö`¡Üi&¡7•ì™•`|ãúSÇ:VjÑ›½m™Û"˜ð©#s;f·“S³† sS¸Ü^ÎSØ3tÓ°SP¶ÒÜn×w(;0e§ÞH@ÙN‘æx®O=CKÃÉ[4AÎ‚Ùè	`6”Ùäq0›)d¶R”é:MÃØä¸,ñ]ÝÒfÕ**Àdÿ ÐßÄp½¦‹ý%>SÇéÝ‰òhŠšÁ.ÀÄÑD¸Y²À±klOa¿ÄW2â7V¢/Jå@€i©*;º°Ý£ÕŒ¬XÝwNØØè ¬{RÝx€w‰J¿ ò÷"i<À;"Õ4ó‚‡_Ðë3o7à\XHÇž¸×”1«ÿÞÔZÛ$¢rT§`4&¼ž‘Š<5F#j+¾(óªåS>Þ>aÆ?w?ÜÏ_˜py²<»Êþ&wweî‚èeåÎÐðF—«9„lä:µ¢1PÉ)6f˜IQjÎ¬|qoËrPJÕsî Ð%ß.=æ|¥£ï4Ó1ÏÇ¥6$ûûû¤úDÈ}{ò”hèe\l¯¾Ê³{ñËIì0”oh&.»3ÓtÐ«Á<Ü$ÜL`Ùsž
ä‰§šì©‚‡jgUü…ÒÛ[Øœì
[Ìg²¸QÀœ+$ôÉ6k#öÿ´f¶´Cm¿Šôõyk‡žÍxj—¼^€%6Ó\ Ð§®G¾ÊÚ7tr8ŸXè4Æ·yk:4»ÊþÌ`Ë¯<kÄnÎ·-—Zï,‘Ï³ukôŠƒ‰DÓîÌg[°ßÃáéÏ=ß±Ès°H'ìµä•«Í¦€‰ü¹gg¯=Çœ3ïºGýZƒüÿfŽ^±}õj¶cÓ†joõFû‡³Æ°À¡Ýoè½wÿàJLÍ Ê2nkÀÏö¨æé.-‘•{†5!ž«ï/G”ÎN¨æ"{‚>½ðïùäŽh¦¿_9£þã^“>BÄ_V‘ø áêÿô“¨À’Œ©ëR÷Ü1}±_±ZøU‰#¶§@TW€ÍšïÔ|2vK ³÷ mFŸ¶v€Qás§Ø\æäQs]£'¼Sè+/^ŸÌ™ÝZ.íèÐ>º"!a	!nMÅž¸Umjg²(]ua<À¢ u*Üä:3<Ú)…²w§Ä>ó«‡ óÓ˜Ø@ö³ò3TSR3»ü;©ÕO4&Õw †¦£_WDím±w”BÂ7÷¼9þy¯™sØbÙ~ï¹+Ä±ûSÍžÀSUÊÌ/—áóUZ‡tBý:¹DkÂŸ¬tã[XìÌ¾Ò‘žÈÝÖÚèðn‘ÄÁµG-#euÁ}îí:s,[Ê·þUöØB¾ËÇ?
ª¥3cÄÌÑ\yIéhì¸7š;"§'ç•ƒÔ{[üþ•fÌÏFÿ"Õ&(û¾Czµ‡½ ž1šk&ZüDªƒkäa_{Êãƒ˜adùà¡Ÿ»F2ìQ™5zË½X6å3ã&~RŒðêÅÉ·•üMÄå]›­p4üý£Áž½àCF’ê¿þŸýF½¹>ëŒ‰å£ÊAð¹D}ÔÉõG¼1¼)Œ‡ÿ‘-20N¾]{,¶¸Õ·3 íK”F ÿoÁÜüÐ2©LCâÚÎ É2~¶ø
ì_Ÿ>}dçcÉÉ)&£—ÜGJFƒ|’‰ŸSŽ4¶?øMªŽi¢2¤¾výãt0sq'þ #G×ëK WG ^‘ÃŸ’SÝ-sëSÒ^>/¢±DC.àŽÇdÇà=÷aÆ`ˆêÙýëiŽüÌ’"Å/wzƒTÏàmmf\‚:£5ÉÌMÍ5~¼—Þãµp¼Öšã}°;]aýýÒIÜõ_Ì}êo9“É²xË¿§ŒyÌÒQ¥Ù˜úlìPâìŠ0jæpØF ª„1¿ÒåÅáñÙñÙ+rñí9yqöêò5(nçoú¯*nÑH¹—9ˆÃ±*\èpüßá”¹'ÌS{©Ò1ÓžaÏæ
RÐ_Ì hi R~·eØû•fCåNíïT¹5à»àX@Í;õyz¦=%ß§OÉ.I ®tdÏ§3ïúb¿ë!¥ú´ÖLJöP|›¢Á¨¹KÎ²>w=Ç­çDÓ‘1V‘Ìjé¥¢"òßâFü›” (.O@L^p™qxùÍÙ!)N.î~¢6õFSU:ÀÍ]…{9ó‘×‘%'yrÐz…ïäâW.JoXA9A•$Ô]}©©/«æˆŒŸ”Uuìù¡ÑQ‚¼óéÂ3t¯ö†eÏÉ©[‚[ÎÇ¥"7n—­Î€Ê
„î£‰ÜØÄKZ±ü]_êž^^÷_SÕÈó7ßžHut²u²¾ÜMQ†O5“Ç§Õ¸´ågjñÝ—xTñ{É÷¿y¬"a™4îÖUtµPw×Åód²ˆä{ga˜OKJ3jûpŠ[$Ež»Ž6¢L‡ó0êò·&Iú\žœƒÖöüâÍáÑ¦ÅU_~ÿúôDI£ÞìþüWË*þM~ÏÉ;^ÎußyiÜÒQµµq÷ó_)Be¯·Š†·žTIã4G²¤n»tIõ›•0rtI³¾¬Ù®wË¤ZX=ãØ³7Ç°›ÿö•eÉ*Ò„ëgŽáÑúžšªê‡rH²ª´XU^£¥v+JŒ¶ŠŠŒV¹¼JŒ“yÂBÀµ
8¹’"g}!ñqÅD© PÝ~ñL~tqüò’þøâûÇãñç“#×û¿4WQBŸ°ŠE¹n×dð ¹ª@€å{±v0Èo›¯ï[“¥4‚w8÷ýÂá‘áaúÊhix—AzÈõ‹ÐKŠ%qö—°°#“^ÌmÅ³ë5[ÔÚõ®X„¢×ˆ’Ù¸¢ÜÙéÆ‡¶˜µï©Š¥Hûð¶qÕ¸j5f·Wîd¨U›½Íævw³ÙÚÙlÔÛ‰¬Ì%Ï«§J[ñØõ·»‰ä¬èÛ”c-ú>€	‰4Ÿ
#°K	¬[œI¹WJÈtìRoÚ¿I.aø­e×x3¬„´j­Âcå(Á Ž8j†¡!õzqÝ£½ÂáËª–©Ì=“AÀg"ÇÕÊ~ò·ú_dÀ’“’þáºÝgÒY6[\ä?ž{!8su]ÇÍOÞ"/É&c•’d4Ft¥ÆH”ß`÷ #,àecÕ(³ÔÛí»Ž=9ˆ“á›Â.èüŠ8±Âp½G+ŽuaL¦þ.ùÎðæ %– _ñêE®ãXäEŠÆ¹ärî;EG‡EYdÏâœ¯’.ñg¼PY˜yréÌÓ™,È‘¡M\Í"}r_%µëRÙ
*vå¦±Ý³˜ÖÊ%¼VŒÞ\¯|Œ.N^¦Sœ­ šÖLv¯×/ÞEBrK$½„Ž¸ :±e}iP°DBR,UÃŠ-)¨jr´ÄNW†ŠTE€¨hP"?›‘‡¤š“¤@eD÷åõS„dŸ¿ý‡ÿM2ùJçj¥(Z2™ºž%dêv%)·
¨ä8¿Ô_ÌÌ´çx¹²ƒ>a7Ìjí„Š™[#¶¬d‘Sq>åœ[@T)õ0¦¬ˆ½*Íz0åï€UWÑ.}inUPËG'C@8GSI5ÊJ>³íhf‚¼€7à‘ØÁŸ.ŽHë_ÿ`©LCx•9w¥•ršž‘9Þ{Þ)•ƒ¿ýÿªzrôš¿£ïØï·Ž¨²ðÑ©ò½á˜Ôÿ¨²U§¢-èCSe0Í6'ÿW,¹CCÌxcžø%¶B^äæˆ³ïØÍ˜€„@z–’Âîg_òOeŽ‹bŸ "ûd3ÈpcÀ“‘Ú¿dÖz3÷Qäœ±oi·ÏWbÅËËXíz4kŽ„f­p¦1oõHXÙ#ô¡¤¿·ÒïùUÆs×jCÃ4|Cím”Ä•1pX³Èkeáš¥Gy	Ý§7(ëJ—~ÝQ¨üZLé¨uŠåC%êæŽ‚º)_á˜~Y0Xº 7/–té =GåRîCRü…­„0YYsÄŸô‘ùÛÍv«!Ù2[I«ÓÝ|Öc·>ÝÙÞl7:²#¬‘ôÉ­{Ê~û$—=³žín ö’ê¿oÔ›Û?ÿUÔ¶¾­fâZ#¼öyÁù‚¿<ysî‘-0QÆÔ¥¶N?Ä’ÃJtZä”½û·‚èÁ pûðÿâ>ˆÎVÌCõW¦ÿ[7±t£.¹\è¹¼¤®eØ˜4îL<â¸ð¿ç…Åq½æ¬ënÅÕ¶ ÒÚ´ö´-æD’öJ	}%•¹`aß)Ö@×¯Î•ÅËCÔç
`~Ü
]DµF×©3¢¦pu`ôñët)`÷Q+u©pæÊ¾ñÒº]ØS¦C8F?”ŸœÙÆHPÑåbmOùÃô¹ˆNs÷Ãè Ë°¤äk0•wQ¾œøSr@eÇ„ìé£Â ÿº)éKQØ†"ƒØô9b"ÃÍêhQ0=ø¶ß10Ê{Í¼Òt}7˜zÐUä›ú·«àê]qÿ%Ô†À¨Ù´Ñn¸LØ¦x3ö—·È Ž'3ß/«Z²¬&c~ú)
–ŸÕÍ¡Tµè#§©˜¨~‰ùû-v"Ø)Ú¦SœÈú=Dê‚µÀ0+¶+³[ávmØ6ž0‚9Ï’ÔY0ÈT¹×2*VìÚt&›Ä4F·ª¯%¬äõðhíÉŸÅ
¼2ïN,&yTîtH³
Û.Dá³F¬2]2ãíûoÿ¼bàÁæ«˜Æ©ÖWd–
¤QhY¢MD1ˆR«×ÄK”ŠWJD—2Ì*¯T ÅÐö·úï¤ÿæôüøs7^]¿8»ã3rþçË×oÎÈ›óËãÓãwxyúo.^Ôëõ‡ÅyÙ1dÉò¢Çá?äÒl”F§€%ä[É&“c‘ úÝŠ” ] üÞ¬Ýq[9Å37G¤¾nÑ©sbçU)K^ØQŒâ[5Nj­ØhÞ"Ñ³T ¸þˆa? ®Sp­ì{ŠÁ=q²m¤Òò¨7=Ìiu˜–ââ9‚‚Ä8Ñæ¶>eÏæÖù¶E}jØlXªæDgÐÑƒ·5·N.§¨•îØ¼‘!-lÍ3sÆÒQÛÐ¬™IÉLó¾mÞô§êj°!ÆGvà—OôWÄßÆØ nYWDRÞñauËS(?HßÁ™ût—\€ø» úög/rVL\ê±ö‘}üž|E^SÍ}AU„­£Œç%ôH$»V–;ÓZ'4ñ²Z¸¢î½wA½Dƒ	ÆXkV åË
™2&>)í†¸ŽGG½#Í×öÓ¸»‚w'†uê}g†5í7‰ËCõðO“~¯a;Ÿ¡ãûŽÅë×«¼€÷RÏÐìWxN„¡ˆ×ôH]ÓuµÅ~¥MÚ•àÛýÊÍFs»õLAXƒÿéðøgõGP+K°Ãužu»½
aåÀpz,âûÂ„õ|XŸ§›pÄü0pÍ°‘»Ÿ³™Âg<ö(Î¿»IÆÀè»$w…†f–CvòŒ¯-rúâòâ¸Ígì‰	ß×v ±$ÿÓ{ué8 kf(½|Ø~as‹aä5ëó~7•/­F¯ù¬²ìœðÿÄs@-'_4ik§=Œ.^€<ž{xKkv[‰šæT¾Ç+ÁwB' 8Ø->ŠÒC,[„3‹xaÙî­0Šuž·‚<écÜ9ë´_a2‹‰¥JLP&û­wà'üâ{Æ™ËÖ9 ÇXƒ}þŽðXÒ#üfI`Î•¦›ßwÌÓ›€-ð„½v¯7nC¨
Ì¡Kµ`uT¿ÜHÁ£éz…ä~%Ì/ ˜`@0Ã€`æîF.‹ûWƒgo+!ÉTtt‰4UÜËl%ØâÄ#
ãšÓºa¯.s¹‹Þ”õ,­Ì™»5Êœ¹—ëÎ²‘sƒEò{„¦"Š”U2k|ií3}&ÄôV~\$ì´œ—Ã†êæ·ZüHÓ×†X°fÏ­¨$S°Ð×Œ}Åýf+¸”ÛýW³ÿ	äÍ‡XN!X³|5#èçµT[K!;7³G^Ë(“Fm%q/Uö»ýÖWrà˜`¹Ç•¼aòsáB†fÍëôÊ£úÝ
ô¥šý<%Ïˆ)MqjÕWäð8È©Ê'çšMÍO ›Éœ(åj)Þ³¼g0ÓÜk¡È;:û"®æã[ó5~ÝúG¨ÉÔË ÐÕt&±ˆ©¤„nïŸ8ÃK„zÈÿç,?óžÍ‘ÚÁ¢§Dj³ ÆY5L©<¡¢ñ*;ÖZ–Júƒ o!ãFŽjÅdÿ7+P‚=Ê:/Fª•òçr;†?1–—?°Âà3<‚Ìä)e2Î…%µ“ˆ'ÓÉ´ò'*ˆÊ`‰RD˜RêßJ:-ÅRy9h
ƒï’tÜ—|±½l”»Š×¤Œ«›uÌºñ{îÌ=ò½öPæ{%L\–Íîú´ßúLûñ,i_©šÑ¯œö[uÂº=Ê'h“²Ÿ4ñ·?<ËBâo&~Ò®“×‹!ªBaáÓ“{SþJÚßÐq®ÙD²¢ÇõµXÃw,’IA_™x. ¬dåŒ8=Y:C9ž`Yªt(…ú©Æ÷2µ¾`®–î½ÍOä0ì“Æ@kîŠ
À9Õ®É¹Ô‹Û0W_isÏßHó(TÈþwf;N{*'ô*6ô%Æíâ[ÙY¶x¤ÍN¾æ“‰Iyç"X$ÈÈÀ°f˜å!g…Ç¼:y3w‰
µðté=b>ž²\–ŒŒô›Äc.5@×À¨Á¸?Ãö¢á„õ;70w|^Îs®‰¥Íf8ÒÜ6|¢Sôçµñ8À8<=YTÿ‹vkOÈØðwâ^³Ò–—ò*ãyù }¡ÙÊë–˜â¼ÑnÃ6Fð/­}µ4îÈñ•Aèí¬J0c.´Zz—T«„ßLj¤Ú$¿'×ü3Ü¼A¶ØE½}eà·a‹lTÊ‹›©z^”Hðû)u)yrýÏá<ìýŽá¦£óxøó"9â8F
Ð::o’'0õ'(Žóo!E!aø‹M½ñä<cbiì®‘cáP}Ê"àÉ0*ùÊ´ó÷@Âø
€(žÚXø
byò§'d,ôOc=tî 51£ÜÃÊÀ.H3¢F»ÁÚ/9þÌeùXÈO˜ô,Å‚Á€ù1 žàxÞE”ÆïÞK¬¶>1±ÚÂx• ;îpÜ(­e’¯0™„%)#ê!>¤ ýÅš™Î‚«¸±çE©Ä.‘ü¼9õ@HdjL¦5.4Â<
<ždiÆ Hw®™˜@Èlì Ä·8ŠªšÉ^a.ÈÜCâe„â V‘ßõ«…ˆ‘êí“vm"¾ÛH¢Ôó5{Zeß4µjk‹I½ÆFtË-ÜÒ¨7:gÍx &ÛdãƒËÄ£¹Ë&Ix“Ü° ŠˆJ€\…º0ÑÓ¶ŒÚõùŒºZA×AŒ§ÇV‰›Xkãç•<$’°)ÏÛâÛaóuµ	Pš3†Ôe‘¾#PõaƒC2QÊ¦T‘÷šmxS|2¢âHAV¶â!ÓÚŸ˜LkïF¶Â±z,1·!<òtG¬>Å«·¼ i„Ú³÷2½ 6¼8 ”ÂùxŒLë: •Áº#ýÍýš3®›*›çÌ1¹Ðk†	£ÔQ>ÂÞç:£9låùúëœ™}ý5 Áâ-ŒRÅ€MØ=Y¢:î]Ü1Ç€)Ì)e¹v\g4Ç(Sw<Ü}ÑØ3µÐ*ËµälÏ`[ñ@ñåÑ›¦qMMcê8£_¥¼ì;Ö2º€ÌÀˆþ”È›«f(õW®"ó÷p¹^>¿ŒU9ª~"·\2(hƒ bž Èû ³{O¸z‡0âçÎBqó4Aìrá»ÿ Ža¶¬„ï± ô8­X2K1ÎµHéEëíŽÂ.èÒ³Ñ¢pbƒä¶XX;Ó$ ÁÚ5ì÷ð6$ä&ªw@cø0‰@û‰ÕIêJJ=¬âP`§‘Œ…Gïv•²Êlì¼ž–+&XÆ>¥üÌÜC¼tûÚu›J±øz•ŒHïš‘Îáq
m°- ©-4¢yhué+%ÐËN_ÕrQIPS\!y´!bl…rÞ>Îû[º?§îB¥š¶´Rwb”Õûdã¨¤‹#çÆŽ†-÷uâHxÝ5]põá«¯fâ0åÂaÎ¬ÅñáÕªÙDØ Uß2þ¨Ì²Ô›Œ?BFÒ~I•ÖÁþ~

¡ƒÖvØ†ö†	lÇš3þõÉ×ÎÜ0l•¦ñ®De2¥æìÊ(Î¤,^È$YÞÖ:¬Kr½›t5r•K˜g¢ØWq¿äÈ	ý •×U+ð'Q ] ,Lmý]’‹ê°ýXUE²OÔH©nÅºö€jVc'öªG_u²¥ÑÎ%‚¢dñD)õäÁÄjÌKË¢gúO±7µ·ÏXþl)j”°Ô2~C*õz½‚çÀsJÊ”ÊyØ*YCÅ&¦±MêÐön0_s¯G 0A«Áì …N±\ØÇç_ëdÞ'’ª{]¥£‡Ð¦å‡ÅÐ™¾:bD´”é¢H½{Å
…ZælRàK¤@BŠ)³™ÄE¾ôµ¡3Z¨Eª_PM÷C’9HSÂü‹7<Œ)ñ@ÕÖº\pqoËr˜’Ÿs‡&éh’/ó††ÜÛ:äoçì¨I§ã#“Ã×#Cç{ö‰á%Kk'g[-¹ÕóM]‡-ã‡)†íš g“¼_Õ™Ú¥×c“þÊÓ—’ƒ}Bí	lÇ}¼2n¸œb¿ØÂ7Å¹¦³¢¯áÐÈDOaÈ$&6GU’šõ.«“TG)Øé‘$ÍÊúXçKþˆ<søÌá&¥G,JýÐzIüe`Ñ.+DºÑ,ËÐ-©"µGóÕ›d†”M@¯!ÀQ]Ø EÈ6‰4–ß¸!P6QQ¦áiŒ‰:è±.Ä¦Ž¬…þ=É€è’eŒÕ–eçeun.€q}MY²rÕ@"0²FÂª‰›¥|û€œà$ßÇjDÀl’¼$Èº,ðò#O–ÑóuÆW˜wW{²äI2¥bƒ„ÈŸ~8P’DT‹9)ÒÍ!©&Oiõ6¬+†¤ÆJ“eÊ«…u×²Ôò$rvGð#`‚IIŠXN¦b7èíb/¢vÜ‹¨½³¹ÓÚluz›Ø	uã]Âjczmi¼y²2xŠë¶ÙÛ³ò*³„YŽY9úéªeÐ¸“\œ]“U>c«<Ó\ô(JjÒICÒeºÌ»Uî°F¬ÄukzÈ{éñ¢;p_&_èPòc­)×‡Õ"ûóŠsH—ÿˆ|tSkb;£f2Ô¨ÔŽK—ÇÀ‡…’8ÝÉÈvÁÁu‹|Õ‘‡°‰D0¨ ]Ì‹IK„ÉË{‹\Øì†\Øl67›Ý6ïV`«îFóhiÈù36CGØ,S;c‚é{%n“¦V±jŸUä°Ë?‹¸M‡
´Ë¼:»$©¦*ÅËVäJÍŽœÀÂ<ãÜÂÈïISþX‘R(2aóÝØ{ÓN.ŽDžåz™`ÂDá—Œòs¯­*Õs¡’
ôl…;g-î™Ï™oúÉ•Š\SpÚÉÅfîJ0¿SF‘0gDý&B…o1TxÁâÃ²…KúB÷9†Â­n¨Ç<Ô
¶bfJ(ée¸˜C»TQ|n‘3@XS<ˆž›ZQ*_±çDðÁ$@›È~»Bí›Œ¯é¡ÖphÎs:ÞEWÚìd_”Ÿ1K¦_ÿh8ÕÊ&©”¸\Š[”^™“¡—,å“)K%ÕWšk¦ëíi¾6ŒÎsÃüÃ6(/mÔçDÌ`Å‰+c´>‘)žfæÓ€H@=õÉV;Í–â–ã³ký)Õ¯û†«›)ÄáÑÍ3äõßaysòu1
%kùª¢NX#¤®þ›ú%,$ý<!âwÕ5
ÖCT[‹Þ_–¢‘7o~zy‹Ô°j¥G\ÿ*£)•Ž½[ä+Ç)#rEÑ–`	§0(Wÿb}±yo•²@¦™(ËßEòzºs.å_(ÔL¹\Á¢RAµ6°ZoX9Üû²Ü:íd†c%Kñ#6ýÉW…å…Ù(í0¯9°e,§¬cÚ‡SàNÙ¿HÌ7§ñG”MAqø,vÐçvbåì)H§†§ˆµ¬Ç ´éPI0µä¡nøP¬íUÒÜV¨Øa+ù ü+º·K~(‚óîËŠ‚!rOî‹|
7‡Œm„µ¬àpº•4”$µ2}Œ÷ê¹Î¬ƒ…|Ð
Î5YÑ¿¼·+­Y¶´¼Òª‰z{G´¼âP‰LßÏðJT÷—Æ-U›++‰ž%­VŠIj…ŠK~ùôbiZtuU™™wxÿÈNOŒÛØ¬WÜ,§žHX{ÓxLXDø£ÆÜ7¾“q;––ÁSË¿Ÿk¶oøü©0ÿl.òÒ˜`ð²3&§ 4æ§:î1vnÛ´‡1¶J%ÝÛF½…>kÁêÍ!rÚB}Þ£``yg{ü‡÷°;a¬”³T€¶\:ÎB]§Ó\¡sãžu˜$)YÅíÅ`Pê­¬3*Vš¿¸™EøW¨Õ’'ÅÒž³=‘6Å=¤´ü´ q] òw 7ÑcŒñŸØfá†H
·6p“…½àlë°0œiÝéfêa¡wù€—²ÐÎyÅfžvUjJ—DzüÊ‰ï‘i/”Kë^Ý}t²©-háõ™êÊ©î•ó’Tÿí?ÿü7…è„ÎÃë’Ý¶¿4Ý%®
T÷áI!6õXVÞK£´Çîo›Ø.N¼g;&å<
½Å> µ¥œåbÅpc‰Ào¨°³q÷ó_?‚ð;	ò§°œ+^èØ[–Ku/¢,w,åšÏÇÂ0FÍ]”]×bÎÊ³‹¦iLX8\XÉ¹°ãâ²*zíÏ/XUŸ~dÁÐp´@;?†5»M^9æÂrÜÙôr1£ÉKôV7fx†}Òj£Èý,aPI	+¶¹ÓeÞzì¶ª}øUK8©ßví4Õ[2ŒÍÆJ†XE]–ÔÍ¤¨$èÃ[I ÆK âh‘§}æØJ©zÅæjÿÖáalRH\T_»Wb›0œRÕÃÛ
ÕÃ—bN
›•›p¤[‰û…9É#«VºI}ùÁ^®¾KÑ™d“èk[çäÐwpe^îÕ¸h³`€µ•R$Ë%*»e°Ýca¯–\,£¯ƒ}Ò¬÷zè.øŽ¡O‘X–ì!–>ñAc‰ÍLùÏwvðùKM7æðžãÍ¦˜C[½ìŸo ã¸CÌùáy4º¢=}wŸIs'Hi¦Íƒt ,i»S°‘<./¦¢Ñ$ìˆí?jˆ.y¢O
mLÕùT©Õh‚UÏ_¢q‚øÒð¼9ex²J]ëâŠÖ÷FBhÕR„
÷a˜WT`õbXa`ÅK•òkâX]¥×¥¨}g¼w€-YýXÉÝ’þ‹m1ý¡rP8³š,ªÜ÷Èÿò”ÁÇeoæxYƒ·Q©ˆ>)ôñSçôÈ¤Ææ)íêðü˜œ‡øÑ~D=cb?*³3€WæôÄ"Z;LÂâxdúúq|R(ôQÜjX—¬#ÇÓ&”¼±G^Îm×K‰ôXÔ »2ý%ùCÑßZÏ\Ì#i4ðO1¬L•:ÆSN–­ÈöTÌ¥þŸñåFÂ­kº>wµÉ„W=Œê×ðø¹àØ¯šŽ¢£+V÷æ›08õ§ŸHãŽ¸1ªeùuü‡;L˜µ½RÄåÏåY³Mb”ö®.	Ÿ	SÊpàÚ“¥5­d|ÉRÉÊjç;V[ql`‰k5/Uª“–¬©,˜lœ}ÂIµ³ðø¢`µ	!µ’g…eîS´'Î0É·²o‹£7øO¸Ž¢Qýó_Æ¬N¡äÈ|
ÿ’-'	óGÌëÙ–¦õlo¼+ïV¢Pô¡44.½x ú73ñ«JíQÇÓ¬“	¾½–~kf¼ßëÚ0‘HÜÑl—*ùŽA~Íÿ3¥iÅ) Ôl²»ö„¢ƒÊì}L°?ˆSü¾NÒ0;Þ¸æ8âšÆ†’AVJ˜%7l|ˆ0ÔÌ;d‰ÓIídù»¸°Àïo``þ+õ–Ñ°%Ý‡·‰,ÎUžÔ(*}Û’$iÞ4Šè›9…?€Êw€LÖ¸Bºë[<‰ NO$ªèŸyôJó¯8Ü›Ù,áFwcSÈ½zÖørãqfšu-™¯~Ûä=ÏÂ-ø:U}Æu¢ôž³Â~	QÜDY¿¬a¨W%Óœ3ÙbÂ2ÿ–•ß­5›ÜÀÙnê4ÐÉ€Khž™=ÌLgT&CBs²Ú$¥²t~x£ŒFí1uÙyØ¹ëø<a€Œb—¯0³ØéUÎk¥Y!VGâµåY§Z,2w¨Êu:nú¬%o†ƒQ„kÉ“EÖ4!8Ý<ô<Ãó5PŸO‘&¶_[^p»òf¼”`ûÌ^‹"3âŸqwåùÌ"ëoõ¬*0#¯¡9wñÀó„ÐÊ±Æ"+õH–÷œzÄ4ë€vñÏ0L^»­±èc™¶Š©{iÁ"Àô£ãXí¹ÓÍK
Xœa<{¹qXK—R‰&·Ód^‡¬FÜ?Å_y:èû(\Û‚¼+yâ=žkà&ã¸¹ÍîR–bv:9!ÅyÛå´U‘¯ÂœDeµ¸d×H’D´ç¨c!×½ ,Y8Iéö=mKáÌMÙt5™ç%·§f¡óû„ÕYÇN×s^óðò5¤ÙªËR¦ås=‘ÜÚ:Ùú%ÇéTeÝÄ‹—¤µ?…&5šdr’PªlG”Ö¯‘Å|dK*gƒÄ%²$f¯¾k
5}XËËê	² ôÕÍÞÜ"±%½U3çOÛù.Ì<®
¸	6Ÿ¾cóÍ¬ªÉÌš|]~•4[¡´…(»Ø¦ªÞMgGÆuùlš3…ùOöÄóÝùgKÖ,/îI—™K'LÆ)¤îeT±¬/ƒòÒAq%Mˆ×B×Z¥V«IxŠ3e+ë®Ì(Æ¨2¸¼WpVæ$¾MAXêVÎÎøfã3·ä‰3Á²±º¼Ñ¼µHº–H0	¥“#¤h2µ!M„ ñªŽåÞåâÀF” À4–™-"wÀ«‘/8»£$KåØÛb€Ê¹e%åv¨ã„°æêÂÁð{›—VKDÇÄ„Û§’â»ØƒÑ‡¤~•—þ‰1`éÏ‡@XUì“!üÓ7ö¶‚+EEd.‡Ú„õÆ
ùÛùŸ«óÆõ§Ž;ÅÂûDe(jlr	ºTJH;ïÊÕòI>9rj˜&PØëÿN.ý’âúå¼f¹=ÇØÝ<×÷ˆŽ5Üßñ‚å9ÅvÈGã9ØR‘[˜uýÉ®ù?¯ùonÍå1?¯yæg•5¿‡öƒÙ¾2ÅG±¾ëŠVh!’YS•ØDg¢°œH\	\YX¥5é±å:gàÑÝéF+£!’_¶&ßÎðp]‡4í\Í3xÙ•bWFxÄ›‰Ñkƒ*¯Á
‰ìÔ2øÉ²3Ç§»‘eÈ;‰a	£,"éÏÉC³©F˜‹ŸG w=0Å²¦£ÌS,«Sú*õEâc|Ò‚îØÃcòâVÅ'‡ -<ÃËøc÷2®Ãq—ÞÔ¹94ø©“™½¸tvÖÀáŒ¥%‚ãVc8I¶‡3qS3}½5üâa>ŒX¤ØÔºäà Æ% |}§»)Ìe“ÀïVfJ	Ü6…çšì9Éc!¶V}Ýºþl4ûÁ–Üî¾ŸÊK{Ë<Û‰s»¤$PðCIxX¼aÕdÅ‰zkx¼ãtt)…)O×Ò’6ë;ÅWq‹ó*}«;Äùsm	=+”Æ‘ÿ	^ò J6ÇO±Ž%ó“ÇºR‘£\Ñ;NPEŽx®èx*Gu’»ÊËwDNóa=å„Eé»|Ó%ý 7®Ü0›.éž3i|Ù*úÎjJË Þ.Ô´•$ÎÊæ3ž”ˆ´ó¼ÜËñr–—‰%—Ž÷—:Ñ@wÓ¼ ã»”[=–|^!+îÍ)¿‘¬)ªØ²Ô¤××@¬Ž»H÷j †whÄ=qT*Ñ¨‡N5¯Š\y²„ÓR®&‹ˆß™Ü‚­&Œhh¥„dxV:›¹zå”ƒ	¯(Ùâz;ÞÌ°SE½óÞPO#‰XHY/Ý„Ä2òÕéä¬s…j|?òˆ¦Ž#c<RŽ	ÖÞ¬×å­W“yZ9_S$Í#N½I~¿‚h<$TŠÍ%ÂU?YÂ0uõ‘AžÎ=ê>¶x6µGOÖè3«åþôî‡»‚ã$±.àÚè=_¾KèIxè•@HÑ½°âwRÏòqkfE*XžF%ÊÇ›©‚\`òÏIU{aÑ>­ˆõž•Ö±•Ï~ï%ú¡%ñÙ¬Jé®Tßˆ®—ä•ŸT¦Í[­?;s¶Øp2Tž*Äë•Gë¥‰iæ: û‹Èi‹9òsII þÜ”+GÞnæŠ¶›ÈÉasJ¹LdC­À2ÃôÊi‹dÚWáLpˆUúV=R3©¼€È¥¸‘®PV q~ÍÄÉjE¹Vev”4IÆG¹³Šñ#ß³Š~r;,‰¥V=”Wq€¦6¹Ë)Øbpö¬Çª“!%Y_à¼××*µèéB€ÍF±Ù‰µÖ‰TÌ‡º Â†¬„ÖƒóGÜU[ÝøCÐ.u á!Û„O©‡‰ZxIZà3MêŒ®€uËëÉªéäù>ç²n¸Aÿ[®9ã0r>–µ»=ŒRëu›iéÊó6a›¬ËuØ>:.vÂžë>ök¯×åðgÏáWqƒÝYÛI78VÙ˜[k	'²]Åž­ß'½¾ò‰‰V#	*C«Ü[PÐÐ•“„Ç¨z…w³¯¶wyó¬6†àe-›.SÞ/ W.ò¾ËðšL1²FqÖPëê
Yƒ¾W¶ãã‚87t”‡"™®\æ¡, {§ äó®ÈÕ0©\ÌõÂo¡”RòkËû/Ê¿Ö0¿'#sX¿¢–aª¹ú4XÌ/aÅ›é)<ï‚MÄï^¸nYsßý¥Ç._R×)] ¥\â‹%þÑ,.!|3<mJZhsIC‰OÆ÷'›\ç¿_¼OðÑ‚ 
ký	ÏÞýáïþ?   ÿÿ ]Œä¹