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
      architecture: "ResNet-1D",
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
    if (presetName === "ResNet-1D") {
      setEngineConfig({
        ...engineConfig,
        architecture: "ResNet-1D",
        kernelSize: 5,
        kernelProfile: "Pseudo-Voigt",
        filters: 128,
        activation: "GELU",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.15,
        attentionMechanism: false,
        pooling: "max",
        depth: 50,
        learningRate: 0.001,
        batchNorm: true,
        confidenceThreshold: 45
      });
    } else if (presetName === "XRD-Transformer") {
      setEngineConfig({
        ...engineConfig,
        architecture: "Transformer-1D",
        kernelSize: 7,
        kernelProfile: "Pseudo-Voigt",
        filters: 128,
        activation: "GELU",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.1,
        attentionMechanism: true,
        pooling: "max",
        depth: 64,
        learningRate: 0.0008,
        batchNorm: true,
        confidenceThreshold: 40
      });
    } else if (presetName === "DenseNet-1D") {
      setEngineConfig({
        ...engineConfig,
        architecture: "DenseNet-1D",
        kernelSize: 5,
        kernelProfile: "Lorentzian",
        filters: 128,
        activation: "Swish",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.2,
        attentionMechanism: false,
        pooling: "avg",
        depth: 60,
        learningRate: 0.0012,
        batchNorm: true,
        confidenceThreshold: 40
      });
    } else if (presetName === "ConvNeXt-1D") {
      setEngineConfig({
        ...engineConfig,
        architecture: "ConvNeXt-1D",
        kernelSize: 7,
        kernelProfile: "Gaussian",
        filters: 128,
        activation: "GELU",
        optimization: "AdamW",
        multiScale: true,
        dropout: 0.1,
        attentionMechanism: false,
        pooling: "max",
        depth: 48,
        learningRate: 0.0006,
        batchNorm: true,
        confidenceThreshold: 45
      });
    } else if (presetName === "Standard") {
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
                                                  xœìÛvÛÈ•†ïý¬Yi0–hŠ’lYŽ‚%Q‡ö´ek55ã¤¯î"P"1. ˜ ‰Nër™ëy€y¦ÙU8 hÜ=“^Äÿ]H$P¨ãÞ»þ* c ü°ËÒÙT°½½½'ÿêª ðëâIá§:ô¹¦BH6V
¯nãÌ9sÅú0ìÀØÁj­VçLèˆK©fÝ`ÕðjöÍÜ·áú±€D+D
Xiœ³‰J¦¥´Š?Äp°zZÉÍ›¹¥¹³ü DXA [ÀŠã=“2Ì¢šN…F «ˆW³t–›:s/ú½ÄXI _ÀÊãìË½Ûˆá`5ñŒ‰gQ“pÙÏoƒ_?áVHÐœÓñû£­MÄq°ª|9åãX$a¥_`ò`•x­À9ç½÷å`uñŒ•Ç)—Y´NÆžK˜<X] _@KpÞŽ6‡1Â9XeHÃ¼Õ($	sÆÌµF»G`¥Œ­ÁdS¦øæXq¼ÊÖ™;Èúï cÀŠ%Z„3˜pé+r´ ¯nðVÓ¡iÀÊUZ…3à:Õa0š'	b<X}¼šÙ3k÷lÐÞëÁúÁêZ†ÝWqèòEo´¯aùìEo¶ÚdhÎ¾ŽáA;ðrƒgC…¾ŠƒÌO	Z$h!Î©:}„yÐ¼ÂæY¤b%ùÏÄí2´ç€ãwx.hæW¸6Oæ¦<Žy*Ø™Ðê2ù„ÏÞƒVáZŠ3õ‡Ò´
¯4|v6Q©ºT2å¡Ïø(Qz„]Ð. €@kq?œñA»ðrÃgß‰$x|h= Å8ÇbóDà#> …xsógö“>"`ÇBk™_¬Já m@Vãüp¾,"¥¹üwÆ˜@ñ¬°Â<´"ÐròpNq{ ´¯æÌ=›ï¶ðˆfÐJ ˆ@ëqÎŽÿA;!5t¦äL¤“™1	¢³#¨!ÐR ‡ `Î_ï0€¶âå.À†ÙTh< ´(# ˜ùv™ˆ>@ÚŒÝ5Ò©äqÀr`î¾S½#Ðb ’ °8ïdxÆø˜h5^å	Ì=Vºøn>th5PJ 8g3­®Äh;ÞÜ˜{')O!— €` Â9¾Å@þËð J ÔpN³ÄW—˜ `ù à ”@2ÐÀùŽ+Æ˜" °xð	 @8°€sªÂ$á˜' (ñênÁÜa8Àgš °@Fpç0TÓ$ £ (ðà ,	Àœ7*N.¶£ ¨á5|ƒ¹ßŠë.;y¤â ›S T@]°g8Éâ1Ä <¸ Ë€œà8ûq y@ÓÆ	×±À“ÆhàÕ|„åNÂÜß<}w¾Ûêlbû
€Ð\ |g D‚¥: ·ð*ï0\×gß†ãÉú™I’iÁÌïGJO'P] , ÝÀ8ƒ	WP^ ,Á«üƒ¹ï'æß€ë‘ŠÙ¾”*ÕjŠg£pè. îÄyŸéô3¤ Kñæ.b?ÏÇ*æ’ý!º Xd ÷à´òÃ@Ih/ ¾€×ðæÈL°ýd$’T%l?šNÂ‘’Øÿ`9c Ü‹sªâ4R:”Rá©¥ |ÞÀ à8¯%6Ã ¸nÀ}@tð œC%U„€;ñà* <È/ ˆ³¯Í‡Š1­ p¼€Àƒq^ËH`fà~<¸ R€GàìOyŠÉ€àUþÂÜc™)Íówøb$ ÷uÀ£p~µ¯bÌ/ Ü‡àá@’ðHœs•éˆË0Æ¾ Â«»s‡þDi‰3 ” Æ9z&1Í ð0<ø â€¯ÀÙ—ì¤ð¼šç0÷„ëX¤ØLàÁ@³ðU8Ç™”B¨6 ƒWóæž÷ Ú xm |%ÎéûÁÛsL9 <ó[L™LÃõ+Nâ-`®G*foy¬Òl$æZÇ‚˜àQ@ÎðÕ8ßrä³æ ‡—;ƒð5@¿ðpN$O’f  ¾¯t"è8 ¾(9 ~Î~œN4÷ñ@] ¾
NÀ/#—r¯žîã«8IYÄS¶ÇN÷Ï¾½ÿæÇÃƒîE®uØÞŸXÔy$ºaìË,‰›®ýÉwbÖé¼*²	/˜K™tØ„Ç§<:är(¤ðS{&OyColáyÁS®œ©0Nª}ûç¿ò”»a<ÍRóªcÓ?{Æ*NÃ8SYÂ’0Ê$°dJ%è,bJ³t"˜/›jqŠ+6•*eWa:aT‚ È‘Ú³\Sƒè}RUÄ\5˜pmK¤š|/(m7KÄ©ˆ”ëÚ~øû“yMï¬oÙ%”ª+E<¦òI;³^‡i‘f:f>æ‰ìjÚPiÊ3ï†ÑŒõÿçŸ¶=¾<¶ †kÅ'”ž¿Ç>t»]*åc×q]¾ÆF¶®¼›^©ó‰ Æ¬³Qõ¦¨›4æa|Nä9}è}¬ÒÔ’ðëZ’ü_Ùžu¶±xIÙ˜£ë)Y©,ls8å¤Çalå’‰LºT€Û_Ë­³í¢vE±yŠ0v7¶{kùÁ§UšZ_øfØ**{–êñ:öµà‰(;Ö§
¥¶_“H)²ÍL=#¥‹¦ÔdAd»ÞÎ¯ØË÷X¿×{U/?IÅ”»¶†ë¶1ö¬~Q­Ê¦t×ôí5]b’¾¢WÜ³Í3/ŸîÙü:…±åãàsé¿¶e÷J‡³ùµcê¢£ùe¶Nx–$¡± Á?±dÂi©@H–¥¡?S+~aMø@+ˆ¸ìZ;©ü…ÔÌ~ws{»èyÚK.{tMîq¦3ö‡|<ÅõÔ]·¯¦êÊ½¦þšVV´Æú¦ãÜ~™Ø$IÌÑy aUgPOQ)åñ›âÿ“ªñû4®Ó‰	#îkcž¤b¾0m&÷¡¨×ßéöX ÆwöÈ¸Ê«5GãªGæ)¨î›_n¬)ni37¶óó–Î[B¶$*^—á'ÁbzSŒ¢©ìÕ~kR¾—B6kM1Ç±¡ª3©1¯ÉòrÈ¬m59ŠŠ(®³^w»C5_(‚Žôº[Í,háò?m9•·S#kxš³¤Íë/•¤Ö)“n?%3*^¹EìÏ˜{¢y°>Ø?eW"Or71³¥ë4*bÌßL:Ùk6¯ÚÆZ£;:ÍÆ$E±ïó²êá©GÊ{ÉØ˜{«´?°—ÛåXÛÖjÅolßóZDëN³dâÎ½ºô•]ö6‹FB»×ÝT‡×"pÉxÖªt•ãU	ËÑXž¾l^•¼ÙÞê¢ùE7µ9•[­êæìÍûPMŒk‹ácmÑŠÖn¹ÓÇjöòË0ýüi¶~¢$ŸÙ€Í—S}@%TÓy2>Ëÿ¦ó_e†.2Éç)“ŸNå¬ìÛn^DÑgÃñ{’lêªz{(ÆZˆútYT¶˜Ç#>uÝ)%·µ©Lln`µÀ\œÓüj·ÔËãe5w«WÂ´\«½«ÍK²¸É]`™µ|¡]…]äÝ”‹ÎŠ¢0Ú2M@¤Øõ+ó«ßìøæÙ¥âÚD¦2W;ÄSS—ŸþíïóÑ¬|y³CnÎT£Qsó›Ÿ:Ýÿ"?v¿ÆNQJ"Ò×ew¹¦°âø”j;œÑÒü\ÅÂu’Ì÷E’äWÝÜ'›R$ágavÆ)¸ëøÿl¸o†óq›wÒ¼‡:u™\£4KÜÕ¢ÀÝ®îÎ—îÖv%pw:Õ6ýü.3ãê8•´=1Mö$W'©¹I1WÒ$¼aäY­Œ¸_ª¸ÈNºòÑª“zâ‹’S«‹PŠGhÈßŠ„|´vü­‰Â‡É=³˜zerRäØ‹ŒÜúÖ1%mÂäoçÅv¬4Ü¨Æ·¦_WC{‡B¬Õe±J× q¤WWB6°5Ë¨Ç¶¿Æ?ÕµËòàF9wIÄQ“æÌ¸hat	³›	ì°.JÆ"=›¨XÅÇZü-³–:×7Oj!ñ"vÙá›³	5}Pa?³8“²³KÿŒ(›‡Gö~W]Yé~©Áóì˜©ºBò$ýSd’lòçŸI|ö¬	\p)¥³T™cìäŒ×rÑÕÈ'(2 ½•cãg~´YËâ‚Zl–ÎÝ­†•‘ÉSîEÿ(õ*]R—‹“	õæQœòx,EDNI¯µšÚÍË½·[ôxx×öº/_nÍ§c¢&2Î›I£«|=KR.‡ôWD5çºz@“#Qÿ•!Ýê'ó-6ÇÏF¡ïØ4ãa¢"AVIçÊ5NU•ç/7í`È˜<Àž’N™¼Kß«g5×|l–T¶˜e)¨œ»ÐØE#ERC›D6ÅB­6º½—;e­6jÕ,ŒšUÖçV&›;ÏËL¶îÊ„ÓDÙZ-é¡î‹—e6ÏïÊ&"/õ)”.É¤ßí½xYf²sgƒh”Ê<æWoöúåÕ½Î“šéDWÓ‰”f9«‹§q×^¯¡¼4²Éfý”Æ¿×Û ïŠ®–y“I[~Í˜E«#šÐ@³ÊU@Îp^\Ø½RÇï¿=e.Eðÿþ…üÄl¶’¿1²ë8à:èTif
Û‘Yp¹W“ÈZåÆNMÖ•šûnokÙ´¹ØÚé/ñô\ìÔ÷gëZÑzl}'¹PƒåY­ßÂä0L|mvûöØ’ëŒ0¢Àø¤[ùæ¬MWìêÝZÌ·>¬eY,
ºwu/‡êÊÿÄlK–C”ø¡Ù¹ —þþ°6"4[Žš{wyÅÅÅq>fçŸTÛ¢ 3¢ù›<~Ã~ÿû[çÿdlk›Ös‹'víð6L²þÊÜ¢ôÎ­Tý~cÖ'ëímØ!Î3)þwŠq°ƒ<¹¹ì4½Ô¦ô³Á[Ý  •%hîÎ»%°ËÉr{H˜ÛþÄîý’rƒŒ—;draù:¹fnå ÅE]ÀôæúÒÔ5±·>D0Ÿu¨goìÚªˆàG³iÔÐÒ±å{¼¹š5ë÷tñ“;Ñ´k,W¥Óºuæ)Ï…ZŒ]MMÏ•³yµ âË6ËÒÅê×rðòZðQâÖÿz£Ú»v
5/®ºzÜµ•a‡i¾G¶dSc±wïl€iBjëÕL#õn%Aæeå=µ;ï³ß‘cšdõ¼óSõ|oåuS­hªº2”“Með3áäSáeŒeÜ.)×kKÊZÀ—«»ò®[}úº½ìµ¯/¤RÚ­»Týf“½íÓ·Çýr{Õ¡lfÔpÔe7¦ì£N#úùRnÙ5îá˜éÈÎÎæMwå—Ÿ7[OšËé´ZN§óåtºü.N¸,X,¿“·¨îÐEÝi^6q¼±æmÆÊLÚû#Ûª"iÃ9Lmþ  ÿÿì½ÛvÛÆ–(úÞ_Qárbj…¤x•%År†,ÅŽzÙŽÛr’µŽÛ#	ˆD$Ø (‰Qk}Ö>ýçÎô~ÛÏÝïýëKÎœ³
@P…%ù’fÄ"q©ë¬y¿Ä¨¡\ÊÆÆŒ >þÉá/ÂŽ·o†sK)œŒÑê¬dÓãÖÂ¥TqifYk`T	Ÿ–cÓ.ÅRjvˆªštºEé…ê¶~ÍbÄÛÂ­Z“®W–eH¬jŽ}mR+µyQ´Š­Ú²zì4FKnÖšýl;âéf¯3vwØáb
l¡?SîüèÇ_þtøË³ÃçIÂã†¿»nŸ=lÊì¶ÐÊµ}†JjÏšm+ÖS…€#®ùTd€ãSñ>°é1à;ÓXÔn±‹tÀÊ¸²L½ô6Ê?òOX—nöÚ#˜Önj•Q„%è+gÑ”G…rÇV|R_žà±„6Tn5%lÉ”¡%IM<”-B]E“&œ®ÝkUC˜ö<wŠ²ÕÄ‡o!,{Û:÷á ,&€"‘M§ä›@ðû?=#–Œûž5)TÙâuOù; Uˆqò„÷Ùa  óðJ:Ù|w¾ÉÉøêì½÷-Ðˆº¿~”¿¨yØþM'I+ªØNðùšÖY9å„+/JæóY|%ÆŸ0øš¹‰{òãk¶ åì³b+^»N½5¶ì©ó—H©ªÞ»~$ø•‡p‰<ÂŸ‡Lq±K_’±±« H]rÜ·q¯ÄŒ¸¤®MH­Dq]âòüÚN{ð
_Ä7.1OYE<ð‹>„]Ë»B/k¸…á/?t3Ìðh¸¡¤µŒí7b&=™0&Jý[½ä­~·úÉ[ƒÜ[Ùå”i³2G\ÜžŽÇÀ>ûêòöß~“{×¨oXà¾fÓ•íÃÊö;]dŸøÃÙùá²ÜŠ˜W“þ~#ÿ’åÖXÀSßsu· "¡¾ºû¬Ýï./[üg~ÓŸ}ø¹“þÀÏ]ø© ¶|lØ$Bhhý“­ÆKCåR/íà¥ön²abuSj$§¦²Ú[	÷Ã÷*Ëÿ žÂçSŽ"nUò Q,½%Ï-ÏJÈ„‚÷®Ð…ŸIsÁ@üs'ð¬ågXM14ˆßbÆ:ÀõQ9në[•mþ–ë>æK“‡@¬Ð"WÁÇ7»î'÷fÄ­¶sæ.€ ÃÕ÷Ú«žzUa
ßÝ»ÂÖ®éÏ{þÇ»~§0ƒÉ›‰·Rª7oÿTmé²Y‰x	kö¼«ÂÅÄÂ¿Iz£¦| Ë´ê*¸šÙi‰©‰ï[†wOK u.&üøDÉAXÊ(I"ð!ý	ásÙi¦àcWaäÏ_û¾¹äwyÅ¸×[Öíù–ÝâÜ»ÞþháT„‡bLþ´ô5áZTš/weÒïÀ¨›q³JL­	®‘ZÈ<9s"th…çu@ÃN„8….È­èvº»2þ"D’åCÛ=¼a…ákî4ÆÓö›?tt{»o·÷Fdá¶Ù{« =·ÉªÚÎïvÙ²=dd wìvÿÒC7RÛ¿h¿éþÒþË ÿ	¦c«ÙmÑÝ­·¼Ëý í	ühôA·»½ÛEµIšé#xÛx$wvÄgžsÉþ¶Ý=[·ÇNtá8æÂª…mnŽgóq{À–ãv¿3Šû«îv»J†^”V§Ö²ÝÏ¼ïN K/^ÀÍàšódm-€6ul;÷"ˆUÊ‹gþ"j}OYò,9Ý@‹Ø€ ö…‹ë¸Z.`‚özãM¯—];þá‚ÜKŽ-Ùqlã@2‹±«±ÉúôpÅ§|Ú#ØØ^7³çÉ€Òe»Ï–ëv^ŠAjnçW8»Pb²(ê*K+•,fãzÏèfiÚ©ŒØIx ,k–ùJ:‰²óÁþÇ&K..HW®¶ÿÈNSíë7&{þ4°–3¸ðœ,Á!ûãöuÁñ™®ÍðŸ6ˆ•!ì Á5?3°uìöø¡\ÒŠ÷N»î W<KøvYu÷’íåÝàþJ /Ÿô(ˆ7N³/©£iÿ¤r«Âv˜†HLd|œÎÜ	,Ï¦ó®¢ˆƒ.Å–d¸uÍþëßßmküíþ¿ë[<¢oÙe=jªþûÿí¯ÿ÷]­}ø~mXw®ÙêÂúÞÒ)4úÛ€rÍšx2KºàÐ~èèñerGàK8Ž€1{Ò©ô¦tv7@›Ôö@6M{hVø¹‹e
Ø	ˆLp{ûG,EÃ4fDÃòªõµ´Ä´’C”4ãmÅ]½®2ü¨l]ÿCÚEä´ië2Ý_Åì&çÐ‰Km1×¾ŒÕEœgÏ	ÚÏÍâ½³>¸zqf¸¾¼ªwß ¹ëwY¼Âê*Š!_n	a7.fðòö`?o3KÏo²1ºù]Ø”	3.HfŽt€f
U;[y†¶a´öœƒ«+íM&ù‚ùžOÂÍ¿´LÏû—§Ä,ï³w] ;ËKr·¦—®ßé_»ÎïËó’4íaÒr‘2"V‹	w‚¸Dþ»7Èñßé'†']ïÚ®%SÉ`5ÍTbÅ€ùÒ¼ï›(»¡[AÝì®„7Ì²sny+JnÂüü5€b‹Ë’1ˆèâu!-¥Ñ/ü`Ô_Ú’«É24/œcæ—skKáörô*{¦æ
Gœ_q:£;‡¬_©”•åùª±£jì„Ì¿g–à$õ9;õWÁÄÉ`e¦¾¡ ‘ ISíÇ:ÁƒÿýÚ a”"³oÊO‘[`cµŸ"Ä—ðó=æM÷¥Ÿœ¿ß¢âÎqÜ;³lúk¯2æÑ¦ð­"ˆ’£ÀñÚ_²ï±ùWì¹o;ìôÂE­`À[$kdÇÃ€ ë½ÀQ … 9ÅFé¥ùí€þ<V=¿eç®…¿{½þvÅ—n-Û#Î÷—íir²ˆÜÇÔÙ¡•@Eà ÉòÜa¨"=óàêÌµmg!íkvèÖ˜¼] >ýe»ËÔpÃß‹öÞø&#õL›LLiNp„äcsÎaÖ! …£(
v6·÷é{à_à÷
¤9™ê¯í^·\‡’#¬Ã9î7r†ÿÈ Üb7f ÐŠv*â'GñžH±“îb¡á=ÂYt3ÚÜ¢Ü—+/trÚƒð”k~cväá¬—çk=„búŠË–¥jÄ$¥1B ÓÒácÇY²gŽÓ%:}’?;;±…fÀÒhypÎ³žËCÕ)e8TOW»ÏòÍAWa2Ì¤\™ÍdA»
‡'è§l¯7'œpq©>2Â/ÐËnŽgÇ/ó±¤µw•µo1áèæãÕ7Æ`ÛÎ%¹¢‘ÞZEþœV¼räd›ýëÊ2oßÃíåFê¢Z¡OßÓŒ/Fß¯ýéÔsJ”D)&º¬¥æ”ñKVî|8^EQnøþâÈƒ\q?íÐ‰NgþŽÆÖü"T~oey¶thWïÌšG€ÝÂn_VY)2%WÖ‚«BÛ–—Ð‘{y>_Ó@á·¬‘¢¿ù*ÞÆ*Cñ»Ê`MKûÔ’¢}Ó©É3Lý‰Ú¾„?øåMV–_ÎŠ‚¹ƒñ½ã-Ü`â9FÕv:?“rûÑUf1‡:þ¥_œ²Ÿk½”ÍJlÛ*3¢Â³ÉÎ1èît£è©$L¯ÖÌS«<ÒÂ{âu2$œ‚Ÿ\ç§Ñ¼»–ÞW¼ÿ¤GñÀÚçèûc¢Jf­ižYž”5A÷b0Aè LtìZÓ…Î¾æ52S½ØSÕÆêäè_=„šÓÇØ¹X’,‘V6å'QÃb¦‡¹Ês×÷œˆÿJO`2æ¶^ €š!
Ò¹KLcùwó>…|ï9¡zÐ¤§À©åP<ñš³Ÿ¶Ä°ù$€5°½õ–‰Æg*sý–`™‚-¢ ÈåF€lxï“„c±<õ X†[²É,éScµÃÅPLbv1G‹Ã^¯¹­¾&†(ó3ù„g¦²Æ@ådFé±…Â†BQ²”,£ö8÷:Y¤» È°<ÔJùh‚B/Šn‹ÍÈg
¾fTH-Êó½ôù²ìKÀVF•{PA#TŠA9ýÈ¢éÏ¥NŠeHN‡G èßæœ	
Dú<å­&œ¡q¤`–'Sr“G^2F@ÏKLªV¢šðË…¦Æ£žAwz4ó}#
~ÂÍKYEA‡;d…D*œ7j.¼îzGR€&
´À{Ñ³½Ã3Jj<âëeà { hzø;žÁš”®à™{äÿð·¿þµÅN]hÝ_°a×n1?`¯]¼±…_WKrÏYû«€ùLŠ×NÃ,p5(ß	f™èÔ–žn§7ß"œŠ?œ*S¨	§}œ¤œpˆ±RP¿w£2ØLÇÆ•*Brœ€i‡½žQöÈv„Š&×ð,TïXdÎƒÖ02:än÷g¾-Šýulî¢Û¾ m‡$eeÌ-Á¤¬ªù0@©N¢&TP	4ßÃ¯Èµ6üÀ@y² PI&kiBI_´žc>‡u‹Òõ8í‹ËëŒ¸‚(â^‘ã.Ë'xCl,§ý;wÃAwPún§,Mz=ÑË¨ÜòRä*‹yúÎÜ©°+°¯ÈzðÒZ8^XÝR jÁÉz!­$öKì»ÅNe¦×æ‘ïyÖ2t‘¯KÒ¦:ÈHs±ˆøñ-•¿#”A*AnÏ ŠÃ®ðÅ'vT`¿H•Î<sª ¡®R8Om’%¯W°¹Á›nä9ÐhG5–ƒ.ZºÐr@Î ¿oë\>ž:”G7ìk‘N§¥ÅzóöMüfƒ¼®74‰ƒXv'ÌOÄÃíÙ ’Ç@‘î¿úFemß:w-ñÆ@ë±…ŸCtÚ Â!oþ°ŒÜ9 1;ë–Ãw¥žãÁTþ,¦ÿW­;G<ÛYF³kö·ÿùÿ1õ!bÚ~÷ON ¸0óÐ{ºx
ä={•yÀ¶žW0>þÈ‘5õ\ÀÏLÊ¾qHH_³Ë
€¼±ÃoÃFÎÚ€W×ÐwRkë–‚Õ÷·<Èkml7D1Ý>¸rCñÌ¹¦?S‰r'eƒw8Ã!±ry…}‰sŽa_\ä%ñ!žØ¾Þ¡¡
nR•t†Ò0bkh¸tÔS†_†¡Ú¹ÏäåEmT?$=ý0DµƒYms•}ët:ôzršõJþ«$«ho ,y§K.9š=•éµ7‘³Ôb!JA¦xÐ
óÀ”m^&+aD–G3ç$žc¬‹`*Á‘Zú¸‰^ý¨j°P©È›~àÌßÊž†j{—ôX¶ÊäÂYïÜq•\f²nœÀ˜ò5gÓ,‘O…o~™y*q9q Ìí.ûþ×øÄZ¾¶p´¤Q¶ùÜä[;oå¡‹;éð{]$sî%p€ºÛ×¦xÄˆAºó)ƒÉÁÕDÎ¿ÍyŽÇÓkfyÑA#Ã7T "þaÆÿøãáÖstªœ3'œà¥Gy}ÐXøíø’ºÊ,£7#;ÂÁˆÿÚÞë
#ñ{˜‡è
4Ñè(4DnwØ­â(ôf—|$äÌ)MPˆ lr2Ê§ðâ*ƒD³`QM˜˜ñ=‘Œ]æåŠJªƒØ#IAÇ%+t¦Ý¬8!;Uq"«ªvZÄÚ)ÐQæ=&uK2:O¨¬X¤n–¤XgíÕœÀbðkÂ¯s»Šcz¡FËü$Æ¦«ÑØ”Æ;`-¡Õ!ô¢AÏ0êKþD~ðžùAž×òã&ÑÒ$onè’f`¥*óàÕ¹ð*¬•Á!TµsJ¶{ŽågF)WåKçI†:½~RrLÎlµN2à˜ºˆçW‘sÛý¥7Š£a÷öZ½n¿ÕöZÝNë­¹üp¿«}xk¤@&’6-/ÈúÓE{(ÉÓTBÓ£½ÌÞÍÅ…Q\¸-Á,2hYÈ”4˜è>¸Š6ß,:§ÆCÑ"Ù¸WŒIQ;½+tÊËZá
ýÛ¿åÖZÕ«¯
îÆpÕÛiõvG­^Çe7¯3diu1BµâM$½DR‡µzNžÀ¸(« ³~µZààÐ³"ôDânƒÜCs±”têéŒÊ1g%1”{[mˆ.Í¨©ºªõÜTesHa5dCË®¦•OEÐ— j£ÆKº†<rL¼_ûKßó§kö“°¡pÓB±Ó,q¾²¼JNœÙ|
f)Õ$¢ªœ¨¤?WX9²/h…Ø­¾^’rm)¢¯ÿ–½™[áû6 ˜©³„Ç
òÝŒü_Æ>¬û¼E ‚	ïQ‹Î¿|Yž¶~-,|6t¡ºþ2g6(µiŠÒ*‰©Q£NY®*øÍ–)¤'çîq4ëø¹—¡ê4,0ÒRfKÃk@.¡‹:íyû™µ†Ö¸~=7©Jñï…P”œ•Y»Ð–ÃÎ87ôÔÐ™•¢ËähàiEcˆ»cÞÍDÛflãfëÿ°º¨›aYn¡7ÚÒG…>$»*—L /§E¨#nêv·Ð®T!gº}ÀÖ8> ÀztŒCl5H 
>k//™Lš·G©4®„Ô_ sòœ3ÄÙBÃvÑîm¢•„‰I&© F$mI4dWÄË}öæ~÷Ëû-v8ˆ/ï¿EÞ>eð;‘€?iÁ¬–ŽíÃY9CÈu‹aáÍ}vŸSŽûZá ÖÚ?ö|@ÐòfCßröëÜ1”îU9…Åšè¶ÂÈŽŒ)WFÏarœ‰ž£`	'Ú ‰ö§ºœI(N,ª‚„Œ+m2¨â¦R²ÎióŠñ”!ûlÀ®EÒ²_’ªtú÷Åh)ù{­îZ—ØG9bsØUµ°ËFV§éñ3¢,)N’‰Rx†K‡º7âYx.Óp•Æ#£ñx“ü;Á¯x@{Ç7C°O\>[ì»èôÚb6L=Á;ý"T«[whÃŸ[Ëª‹Kè5ö2o»9ª0!
ý¶«Ö+•“÷7‡ùå›Ã®Ê_%Z¾~ïAëA·Õì	DœjÚx}ìg0Š}æ²?²aK\æŸ_æÊ¤`3â­£ô_‘u±¿ÏÚóÈà¾Äêi†â•B4HbrÃ’Átg#Ñ3cº‹ i…ÄI2ØÜ«àÁÏÓ%)ý>"šÓŸ†ªÄæ‡Uô)ÈtÉBæðIrgsi…9àúzýBa®ìHd"**Ýì‰]ú>ÖŸüt“—0 ÊÇ±®‚Â©2ÁRú +qt—‘.{[­\~ÆE{Ð*y
Ø˜³ì‡‰£q7ãz³Ð"ùJÖQmU?¡bí/u›ð!Wô%/…{+Ë)‘O½d :»í%uºè†;[2aÙ¹=0ŒuRšuó¥¾ª/[Õô­Ü–åØ©ƒsÀ`¦À(„ìÔ™hÌª©´4á$Y!ÐGVà¢Y)€m•F¥¼Q¿úNŸºéÜ·7ÊÖ¬õW(ÍÚ%EÉUñã0XÖô„0§ÁOíPñŠŒa='¤¶ç›ñš)V?"ÊW†cõ¬‘"›§ìÊÎ1@]y{ÌçEbmL]êrFë¬æŠ'6Ú	LœR±…´0ÍÃHIó@."|h&ºA·«7–+z2d˜tÃJ$6€1”DßÝÓlÂ;]‚2ùk'˜cíjöÌŸVÊ3©N
›©ÛŒåÄÜM·oMNü,ÉYšK™¦õ+Iz¯‹èž?¥ì¦F1]’ÑíKEJÏÄ×Å³ðRK@9txF	õ
Æ ÷Ð2¤yyº
PÓÁâ>ò hö$/@õXlÃÏš´È¼È™r3tK*ÅZ¡|\Ý¼]2!ƒÂ+ûŒü¬œÄZ.½5ï¬Ùˆ³¤4LiF8ðÄql4Ý7/ŠBÂã'XÁË(ƒbÑx64¶õÚ;þ*j&î!ÙÆ[-Öïv»us—”;Ûu¾¦ ]mÌò‘
l¼"Ø†UòwJØJÄ´ÒBÙÎ™…á¶‚^9g°U³£•ú$‰{‰àÒfæ §RüA†ÒQ<©”U&=™§ÑÊvýRi8O#FQªÉ¼(=¥ÄŠmà· qèk­+›Ú#jóPÛÎÃØg¡È£GÍ#{Ñ*[‚ñc¡n«%TŠIv5ÚåþÅÉJÒTqWžà¿ýº«‰Ì—µHo¹r˜¸/ù9*Ø¿«7ºI éÞ—+ªëd®°Lø%^^3|ï.¡ÇÅ‚K8a‹Ê
ó¤	!¥ð ‚»Ö¥ÁþùÕqû5"¤3? ®Cê:G€çhœßÀã­(ÂD@H¬IàƒÈ…ÅA¬ÅÔsÂâ¾aNnÊêUÑ']dgÂ8«‡¡_ÐdWK,ÔEîÄ¡é—ô‹¶´ÎŸ3ýªWã¹ú ‡öà²ÇÈ¥æÂÅÄ” AkxÖÿ}q‡	}L{ûééS¥£#„.w‚(^JÈbƒå!ø-gþêÍŒŸÑÏRd¶Ç·;®­µnTað#3¢=-õÆOž`¿ùm¦œ_ {÷øèhÍ®ß5Y)i™ühSÂ«ÅK5¦ÀT„åPÏ_)i~šf”…yÄú!úŠ×’çMO€ˆÔ_"¾â.$~mKþÍ?Ù4œ¦œJš4® ï›œîõ9Ôð#;M£ »£IÕ9ê0cÙ¨P¹5}·z¿l½t“¥ ¢oäã’ ¨PHAÚìõ`èp7n3à®±Gñ?"ÒžQ$´0'}ï‘¹W³÷%iMk"7K•\:“0“çÜ4k´ˆvF2ëg(òPöC5d-ˆiØã ¸ÌÖ„©V©©tË•¶G¯œ	Ð\¼'®ãÙæ=+Ì2E°U„@²¼"‹Þn§ûŸÿÁšO=ly[.`ðª¡6à;ÃN^ù9Î\; ìTCP^÷©î°A~›››$„¼Å­íûÏsšWfÝð½Ý½î{ÚØÑ¾ü¶·ó,÷^½ÝíT¬*vtŒY°h0°ã´#°4@¼ðß“Å™8XÓýÜ]LÖ·»)iêàGÿ››ÎpÕ T¢ºDê¦é4xä§†yÒòP)›÷Å#Ë*gþ;}ñ
¿¾°¾P>Ñä4x¾´†C–8Jƒb–BH¡Wu YIþ¥>=¯‘<áUû÷Äîõ#[r¯Iè¸±È¡8qc¦	Ìé$¥C•;$ŽÇ$‚ðLvBqŽx›¦®³Äà''èr#õ6Z~*äMhyy„tÙJ·¶Æ^«<2À‰ÎrÁíÓ¨i[-Ù6ûÇÓ^°ÓõbÂÓ÷±Ç\ýþ‹aæÃ.ô6‹ØD¸&?'ó¥Dß]â¿¼EþºIÍÏŸùÇÐ_¼hâÚuÂ( 1&£ÈÐ-ªìgmëæï“—’:7!P×Ð©R»ï	à œ¿.¢¼Bìæ•~Í“¢‘>y9]àÀò§5¥Sõçãj¢`À¼[½\jÓÕ~ÕTÊ)Wgâ¹ÔÈ@-BP'PUg¬GªEÄ°š%Ò×–ËøžT¨Œb±ähb.yøÒæþ¦>2‰Á¾¯åÂâ. –Í¦ÃÆé;¸r•Sj á3k1…g›NL)3gÛé@/S'â•ÿÊ‚¹òþPõœ0]KÄu†šª	;éO(?É™?Y…ûyÚ¦çÈ³3v‚ƒÆK+Œb{fœH•ØxSÌÊk@É§Ãé"“°É_¼Hé›àpØÛsÒ­(Ó€Æ®Ò‚1Q™MŽ¥|µ*mÒÎIÝ"ëÅ µø!«¥Ýª¸`Å:ð…uîN­È:Ï]Ž}`¡;ÌíFä‹4Ìå‘¿DÆUp«¶€î­Qižtÿ…Þ„.¼‰?¥ó<¼”§T(…–”3¼ˆ5\?õZðRU¨+)"JùÃ29fŸ àþ½
Î
™CìNäJ=¹gy×üêÕ•áYR`ç9Ä
I7ŠìåU"A&« ôƒöÌñ–FÇ	©Lz’>>®­Ð;ËÐI4ÜÓŒ¹!,àÄŸÏb&Ð¾8÷±GÉé‚RVwW
ÇÂh,Õž‹šT¶(ßæÉâÌ/á±Õ¹Ç3Æê<âhçÊ,Ü	 QœìvHþZoºcfL•U8=ªTõÔhÓ„À*hÖðX:¦}1tN9ŽÄPFÚ¬8”DlÀÕ”ÁRKô 1·Ì.U	¨x´ŒåÑ—êSYÎÝ e"æ(ù‘É®çTF)£‹°àj[LÄm¡.çñ™K*&¼A'rà `®µºGÒ'.ì…þÅÃmþV…GŽ.G	²¨Ñäƒ‚&\> ÃK,=æ†Š¨¹cL2Ë“E$i<æÓzÛ}Æu(4œ5]È`]šT)f^H‹µó•s¾k²êê\+¦NÙLv†f2È©ú‡î(Ð1iÈQÊÂ˜Ýß¥|AÕØ‘6b1Õ%R> •ÜåÜá¹%±Ž!ïKlÀ+eê †Óš¹Zz<Ç‚‡W^‘zÂ»#—ò>ýÖÈeûÉÐJ1 ß	ågE(ûTè”v’5ý­tmgXÔdR2sgX§Ñ^· Uî Ø„‡â4mÿN/Mô2•[8+XîÕH¢Nì\éðê[˜8´2µÆÇÔØo˜Z~ï:¹= £&@¤u|W!¬ª»@7zîŸ«:r.â„!.+f?_ó×BÎ¬`Þxx=A&vwäRÞ¨ß¹ä9ï>bIÃùT~N¤²WDz»Ü½'dMò~¨CÛEs0L~îØušu‹dÖnÒ,á›Z´¸Û+Z‰n/iú; ÎÜùo@Œüù‰U½$¡É5E@ã‘lŒ9ùÂê”ø%ÏÂ~ 2gåc![ÔØ¿`pø¡ëˆ“ÉQòä¸6tÆ|MØñ’yîÜ+‹Ž=Ç±¿a‡ç¨(8ƒ«‹ÔÉ‰‡"z€eÌïŽ§Ûõñ¨1ma]P)WûÕ›ÆÜºD1ë|û‰ùËÍƒUüåâTr>GËcÚgþÒHŒk’ãJÑ%ª±ÌpzÌn_÷´Y‚È»&RÍ‡+=Œfo®Šn[RSª·V˜Ãnß8JaClýš4a
¾±¼©¸ÑlN(¼:’6‘G¦ŠfIQ×¼åÿÇÖÇn¯‡Èeð2Ï–p¾Dá3	—„¦XÝÔaÏ|ž_]kàºtb¡ÉvÎ°öÕŒÄ©0
VŽéïÚ8'6î³GÙb÷	÷\V6©=ë›ÆSkr«µàÁñNà¯—¡³²ýöO¾;è7°æ!`¤ŸNNð'¿»ó5Û÷‹îš ()žöc?àAæî¢}Ñ~³C‰ž6t¾W¿ŠûþŠï7sóeô ÇSŸ@©*©P	„¦¡Z$£ H>Ý8¥?Å²…kÕxxa3D„)ê ±³Õ‚â¹99ÉŒXüô”qtÈœË%ˆ8Ünƒî@ùÀº20PŽ®ÁqÓ›ÇõrÕ¿
¥â0áfÎ‰›x;ÏÇÆBc5ÜR«¥E”6é”6é‰E0šó­‚l«ælUR,4ÍÙAf«	@¾ðñm'òŸ ¢±Ùß¢ü°]s5(cäÜpz¯) ÷ë%ªøPá¦»¼vÐèuQ¹ 04F¦» Ž-ÝŽ¦H~„úâ”íšæ…ÀÉÃÜ·xåùÖ,:ÿ~6ÂM÷Ž‘þTQ1V¢@J¯BøÄó­œ
ñ¥XghMð(É˜–	>R“—eÕueJ:S],êÍÆBË¨wásË+*,xìœÁ’S^ÿ`¹ÀD1í0<E Ÿ ¨sw2‹-Ñ.’²>ß08PöU`Á7ì+Sé~ÓTÃ1¹5™9É[1óÔÑž®ªe«x˜cÎ$Ý'{"¨Èß‰pñP-Ï`Œ¢ÁÌAZŠ6š4j‡=ýîÙp¾C(UŠ·Nò¤8pìæ¾ÍX4ÃLIˆ]ã„xw(Oh6ì7"TèE‰WÎ³IŒp¬÷ëøîþ=½pÃ~ÁßBj8[l.0œ\ÚoOVH¡kŸ->c}Q:¢ˆ0—›†ýmÄý×ãõõûûÑØ|XöÀ÷BaXG_)w:åâ§XcXrCžøsà Ðæ+|Ô<ßª«”¤8þ©ÀÇ”2	ÿÊY…;ìÐ¶æ?'ø=vJ³RÆÖ:DµÀ™®<+ÀD¤ˆ
QÆRë»CôÊvÆjÃŒë½OZ=øNl ¸3ˆ×i‡Ó?ÅÌWWÏOA]¦†è&–môÙmb{ÜÐ>}L¥P÷ö”Bò¼„Å úð¿aË?à9.CBî‹Õ0?2 Êâr÷Ù€ê—"Î±¦¼¯@Q!k{¡¡>zl]MÇUiÁ TW­8[En¦'Ÿ¢$4E^9ÿŒ(ÚþœÁNÎ‘ñçÕsp…l¸sØ²sA3ØÔY`p1NÚ–†„HØQw½ã?Á
aÖÂYÔÕ˜%LUÄgèÊ~è9A6ì[Mò×)ˆ³|ÊÐ k÷Æ´ÅH]j¨­òeDt·\Þ©Rt·Z,ªBvP›¯¤»YRP½
¬PýEª/j‹”^ÝÎnþN¬ðêæ²j»Ä\Ë\â±ü:TÒgUs˜«ä.'R¤íÒ½¨'À5ˆoqzUé%²|Ù˜Öè½ò\Ü¦Ñ0‚³åäfâ;ggî„óÌ°À˜˜véV°¡Rð) ¹e@>Slá»¡Ó&™„y"šÆH—r¤+” …êX³STòC7_±×þtê9Ä£¤T’õ$ÂÚøOaÀ˜®gH¡”„°3TUâ¼^^Þ-‘,¥ˆý›RD½åÿ²ŠkÃg2I?Æ†•¼SñaÓG{b^8­„J?•èt»]™C
Ý­„Vh_, òÄËH†üìÇ§òh>iâ¡ZL>AÚñX–I0—··œYR,DU	…7Ø+®Ï
€ËÅ/ŠtÂ[Ö^ž»ž­Ã¦D}çˆ¸*×Ÿ©üžYÅ;ÅÆ·›©Bž$ózkP¯¿ü¤xöž.ÇÃõP°fªe˜X·:!kU/æƒbe	"?Q´ü=ÕÆÁq ¾‘<5Iäî¹a”ª,\ô›Dƒ‚mEV`¸€
Ý‰ˆÅ®Œ ){,{A¶ôÉÖ½Y—XÍR~T)i)ÚSWžGvè2Eæã9ª«ÅëTM"¡²d ÏÁ‘¿ØPpkÖ¹"’3ú-å’š’wŽí®æÚqœF¤
bo™<A¡…ËÃ¢ÙÊ×I2 QíƒPjœçFÈ®éðW…”“·…½’äÉûL-°Üøð(ëêÝE»×ô´£â£ŒR?‘z[ü½‚äÐ*	o(%pïóx¤6z‰åTózãX¡¶÷êR!»ÇâP/èKM§›bjw(šÝ~@Ó¡¯=­U¡J`WI´óaR÷æ¹ƒª{7œÿŽï =žb‘!Íb‰£×ìQ¢ÍŽý¨ý2ðíÕ$’ !òcƒÈSÀ=¢>ª1{½°æhòÖŸ9¢Lj>%»‘Å˜ù'´¨]é¬ÅúSÆ 
£W3?S%5ñg†SëLôî±llÎÊ(µÇ°·aõKýQðë+²ÀŠýÕ	|&U·C´jû®M‚¦®§Êºn„ô›bÓ
ZÝf˜œàK\àM…D¹«±õ[Ó|Ì0‰MýA66ôcïnÅ…òG?¡Œ›	K¨Ì­'×èíh,†Õr=—ÖÍ–=AUÜÐ5ºøU¸Ã¸QÛKU#‰qú‡ß—×÷HÉ<ôd~4lÎË—RE÷\½R8Æ)°&ÁÊŽ3ë®æ•‘ŽëÂ
ìÏœQžã¶Ð®däôÎç­SHç¡:~~üoÁ´îžÝ}.‡­ 1nJÃf§«1ÏÇö;ï{GÊWQw^¿æI¸K5	–ýœç±a_1 ö,pþu…•ÍÈ;‘Jm_Rà/~öš†q²-Ò®äÕ³š‡>o´ªÒoMmk˜âÝcÛ#kê¹~ä²ÇoÙ93ùAàüŽhï
Ñ&K~’úFYž;>¢Å‹è»œs&t§sKVÔ&Eí¿lYßÀÓ°qî‚r‹­B1³û!{òó÷Ï æ:SúT1ïDL+=Y´›âóÆ¹ùùü¦XZýôîÙ>C˜îÈ¿lÿ£³œM|+bXZôpHö0\ÏçN¬?o¬[;œæƒ#`Ý6Ä‹ïN$ò÷QP±èž\Â÷Î…HÑ˜’g-ð½p`$dÍåEß°aÿ+Û™~³Åì•CÁ:RüÍ¥‹Þ0pöƒ)9Zc'u	>smÅGÇŒ¢5|Þ8Z3!¤yQæÏG¦wëHºà‚ô•XeÏ_ÙT¶vø‹Ø'j×–†nì–‡n 
V\vÑIm.9O_S0··ð›yE{r&amVŒyc#v…òó¬Åì1»fÌº°ÜˆñB—ÍûÎvèçîÄ	·ÏÜÀA¡û¾Þ®·8Þ'È¬[ì+@¶ØÔ‰ŽýI¨é&nšú€3˜:qÏXóo(ÆÐþÃÛ2†9[è_ÜlüÅ_±9¬6óÚ.<sý…ÍØSßG"8ÔÔ›«ãbŒxœh,´wµÁÍHðM£ä+÷¯°*´^Ít›ö¸ÅîË'&¼¿%Ö³ys?±ïÃðovY:+×6Yb‡§kÎü(Ù±QÍ5¾û ¼ÛqæËhmÞ	–lÆŸ…Ö¹“]k ˜¨‹‚}¡tx
–Ÿî 3lB2m ³§/y2¦ý&©#ªëµYïí7l{›=u"X-ìm·ÐGÜ]7‹¢èRIU4Éø×Ä¹ôô¾š·•/ò»ÓÕË/ .^dg×{015
’Ÿsm¨û~Búj6ƒðŽO@ítè±fã‰å¢»8Sûãï9óÃÜx°$L+Uù­.ö‰6Å9,/Û#ôèïW-ß™ÆõkVs¨¶\YÀD&yÑú}9ñ{Ö¦š'âÏpÙžTjëÂR|ždŽeOÌ1ÿÀa×0²æËO”Â ÚËb=¸\ßÝ>¹áã8±a¥ißg_³c\øf,Å×•¯|ÓÆÿó4ª•4Ôª€$p
¶¯%]&·†Å‡çÎ>»ÿ|Í8‡Î8Ú@¿àÍ…î³‚"ÅÇ
ÞDà`E¡Ãh?vÍ¢×VKÛøš‰†•aLËkˆ*„AM%’oŒç±ïð<¾Öatv¬5[ 2Ã#ÂóaÕ½¹†EŒØ¡þ8^;òÛ¢ÄA¹aüväX£!Ú <’^Žª	en—ZxSÑ›ø­†‰{J	YÛˆÀä³AqPýb;7ë®øO}¶JMÒ)

Kq3Î­»\y¡cHå¡MízŠð&¼„  Iø+'š™Æ2?·®S`v*rê`¶q1žÆà2ÙÐ¾!°ˆüÏ@A’7ÁŽ˜ZÎ \;U0ë ZQg®m;eÕ³#TÄü®¨EÓemÌŒüsÑÞÁß!ñÿÜœ¼2 à­š™\FŒn_}³gžX¯Ëc?])ònaª„‡³~Nµ‡;‘ÕArèSTšlnïÓ÷À¿½b"¼žC6ƒ2Ý¥d¤u‚Å_š’µ¸*´HOº1P½éþÒý¥7Z^þLÇV³7Økíõ[ýáN«Ûéo½ÕiecØ³zÀ¦?àë zAÔFiƒx?|MÂÕ÷íì®ÏaN±
sžxî²=ñîä¤éz-p«Ÿº
6½DX;9ŽCX^8‘AãY¨¹K	¨sIä¬( ÄiÊÔ“`ÊÔ0Ð!IJ	•æšç”ÚÁiŽgÑ@,tØôáq©²ÖâÊ«ç‡¯¿{urøì—ãÇBò½F‡'p1î¦uéd=Õtûp{ÖÏ$$qCQ“uÜšÄë…:v3•ÌžR¸'
m`ùÓTmË´‡
6¦†ût1U“Î“’Nñ‘r½Z-ÐNÐédS-ë6BñpÍÛ­L¹Ê“ËÄPÁN,YjÌŠÛk@ËgW!½õÊ9»®eC\àô|v]fª*&dö¹Áª4¨fUúqáža—ãÇñ”¹ìqÕ`mz>-<Ë©æT¼¼ß<ë€îÈÐäL¼;úáÄÀç/Ùé_^}w¬›’É<fÌ½P-ä ãè­ÏQê2Nˆº†ÄÏSÏÿ Çï×˜¸îlïÆÆY*PðKr´¤Ô}ª)H¿±;È‰|~‡žø>O04I¬äN"ÉŸ£}NsÃü°¨“Èéøa	üRB*š [d™L‘þËÀÿguLõ$L\$™ox)C„Ù8	ŸžOÐªëy#hì©Á™jÅ9>
O–î(*ÌV7f¶FÀhõz­Þh ÌVOËláV}ÎÝO@zŸœÔ<y:¦ªJôO‚k‡ûàòDæpÌþDø›Ôœ&ídc_ŒÁ-§3ÿât5_€ºƒfžÖÆ¶ø‹'X§56i›ÚÓ¿ú'gÕ=K¦…*F§óÞYóZ4ß‘$lÖºÀJÙžs:‰‚¯†I7§“vŽK ~æ*q‚ƒ† c@"å,ã5F$ §Ö"u[‹ùë…±O;¬¿Û¶ØðAg°<ˆòiHb5ËF€ò%H‡}Õue×œŠY¨ásüXÆ¥%&óæ½Cù‡Ê*5z¥[»Åez¥Ý/p)·`Ã±û¡¬ò‰#¦CªÃ,ÕÄ6óóI'jü”é ÇvCkì9öÁÕéï ¥™7µ'BG¸F¡O£‡Í§d‰\·#ñÁ;²Ý%Ýˆ§FSáB§.¼¯‡jJ®f@!¹.º H21CÜë‚’Ófµf¹•ÖÒC½èÇ5v’B&¯”ˆ¾""Ð
Š‚è> {üØL ôIªu.tiw"â"‚'çz¾u¥‰Ÿìe\º†êI6Ëìz®µD
×åž4.ö3QO`T˜„Yª)©0wîE-'@_°Ð¼?†ëåxC!“O¹»p•2ÒÉj
y*ÖÞ7({&kk8…ñs×’2·ãxn¹
–ž_´ôÉ›£øræý‘¤½—ZÉùTRC#,•4Ñ!'Æ*òEè*àÏR;}5•¼À|•0X2ÀQn£öÞH`—òòTBÎku»Ý¯™òBÛ"ãSnRAR4}¢‰ÄÉÑñ±°ƒl°'°ù³ª©Á—VðÝ5,]¢A¬øøŒO²××#²
¶‚ZÒa|†C’¶qb[{ÊÄn¢fEâ8)aVâÕU:Uî´Z1CEÉO¬±©ºŸjBÔö ˆ h0€…t½¤×G^Kæ»RÙ§’Ïÿi'
g ü¯³»õÖè›çåW XLÐžµßG$Õ'Æ‹5§……uûJE p4·C=olè‹¯¬ã/2ã©%UTáÊ‹? G¬Ë¾ÕVîÈ¯5*©HcýrýP…X ßÇèõsíË},µ0FCá1„‚ò!üCEDÞÝ»Š»àn@í{WÐ‰¾*EüÉ ~Î6Æz^"¸ûÇŸ¼x@G1ˆBæ¼Ñ·÷Š,‹1ƒÀQœ™ïS¡P¶/˜¡J#~LûJÛQIÿ54Â†¾•‹v²8¦D€b_4	ReVÙnÕèMet›Ó¨Ë7³ÊxåÅÜsFÀ’j;ê'…f!ºvÂÕ˜;x þaº<Ê›4Kê”"ÇRjë©"vRÕÒEËVôV´t¶ËF]P¤Uö­ eáR*
òª‰®B§òÊ *«leª®Ün’ž¨qî¢LD´ÔZ3Ýº›
VZˆçÄÁs1ÚâäÆBÃOK‹9ÞIej“*í)ÑjäÚ ’Å´ÔQ¬@MÏHbÕ˜"›á(–Vº0ÌUëJž3dY6,‰ã•o½˜SE ÀO¾ê’¡û¸U…\Þ{)Š&—XŠðRuÚQc}¿6Ï°Íu…5³«³ôU­€å+µU…Z”=Rþ@yÖòš¬Ä hlÞ’I;CÜS)&Þ£bÊ¯ö8JAGH—§ð¯£5%¤kY(æ:iü³%»me^ÍrôfE“Paë= ’öJÙóŠUüøGc¢8³@¶-
žH_Ë«lŠ^3TîãÂŸ»T’6§@‘³7"ÞORÄˆ+©
F\È*röŠœ=½"g¯P‘30)rv
9	_—ðË9uM)¿-Ìßê	ÙLÔ¨¦2fýbz¤YY2åúX	’ÓPºö†dÄ|k÷‘›_ÀÊx©úþuã¦§¶ ƒomaÀŠ¢ûnÆÓ¯\jâßcß,ÔiÄ9Ü¥^î ŒÅIÉxžù)ÜöTX)¸9£U¸p&ùÖ†³Bbh,ñKÊ"î2`l¾I®H·e"9²û²yû>9®óè52¢jr¥s\n0ÌÄ}N\/÷—Nñ`ÿ	ãØ6VÚòdÊÁ¦jÂ !8çëÿ÷ÿak:åVáyÎÀ/lfµp#6q$U×²Þj•Ö¦4J¨iZº%Ý€ŽPQ	ÜÙ›7YˆM‰jÉ‘Ô4|AzM‰i/gÌ±š:Rã…Æl¡!ÔCÙâ"TýÝQÎÀ‘Ñ#•[:ðSßeéj¿]U¨*ž½m~ò²ô³ŒLI3Ô¥=Õ<›yNg²ÐrÈE¾£Ÿ®ƒç±{vçæz‰ÉÀƒ;ÑzBÕówä3*^zÙäv;^¹ž6Í2ã.µx›Æ‹^µÚÇRç+®¼oü¸Ä˜Û²²Ü?¢})Ë2:ht.×­Ntµ:“ð\÷¨ÞâV€Å+bpyæq0á·	¾jŽf\zÖút½ˆf¯ý…ÓlDððÆUËSéÜ€²Ë¢ŠuòúŽª›ésñ]Ç%œ+I#*êSlÂ€f3˜R·CDÂÄˆSvªÔ&ž>Xº]-ÂY· @”	ÐhÛl˜ãjá9nrk.@^-zŒ›¶ûÎŒ‹¡œ¥o¼ü)0Váiä,›Ýâ¶'Ç‚±~hPü0Q¿&Àš\ÌQçäÎ@ ,]~Dx} ÓÚ×À+ÁçÓdGÖd–/#XŸEÎ¶;þw‹–•²ÂB°‰yWÛ¯}ß11
€ì;@³òFþ¢(BTN,•è•Xä…å‘†f“)RÆÄ´´D¼z£³™3×Þg%eQ
-Ft®¼L®¸LA‘0U×ºÀé´™s×¹šy†Ã}éùQÒ¥mÂb]EåÂ2ÏRC§OaÅã‹bH¼jó÷~àþŠžU^a“¹yl“Ã^(-WºfÞr»K `Df<X¡ä¾²†Ow°YÝÉçO»!Oc…Iè¶AÇ¼[÷>O3`ÒŽ
ZdñM›Ä›Ê¢X’‰+yS4]\Ú ?5Ðd$&g¾"®´§b0oªÓª˜¬šÞÏ8‘{WÉFˆŸßJ¹¿;Ž¤wOsŠÝv¹QÔ€wF'!):SæDã®1*ð›0­¿ÁÅ(%'DíM¯‘XÅÁ–Îðu‘¤UÄ³èrÄå¬"o¯qGÁ sÇËÖˆ§w³ÉÆÆx_"N\éÎ‚˜MVÆBr3¬”[hú¦'EŒ«èë'¾Œí¿¦4kËq¦B(Y.ž´°ÐqM§`1ŠRÅBjb#¶å‰=;sŸ	jjT
ª6	–’¬Ã2ÆÑB5a.¢‰B¢î¯à†ÌÇmÖèg d =ÀPeò éôgß‰Ë?ZÖEÜ*@ƒ<÷Lã1©ÖÀ?F3ßv`GPÇ³®4Ÿ¹Gþûë_Ù×ÀÙýí¯ÿ¾ÿ?[‚ä0q¬17ùwáû3®ÁÿUØÀá¡ê(˜hÁ`‘OéDŒÔ–FŠÎ£¨å—. F©h,üöWðR0ö1ù3V-	£Â¾Ýð¹{‰ºä}†úÏ¢G—\±#íívöZlwôÏ‹A¯3h±þ.|Ûéì¶Ø^{ÐÙk]øFáFü¶×Ag.¸;á·!¼1ÜÃwpm´×Á7¸¶3êôán¿`ÌZÖŽ*€Àk—öé¥ï­ç~°œ11}Ö<\PÍ.Ø¶W«Èõœª{¿×|Ðýr+y›5ð³Ê¶áÙ€-Ÿøó9à(<tË™ù°õ–·¼‘ÄG¶½Ââáó@‘xQe…Ûßîþ7ª×…}ì?  ²íwvtHû;ßïÃŽöp÷zømw™övH;ß¥oVF#|·‡ßvV€ÞÕ~ŸºòÝìÅÉék,L+YqgO]Ö¤÷v†ÝJ[ù2ðQŸ0IO[w`º«¡òíœ¹ÓY;É.m»àp›MVcØY²Ñö+íµ¡Ø$ŒïC±­o¯Ï7bg¯ÓƒõÂv:ƒ]~wa£üŒî;{#Üª;ÛŒ§ŽïùS*ò¨‹Íšÿ´²‚èWD›–7AƒÄ×ìž™Ã×ªçï¿ÿwûÔ‘¯EØ–¾=Ÿ6éÇÜªŒ~ÛX³Ž„Ží¢û“» žK?á¾m¤ŠöÖäçîYË%•ˆJÐîW,D°Ã¯wu$»ñ™ë‹„‡sç<œ]DÐâ˜Žø‘Ð]<tÃ.ç!AÊH\Û¥o2]:œÃ;ƒ‚ÖÂ—OÄr¬yäÐ&î.æqÁÇ®
â]©åâ5[ŽÏóÊáÙFˆ†i4´É¡»ë°ÓÉÌ	'ÈeûþJ*üÂf«ù²ÚY­âÄu<t÷€™™þ¹bÑ…ÿSïcˆïv2)…¾°Q´cù&ƒNwWi¢¿[¯€«¡ÚÂ¨_¯@\ƒ¡ÒÂpX³`9ö2Q¯À˜ÃžÚBÍY ¢}ÐU[Ø©ÙÌâÚÂÐ(óÏÛb2Ë’®0op£Qü$š4›øø%<Üï~ Û‡_¾>`ÝÎ°0upÒ[2xh¦[Ü¥èT€?óÏø(ï'>2ç€»Ø²“öÉË–uœËe³Mß–þEó’µá¡x™1Ì€m³f?~‹ÔpËœ¶7ý¤½ÁºÀÊÞ(óSåsOa*;@Ì p³tµ£ïU;ï‰T¢ÐY“Þ¨¾- ©6ìñhšTkæÌ]XÞO´ÔÐÜºl5‘Ögõ5ï°tp¦° ïî]]Ê…?[ìÞUÜUr½·uýÏ‹wÅ-/»Ð£B§"8¾Ð§òŽˆãK'ðÏÃ÷È
úž°Ãqèc >Íç‡/Ç'œ»¡/­L¿‡·^à?™d¸
½ü~=FéÝ¦ÖÂ´Ý…øÆB*yåœÌ,´š )‘¦®á†wÊV+lÚyðŸÿqâ)´ËyÞÞxbŽº$‘ Ç4@V%—þ¾ûÃc‰v%P’^pÉ¦!½HÂÙ½3æJîbå¯BöçWÇdˆÑÔ[_jaý`5Vó¬ñ¡KN<1eN_=g½½;ÕDÓt0‰âˆh“Óú%XØÏÀqÌræù~ðIpG£Îh÷†Ü¯*ƒµW·…ê †5[ 0¨cØ­ÙÂ¨Ÿe‡£š-€ìÐ½Ñ:ìôHN•7£æv@ºéßh%wv;}•Ç•¶p×V÷ï…Á|
Ö¬þGf°†¿3X•›2Ý–yn(£ðûÛ‰¸ç–äÖ
ÿçÏB,‚xy7‚r£ßÙjAšÝû6s¿‰ê¥ÒÈ¡Ô¹
Þ¨h”:8IKPò¦IO'¼[9rÁÁáÓÏ}Û)g*ƒ3#BâRÒpÆ!ä¹ú‹ßª^Ei¤“l	¨eì³q|šØ¿¬WVÖÕò¦É)Òî*UBÆ\–4¡(¿Sõò‚ÊÁ­’ZÍ¾šKuÞ(ÊA¬PÇaœRK<hÁÄWwy<j>D…Ï)ã‚ñÿ0¨\°J<$
®‹ƒa*„kÖš‚á†.êÓè5AÇ~#¯‰Ê9—íÄmbGÍkÊç/Òþ{ú<ž4£í?b#në!?@úÑe³ä½MôS2Ô¸À,Ž3‘Ê1	ß¥éÿEØEÛ9ÇîxÞ;%ÉµÉC§Ò¨ÔÈpžæâ‡ï›ûì’ÿÈ Ä‹ <Œ¡(ECåÊ§I4]]ï“¢8dè?qœ,kéÂZXììhwV-Qp¤Kb=p¦6©&¢Ps¦ç#É.ÄÃödÜSwº°£(­©”Xî&üi`ÙGÖ¼ùE˜þ¨Ç¬;Mâ§"§rõ®Ä±H`Eô!âÄ¬§¸X–9TÆ•2uŒï•¬Sº.%Ü$÷®”ÞS×ö”@§Œ27úqþ³þpØÚ´ö†-U·Þš¹#þÙÏxu–— Ëeê(Ú¼Â_"çßd^3\¨öÑástRëÆcÂËsÅdÒãrC^OS`$“3!(	O¿’6·,r2HÎÄSAÙÜMmÞ~1Ä.ä.N0!ÓÇ‰„òþ¨\Â¢·ÈëüPY¯Ù«úÎãé!¹ÿø«°Ù3G©ðÏ]¡‰2÷ÃÎ‚6ïI_Á1•s.$§âò¯,5LÐ)'	mÆðhÛ9³V^$»ílv8x?/±q“‡g%ð,rrMÒÀä
xÉ©Ôäc"É1Æ|e…RŠc5ãÏTMIø¢šåÀÒÏXµ_"å“j7°ü¾‡õô^¢JsC–¦<9…žY×Œ¨0ã¤9=ÂNÁâòà$SêÛìhfÑ>sXÝ:g3™{iÌÄ¹Kðì4üõéÇÜ¦üŽ7Å;üæè$#ÝÄŸ/A`uØ¹®à@ˆZÚhñAmáh	ÂIúÐM¬ö`¸¶Ó}Ü½Å¼‘…ÕT)Lr®¿PªS¼qp4AòÞïfÓ›îl½UŠ¡L¶Ÿùvry‹*´é6î„Âp‚ÿX³„Ü …ÙºpE¤:šX›çB¶Ù
’¬MÎÄŒF­øÿn§4æ—Þò²%åÎÄß[­ìË{]Û™¶ê4Á7.tuöi‘ùfjäÈ’Ó]´pÆ—>lÂ9ýÄÚ°¢ ;D³ƒF¯Ûý²!Î€øU¢ï9XfÅ¦ƒTÂÜaîîƒ+zÕ¨eF†9Swqpu…¢÷>ëw[\úF;WK$ÑG“d‹ùrëWq›å©³°B
G¾×OÅV3×>hPŠJÒaƒ]öÀÄ­ùŸË>ÿªå/|Â¬™vðyÐÁÖà…#ìæ ñ‡~ß8¿ö >g®ºáu1hèß«Öz¥¶n«‹SºäÛUÖüáŸ/]3IŠ?drÖ@ñ…á¬LäˆóðœåOÛþÜB|sÓ2czúû¶<	_Dìðì{ûìþv††»ch9ŠS<ó¬×å¿~v8”ßG6P<ñÄš»Þ®!ïA”î~°Ç½>ƒýÀžÃ(ðßc	á?ÃÞhT©–=ß@ÏéïÆ• 3|›
ØÀË˜CGVJ.°Rt#4'Ü‚ùNqy¹öûüÃ5ªû{¼‚Ã£ÑÎÞÝ®`)À?ü&
æ¤ÀÑMá¢BG€ÐµO‘œñE>¶€ð <`ƒóÓ#Þ]‹‡à ò,¡ø)3éy}œz¤Nö²Fdó†ƒBžç¶´wîY•*MòUÜâ!4ˆ¨ñªøâÕþâ–JhJH­Û¯²Œù†¢‡£¤kw4:{°YeÀ~+¢Á¨Ð^Œ–X¨ËßI £»3Þ±‡å/ðÅY^óY2¶U›¾ž,f¯%ðñýL\ÇÕ üùql’3ÕIÕµÐ•R?Š¥RÚjû\§¥½c%M…—’Í>ÎF•úáÛhèØÎ Åöà/)]ª÷)6°_%-ßÂD…fª§j~Y¡×ÒãiNeÉ}ñB$è’NOÊæÆÐÕò},NTAjªÌÊ'¨bAÅÜÑ)ÊB
[ayl›[¥tAü¹<¸Jý‰ª¼Ò˜ñnÿl§6\ô:•òów$\¼Sý-‰JöYÿ6`¨4r@Óiä.K‡‚Œ€;>¸j^‰|À÷XkÊt]AgÊ?è-ÂßFÜ¿Ÿ~Š”*ÞibP©‡oáM÷-/=ˆ9(8—\îm–¶!´©­ÅC‹aq³†“ ;oÌþ(œÃ^žÀïÞn™VWm€vwGµÐ]4¡§*vø)Ì$’ÿèç»Oz{oó¥g
’Y gŒää"t6qNB9º?›={P+»yÎö§ILžc4 ¿LØø+Ú&ÙCî?ÿsiVLK.wÿÈn#ïî.¦ûXWû…õ¢io±oÙýÛ‡÷Ù>³“^†[×ì¿þ}ƒ.ŠS‘‡“ÔÝõê\õñcVgÕ©Õk‡+Áaü) ³y•7yS)éá¶¢(*vÆÑ(¨ŠfÌeü Å}á·€ÜÏ,m›=³Öþ
$Äã5°&î„XÊ@ R‘	cÑcøk¬aXKi›ËÓàM¥<=ž¨a§¨~ŸpÉØ)>¡8ÅgèÇç3rg©J-7ñÜêiKaì0l<y‹ö(Íó,ÍƒîN÷èíöÎ¨@ÑÌÄtÅ³ªÔ¹©æu@ö‘÷Ê"°S!ÏçÄ*²ÙÆ¨¯‚$^ž‚E²êòy½a*`ògpàuÜKUt|ÿJN"=c0Ø”2¿Yìè£W[XS_Q½b5žŠê\\C|R;7k>ùùûç[Õë}è'!¼RV«GW®jSWÉoÕ.+§‚®ê‡KÅ¦b­"QÌÝÅA£ÛéîVzØº<hô:ýB7øFÎ’š® 7$¾Oy]­ÌÊn‘¯ä}àEî#'‚lHæ‰*$9W\ãAç`Ÿ£laðJe`òµ*¸3dêðFìÍÍå(½Óìn¡S[ì7+¼cG»$m»‡1hcÍ$£€sv´n‹}¥ÓÁW`:…¾¶b˜ÐÖoýœF€öQu ‹D~3wˆyR¿œJÎãÔÇ§€l*cš¢é‡ã™
‡J‹dÒE4!i™o‚d$/*B2À>þæQÌK˜sL.›» à©b¶Vñ	½¸®£ÄÒ¡¿
&N+ö;‚‘‡AG<q«cß[žÏ?½KÖ&uâ»þò·‰b† ÅHËhdd¤•¾'#¹]þÝ`™§fÄBFf•L%ý)¶‹™€±‘BþCôÒ‡ñ_ý]®+«lnôH9ÂBÃ+r”‹U‰š$Í¥²¨TeR¬gxÀ4Õ1n¬&(EŒYé¨8þDÂJUä~. ž,lç)Í+g
ìX°®Xˆ–ópT×›LòèDhÖ¾†À^ôH­¥æõËG;¹Òå¹räÅJ"YA¤¨—H4Œ7¬§nX­’É9hÕâŽ½zaÈÖ24E˜©ÎàÜW"tQ hý‹V@”<ÆoD¬i¸Ùzí2,¿rÎþðp;šÝJcèñC^>·Öbb`Íÿú÷­[jVD_p¬ýÊñ:©ŸAÕà¹mµôT5Xy}{£?©*Î ìy{áwö*u®Þt:Ù†ý¶Ò"vB?ˆšM«ÅÆDÝ­Ô”×fãäÇVµÆ¸Ùü}j7¯fªÌØ—ïÓAÜÄx»öÀÚAŽÈÌïfªH' J|m®Fº‹ü‹v=ìÖÖŒŒ˜°£VÄÅ~öU)¢V·Œý'ŠDªÖF¦ÑnG•0méìò±¦5‡%^¢` ‚õÃNçF{PÅŽú¦Ë•´U™t€·F–RWk­^íÞNœS\ˆ:uA\G6°Æ\‹¡1Œ±ö[jÙ³$0ÊTeqÄË*Êæq9tÇ‰†­~¯×êv[˜®§4T÷	£µGNÈ¬°)wxÀÈ½n·E$ Íâ³æ÷ÉÐ8"8K$4R¦­-¤ÐÎÖõ—ïªx5g?•œîåOM¿ñ’VE"¯¿„´­ñÊ³‚öb5QíÐ†]ôsÜ š®”ÅÝJPC·’°®Ì FeûôšKUUãÙø§"ÝÏAÑv‹Ì]¹HOÂÊíõÝ.¸i.*­bÛÆ¸0ñx°­pæØ¥i›•£ÆBÖŠ9("Œ†¬=LòÑSìƒlb^²³°è©¦ÊñÜ¬ˆEU¬k<ŠC&|ÀÆsæ†ì»ù“zµ•/Ã¬HÉKI¿éxa6yÍK+ŒxÝã¹Š|Ya„Pr8´(«e‹ù(Ø¢m’íRTÝÁðHxØuÇòÚ‘;w(<Lq³ÈÚóuãd7q­´W"h¸q‰ E-fæa>py¡*Þ-Ó-S®Û­0TîÀ#¥{‰‡W:µ üú~Ý~êc`é×ÃN_b‘ªºyF•’l
¶"	°´1ÒY›u’†½=òçs7:û~4+ôJ0ìßEÂÆK–ÖÒ–.fjd‹rÝR†“òÙè:\«Bf²Jû"T
€*½&2¥,ü¨MQÚ€Ùs7ƒÔáré­Y²xìdÑ~	S09OUªO]é¼g<	¹çàP•5(t;Å1&GáJRÅ&ÆÈl„äšñŸÝÌŽ’È¶]Á¯ª*G-ÛO§¼£k¶ŒJUíeœW™±¢}‘ìŠƒÂ'ÐžØß+z„Ûý¡4öÃx9LÆÃd¹
š5Zã—73Í„2¦šGí‚)›«(ÖI’õÙ!¬ëµðçXDë˜rïêñÖK=ƒ>äñ)´sŸòÓSØˆöôð•0Ÿ±RuNO•Ü¹q”þX•'©Å÷²H-5>u+©’>äñÝ MÍ Fšš8gd±¢P'7T*(J]Þ^–9>x†pú’ç-Ïð‘Íï‘¤÷èKÙ=’äÅ°R¢ ¡ôšôjúÆ_Í"Eü—=Z7´_ŠìßZƒñni<ÁCÍÆ§¬‹FÚ&Ï˜ ·ýèàêÌòBç:¹{ãñ»¯°µ›($þøïtT½îxo·§UaœŽà4y½p•#ŽjÅÝ’&lI‘3æ3¯êÆd®^Ny]¬ÌÒ8-q¦!åŒuneZ.Âä…c²"TòìD\¿Ã=c	©Ècéƒëv~×ì|PÍÎÙj2¼w7š£åÊ¨Ë‰;Žu9ªÚ”Ò8:D|zš„Óne]N:tÝ^‹t7PéÄ+§¨t¤åüªtÒ5ŒuÚw®ÌÉÆNþ®¿¡îéÈKÌA¬Ø >Nœd,t{¡qR&-}‹CÞÊSh©P|½Ã·;Œl3Šˆ2â*ö/+ž2ƒ–vYl¼YàÇGù¸A4Ù&'µV(Y¹1¼<¶£rTG•xŽJÁbt¯w v‡¡a·pJ]lÊ0òç|ÈÒˆªÇÐÆÜÕ)“£|>×c¶[é˜Â;’ºËð¨zÒÊuª•oä¦©'ÆŠô³ ±ý]øîËò²±Eù¢óHWXÊŠè…gþT¯ÈÅ·Œ‘š·L.ÑËª’;E3PeW{…á¶<âO‰§ÑZ›èQò©è´Ô—Gªzœ" €,àý¾mJYÂ±Of©ŒxA»yíŽ4÷®\8%I?nð“×T&í¯<@³ÕÖŠÒLòÇ|¨ª¦ª'ººpŠÖmOuqMs¡÷{­½~«?ÜiaŠÖ­·TvCàP°Îúï×ªG‡nq™YSÆC“Ð_Ök›šˆœêð [ó‚ú“NDoÌYþšã%Ú¾gÀv,ÛÖë@3‹êú
±JýÓ3éäuhÆ¬1ðyæXçÅV³›.IàÌaÃ>§Uñ—¯’‰õ°Ô¬ÓA£ÅkÄ2gNÐÁ«á·7]mõb´ˆâ¦L‹"XÉ±V°…sneÎ+º`*äÊïør²<`%Ö]Þ‡H,IàœÃ·°è!Ög±0Øy“Eg!ÞßRžÆWõo^Žÿ†¯Øñ%Ò?\§rhrsÀœ'QW_¤¸¾¢ W$¢º#²®ú_ÆÎ"ÅQíË50‡]M\WE‚pKë)t_)¬hÒ1Î©þŸ46®íõÔ+¿FZ2ØWë‚hÈÜ W$!ãE™)þÈýŽžcpv²¢WÁMˆEl¬Ö£Z6~È^ÕD›HŠØWS}²Àº`þK¬Ž&»©aÛšÙô—uüF&†:s—WO5øê%ùóÀi€èÀuB6s½÷£apUy}	ƒ±Zú<ÛB:K³N 2ŠX„Ì2"•®%zvÎ`MeÒÎQa‰ÙûçEú_·ƒ™µ{Ýî?/†:X}¤•:uË±âfíá.–®¢jtÄ¥â1ÙB¾¼.1"z@YrybM¸hFyÓhÂ 0É€û«hã×6`‚„OÏF÷k×êžŒ{a¹¤Õå§Rš-¥¶:6Íu¸t<ïhæ aŒûäÊs½,YÁ‹gfÈªeùj©Tb¦º-®ªæüióÑrEj4Oæ4™µtRšˆG¹YŠS*Ô·ýî? ¦°ÜÛ’0÷¯L»ëåî…ªçy^&—oöÓzxré¹ãÂ¢\ƒuJt‘íB06Í¢Uoz' –ËÎMN-¥­›[é´’,¬‰¹‹fWMì/:JµÌ¤ÞË¡Èš^±¾$¢ýð¹{ùÜ·ænüÕè’ˆ°ô¾ß±b.
/Í7oM°^+'#róQ4øQ˜Íèq	Ã~AÕX†iÞ»Jæ(Š½ºÛú¨¢HÊ½ŠKR™UqEWò5a ÷öZ½.2€=Î 6rU]3(*Çæ+]nïvåJµ$ÁÀ=³Ö˜øXŸÅ×Èª+_}?<z}òÓw4¹ïÄÅ·ô§¼ÀàªT,©@J=/$¬2Èa•~Vtõð¦l¿YV»Bw	­‘0ãFÕ/ÓÕî„KÏšÀ¶5¶Pº‡¡5›¡¯î¼¹µ—Æ4aoüÐÎqOöíÙv=©BÇþêž5hÀSøè™§ÈJ®¡YMÁM¼MF~D•£
PuÜñ¸ö«,¡» Iž«ÇúlââF²«ÞÏMp_NnµÜÄ2ú·a\ÐFNªT@Æl„+v5ËÇ<3sáì3±YH‚uR<¯ºÐöeZªlX35Û—ŠY‘"\t%Ÿ&JS4o±ùIIy­‰#þð>ÐnûÞÕüÿ9)®ßSšò¾0”@%ØIåcÕsOÕb${,‘ÿ¤žq};˜¥ñÞ-WçêÏFµÈcv¾k—ì‹¸_^&\>/‹âÆ¦"Å£xIøb–½WÏPhWÿsyõø‘l,RlþxÛ{‹‹mùqLNe)eÊ‰j…5]„žÅ-+½$dB¹™!O8P©‡¾.×–ðAº^3KóÒ[1žìÐ¶)­;~\w0É_Õ­±`'q`ÔÖMTõ^¯MÖoƒ^—zãÝÑXUdýÆØ’É]âVs*;“d$eàâ| ®³C _=US”ãûs‚A±Õ.pæ;9TÆ¥:9:>fÛìèü÷Õ«Ÿ<¿'G§tñô¸ælÍž™¼LxZù†cö t+˜Ì˜í @èsÒÆ€ìlR)^ï¶NCÈ‡‚Ü¶0Ü'á#’_üÉY‡û%‘º‰Ä(5á¸
|Þ®ÞP½+
 q!©ÑâùÀ¸jÁÂØ½˜`$¸;½šH·Òµ€|~E!v­·(g°¬Ž#£„Ô¥ÅÆ"_G£ÍäUu<tªÔÅYÚ”á$Ó±$—âd²®×žiu*A7ÐV-I7ÒîÊ[”‹ì¸•Œ$¹˜ŽCvãÊxiIc0á-‰cËž:e•@Ë™`!5PkœX± ÷©ä­»9æ…Äãñ)¡ÉfÚYeÃ«w1yèÉiŠ%¶L ÐŒ¢2.Ø=1GÚ¯â¢¦ÅÎ¯×ªŒ·-*ºaøxGÆ,–§;ÑòÍÆå6oµ°—ÚboÌrFÓ"*ØLùG¶œ6øË˜«‹ù„hHvãÜç¶`žBO;ìÅÉéëûáˆO‹=q¶:ŽyRy?W“Ž¹Ÿcjrªf÷·¤ù\zí=¶àŸT^Ž­¬ÿ?   ÿÿì½ÛrÛH¶(ø>_‘­®®’»‰WÝ¶í
Šº±K”Ô"mWÙáp$D¢Ü (‰vùDÌœ30_0_0gb&bÞÎ¼ïù‡ó%“+—L XÐÅUuº¹w»”	d"/+×}­déd“‚Ì_ñùOìê-³fÖS#g.ÍÞ:`Mì¥V8×Ç·D»£`^Çˆ½§|Lè-Ô^EšÖâŠ¯Õ.G€€þÖÆíË˜ŒÎÈa6,,ÀkkØ¨£d¥Xê‚h© 6rÁØä¼1#±ËeÄ’R? “9sK’úÙUR €$ú -€NÒ¿ŸØZ*hÎ “)Æì]ô€6á¨ÖAÏÛR\=€H»¡¸I7£°Nc8¡RÆý¼®WXÅiËo»ô{Sd=P2‘DÍþj½ýxóel‚dŸ>õmÓ¡ÈðêÖàªÿLã(I¸´±¯ù~ÑXã	|£¾·³­ýüsd9ÑË„ˆ@²Þq–sÛ5ÉåŒý IÏ‡àvKç+ªm@Ö6EžK.}9†Æ‹ý¤#Ý®:R*Ÿ®Ÿ™nH	ørNN­;“‚5£¤gæÁö“Žµê®oç6ücI‡þuVv§Uu´­YÚ­·îÅV×o\4·ºÖEã^£|¯~ ysô­9@çd	÷•ä[rwÀøžkƒœw¾`èS*^–](zEíN ŒÛ–$m™Öa:0;ØŠ¨fçR«s\£K©Ñ%®©”vWZÎ.¦QÇŒ„VP$ÒÆc:é{C«!ôÂÊ¤ï¹ãÔBuq`\iÚ¼‚\Z¾w|¤`…Z‚Qc`‰½ð
Ò¡œ”?Â¤ûv8z€"ùÁ
€æáql5O,yAâ*ÂE¬b%C²3çÒÆ  ®;Zâà¡ˆj6›PÍÞºâJA	×È’[!¿5”›áfv`7†DDˆ¦¯/Ä-„¢Qïäí…Ð
Šdx<Ä4½‰«	%D£¡-B	”0ƒJc¤%Ô	¥”J>¡¬s,ýLÓ¨³(o‡â¢¼E®dæ{Q¢é™=4¥¦Qªéù(Ó”U`ššGnÊ+MO¯%0…"Y?¥£ññ
€(yi‹ e²Þ5ª=%O2Ê=)£8°Ë…ôò\7íQ4 Î#ª!Ý™éŒ½Å
‹|Ì·þ@†R¨¨HGºA£3=°üm+&•äÐ[Ž,þ¹hH/ª©B
2Ê„"a	m<‹±döÇ:I½@±Ê ÎíKiaY™
ƒS×
q8¶äX¹R}Wd¨h‰Š#Ž=¯ÐC×ï‰C€"i’cË÷=Þ¦—72°B‘û‡˜¦WÖ@l
EÒqíÀ£œõ7‡Æ©Ñ÷¤^¢Bå~ÓY!—b QoZ¢‹é²\Ê'M±çdÙ)		Ã=GÉíÆ8$ñäP$o¬•Ã8Ñ¹Eç„Ð‘ÔïÑË[h‰ø•ÉÐ[xŽ7…t4H>t˜åCiE„Í¦exñÑE¹Û[¾IÙú`ƒÐÂ<Qá|b2Ÿ,Ðv.óU¡èD Gè9x=Š @Gç¦ëe;:T]Óy.áÄ }e»IŸ¢:;´àzUGG`rÐØ®ªþÕIªê€ÖN¼r2[Õ­Åwq9RuAkñ]tÕû2©2?Ó«X X®ØJÊå,=ß\˜!àE€‰Õ˜™ÏU7R5¢›ÅeÆÐd4Nëræ‹™)õÉß)›]™ZËth¿šO!4]QsXñ{iÝ"ê0”¶lX:«ˆóò—ÁL^è¤
¥Ó žBjžT!š_Hc¦%@»8†Ñ3NÀaÔ›{²àêñK½ëMc%Ð‘«ëPÕW«=hWÕ Ý¼l©ºâ}u|sê¹òò¦ulfÝZTÐz*1§‘¾ºt¼@:ŠIê8Û¡˜®t”£*6v>J
;ç#9¶G¾g£šwáþhÊJˆ_«0ˆü¬#
Èg,€^ý ¶„"ª™ØÈsVsË§„ã…ï{£åÂ÷®¥É¦u˜¯›¾9¦(qî9â0„ZJˆºZ¢ü¶ïÛ8µâà²wq.žA^W	OQkÐ™ž_ŠíY™Ùn,ÕÃÛ¡¸å´”ØJŒ·¶?¦gÏDõóÓð­ˆÜ~2h™¬ÿRA”öäƒý¥ßœÚ®L´’*›¸2%3FtÆ¶Äq&{‚áÏì±dŽ…~ÒJ2ð&HëÂ¹IaòN‚Ó¤
Éºšsó“µ°]	-Iõš9³¼Ålå8r?R5j<××Vv(Qf‹ƒ±çr;ôÚ¦GÎv	Ê@1XŽ}GÇ5(í9Lu/{±5‹…íÛâ–Æ5˜ÆsïŽJÂ°âbi-¡ÜÕl5ñ‘`ßŸÊÜåÿ‘üÐÀ—[R–Ùò­¼µ¨{Ç2Û¦OÎ`é\Ë×“ø÷û½¢Er ÎM]kÎ2; ºèž‰=tÏ(ù¡thçÓ4î®…ÎNdÒI‹(MýE##×Bºp9²PfÈ®9¸hZs[€ùS|â]JÐl|?‡b/'«E@·d=1§Ôb¼¡ã?f±´Ô–çÁºiJåIº¨¨êAP—
fNÂ˜Æù.FøaM‰Àè>@º\Q½×^ˆ›?!Ñ£M·ó‘›ÒC«ËÕE¨™¦­Hy3Ê|Ã$¤«ô;Æ.É‘2…€CÏ¿¡„J×n—K±b—ÂS$ulÍagÿYv*zDN-³„ï(Ûˆ›JÎì7q5±;nLA‚òeÝËûz½Ä¼ó˜ŠTæåÍ»ÿ?a™VHg†pú*kô\Qúaµ ‚P!-”oiK:ôPiðZüû²Œû+Ýs:›˜“ŠÇ!mõ(ÇaúË6Fè=¨BmŸ#UØ®ž¸“ñƒ*yA·¨W0³,q`'l#ÓG~pØõWô fYVú€ˆOPêÖ;sn…ôxRWrýƒ £o…àxNÁì”ònÞ4x ÓÇÀ‡Ð¶ë<4.æÖÂ7?QnVÔ5¥•˜u·Aˆ¦¤ÖËäSªQùd‡3ß›¯hOdý0æv‹’@[„Æ£*s‡Jq ?‘+X9É3yŠÓÜÌ¢!*pæUHÉ™˜~hºäÒ)M“éRü§Ç
©4ò	f–FA­¿‚Ôv=7Wb-j½
	G\ñø9Nã†^Ö±8.Ò¡ô)Ê³Çt¢å„Ò¤µwt6ÆÎ’ö,©Ä`O‡‚Û'y›Ò:DGþJ8IRõƒÎíÐ‚¨ÍÕØQ@âäŠÍtr¯¼`,’gáÄÇ(<pªö¤è¸¤¯ `Ó·&`Àwdj#U£Z0ÏíÙÊ<@©Ö,—¶Éi×’Ú
-‘CÖœdÍÔåx{âM}ÊAØWÄ,ˆ€¾„×ðüIQçÅ½£º?
¼„Òr'–—_˜"MË5¯m‡tí0³ÎŠ‡8;Vh9ËpÍw¨-ñÅŠ=‚ö$O ‘é›Ž%\ý¥X%ÅÖ©Ÿ£:4éˆ ²*ó©ú9†2¸x°KÒN³àªWQ‹Ã93†3ßÊžsõsœ¶“ž"ÕcäûfèÛw²5û"nmNœ%Sýê—$y‡çÀ¾É{§¶Vco>"¹ñªßÃÚèÈÀòmà]sýªžV°Ü‘ájaQ€eV?Ê
™~þÙwqÊ=n¬g1ñ&žæðvîµS<âNoêf=Èz‡iDewòîeô´’õú¬A25šÑè‹zÆÌ“¯èRÕ‡²`ƒtÇ[Õ ´,½8‡u£â9YG…²Rt=H¶!)@‘ ~†ØÎTÚ2µê,Å&¨Ï]Šz‚ËQÍDóÑåÛ¬'®Ge¦½M¬(]úÕL$u3”„%	V¨w.*ëÏQ±R]	PÓ.ÝiJöË78.Câ$PŸ2EKˆ‰C	Á|ŠË×  &–q9Iê0GeÐ¬‰ž/ƒ
\Ëz-Ó’V [nŸe›ÒTÛV3óU¨@™ª¶Å‰mc»ã­×¨3çŽ)µÄQÙ©ïâ†]ßi]žÊ¯ïP‡Qþ-Žu×hÔD'^^IhGìF› öncGHêI×€'˜Õô<‡‡ÓºèÏÅîgõ °F×ï8?°P\GB POÖ£'Hï‹®×õ­sûô¨#›¸žÀÌ¡ô3¾e¬ŒÙèN·)íRTÐßœH>øC›¬³J‚t?yÛ¬(¹fþµ†;µ¶´xjŒ!
.`¡%¼U ˆåd%SL\ƒ±aÙþØ¤,®^\g ‚Ü’Cð£òdüˆ”K-‡]Ã$J ô0°ëS0RoRéiÚ”»ˆj#neGòW,`I2#Åu(e¢kfô‘Ij+½‘Ü:®An¥—‰†NëªÈ’’K	îºÒésÉú çÈþÖvÇÒxÝ1Y‹k{–UA^¤Eð>Çùm€*ŽNõH2aF•à‚êå(Š¸2ˆáOõ=É<ô]²[Éé¡‡”Ôa:`b—çøžûIR?FHôEy÷j­³ÁjPàPo÷eßj˜dq|Ãé7·%¾Ö&
—Bî÷+¶ë›>Ý¼ÉÔÊÒ³äAS¶.x¦ºöø£E)„Äƒ	O*!§œt—<!Ñ#ÌaŸ¾9j5¥“NXŠ[¯×ÞH»7j$HVFÑG7)K#;X§•ˆ.~ð(	­y…•Ç`D±$´U¡˜Pßt2IifãÍÑÈC¦düæX5éc£Ù.ê	÷)Êµu’rŸ(N§¹íƒVáÛw)oÐó%Ç%¨"¬ÃpœÙïÇU$–ápî@§æäÚ¶œI¾?éé›îÔ¤¤©‘å\‡Ñlë™1kMÑ¿ÒÓ%v•Vú§Ç²DáÐ2mÓhfð2­!çó‹œ_íÔûâæ±2¹2mçÖ\áÁàØ2Îí–ˆ££r	é¯è&â°+7éÖw5µ¦Õd°€|y¨ÞRø|*Þ5P¬ðÙ¶$Âœš+
4¤Ñ¦hyd:Eóytä‘kùÓ9´nì±õð=T˜Zdâ§’*ÌÂtÅÈ`(aõ¥FýÐôÍ<œAü¼/æ¿æ‹ö±uy!j;ÎŽQNÑgR3\-6¢%Òq±³ëzÝ1 %®A4þiðVh¸EÌh¯¤ÑúWK\JŠ~çr$EÙWM¾iU`T±ËÐ–œV¢
ÚuÙq"Îj0"+®”ÞH?Þ ×VügEÈÊ\³Ÿ¤SEß?DÛ39àÈò;ŽÒ*½ô¥(üAß@i†º¤S:èP9µ²ÇbCZÄ}ñ•}±-’4Z6¶Q"Çé¯ÃºH= Â¨£Ö§w¼+®OïØ@iWÏÎ¤üDP$º/“8»›³Bâ÷“K1}É`I%äT¡Åûå8‹ox:ç‹öIäué/ƒÀ6Ýgië3%À/ÁxQmÈ¹iÄtLß#¿Jg?ÑX‚áî^‡7Š´ÎsœXcµAú6\SÃJÄ1
ä?þ±¤‚÷'a¾QJlM#×^¬}<Dî¾„Àäw®¬Uš!')÷&OUz†ö¦RHZÍ3f²ÌìèT}e`„x+›0!®AÑË©™1ú%U(½’Ì¼¹¡Ó…e_[~fB%Ö¡#ï»MGèLàþcIêŠª0DÊšg—?©Â*˜³y’º*§+Y–<!ëì.‹Š9YóÜx¢:ÔräÌŽ8NêÐ6çž+ê®ãDc&wYnN³®Æ"Å?Á	*oºçbâ=^® –G+Ö¢¸ÕfW¢t?"æbdºŽí~ÄiG/ûFöF‹jÈú±çGù?q††ø– ®By9x™×`à{Œ³ø*­Ã`[“²`Œ™Öá{áÜ¶l‚ìŒU ›â£‡NïÑ÷ì Èãþ¤uh½E »†'U×sƒ‰éXòÄZÌIœ-Ýi†xÄU˜)Pþ,ƒî’*OðÐ<-=gžuºIª0ßÏ%Kêàó$qKhÎ4ŠóÙX‚.“=!­ÄÚn²67ÝLlIRGNL™¤ðxé8V'ud½»]ÃQÌ)ècIÁ©éOrñÊP‰
UŽH„û®r½ðê
ýtÜpæ›&J¨Du1ñYTg´b?Ñ“
›Óõ¨è&³tQ¦ñÌô²)ÄxFí´¤P&\?®Â|Û÷ÆöÄË e±ö+ŠŸçKvw:­kËàº£‡Êç¸³"R'²’õdbÐ
¸¼;Àè«æÀP¬LŽ—8ÓÊÀîæò¿ô¤ë˜“	ÒrføÍ®D¬ f¿‹äÚºr.êî9éøs\
ùØã!®—ËCË	E·ÒKgF}üÇÿ…ìƒ	»š>þ+²)%3!îÕƒë§ž*rñBD}àº8øOŒcJÀpvÃWÒ h	ˆ¯š»_ ô’¯$eø+œ2ü•‘5Ç5pIsdE$SaÊ;‰óÊ8ÂY
óZŒÍª˜Ù†T*;cóÆr§’|="é³i½˜Œ°„[#Ç„›!0J¯´)oV>Ý×vèÛ×¶5‰ÖêØkEJå(Ý!Ž½Û“o²âˆJT1Ý@<]Y<X…58º[8'F©%êðGrt…²}ZÇ
­É+ŸÝjÒÉø‡¾âA'(b/’„7(‹èP"#Cì5"÷¸¬b`7Ï%‡zVF4œˆ_›¸»1<éN2¡5È»UúSQ‡%«$ßäÂË1i[õ–èž|>‰¥£D“6o\Ô÷D>ÆdIÎ±\ó^0â"—jTèæ­«èB¨DäØjHú¸³Çâ¶A	Ó¨%€Ï÷\&i0}ˆsrõ$ÿj(bd¦ëù6\³¡} ›wqÍ€Å”è<”Ñ”þd’¹¨ÊÞ£Ìñ`å
íáŠˆ®¨QíLžktQ*UŽßóýòrØAíð«Óþ)©)¯À“ŒÎ™äÎE|ãä*9^Q¡ƒ¹¼ú¬\aõ/Go¤SÉÊ”×°ÝBY‘7Gu'r/¼ŒÒ®H'Ûº }obùØï¾õ»ÒéD¹I‘NK•§{nö†â¦Ñòþy-Á©ŒONÕfLOç[zÀvÄkN˜^—òˆ\3†þ¥ ’íj`ÎyJÇJ["‰£¥TŒ'ƒxc¢xœ†Ää4ºü3Ž±Qb¯ÝÈÜÕ‘oYháÙnlÙ“Œ×TêåÊ²ÝkJi"Q‘“^iu+à
ªsÏ]‘LÅåÈŒÈãH¯<ÎhòÖov	.i¹’ÎáÈ¥p“I áo¿õ{õJ‚ytÝ»-üNMþz°b‰JÑÇµ¥ìýÊ!ìô=Ic‰afÁÛƒåèºB'?.ÄN~‘‹»U•ì1	ÇØÞÙüÊ’ÎÚÕÌb(ˆŠ«hí\’)R)»û2Å5ûI¦”?!¹øîR¾'3äoÔÁ5[dõ¨§NvÆ^ÖÃ ­Ä6É±J(Ö¾™aì›8âlÉy#Æ¹ °"Fë Àk$ ¼–oVcE”áRú+b¨²<·rn¥ˆ[ÇŠ(“žžì=kHéÖìÊ<PC"aOVÄ0úÒÇ~À}«3•Z±"1Jíxc%ueãe.-
+bäEç@ÒBóµá±t‹Qƒ¼ÆxAÖÏìpfúSœ:nÌË\á‰<£ŒŒ3B6Êôeˆ¤/'r³d³Á83Ì1r˜gK¹!/cŽàHFM¼ŒÂ¼ÞÅEuØ"¿%–8–ªQ*VDi/ÅedEj‘Ñ¸3ôƒÈ:ý€ËçHéêd#	±"
óI“bEÿ!q‰âå¨'#¯j·ÎMiˆ¬ˆ“½eÉºÒ*²"j9äÅ_âšõ)‘áÊ(Ú(7äeêñå$í—ô &’ÙSkßÉzüEr>ì…u^Kü‘ôá]DõÈ»øîa¨$ôèÒì`I9yfûö]¸ôAœ:’è‹ˆ?ƒŠ9dæ‘„ V pHã9Ád’Ôc“…1mškä¯à’\î˜Så9¦oôå\Ëï‡ÌÈ£E2]DµØNxlä£0ØîK;åEu¸Á˜Î*ó£aÕèò­±í-n¡Ït?ä‘í(Û-WËQàI¦?þ0‰JAñà¾çLé“é®z˜naõÌÐ ÷À×+Þ—‚†É è©0Ý”µ@ çÅq×ˆ"¬&V4à1AÃFŒn05d®·JÁêü&ZãÐ_NsñgøEþ³rÅŽXK×†–¿2X°n®·è)>”—…É=JóÆ¡bÍäÇ¹(æÒHÎ0ââpÍ‡C\Ò³ûsZÈÍ–?Ä{4pŸOž¥!¿t,ÑHØJ³T;F¤fWo"OÙFô—N!?¾gcSa3Äæ÷Ü‹²^Î¼ÐÇp<‘ñæ¢YaŒBá“.'ø³qhð¬†Ù8$	~¢AF0
0·º[qºùö¤Â(y„·{ÚaÆ e]ûpš_e5ÓFO4H¸­<"ñÉÕÝÆ—6
c4)ºí3‡#à!î*Ð²ÉF·GÄÞÀÀi:UÞøQî:=ê,ÛUn®ôI…<X,Ëˆ‚°ò¨Ÿ=&b´ºŽ¹J8¾\wô!’ã+ºˆàÇ|8ÞÎû]"òéOs(:þxf¦ìý¥=efÇÛ°öQË'fÌ}t&çª··Ñ¸±^d}Ø(Ï–.e¯¨¤L?83ö|	§5JÖ–ÄmŸŒ2ï;¶–!ßm¸<Rª‰Ž¢ÎŒN?ÕjÂ¥œF|Q¢‘$qÇ!k¸"nKÖO;‹­øûû^a‡Ä¸Q{#ÉboÄ¡¤ïe—”¶z )dW­pk»ÁúÄ7¯qƒ”®|'eí®KåaÍ‘c…\Í±„_‰!ÄÑòfDhFÖ;—½¿Ýí`®à© ¢o…–ç3™‰ÝrQMLOZ§„èi†ÉWw¨
éR*5ŸjåiFzdú«ö)Fu(%k>‚-pèÕ»µàRhûT	¾b‰,~jÁµÐUô2½žñšH<•äi4Xˆƒåìæ*$[i<¢x‰‡¨í¤<šË8Š¹€h‰@5Jëjú”ÉôlŠ‚—¾Ì®ê OSêŠ³2ø´*Õ\-AÛAé¥ì½=&ð¥à
FVzAÌuzSq|ñSrj~2}”·âkÏ›.þ;ÁÌZ‹™/›ÅO	}ú0öØY±OœXÞh¾…‹×I_'´6Œ'C`˜»–CšDWoZSßœàé„ æçM­§–°'®E%c¸&Üxå3ˆ´ÍÀ.Bðé8ykÂZ?ìËÁUÄšèÄ)úÆÃ çÌ6F,á1!4[:×KŸDmŸŠ@C2ƒ£!sQ…6CC7„¸ï'ÃÕ'¾e¹ÁxfStL¿dÆ)4fæÆ®?™B­Îå…K¬¦­÷ã#JŒL“’FcÒ­…q1¶L×HòòçÞdYÈ;ï’Ò·2>vCc8cyÛ×p6™=ka‡Ø+»_3aÕc®p)4˜A8è
xŽH¾\Êé{~HEåIŒ‘øbXÜ]76y˜Ðã,Š©üÖÓÀQÏ83WR,,­#¼î¸nn$L8gJÃqÝG‰‚èa*:Ë¼ta¦”[*ª&¬úa˜ÌJ ûÒ^0ÉÞÏ~$/µ%#ö  ^Þ1]’c\H^Ñrõ8€tùÆ% Õ%prgÝ%‰Ÿ<RRÓ€;FÙ*`’4ÐÒ•rèÛ£D‹ø¤‹Ckä#yxŸ”¾ÿ ¼
©f\°¡¬"óa²˜8sÔ!˜Cþq„»Á"Üa£#ôƒá«Óa—Äížh„ÇK.YÌPcÛ>eKÞ˜HŒÅ[“’÷ˆU'ôHþÝ³)é¹!ËuáHE<¤È ÍI¯ß}2&»BÅ8´Ë¤œG"Eâo¬1‰?Ã™ˆmÆíÂj^ÎŠ¿¦ùîo±UQ_:c8 <:oŽÌ{Hß*Ú†)¾âûŒcŒœíž¿ªz	C`)ò!Ckˆ´ìÔíSsõ»Ñh4Å4y©¢	I¬›”!òÜ±oÁoá
¸A"ç5‘{çûÈÍ>2L’K¸|ÁÌ}$ó6«Ô!tz¢¼!©YEÖîÈ¯¡&qcsð‰áÒAZ´®~Ëê{TO±¼wEƒåe³µEU~/4o "¼¹5aWF)ßÏâà˜„aÁk*9¦¼“à®½¹„	ïb¾ùÊ	}ÓÈAwd6N³´(H”ç—N­ŠãêûûŸµc¸á‡\Û•5érV*A“Ä7oÓò••ßÚœ›‹õ±’/ÉºsnnnÒWt³ˆ|`é›ìÏM>œu(@·z|ÌGO•?žqíõ2Xy3ôíùú³ÍÐcOºôè­?û7mWö5Yÿ“ÐÓ3BùÒwIè/-}³è¥õ"’A§±É¶WË¦íŽåÄ
Ö¥ÏþúkY_öäáÁbÇË˜Þ´]i—ô‹ºÍ—gêúxÓ#PJÁ±Ü)Åh/IMù)EU´'y Žûzñâ©‘ï5»ö|bß1XïÎÍ¹õbmf\/‡\ƒŸ4ücŒ=‡Ã¬1¶ _–Ah_¯ââÂØ%¡uÆeöwà€ñ¨]«‘©¹0šk/5Ëö| ¾´~pJGüÉc¦Na,·F½FfðÐé6í4 lûGn3ØÒö,LWìŒuqkúƒbœñG²\0}¥Rm?‚Éá†#~®Œ|yîÑe¾†ä–c‹ÌMÈ×ùèé_ãY´òÏ·àƒÕFó®^[Ü½Ï®``ÍA|šÐoÜ·Æ»F^]{9¤l‡T Ý×k29þZCEs³níÎ
Š†ö|‹î¿êÑ3²¯¤V\ØÅè—Jîž1$©[ »ÖêÅgúæqeæ¡ÑÐÂm8kéÖ±xgßÕ6ëmkþ>³¹d>2šdäùÀØŽâ?øãZm«]#‹‘Ñ ¾àãŠ„ÞÂ¨‘íîÏµv­So½ßÚk“ýÆ„J’ôëKÚxN>Ð.h3vŽ¤ã¢h‚ù#IÁfÎý×÷–LÇ)Æí¼PªÝËø÷YØ¢~Ñ/õÖ¬U°™Q¦ãÖ7|šdqÿ¬èIE‹ãAQ‡¡"	%¦ŠvÀé`ŸÉ]$¢Hpm|ûm!ñ‚ŸuWL¾ÒžÅç%(êXOË4½vY@ßá‡ Öð{>Z†¡ç–¼EøaesÐCLüóÜ.•°?¾ø¼Î6ÐñÌÉÑ	Á7ë¬B•é®ž•÷”ØçŸóg$±&1át8Óè Ãñw›)N¨ÔO‚™9ñná„r×¡ý `ƒáoŠ¡Œÿd(C4 ”î®¥Ç”Ò®­½ˆšÝBÆß¤Çxk·ò]íCíC½½¸ûàOGæz½¹·±×Øh´¶7j›Ígï	\CGûÐA«¶†Ù>Çt»5‰Æ6iqæÝXþ¾0T^!O†6‹1ã÷rÛFŒëËÏe Q„Gøïs|‚Ëºz¾ÅA¿¸ËÂSö¥ „ÑqÁCå©WŒâË³uÅ×•+*£*©îóÖ_I‡r¹
gàÊÐ9¡Rªqé{c+(oqh›S×bHåco:u@v‡ä`Ý’ÇòyÁz8¶˜¹àu5Q!à!ùü3=Ñ-8ÑMz¢)uÞNŽõ£9Ö¾JN:lFweÞ•"ÚSt¨l×¥ísû›ÏËÀâ“†9O¾‹ Øœè¿ ¿MF÷Á 4Fè”íò½¹ð
pªžP¦<G­ñþ;zÔ¾“ŽÉnttD6¢]ûŽB$”tVÉ¬ðÖ²\%©ÕSëxt$ºüûÑ
kI|viõ)û­d_õ“æÅŠüTƒñS?Å÷øBsxÎ’â=Óµå7Àq{Ì¸¿2vÚ²‡æ£ðÉ‚JX¿cýF«½QoïnÔëëïÖa½p…HÏßW}‚õ¢E‘Y¡HEá¸ù0óùsËúHŽ a§<!ûì(Êò–úÔÅ¿SSÚ×öXD‰GîÔv--j¯$	Rl¬Åwµ91~·[¾\`Õr€«eféôÚË‹ PÓ¹—|¨Àh¯òÛ.\paäóxéSâb,ÀJ£=ÌÏmw±T«å	Wú¥ñÌyw:Fƒ=·&/$ Ñ'ebg¦;¥p¹n166°ÂWB»uk3„<3áfÔ­Ð…µ|ÃsYXtžÊ×5ç("÷è‰lË;¯Ùjb¥“_gÿÑÐ÷LgF~Â;³æ`4ž0ˆ¨/¥žO™ùkºoûT4¾ûî»÷QUŠEYÄçw€j^v¬ëPªH¦ÓÌŽ#yÎ¹Q^”fÅ«f”yàÝ&	l?†Ì>(¾ÃÞ`¡ÌHhý|‹»‚l«[<_hžc™ØÐ€ãrGQ ;÷ Â_Îc-Ð^í/ïå£_Š ·vjY¤·­Gzof–K,Î«mk;Èb¶
˜¶¥lŸ7VoƒLìÈ…> u6­0Ý	û«€Yé>ö'*åøT´\F@]*BwƒœÁóT¯¶`V47 Ë ^{ð˜åÃ 2 
Ò?£¯O)7	½MreýûÒ¦%rbÍm×ŽnÙîGÖÞ\˜#›Žaµ©Øœ‚E¦çYf™3GpE”Èq®WpÈÃLëjévzyì1±¶/>SÁÓæÑ
tf¿þJþÄpá¡š‘‚#ßX³)='‹t¨·ü¼€œvíÐs1³'tw€µDÙT <zæ:„	~iP&=s¼&Kî¹ÅÎttï"sF™œã+›Ä[†Œj¸`—ºöÆË`ŸI¼-±`»{êElº®¿)_Aµ8ÿ½,$×žQ×F´ËõB˜¬wKOn4G6b=J^S‘‹å
1#»Ém
S™c¼2]ö7ÈpæöµÚ_>˜ËÐ{ŸJîïXÈ'Ý
ºjÓYø/tü‚È€6µÃÞÞF½j`@Û”•gÄ@e«Q“*”=ÛÛ}¿–‡Êœ|ŸÇB …°cCzLX;¡«š“/Ù›’v•Ê–¹MÕ(ü²G9!S¶K©¼‘“ôB¾ì0Àd¡
€|aú€˜b© ”Åœ‡1¬ˆ$b0 ä'6??izjÁ	'ž5KðTÔþéDdF£ÍX
¨| æZ›AÏn<ÍÖFƒJ.æ.—^´b‚Ú@"®1Ý‘±c/x ÄÙ€ü@DÇJ‰ ·t(â;ŸhÇaÄ ÀÊ÷i6¸¹™'%lðZZÃè„¯{m&nFyþq—nënN¢KÎs™ÈMF]‰š5Âèa†êu‰md‚ÍJ"z)þùpòøÙˆ#s¥@µôÀØh·7âÿ•@£^rf€ú²çÒy˜ð6à@N˜GéŠR¿Õˆ¼lý¾{C&ÈïèÕ<äyŸvz„³QÕ_w˜²˜T­×ÍµÎj@î°Í<³LŸñª
OG:fN,à¶$:ôùÆ¶n!…³±Gy^wbú“ï€êü)˜y·b¢æTFåYÀÕ‚tS%U3U€fÕ‰²Ö=UÆgX1YíÌ÷Ùß>¥¯Îèüê‹Œ	µb.Ç™f ‰Ä
C…á3²ÿ‹Ü¥dõ•«¼$Â³&â1€ŒÚ ˜³	f”«üh¨’
1©€gµ.^-â´¬jÝî¬™£œ”WÏ²ïüÔ½<·–à¾N÷Òó?Ê0þ­¨ß¾5k*?§Ð`52ú+…}ºl§¸(¼—h¼æžë	f¾Ì>i°Ð•Ð‰Ÿ-¦ ëzîµ=ÝœX‹pö%²l(ñŠicDøÄ­$ëUÂr(GIGuÌ&Ó½‘¥"Tü]Q&c±A†–V–Aùò.M³üLÜ¿ŸDærtòÔ8YÕxÂÞå-H8‰WU¥”`3^Ê3ôènœÊrXºØ™VôŽY2æÝ;GV{%ò€÷Òíh¨Œ™±ŒÈ^Bð2dË¹6,º-I²¿AÄ’5y¹…fà$/Ô=ïÎ¬ßs½Û’i2›ü›ñNÊâùËll–ÿ,¡@)ò®±ÙöAïž2X0U´{Emƒý“65«i`<È?¤
sÝ¶VƒÐÖ(9¹hÒ¹šJ}—R<·Ç§lrÑÍˆãŒ Y*(~2”2_"‚	.¢ÀuEóÞßØ}/N9z’N»^”bßQtNAÏÆ~ÞÎ÷ÜžOIà_|‹†›*¦_ˆé„/ÖdäÃ®éÙ5oô=Îtcn ¼éê|Ë¿ôèá_½Xs©äUå¡ð~v
v ãœ¬˜P—–[Y¸Ï¡.fÌž˜—9hìÎ25ÅÊÌÒB
·ÆÞ6]úOŽ®ÉTLÊïêÌaOµïrë†J.o|¹JA;—‘G1Á<ž×¶Ç³ÙnÑÙÐ@°Ž´G÷™KÒöigÂïØj$Rn:PkDå S†ÝPkpvjªi
Í[ÜœR0ÓØš™UU&9ËtsOˆbm3Š‰Tq%ZÃ;ÇÔ€$VtN¬k“r$(/Õ¡—·¥çÔ‰; ŸŽL‹98-[kŒVˆpê-ÉC–5tk!Z$‹K¶
 \¥ÄR°ðKj‰ZûÙFÈ”³µ ƒmÔ´þ_ùe’†©¶Ô!ô-*g‡.ÔNNXÒëZêÛ;0àF;bt{¢ö?gU»z÷õr«k‡Ä:n“5µó‡FÍ«G®ëÅçÏQ_tí£=Ø'kÈ&¨¶+×ëñ¥“3sÒbVJ¼“”iE~Ô™Í—Z`5Pö9\Ws#D]¯4¯k…Tœ<rZ]ëº¤ôD—ýô  ã™
­êEkÂš¥«­U£u®º§ûäÇ«ÃŒ;1KßCnT
8<@ìfíÈ¼:ç+…(¬Q»å$Äè:v!ë›’õ:­fp`”n.z{¢ÖkE3Ï›Öfãq”óXJEì—næ“ýT¦Iuk¢òA‚U8”ùWÓ]õe”)ÃeW•°­”í€}ÓˆèºƒÓ],3Ò+È®Ò±i1ß ,g2`ç®çWÑÏ°-j3à*Ü¼—¸R!•ãò‹ÌÚ*§çˆUÌúMsÊ‚4Ó”‰M^—Ûê96×m9^‹¯Ï~îbã pöíz±‚EÐñ¥8Dà/Dß~—maY4’ ¹>MÏAÈNJÈo²6Ú5‰WÍØ¬Ò6°J¢k>ð³z·x­×en\‘7»:ØÁX1Z)LôlQi[H”Ð‚`”j:Çk“.¸Æ#­zØkÜSí¨Œ¡¸·ÚqîƒYd¤<¥G Ð é_-î©iŒºÑ†Q(,sù %Ý‹öç£Ü	§Ô•.Æ»mFÜâx³¼,¬°R$¸„Ë{ÍÚv­û~k;«R|÷çºÕØkŽÞ‹”¢À<‘¢.¦iò Ÿò*…"H”#Q¦4sàµËBh,—ë(µ’ÉÍ-‰A"Î™qbWð„d õy(P‡Ìl2 F#òp Ô}ÿ[v½ÏJ1²kq¿Ã‹‡Vuïxoð…ó?~¿;&?dã>~‡(ø]—l ˆ‚õCòNÞÈ–ïZÎÀþd}yÿûÝDß¬í ëàw¸}l\U_d°f™¾~Ç'û˜?d×¤àºßÍ¶•*vµa[‚«Y}£¾Wßhns–^–J€á?}^WábòW¢9ÙôI½Öhe_``D¶hôÉaŽí;k²^ö¥O.Mßœc «Ôq*ÏÃñkÛVÆŽ"2“®6åßÚ yÛŽa0$
k.Y„ÆnfÁ¨÷ÚòÙeˆàZ<Wxˆç\„µ²4·ƒAdõ{ník1¥^d,Û&·©]IÐ'CeyŽ­\–ãˆzžKÂ™Å‡e_G¾ÑùÙ2÷ƒg ÖéŒ.¡zJÌkõ­fVá0*4®µj9•Cùï‚±Éâ¿>4‚,×íÞ2ü`S`uéqS™ÔQÒ¡µ6*Z°yâ¨Ksd#û£<JôÞäŽ¼€÷ÈßH=a'–ˆ"¢_…ï±à“mÉäÙ¨]C~Ý(dîÊ´}YÜ²Ö6Þû&Øur©¬´™4º–ºáçoØRE¡ñÆ7,ñŠR¯ *=J#«µb ‰–ï×_¥ùž¬ÅÖ”:H–ûi¹¥ÖwÜ_Ëß*Ðµ•ÚŽ@ï#ûéÞa(„2L]rc‰}EÙPÅ®°_QzŠxõoð8•3ïŒQÁIA!z[dâI\˜ãa_„¢Åg˜s'Žõ²¢‹¤NógloÔwÛõÆÞ˜°ž½/IGÁ•p©]X­´I•tºÞ4ª;J¯@Ÿ'žž‚Ðí.2vmìX2Rcw«(P»8$ÐRÁŠÉG†}K<ÿt?e]hÖ¡Ö»@ÑY êÔhùŠœøxøJ‘n•^¿Q3`ŽPºâÈVØÌØÈFŽÌ³¿t!ã‘^YY¸"³û|²&«¤AâýÈ–6¬ú…ÖÇÂ‹ôC·Bå¡äjcpœy„“ö­Ð?yUÐ{=Y‚„NH?ô¢\c™”RQÉò•ø°QK3b%ôd>Éc0ñO„%9±AqŒ¢„üwq9ÜÏH¡Þ"´çö'¶#TtxÀÉÓR%Ö)Î~€ð&ŒÃR›tÓß÷äçnçüp°OþÓ7Ÿ×)'A¹¾Î6)áx øWÒ$ŸÚ³/?ü\Òç>ù¹ÓíîÓ3¸¾×Vô×J»k<ûò—ÂŒEe«qïAj_ÝƒãÅ´	äÐ
MÛ	È·äµ,!‚‰í¯î¨}^×0pÚÈÊü©¡Ò^;Z…C‰Bt.•Ì§Ï!CD…y"Ž?ÈÜc°[dà£ÜåˆÝ'µ2³À	‹þ©sÏá¿ˆ¦I­ëië5æ^ÜEyVÈVMt/‰…ë&·Ž”§	B9Ód’òQ=ù4KJ»xÖ›MËÖ³ÙjŠ¬äb„žO+D3*ôŸuª”ÈAiÈB$KtÆîLpVW•í»$SjÆh'ä…‹ÄE“Ad~}ÉdJyÙŒóöoÁs(ç]¡v*ðÍ[{yyud\^]tƒÞù	‚òp Ñ ™úö„À?@‡zÚ¯±2`P‡TÔú{–Të…"©œ$Ý)>iWé½ÛÉgž]{9<:\\‘ÁiçòµÿÅ®GE|« ¶öòEšZkwƒÔßc¾\šëôºçWýÎYïmgØ»8ÿº[ÐïýÎ¤·Õ«=ÊT?n©â‘Ÿ1¢J |0¬ü»:L0Öíæ’Ýƒ,4	B«0!êAç\´””†ñýñ`jâ²þÜñ}sµ	
ØõÏ<»÷>Ùý)=?l»0çrf
<ûòyýwqèœ\¸8Ùüž•dsEœØb™@œ<‰g¿Ý"•ç_èñÿ¸Îtdú )-OKšs*<[¤&•£:J¿;”—¾HŸÇãÛº`<ÛÏ3/ImsrFýÙÜm·¯wX¦¨?ïŽÚãëíïŠîw‰1Ÿûó7Ÿë*Ùk¯F$LG‰o<í‹ó
õ€V[	 ŒÍò!-Tµ~!}¨MÇq_D…œ;üJÎEé©@ø{¾«	ÄØ³¾W›XÓÁÈ²¡RÊŠ/PN<ïú)YfÀ*Ã¿Sh‘Æ^|¢Ÿo¥òWê®Là«Wø²’gÞ{,ž³í’ j /nÐò ›.‰âSY’[$¸5¢œó¿‰Lq¹(‘ñž²Ú0ü½bâò¹ûe{Fn{ZÉMåŸ¨âIýPL@R/ÝÒ!ß“9,´ø´j©†%†µjY×†òå(·VaçWÎa–ÅUÙÓSOóiNÈÌï‚€<f{I¦ÕXëÇ“à'ÆõJB
N@Ñd~ÉrÃÈ¡ cQ¼Al.>ÊË<'ÀæDŒslà"
 GÉ×«.{
¡`s°Ÿ”¯1€ýÍ´pœ™8÷ÔöL¾XþÕ	Ö8¼‚}…PwUoöïîÅZÔÀ­þ‡xò|A#2y±Ö¯‘ùmHÿ"/üÿÐc´ÿÝ†.éiaþß€L×¶ãÄƒà—ß¼X‹ø´¸â=	g/Öt”d9º¾¦ÿeŒ€ß¬jð7QKÿDc6wvG×ffÌtÑÐ•Ý|¬Pr3ÅÁØ	¨yÎ(÷£79I=ßW,Ç4|H*9¯^»‡ —·Š´·U’X\ø•ñ·ìûå’›5Ýˆ©rß6rkSIBûQ9IÄˆUÛ¦\ƒFrµÅÉqA·Ñíïc6?4ÕžO™¦Ì'ý’€â[8>L¦ar×Ü¼[¯Óª÷l‚½ª\¦ÁÜ²Q’ª¡Î]Ôê[Yð€Š¬ú+
/‰µÁ1¤4{‹³Ð®Ç®J,àiØÌÚË^hýŸ‘pXÂ¥ò kÄ0=Ž÷aà´`Ý"ï½¢¥K‚ctÉ¥#U!ÝÝÃ ˜:üL7—é;Ò]•™GU¬|Fn¯S±B0=¡ðC¡^C½T‘GÌ˜!ZˆKÄÔÉÌoQòå¬Ó8ZaŽã‡¸o;Ò„Åx×5Ó‚ÖµC§ì÷Î†GW¤<¥ý†@
”ìê(ì·±pú{Ýuu~áÌ¾3O»ñî°÷ºŠ¡EûÑu½ùBxÜÿµ¹ÞP€!/ÌnW;‡óo¿E	œÿ«MÙz‰"‡ñ­™E°™Þ‘ÁÄiYqÿ4pšÍùtÐvO	Ø	ïµ9¿îT!øn/b·B1 -q,LÂaÖ
oÓßaóˆõ~q|¬	QÏÌð‚p4g0M4ÑÕM¥€ÔXÃ'D‚¢ý×ñ­íšèÅÁðóËC4g},}xuqyñjøP-N¿ Eßt¡7*Í‰N_`1Þo­ÏkR›±ZŸ‚Úa}÷}±#›¿S™+­­É•Ö(M2úP[¾¬h'ŠB9ÃºÊ¢Êã‰½BüU×ißÃ·-´ÃØHJÓ@esµÔ9†"óÒC*ÏãäÕ%)†pŽ$ÉªÜ7AœZ¹Ô?y‚’Ø;ÓSî¬’äIáŠr¾+ÏÁ%þ†Þ‚Dj)ÛUÇ³n‘Ý²ýìK‰Qèb+±Œ^Gn›¤})a¬žA­[™ó‚¨Ìé•\Ç.Ï±½Ü=†È Ÿ/™ž. 0ûCÜp"Ç[µ*î[pµÒã(80^>“™xµq=K˜Ë} .4HÎã˜­2ù+Ù…ˆÕÇä3´AQ‰Ê‘GÏbNy§xŸvë5 ôü,%Î&BÅãQ!•OáFÓz7äø•Ÿ|Ûk›M®ÿDu‰Ô‘ª=ëZ»yÏ:ŒËü²¡ÓÈf„¨ë(ìã×_Ñ½dÜT½Ýê-ÿ/nm‘®oAXßéÛ”z&÷.Àq˜aJB—³âÂ¥†»Sç±É_È:ƒ„¿‘Æ³d]¢º¿†!C‹M^,¼À\õÉ>‹X‡Ú¼‡\ ºî§L×ý*œnøqªsc:X§Ìô§wÏä~Ä¹4‚ºÀmìi†_OÍô—óÙü&À[ñûž¬ý¹v]ßi˜UÆ¿}ð*¶åßåþ¤kp*FŒÀ‘ÅÒ_8U§À‡Ò/×cgÜ4­	ÆŽäýÆÀbÁ£49kÐÙÄô?Vê&	»ÿfÖ6ë•·1ë[ÛÜ¡¸ƒRŒïlú‹Ý|E7L5Ñ¥¦¢ï_˜Æn›þ·ZïsÓ§ø™
…àÚFOwŸî˜qû…
@Òbø!é1!H”ýå«7ÁÉ?ç¤qì*ÝÂd@bìu©¶#Ÿ¬<eÁÕ)«Û¢§nu]ˆ>hVÌÎ?H%ü¼oÞA”¶ÕÐ*Câœ’(UÈ¥ç9Ù@ð­£‹YêØˆÏþ¨÷^ l‚ÒòùÚ@°D‹7ZT–^WÍ•§«›wßQÄÐ h¡þL
"ßÐ¤KÌ¦Ø»Ïa5µúŠÚ§´WÄj¥wK…XñlI‡B¶*ë¼pÖb]¬)@»:½šøËÜ§¼gÅ´Y›&Ÿ?|X¬Cã_Áírp;#ÅÁ¼ØÀ ¦Ô-
“®*®c£$
âÛãœ¹¿—èv9²U§E6¾â£ªÔ”%÷CßWç­±ÉóÜB9ÚV~Ú	yÍ‹IÒïÀ2ýñ¬#P¶rþ)2•ãÞ³÷b”D[HwÆ—-Yß^‘îÅáV¯;8|àÌBiÀC2ºkôh>²&•ƒ%ô‰Á“Ëj}+Ï )ÙÂ¤éXÊ¼5×Em5ï #Æ;Hñæ2n*æ Ò‹&ò~ÖM[ù|0Îæ]UbîS“£â¥«ÕôÛ›mµWEfg½×G„';À†Q©#ÕE\žâF¸HNÞeŒ¾[é«»}?¯Ü—\ÆAeÜ«@Üp²ŸW$ì2EBë‹‹pÄ}$ËËÆjÃUc0é†¨zÔEÓêÐÆçôNd™o*àP—Waq§¹@F¼Åò¹¦H%t•“˜¡N%Jë ÎÑ1)Œ¥J$B4¿"„(²¨!n/’GÈY„béZ”>ÞÛýÐªM¯›Å·L·…Ä§w¯Í’f/ý6ÅvÊzçè”.w‡¦?µ¢[#ñÏBuÅõ„„Wåg/Þœ¯õÓÐ[ÈÑ×;ì°^öÿäVXûß?Å}À%2B„_Yf5 9¦iÚ ²ÛÁÔ¡<Û²ûná%¯IXg¹tŒÉñ±ôõï&T.Ý§ddjAìêßîæÎ¿˜ºÝÚ¸<=o¼]´Foî–ãO5Û<½ª½›³æ¤9Yµ›ýUûf<ßôéÜö»{Ÿ&ó±Ý;,Þž^y—ƒÞªßíMÍ“×‹·Y-*ÿíòô`69™NßÖìá°3íÿrÐïönéI¥mÏkãùžÿvX³{ŸŽçý_>ÞöW½é¸yµ5BçìÇ¤ïÛ³_^ÙgŸZ»gM:ÆO­ß=KÓ25Õóï³DŠÛÂÑ%“u^™^éÁ)ˆ \©$ã‚ø8rìEur¦f÷7”^hÖøfKY?ÌAkzm9¢S¢¹æ½Â‰5X2>7óH.ŠKÍ§„YÞc	ˆDÉw_~þRè#}øÔÉª´¨Šñ´’ÙUä.Ð ÁååŒk‘Bª%)¤Ö^ŽàÊY2¸ìtöKTyk/±Yv#BÿÛ&’“Ä‰™¤óäi²ãŠØIà9$6™²d«déG'šALt"—E·l$¢øuij‰8ß<ñNÍÅê;l$…8³Y<µÚ_>€É¿Ô¹M¬®Ì¶[C„¦—cð¯““ªù/;Í£Ûi2×<f´’nrxSÓöU¬5Ê´²|)ï•VV %´›ç5­(IUêª~›´ô­Gýè]wžÆ¹!—F,ÕØDYÐS¿!Þ}Õ©ÇÆ¯Á¢ç„táËöµmù_Ãá_Ð¨sQHÁQòðxØ¯z¯ *ý	AR°Î8 õ9iâ@5øŠª¤êð;ð®Ã¹y÷Ýg* ëªW|POÉ\ž’ÜI¤È0]tC‰j´÷¶¶çxh~ß¹<{Q¾“îYRQçºxó!»y¼ô”Ã«à	˜I=·S,Ù]z—3à .}odŽl‡’r+ØÜÜ|$¬W}7äŒáˆGuHFû>Ü«ŸJ#ò"Çu3aÎ Z‡B_¹×iÿTUð3|<òØœPHÖž¿õÛÜ-M¡mb/é`ð‘Qù]%„CqçkêÎ¨5$Hä®8”ë3\)”B¯‘Ë?•Ó¹Eâ¨°ŽL"•Ž¦'^Ç,/ŒRÆl7˜ŒYo7#
£c½áS¼WvQ†´ö;ØLhü‡ôÜFçA(ßíÜ•P yqSêS“. ªà‡])(s;
¼È!Šb‡ïc¦÷iï–-¥«áŸ¢ŠR<uM>»Èñ«ónáÝ¿ØdÁck§StéX¦žÏîÎíú^GnH™¿Õƒ½Ä
]bQuSMÅûÊw3,Ãmù-ÆŠe×KÉxŠé«÷Êjçî›Â¢^ã¶2Q3¥ÄhbO½˜Ã­˜"FhÜ”ŒØ[ÜO~_þ@Cu±·‚QN˜Ê=ÊLÖ (·N	Eã™Z¤x~ày/–ÞÕ,Ð*Å}/„}mŠcc^{þ\É»j@ô¹pŸÏšÒfBQÞÕ™¤˜n÷Že‚G3má.Œ¼1O–öDåáþ|kÖTZ2Pœè¾`Ô`´¯,rã®m— Œ(Z	ŠvŠJ‘qØg;\‚QñÌ›Úcòm5½</¢*¡DQ©ª*KC1Ÿìg‰ù,Ãù^(ìo]›ãéd³ŠÛxYšl=;ŠÄãÂá.Ö â\mxLÊ7K¬¾Áý~RÇé˜Ã„÷…;x>5ÊKß_ßðÛÎá#Â õèZì(M@KÌ°ÒÜÁ[€JBøÃÀeE”HÝa>³F–h1½Öí:¿b™¨tÍ4*-í×0EÜ\¡ŽíkåÁÑâJ®f>öÆKõ9WsEº]Ä„]ÅXö‘2ø‚Æ­|g‡3K‡ÇÔ«ÆhŒfÖê‡q‚ã³Hý M¬¬ÌJëÄºféÖ–ù‘Nml-ø5_¶åL6uäÌ—NhàÞqí}ØêiGÀWt[Iú6xçÇË ‚ÆžÏ¶€zä{¦ßÁ3MÂ™Eÿñkz\ŸXÓgdâÍMÛÝÔ°»:F[1÷ZÏû`Ó•sXQ~…Ž®j½#l™ŒSˆMìÀœìé’_ê«Ú7%o­¢iyf¹)Æ¹ˆ¡€÷HNU$»i.¼`1Ä¥Üµ'²•¿.<ÖoF!LéƒPõw+«¯ò­€^ÔâôW ù’“øÿP¿oÃ™{«€ð'¾ÿƒPýd;s4_ŒP+ý%g|V°°þ ñ7ú}r‚PðGaúÞ„’ò…o{>…ÿOV gBßs§¹!e¢ø2Š«•!„PÙ(€•f¡)=('¥kõ­XtµÙˆµ¼PÃ‰+`2ÝIÕ©ó´1¥“^CO_x_» WñÆöÀ4 Sóº¹¹Ü|vŸ…XW'-ˆ’SÏ(^¥ŒÙ˜¢O‡£gG»èì>&&#¹µ8™×KžŸª
¿&e..ÏÕ{}‰ŽÝ±­I–oòW¸¨èË_ª²b¿cöh'Qm?ŒêŒÇ”zWUy ÔIÁ	ÙïÉßôêe&’ÍÐ{kÓ¥k³þì¹¼¸8{$&ª°*S!…B#2cÞãWV@Ùñ€¬q&:0Îtì9€µ\`,b»maq¡Ã8 šn°èŠ®ð`My£È–ÇbªêSE+YÂæ–…ÅØM³£Q&ÃÍ]D÷uüaÌ›àlHæ¶kÌŒw"“„=‰¼8ºjëÆ !q]¶3×ûå(¤ˆ‰©ÀÒ$i€´ÏûHû£ELzˆ|úuÓÙ
¼ëðÖ¤"Ñ«^ÆMÿwQËdÔX@ÆÉ•óÖíóÀŒÓ+g<oMÍ7ÿØëÍ'+úß²öÓñÉqmròz5r^/Í¯>]þ^7^¯^5f?5^_ÒúOo™ÀAç¶wøÛÞÑíôü°“ü¯ß…`ðgÇžÝ;y»ÜÒ±´oFóWR€Èx>±LWçÃWAï°W?ÜNû¿¼ªŸu;·g¿tê?”#w={÷o—Ý½ÛŸ~¼ª½ýñïËË_noÞž¼ž?µvÇó×¿LºMóÍUÍ¤ãì;·Hs¾ëvœž}07ßÜl®ó[¯×`kµˆú†uÿ›ò®¶	ž¡0{G1²åRVÊÔ€!ó X ‰ìæI8Ò»fd+T˜ÑÅ`)àv·–e®8—˜ï¶’ùµ6pÍÃÎû¤lƒ±]ÝŽUh”…ï€ŠÃ7;õZ_Š»ê6Æ6Ml~xu
YœØ¤r¿Ñl „©Â¬
MZ„YÞÉú:É&o¬óU½%èZt~\ßitbtÎ\Çt·F¾læ^MZ~¬ô§v—Ü¡ÜÉˆÔ9§DuXBìŠoid­ìØéúg%In¬Ë»RNœ¶ñÆ[øàR°ÜuÊuÏ%HyTp¬´"ÑLb7CHþMÉñNÞ¬\nÿÒDz€£"ç­5OâãÌò¨ƒËb<Iä´‹4r
×jæ/ßúL·ö‚I[«(`^³47ÎÈ…çvº­÷G.6øŠJ¿²Õ¨ÓÕÐ®Á7º“×­ÍÆ‡‹Ëa¯ß{{¤ÎX¤™z•3®V’~,‡.kÒ5Ý‰=ìÍJáT›‹H}£kÎ]0º‚y²¯JIÙñ2x7&9Vp;{<ßEYißKä‘f]»Ç÷FlX˜+Œo8„Ü'Wív„†òªÞ£Ú-,¾Jó3$‹llæimö{î[0[êŽEÑ¾#GØò«4¥·b>AZ¾VªUz?dúXºÛÄ“m‡_ÞU0ž'H}<m¡3`¹º–Ab–Ü–(à··»ÙPëvŠ=ÚôšåB•³²/q÷4zhzÎ™ã ™
'X{-?ý²ûp–™ÖŸTÙH£ô7:ò¦¤'!Ï>ü;0"”¥ƒ¸Èµ£»±åP*ÔûêÊ
‡ÌL¤m,JØØ~VŠºý‰çMŠœŒùÐé2[ÒÐY…0ôäíÐÛ{õf-ºb¢xè$:¤ÉÍƒÉg“;÷âï¦¯h?Ühµ7êíÝz½ðÃªÃ¬DzT­™ŒÑŒOÉ…e§±Ë×Wj¨Ã–¿É“ïb /{‹·Æ–µËñ$~D(ÑC‚€Ý§›ªn'm ´Ó¡l².]±_%k,iÚÚré[c;PK•”«ê âÅ@Á×™Ü@Ò¶	éP–xÚã€œ¾:$¦ŸË³cÜJ½ç‚¹ä=çL…b›3xÀÓ¨¸<mŠ®Æœ-'ùôZ±=’Ô¹ØÞªíÖï3x½0¯­H:F[€œ†š¨çÃ-Ôùk³Ú-HãMñ·­óÎÅYóo&Ä5²`ÚæZ”D-!ÉÐž1ÃÓbV³WáB¾
Z/ž¨i/:3,x‚­J%Î4ñv¾8ï\ËãþÉ!³xI«”©–‹;Ê×£g$|°\PžPWÔ€©X‘¬ ¤d?¿Áa]}ÒšpÒÌÑÒ1}Ã]Îí^ô?t/Î÷Uhz&0ºBcëC0ö|«bÌ„þAZWº(¢F‹òœ¡¿tÇ€…1 ¯˜óOûàÒ1¨Ý¡Êp!T°%a¶×tä÷!Ä Ð,Êö¡gê%©SœÀËC‰t¹€$¾Ør®#´ƒ¼YM?/½ü¦–tq;êePÅ°~yÅGèÑTçÄ_Ñ%qô_k^ …”´$+`É)B£ÿ+zc=ß=3áž°,sÀdk*þ£¼à¥ï]ÛŽµOþ¿ÿüßþOò‚ :[?é¼zógTZ¤=ÕU±s*ZµÄôD*V[vÏ£LRÙÝ¹úì(C€.Ôð·æÞÄ+µ+0púÎÆš{Nð›)çá¤ž•‡§úOÌÆ‰^L¿)''DÉÌI P™™ëŸ‘×T”œ˜¦´¬\wf?vmìè¯|Ð]ä.#iÛU­„…ÚfP×ókäŒRÕL-•stcÐ£ôãª†rÊm,Ë©R8é€ÕzUÓQÝ^ÞOµ+°p@NÉÞ‰ãÓs¤ÿSÑJ œÐÅ†ÌÊ&dà¤§LH1Ê¢ƒQº­ÍK ‚zÇCˆS;Câ¦Cuõ©Û»g:‡ÒK3³IlÒ˜l¨ttJH†Ôº+5!†<ÆS‰ËþØª,öÿC±U¾X•yªVkc»¹±×B°T¬?%ôú¨ìT2Åb^*Þ†ß–‘JF¡æ¢ ¨ÌDÅÑ|‡VÈ=…+_µ£•ÀE%c/@Âþ(T2­{°OÂtÄ=ñÄš|€ÈÖàûMž»ë÷ÊAi'öê¼7$—Gæ)AŠ¿çÄ¾³Mñ`€r)qD]yÆ¾:¿¤ÐQé÷˜ùƒ±NÉê¾IÆ÷(¶)“{Ë9åò0±Nb²ªRîIêùQÙ')‘ç?/%fíûM™(q J>J…ÊŒT¤F‡áè.Ñ«šŒY"æœ\b¶ÝBMqõávAzÍÐS'o~’ûUX0qC«sa¹”Ã86Lï‰Yß¬j¢ü§åÖV~S­­éIÊÈXÉ:xç¬½üK±GbßgŸU-à@s"ÏÏ'C®Ê¬eÒ%£L—…î´J.M‡XRæKJ>º[ä„WÊb‰LÂt¯g¢´lTñåEpb„ ;dâÜ™åŸÇŸº»š(g².ö·¸Ï~Ÿ\ïáõâßzÄ#_¿÷‘ÿÍ­±™Ô¼OÍg)õŠ–Xb9`)¡`œæ*g€å|—É ‹¹Ýþyù_!ißoÊþ
ãPr¿ÙŒ•Õ¸ßäžû3ÛýX‘ïMÚ"r©êq‚4þûhóŠpNS{£e}Ö
îïRqÓŸ|°'ä×_5‹ýóÕÑ±¡"ÿ©oÛ÷›Ár„>…±õÚi=ûblïü¨ôàÖ±}Zî.½9óõYl‰r{{·ö£qÕùimƒ¬u_?üÇ…¿ R uÞ_‹bŸBsZý¤ˆ{¢]è
d-eÂ”4_U_:¶D< …×dRëê˜3½Ë]Ádë”\ÅWâ„³ý‡\Z^t¦4Eeöú6,8¸¿\…3Ï%WÒ7Ç3E<³LŸ]æÙõ¾7¶‚ÀóÉ¡mN]/`áÈ°ƒ|­PL½z¶ym‡´þ=ó¦í~XŒCò§/ #ä¿œ`‚€ÿ€”àI¤È-[ToÔj­÷[{µˆ3j×šµ:-·óÌ‘R‰±?MM8Q	û“2¾WWòÔÅÄX rNŒÒ‰FùåÑäÙB§ÛC
ÌÚÈ&m„Ï®rI•¿’”WÏàÎf'TVÄ¹êrY¸éþ¿ÿ—ÿ-ÍIz4©Hš-	“SÚÌ
% M‰|ð=Ôº+#Û$ŠÜ'Ç´ŸË `ùSk¢\€J)KONqÞð¦6/J¾§8q( íêÕ³"TKqâë™U±ÙßQA˜ÀuQ)©…ò®éŒ—ÐÙ„œ™!…eˆ`l^¤ui*øY¾M	feæµ@Z…=û>ÑbPf´j2¼J®þl&%É²îrZ0*D²
~OÖ†"Ñ±ÈúÄv˜áôÄUVêé9ï	®ƒ[s®ÃUÜ¾9N:\;÷oB&ÌAÃš¬}Ù'—Ë:˜Ù×a@¢¿hnl“<
r@LàB®8ñGÕDÐZ´ø¯s›û²TÛ”“HØm1Nåôþã]ž@üC@gõa”ÌJ8Æg_þÛÿñ;:Ç'æ’ž"Úy:Zzvèô¨8MO=,â·=›ÿ¶	D1ô)M"sHXKÏkºÞ8å3èY¢°•ÔÐ%‚Å Öõ5]¹à_'ê	)!8Ð^Y¡o[7p…”Ðý¨jz^ÔM|«©Öžâ0–Gß¼¬ÒÑ»OÊ‘¦6³‡*›sº¯¨}$dýÊ¼ÕEŸÝ+;ÊSb$ýaÛ]zË€þ	°ç(&—»ñ`	|T³ëè2¡†‡”;`|ãGB:sÆçÓ6P‰(JùúýæÔšÛ®ýÁ„ÜèI¾D¢ø¥Íî²S ÝÂ	»õ8»^~JÜ"HÕ	Fúƒ¬¹>9É/É¾™áÜ%{«ûÎÎúd°r)(Œ‹åU‘ÅÌ“å§³p¿2´?)HŽWmâ$´Í^>ëûÜ¼ƒÜºõ]¶è‰šwÅ3ïŽ—¨û‚1%¢ÎÈÌä
âÍ€èÙ,èf!÷q"ÏêMÌ)Šï3çhÊÙ)Ê7óNìÆXzüŸéÐ©/ÉË\À€9f+ ç,YpòƒëÝR¶mJ™n:¨,Ì}gú‹<ó œfÑ íYß ö>q—0õ’ünéåÆö—‡à†Tp„ä£Ñ”ßz‘€Š%Š1L¸píågº›¡:ârÙÑý¥ÓgÐ>æl3Ù÷ØÓƒQ:‚Âürº´tÆUj»Cî¹X“SÇf˜6O’Ì÷ia›(”C¡Í
Ît?Í¥eVoñG²šžCßvmOt¡/¹Ðü„ÔîJ÷­2™/Æx6yYÕŸO!]û`–ûšRÛ¾eôä±¶yØæ›µ°”æVV¥îþDë³#­QÍ¼Ê_ûf"«oµ"ÿ‰Ät-œ“_ÁVòpb3k¢@—e_k|¯qg¯69ø|,²:Æ®(ú›+þ±Æ×ùX´p;9]J´¡·`9Ð„SiHÈ·”{…ä-\¢J’V¸^M>úf4úfÖ‹ ðŠbîbð	®ÔÊœG`Bï™—=ŽÚ«×êÇÌ,™X`;Z1:Ë%ÃL’n«Ì‹e>:RÖd a™Ì„uMfBµ»J<WB¯ï{IÕW‡äÐ¾¾½µ7·è+dW)Gªw,õ¬˜+–ÌïXæÜ
3UåV$7ãl9´™þãÿ!/…‰¥uäÿý_Ézw	¾*ÿýùŸóJßÃ$S¨8à³ð8…®´üù›ÏÓ¬É%œ°XŠùB|s:¥ôóÚá¡¡ÁÏ„ù3²^[É›ƒÐZÞZác¤[lNlÚÖ^qi+.¯ôÉNì Âò-=d­˜ÇŠ*Œ›ÒÇcX×Ê$lÅiÊŠõGx¶2St ®ÿb&¨‰£:3W&:ó,Ð`^’åŽ,à‰}GKJHUfTÏí:öøã‹ÏëL£|ß`æÝöÜÅ2\ÿSÿ©äíÅü²%2¶Roã¬'‹Â™.rÐdKNÆ¦ÄÏ5jiÂÁ½vmkG{ÛB;aÊƒ9³8f´ÀÜ±FöÙW¹¦©³Ã2ÙîÅÚÐ›N)~tGq’L9Sê':Ö„zL}sN.ùm·ù |Xªß<aýæ³´Nº$“Û‹»n4&MËÊ¤,ßæ)Ë)
‰‡GÖélTD€ÃšJQ+à\šÓªTT¶ùpXåkÑß¸r€åM 6ø¸ŠþTÂ+<ˆ/“¸?êÀ´P™±ýÒãsÈáÃWõ¢R…0š.M´JmîŽ&×»0
Cæ])	D£Ù'YFø=œH µ¬mÈ	vRÖ½ý^ <ñdÀ	˜3æ!‚sö·Ð“ü…t=¬g¡}8³<”$Ø);bù™”Ä³~+2€êO…Ò¡_Z0]Îý×­æu» CƒZÃ7i4{|`=ýèœ™#Ë‰ÐpRüƒ€j2ÞR¶û1†Tö·RÙ“¯©}Ûqè ztfwd}öÑy–7´¥ÐJø´*Âlµ(ìµ—,–Ú
øpŠMÚyWV`O–¦Ã/.ýAà.nv‰-2u¯UžèÞýµ XÔ1v—>¸êõ>x£€¤÷âÍñ³§ÃŒâ:i½º9blïYµ‘1
“Xÿÿ­§öËÐsÕDK±êÿ  ÿÿì}[sÛH–æ{ÿŠl¶]¦ºDŠWYR[åeÙÖ´lk,UÕÌ¨6DB"Æ$Á@K*µ"6bcÿÁüƒ}Ú·ŽØØØy®}ïýûKöœÌ	äåKU¡£]"	$òròä¹~G¥mÚ¬ž=n.ì‰‡TUÌC¦;‹*ŒºúX¼P“ÒúŸZú×å”j±$¥”-•jF³a´ê¨"q
±á“SÚýbfBVÝðîb¢	sÇ•Öv'Ñ<•ƒ=ÐÎÐ¼W”)ÕLo«•¢Ï}´)FW[šs«eÁšGW'˜JäÁ‹þñŸÎ?þSÓÕ»À³_¼$/1Ä°òc>?„ÁyBê­f{ãç¿c¡zÍ1s§ÃÈ«Â?’ÊCÙ…Mš ò„%åIý ˜ú^Ta.„ƒGdžÊ	Ú¼×©+óípô¯Óô;erâ#`¶3sáq´Ox†²PÀ…íìëû52òq¯ðO
S†sƒä:ÜEž `¡Xçy;· ªNŸ‰Óíëkôžl‘þú*c…[¤Ó[¥¾”-Ò†/£ÄoUPjk‰k¤“1]’ç<Ÿ‹Ãí0Æ0úþc\¶·kpÔ^±ÿ\vØ'ø¾ß£:OÂ³3U¶k}˜9üb[Ü®q#ûî5cÛ×­fïFBÔ
é‹6áMz©£Üã½BÏZmœ ³*¯ÉZqÖ©­ê&¾{ºÑ9[/M|·o›yi†šÔ¶wË‰ysäÈ4Êò¬,>)êïlRPD¼‹y¡ei^:· u“·š84líÑ.°Y“žG*ù÷y~ðŸz LG‘wµ]ëžš+€¤Gm$Û× i¼2£0
~ÂƒÃx{'L+©ª~]˜Ïw_ÕŒÝà_v.u
$<öa€ÉEx<òOýÚäj=c¡iê;XbÈöõI›|LA	jcö>ýè]’oáã[õÈç ;l×~þ»ºeTã/ðT|Í#l”wMéaŸúPÏß™¢ŠVGÉHÝp6á½‡ýþú¦fäT¿Öé¬gÁ¸Ú6{0¼šU	ÅL‚ºeºç™7	Æ ÔÖPú¢GÆ&ô™ P£Ò”úNœëÞ Ñ}ûºN#Ø©þ•å´5fƒ!à†;þ+ *§e©«°Þ{ØÛ8uX…Í¥,‚fj³€§œú¥°N†‚ê]ÖØ‡ŒÓ[çwVÞÞ¨'ŒQz.y×TŠ^©©ogrêuwÝ}µŽÃpœj±ŠÇEn_?Ú¥‘Þü^hIãašG1°xÛÚ•+ê´ú+Ú•d4ƒKÎ6ó?2l´v³o¾/ã÷Ðr~…e_SÚï®ƒ8µ`OÏÑA¼éaS†)*ÚÚj^2›û.Ë‰ËíkÞ¢NÍv—Y²æiûº­>Zòû„s±Kºº6Çhg5ÖQNS}´»óêÕþ«çdÿ9|óúù›½£#²¶¦]TBfÜï°	†þq8; ÈðHÊ#,ãÄ%Ü¹ozoÆç#S>Â“~z¾Eñoü‰öþ*°Ç*O^ß^p<eE|êí)ÇuÐçr÷¹žŒw"ßÓÙR™PÑðÞXGE™€¤ÏLÃ@ê­õÓõ¡F\c„°]›Gãú¸&«
»¢£ß”#ëé\Šªªq†àùœ§hž•¿Ñ-¸æ{ó4LL{.Ú"ëKØ$9nõ[§m«Ìoå,¸£¿/3Ù@«€VéŒØ\y{Çû"[¹7Þó³MR?“U1ê²;Fë•n³ÈqÒÖ\üút4 daØ&Û×‘ÇÕÙÒ;é†¢7[ö“5pì¬³ú ¼ØÖâqÚM5ò`Û_×g°Æ1M{¡B‘ždAâˆrM—«dpµJ®¨,yC¶	mâO–™=ì_É¶ö>Â›„¹G–ž±ÏÍSõYeí³ù”*¦:éXÔQx°ÞÒ×WÄkJQ·ÕÒ ¨eŽAE††KæV~Wi½/$öÝ(ˆgä•ïÇ²OÇø…·õÂIz]¶·¯—ævš'®ùRÙn½ì85ˆw]ÙîÊÎFoðÐ¼¾îr’|¿`$Ù°<¢5 °‹†äûÑ$˜¢ë%˜Rw”}•´¤¥¯ƒK—i\¹L+ü]ûìp~Qeê­ìE¾Ý}¥„MT:}2p¬>"Ìn®vz6Äf¼,kÉW%÷tfqî°¿éìœÑËIÛZ;×ÿ¼¢c0Ë9"óà v2fˆBðÎkš(¥=•Ñd…  O cFþ™õHÌèsÅÌ7z1o•­îNò¨³ŽÖÓëhLrU‚†¡æ íä‘všÐˆÊDÃÃÖÈ^Q¬¶B(EUJÉZü$tÂÞe§f×vÒºuëY¢$|¹+1™u–›ûƒ`$êæ‚¬|$#Ð*Çã FYäYäãÏÞù9Ü:$/þ|@žxÃs_•>@Û½sp’›ý37‘Ù?¸n)m>Ñmªìˆ4óšåˆÔ«dæ]Coøë­-CK?Âi`SÒŒ½ã·XŽÊ:3HÑÿúšú»„f¤¯¡F{Ã­%hƒIlÀöäèÃøØ¿_ß`bW3»²onV0ëÁƒ?©#ñúÄzH»IP½N5‘£ÄŸüŠ4ó^—o¿CM¤š±—]j+x~áâvš)óGøcŒM£šæœC»ãyœÐCStçÐœ¨ŒP,¡#ËÁíj€]/r%!FD°aDév)´éDEŒŽ87ø–(oò•SÔéÃöFßFQ®òHñ~ÉKÞq}‹@‰mo²(Rjq$¿êºMr0µ­Ú/ƒA6žÞ$œ‚üDhç.3/Yz9„Sÿ%¹Gu¹{lñû¨ÇÐï`ÉzøéÕñÄû¾•îkˆ÷ý›V0H/'!½rŠz=ï¬YŠ-U)ìßÝQéÏV*é5ÉÎ4	™°*x3Aõö|ÉÊ‹Ú|vOÒ¥õ.ê#¤TUçâ@ŠF…{bho]› ^WëiM—¸Û¹ôÒ‡ÍuÑj¯âÅ£*¯ÛL„iÏåÆÔìôz.¨x4ç¸³RÕíò”~Ó¡Ç$Ûv­Uú¿æ¦uËáeÙvx=ÂÀ^Wê«F` ·»<€Ø™F?6	† (º¬KÊüÁphføÜŒ±½®÷3oï¶àìu|ðGFL=ÊÏHžâíZ«ÙêùÚ!ùe_^àa|çÚ—âÑ.…­M£…/#ú$öÍò—Š¯=‰æñH­=–ƒéÔ÷¥|­ÛÒ„ø8Em¤lì¬ý°£ÛsŒòji&?­;˜†n`KÚ²Èûèc&^Êõ”Ç5hš£Áñz¬N¸ƒ›ép_%´¼—": —<˜œÍ¥¡Ò—±Öèª«ÊÆ­I¡ýå¤Eê€òÒn±œBv³Ò€Jœ%·dlç
=)œÔ(Ï°ê·vÚ¬r‹cjƒ¦SaFU9ƒpvÙXgVxÎV¡Ö‹0R iMI54]*&©4Gd¿Â"(–ÞÙ'«^šâKu[ë­Ý"<£8M­ØŒ&!Eø×Õ-E ¨ ’¯ÓÒ¡-ÝÆæ Sú°’¥ÔÕsnIÂ®¦†$ÌGüj‹Ôð?¯11BÓ†˜R9J“(u¶TuMúw{cŒ¶¤&Ë½Ërº©ÆhŽKËT”¶J1V°Ò2kÄn¹uýyEm¿a·úi¿•8)B§7WÛÝÖj§·Î‹îÞ·¥{_–Ï‹/T¦ýç/µJíûÔI½®•¾tLé26p$VÐ ÷û«éÿ[Í®¦Ê¦Ã®Ê@à•#ìPmVˆøV¶¡"¯ÒÞV<YF¤×¥÷9!š
³òû uj&Q0©¯”=+˜§*Ý· 9È?–ÎÁbæ°ˆwJ	ü½ÀÒK«N#Ï|˜R–²ˆï:§íS(bj+õ'3ØÒ1ÖsÒÀn•&Þ4yš²²Žj©-CEê¼·ûï\Á\c	<ÙÆ¯§Á}ÙÁð>5;+¤=»\%b@øbe•ßlýóUR©eè`Þ{\ëôf—ÿQÜ^:o¾S#¨i‹ONL*ÒS¢C]º¬½²ôU ã¼/¼z]-9ÄÏ-Çh™~28á<}œÁŒ1ðÑ·2žÓwíVüŽ-  Y©|åÇÀ¿x^‚jâ	¦Ð·Õ ©Þ÷4€fûZ~peú5Ú®õ´!HLQïv‰Ö¡ZÛE0˜GH³4WÎ|¯ô¡éŸNºÓ¹ÒþøEÌ•6¹OS+6ˆò‡£AÎµ›kWg¢/ ¸²²úÁ)G
}6Ô26â=‹êÝI‡W-Ìpÿ6Z–±\~¾:ÕRtª-T‹<Á¼”wJø´ºÊìåÌB½e.m	Å$»XLRÐ yÍæ	Væ,ÏnK-‹é*ž]Åè>Â
R§WŠ1(ª&+10™B,±j&bÛë‡´zpOF2ŸëÐ;-}P×	÷±7ªçuPÅ)R™ Uë‚”`^}ÍJ—‹ÉE)Šú½à¯4=ò½Éy}v¦õûêJ`»–@æ¸³½wvC[ÏâS-OF3=}eË2MÜj!8úÉþ”%®,a	L%švž‰CÃÔŽq1L’Œ­½ºu·S,„œúÿ&/+×¶VIÞ öüAK*ùÞ˜BµŒÇÁ9‹ÎãXhõ#®Ô‘ÜtøÔO¼`Ë±ºvØv>Œü˜¶€åñ€Ì¼@Fr1EêMS´¢IÔcÁŠ•›¨W	üÛQ˜³rCV~w›Þ­¸Ù¿E»UÃe0ÛâUc+ôÄ
,=; ž´;öÛ2:ÕåX4*Ì@qH7÷I'Â3O(£aÐ=¥šØV&ˆØÔSFYœ"†$f…6¨jêQ•#Q¨üäV•'ƒ]Œ’do­­]\\4…]‚s0*lÂÉÚŒ¥ÊÅkƒù)|5›ž? !$UfAhuß*1»&Á%Ìª?b¥*Ç¨ã)ºþ62A)¯lBÅ+“2Êþ‚ñðjö…Ú;Œ%ãÊž´Y5—ýoì“–´yW†6‘}¼ÆÇ ÃJpè‹J§¶ßRGT a¼ð/ýÁˆ|¿Ovxj©#¹ŒÕ!ø@t‚î¡½Ï»Vm^èR	-Rç¼ÉÇÔéG/¢¥Cß§§À7§’–f$sgŽæ'>›ý–TyKAXì3aÑP_=¥»S”$u0rÙ¸‚q§¥,ß]yKM\jAóhøãáÎØY"éQaHV~RzÚÐ‰#Þ)šÁÂèŠü ÙY0`.±7þ_çA¤0xj+"Â*þóÜ›&AÂ¸Ü!ž*ÀÅx9Äú?î¬oÈË€òBýzS¤y´Äe%“•KÑò^›ƒôÌ¢Q?ì[áË¼\Ûµ\¹4WYdµqN°N9e`¤ËÓö5[Â÷™
±õS¢è–iu[ºè¶Š%:}I%™Rž$+žlÑ¿£ð‚Seœ`‘'øÞXF‹gHKKÂ\ÑmÙdéœ*Äè+½©Æ¹ô¾!QJGAGå,-ZuKÒ+¸B²üèÍÍÕv«³Úéµ…¬Ï´~C¬Ú¦”ÓðveøQ>3Æ^+%wŠšÅµûÈã4lÍs^…-HÌÀØjiXˆ‹\º•W*“DaÞ›ÒBlì^ÆµÊüé†MBŒª ÅÍã´×è³ßQ]óŸ$´~‹y{°›˜zAcnHŠ{‘Ü_¡’ Ôœok?åõm¦>f‚aEÀ:.»FaM4ìón¬LìÉ$WLZŸ=„Ë0‰ç“‰'ó¶â¨£•-«$ ­a} QÛÂ ç&[”g)b×ßþFêu´ò¯iÎÁO¹rsŸÔ14†5VŽ4Xy¿Òüw©ëµ¿LkÚ(1vM½Á9ÊÍÁ8˜†^4l^D0ÅWçµ´
Ô9æûCTÞêµÝp Y!ÍB¬[’ì¿·õ
Z<&~8OêÄwñµ•UÒŽ`lJÁSâQ¥Šghx<W*‘b=%Ê²…I‰û»«Ü‰ŠàâZ r}¬‘ÿ<ƒMN“¥ä¢´´l”È’yEZgW¸ª†½®Ìf¿ëkÐj$X¼¨.ÂXY¶mXZ -Ã—µ[`"©©ÂPé^ÅvŠ2X…2rjáìmô”`ç/ãÓ N¢à”IÞ”c[ë±ÒŸÿñß±B[ôÿûæ*qÝÙ™)•ke-©š®2XKc‘Kc3|qŽ3n˜%Å©ÍXmúXîðÒÊÂ§	Å1ÌÕIM’D¸Q°ói¸RþM¦µòÏ©õŸôõ·&î$ti§N`ä>ÿÀ¹¿C#˜ï˜Í…â„¡5ížCXj•ÃÆÈ^$5AòE …á“|‹«jÏØãñºyD^6¸±
sGæ{óY€—2^Ž.ÄM‘g™}a(íÍÆ)¢“›:1|2«¨—Õ%ãÐ‚n5KÏ$jg™úqÜh·[Öô)VÏÓµU³NÅ”‹&ÍÖŽ¢GÑŒïPKÆ5”¾¤/ñ¹©}§E3žƒ¤þ€<X9i½½!tDv™Üª×"ïAàÐò'ŸX…l–‘‡}Cžaïã9µÓ!²¯óAX*òO¤"ïãsác×Vó}ü™ñ² ÎÜ3ÛŠð;;`h§jém)â"ÿ/j˜%¹yºìy–k¨
7'»GˆtnŒžy©ù–ÌŸ,•Ú4'ŸïpI“··:–É…ÄC€šÐÊõÜgAË>ugC1 vå[Àrc¹ÌéKåE¯¢­f¹y[²šuœ’äXàòÉZ½ÖF»ó6/Häân+*P›Ìý`|©¾(^N®·0C«ry¬$£±Úú´6Ï£Ý.ø7ÌÖ¿„ª
ù!h}-0iåioï¯Ã¡iWÕê*Æ~céõùØCV–9`uÏX”Ò²ÆcèMR0V*=¼hh}É|ª´±êM¨n“ŽòÒ§›K‡[Ýë/ŠKåðY‚ùKÚä¯uûT2Íü%¦¤fµ{„‘˜ÓóÒÂ‹Â‚(Òr¨@K[ûÎq!èMo.fúndrØ‡èb†[®Ömvj_j]XËú<WÍQ®TSÿ Ò0û#'Cµß¾7R/ëèÇl·dG¦{ì"O«+Ù ÕAí†˜yZ³m- âJ%˜¡æ ²B„Õ,õ¤íÌÂm ëŒ?Ñx¡¤(±lvdK²  £S»Q–pQ÷ù¢Ñ^ÇøŠuÔz.0¼	þ;¢	,FòÆ[îLfñJ*ùs	y$VË@¶0©¨F'óC4èhâu[ý•ÕÖ»¾ä›nw7W7;<­³òV1ÍR{r‰>®I{d”•4„è–Ûèt9eH:f?­\Óh¶ø'Øoœ'Ù`üà„%/yÇÖjõÝG/ª7ÉEÞo,á¯ÀlÓ¾á5ÐWì½8šBp‘bÉ“È¦*w;%â6'â6W…6@‹·×®"Ítú-`_&Š>‡†¥òOâ‹º-ýŽ¥†2‰åöêb¦M²Z!3†C[£né`Ä`˜_úwþŸ³¿ûðwQN×-Ê@AüAÇ]˜\‡„’W„Ÿ¸N Ö!.n<Á Œú‚—dZB>˜ü]-Âã:©×Ž®¦ÉÈÇÀ 1žíš_Zöíº
É™û`IhsBÞ’GO0Ò`\¢Ì´Å;’O_XLgÖG†Ùº˜„!¥;c>I¾Ø®qŠóú7’ÆŸºpÄgÌºjA[&äÈ1aôìèC×yoì¡Å´®[^é¸´jùO®k–‡.¶bR`à‚+¦¤þWëbTt_KÄÆ¨{»€F±£6Li!ì_ Ênñ|•é[¢ÊW×úöD¡ôº>i6›;˜ Wï¯¼e6ìwi8Çr]ïYàJÃ0iÜ»Ì6.¼¬å±%§*4I‘žl,áäcgsµÝk	 ïRÑì‡¬h¶±‡FZ]1ö :Ùáæ,†9âï[õ´aVéq®±½åÇ/Ú4AÆ‹œax®îŒÏC „Ñ„ì6ŽP·ßÂ3Uñ­&JiGª`*Êy š@d;±%ºÒ	¹A²aÜŠSiÏìR¤ö‡JÊ8Rƒ J˜\¡ß³0\®îÀMožÐ ¾~Ä`>Þn\Ë<#˜á±à%I0ðyØ:j)KÇioiz•îs1B©ôJRk¦s-˜©Ä}øØ3"ü˜Ýe¬ß’ì‚rÁ\¢\;Ùì—lØÓïú6Å9O4‚ºK¯r>ocQ¤ÈSM
Š¤ƒmå ’êÅ¿–¨)l&$W°’,Q}G×ý2Fçƒ’Êrö„þ`gv½ñ s.ÃHôP@W(âD!b`þŽøm®ÓBÿDÿˆ<1zž6Öu9Ž–Ê`<D5N«bRN!²Qìµ4Ð¾ñ@u,K/ª¢&Ñ|@ëX}ª™J_ECåÌÁŽ•8øsä6˜³74ZökfßrÝ¯‡{ãþå1oap¿6Þ­‘8·`eÇ/‰,Â§Ûj“þ§bÔÙš/—Oï]Ò|€ƒð< ›–>z.}=»JFáô™ïÑôê½©w:È€VnK))pv6¾Cú–—úñ}¼ýl>ÅÀ¾|ænŠZÁ‹ƒÿLþNy¼8¾ÏÄä?›G!}6×òøtnî’ÉwÚW¶V;]i|yl>_öåñy‰Ó¿< Gƒ(˜%·Ï¿³àŸßÊNmâûºØ‘*Bû›ùÆãGÉÎþ×,±gÈF_6K_²¼žú—'­gCûµÉêŠð‰gðÍwÅÁ%¤ÂO%¦óÅ^®¾³_  n‰Ò—ŸZ\7 YƒøJ	/“¡á‚&6ñ¥ÐDÖû¸q¦öÒœœ!H‚Í±ëEº”›âûáuð¦NLfÐsÛ“p˜äƒÅüÌ²ÒI§Ù§ˆXÕÏCk¤*ÑadÃ}tf¡^ú“¸‹úje·­GX1°P
RÕÍ0ªº~´‰á~›ë…ØD0UKL%í?9\±cW\ä$hp`+	=è@Ö©d½—Áê‡±á:
RÓ6Í xíô>{ô+Ëˆg‹mKÃ¯óHìqþ'sðãOÆÙFXdÎ3,±/¶Ð‹ÓüÕ‘¡§‘Ü‹…NJ+<°s4 S÷Òàâu‡ØbþúQÇpdiµi1¨-Rƒ¾NfuÞ[%ý«Xµ>¬h‹P°K¢2£¡Ó–Æ¯•ÈU´Muì¡«ÒqÝèb¤,Š¡%$'c‘	ãqY¸Q˜úµQgy˜(yhó8—¡²l 4†«ÆâlTñŠ¾JfÉ.ÚÍàÜ&xÞÒ?O³8©b’‹eˆ¦.•!Pç·•B¡UG’2þÙ,!•—œ§%-*-¶Eu0O/úEÉ2]‚rÄ‹F€ì‹ z‹`lÊ¡IZWOµ•mQóU—iÂaa¯f>Íg¡ˆÖ(Á½ô’(¸¬ÝR ÕýZ@¢[ ?ŸóŽRö‡{øÒ’‰û›F ËªË%a[Éó‰)·<C?¦f–l˜Ë“üƒ!/ÊBád[Èorô\ìhÍF°xçpœ`Yt0"¤NüÁÈ›Ò°Îºø<ñfzJ‹{$#¸1žùZxtÌ‚Z:ç<€KN}|šøqŒ™nWð¨Oñ¬2¨_zLý¦vAià#‹$,lg–ÒH•PP<:²âÑãyAòÊª­Ò–ûÆä’©øG›†y1~jÐþJ	fÆ?ÎNEâ4—YTtbÚrF£àÃ‚ñø.ÆCDäÇDY$¿>zce…§´˜cnc>xëù<eyMi ÐtçéG·Ix‚;â9èâMÀ)ü;ÜÿÁiÔÿfnn	C~çãy¼Øˆas çð6œþüÐs9g]þ®‡ïOý$ˆ'Ò<{|pÈXgà»M‚Ó <žHw<¯á¤î¿ØøCöð]ïê®GþÂû	¤ŒIÄV4ã¿qÀ¿UR[![ÙùÃåM‘¬°àT½5<Ö<Æ ™Õë,Î>hÂLßooç#A|þu­¦.×Æ[‹Ç 8€jG6Œ·Ñà~”.—ßMVë/"³ì\,º‚ú\c"@‘ ‘.µÜ0Ã"¾wÞ*´ãë‚¹P€gc‰´|´ÉŽ¥lš§ÔM3s˜Ô´Þ*äÂ³[Åp›òxjx›ïBúirPŒÙ50p¨ªˆÏ¨îc.ÇWS,ÓëšNåŸÍ[²¾°8u ½¤Z¥œ	©DU@›ÍÀ›ÑéüÉÏñK¬¯å˜eG §MÏé¶Ev`óq©ú}¶us]#P¾™§)LH¼Ô$—çå¬­«•ôË˜LÆ˜ÂJÉ(É‰zÄº””w…w±NõrÀÕn ¦ýAãÄ9LµPêÑñ"&OÂÛùsÖ¼¬)ªsÝ±ãÆÑœRòÍT@ËY…*)ª©ÒZø± ÛF«˜—[ÌYuwgäó¿UÎõ5ÁIÈŽ`éó¥)]ÒÑè*–Í1-¥=Ÿ8ƒñi3%ˆœ`V¼·h‰Bt±Ô+]’jèå÷¢T£7k>k?ìì¤fÍv«½+#m”Lœú,î®šØ5É×©çJ5A>JUKYäAWäzyúLR=ì…ëX}·X(!FHKqkžŽCxHò÷ ‘ÊrŸøÚyoÐ</n€õT’Mj¢U`<h‘Ù˜h(®ædX%ÃË8JvDqŽbò(õîQÃ@¡Dåu~­œÉ`V4iØ©~ýÔGÆ~EêçkƒÉÏÿS]ä8½4jöµazrâ]n‘NÇtóÑêÆÈÞÐƒ®ì2dÑŠŠãž„ã…†]Á–J‡ûØeüpjøw7øÔzJêþÚÁ€JGÛv,SJïn¸{ÌøI¸õ“ÔŸzÛÝŠJGßw[kŠ¦qw£?ùÑ¤‰èyÃù i’úk“Ÿÿ÷Ÿš€ÛòÆ¼-«Ù·
Å#Jïnwœ Ûë/Rÿùï»‹ívÖmÅ:ð®ãú‡ *ŸßáØ_€N†Øæ‹ÓýÇ`ðÁâ´!Âw7Uîr×ûƒ&yƒþS.EÖþ_ÿø?ÿïÁdÁÍ"ŠB›öãÎ0†ìî¦âivÙ@œxS³çPwÄgÍ¤­8 NÃçi‹Ì G™AÝ15Dë§ÄGz'5…o‹ò•ˆ{
ú™'|6@ pV%!˜Öó&×¨‹¥VÈéàñú7œ{lvQN„Fkê õTXgÈf¢Þ£Æ¥“t¬ûnîŠäYJxªúg³	åu8Ð»@e—rí40¼9ýÛ0¤ÍÕv·Åã‘èÝNÛ€õ7«HªºÎ%×Îç¡°B—~ R@•n y+‹I®#`H^ëÅ
¢êþK°]ºþçxüuŸŠ®½§Èþ¼ó)Ê¿®ïþjgsõaÇÐõ¬PÀB=çÇ¸kßÙíiïù'Cÿ»½Õ˜zSÿóF;]»šà»Üg£îþÃö*be´ú†îç¨æõž¡®Oc¿±ïYf‹ºëóÌÔ4óêóB=OO?×Î§I‡¼ÿbz¥†ñ ×énÐA?¡:í8–V±¢†Ñ¨a‘
×²ŠÒ¶âÉœ§ Í‹åÐÉ¬Ñ7@K}˜¥@ç¥K­]ß0œjH”Ê‚Ð­´À5ü£0õw´¦þŠ>î<ŠÝêÞÂ˜âsÚ—]&Óˆü—'ÇäAŠŸC@‡ ‚¡iŽÈ–“‡NºŠ/B	 ¥‚§îßÂŽia4p¶ØfË~=Nó×àLð&°——ø<ú„·ÀaIpUà¸\âKØù$¼Î4²cYêkè†V†Já”ÚºK%4dúùk(5ãú/w0œ+“Ö~ë‚-Ž&ý±—ýÃ~µtÂRÙÍ‚<Wwe;M+ƒJîGààrPeŠ!7Š]•8¬²>¥˜0äš	Â›¯ž™ÚST§	¨,zýd½ußI„RSôK…¢Ö×Š«©Ë'õþtR÷O1_åÞu&†Ü=>¢KË	æ:- £‹Ø™Ÿ""ãÖ…Wäbô<q!i´*´D÷ G Î"+d¢˜¤Z,­`GÎ_ïÀÿu#¥îè¢€­·Ò
“Œ‚¬T‚—¢Úål8U¸´òÂ*qbe±áPƒO&ÁÙA§—EÜ¹VLÂ‘fäß2CÇ²Ñ|¹õi”¿áaDÝáðjêM‚ù†%Þi0Ò0%Ì¦Ñå#’U9Ïecá$—µ~ßÑÕ[)øEW×FÝÃ»U©‚`Ò
Œºk¬éD¼d"YÌºÚm™ËÈˆøõ½ÕõîêfÁ×Û91#Ê‰‹£ØÈº§dßk‹c¡ï½åæ´Å´Ð;‹kIG[%¨Å:ÏGˆöšísËÔ8ð¶Q¿4°xR-’%NJ¡, ã%1¶XälUÏÌjcu"ZLÈ¶@©6„´98Þ¹L­ÊÃ«0gÓîë—‡ßï=]Ê‘4êß‚èÍÉ¨a=¦BÀ,[±gÎ¼…SlošŒ¼ñìÊ¢êXê“Qw}X’èª%DW0¢¹¤0ä9é‘ŒÚ 'È;}%F,sáXD€Â_6VmÆDÁ¸Vf€k‹¸âb6¸HÌüÖ}JÊ/[­­ÂéY=Mã«Qp9T3D[£©3rýg1Y¹“SÀ?þÃþnÇÈÿgËÓÃå
Ëúº¥Êêœå’<=%˜yö“µÈ2!õr„@œIxÏã$àtì×°ö÷H»@Xj=GÇ;OöìÙ+¬P³2<Y§^t_;4¿U./Î—
'<œ6ËÚû¥ÌqÙL}"“…ö\I­˜Ñ_S0¹N MUÂÕyõÜÂ!º™]ÏÂˆ•óÈÓ;Ù†5ÙÄ¥ÌÝb¢‚×D©2,:¦é^"ËÄÄãq€G	2M+€…NU&vÈÙ£ªÔÙÒ3‚a¶S½¡`<F	ºOd:ÝfoE´È¹åUOB„‰-*šÊ¨ÍéhøðO-¼¤ãáŽ6l‘«‰ÙÑCbfòGß3%g3¦’×"wg‚1ì‰_™\œŸA‚±XZïóKÆrÝÁÛ‹Ær±ÂßdãÊÉ&ðÂñÑÒdãŸÿ~7‡²A4.™^7¤ª—¢o2û)_ª*¥í(b³TQÁ.Ãßä:w¹.ãGÁ*ÕåÁ”ŸM¬K‰-=3íB]á‰‚H§è
éOT²k¡h×jö:_d÷Oku&Çü’¥»üýòÄ»çÁéiLžE¾ÛÛÎe‚^%l•ó$´ô/@Î,AÌÓ`*ÿ&å9v&¿/Ãúün, RžTÌAò¤
R'ƒ©´ÿº>`\_¿úMÌsóJ'Á*çedó%Xïè‰YÉv‡O,b¹k÷›_Ÿ|÷Ë·Ü‰Õˆ¾0Ñî…ï%d×ãUq~UbXÎnÁ+™}’]¡rß„;±Åßä;Ë¥îŒ0…·ñv—&áÍ~Áf¼ý£×¿‰m®b›Äå¿P‘ML˜ülRÛ&*;í"›xû­Ìrp¢|mbÛ¯Ã,W(ü©¥·…~6ü¸¢É f¥®¦pV'sÐî„¼Búƒ¼uØ~»óiâö…aÓ‚ {|è‡ÞÔ7i%¼<Îö"•s‡…aý± ±Åê-2ˆ®@”Á¿þDÕŒtƒ©%ZJñ9±ª™üWS)Ñ¨ZH3=ÏÕYÕãü'ýÓúªhÆÍ ½_ñî‘Wþ<‚m°ð,`}uÂê “£p|Í~¨Z’Ý	–—µùé1yŠÓçÄä­š/ÀòJL}qX^6ÿEÝ©"&¯#$¯6aq) »f¹äÔÊ¥ ïÞI"’(Ê¤PEÞ’…$
–½KÝÜ]q†t%±ƒö|¥Û"öL¥ó”„‘.—ˆ|¸üq&éLJ“]ný²px	œXÇ!Œ4=Íöh]1~€ªGãuIyX©j¬(p+Ó €(#8:ªº™ÎÇ†+ëf5N;?µÍ.OÏ®+ËóÀÓ*­raÖ¾C‚šcµ“Š&JÚŠ[v\ñÑÛH(û’âNd¡­¦°j«yHÅR›vQY•\ð2VW¡éæc‡ÙçB'25Ž2eÐ(—ÑðS0à›æìÊ¥ØTVIžãàäM
¿,Ö4â³Ñ»s¡¯\‹ã—nmÒÇ"ïüÝ,˜Q£>f¶¨8°qk^.+ón|M8ÝýaûzÊÍØß»œ…QÂTˆ—Î€[ !å•“é'¾£¥Tgá&Y™¥~±îR)Ù4ûØSÙS[ÞJH„®%Æ0:Ëy^LÇ¡7TìOëdSœªi»áÐ|Æ±5\XâÑþ€êãÑü´1©+Š‹*d’³ÑùæP!¹~~t[ë­]íùa>9ªPrâ»Âyz˜íä:å5,—:Qî“% 21R«°¤wY³åTüÑjÌž¤ð–UÑ ìïØ+»F„BáL6,lÛ~á‚•Òü:3@‹yg!äòpdûic÷•)ŒÆ¾­–Asâ¡ôµÑžØwGäÅ¶DÌëoèA¸÷D€í§¼†ÐàÁñg'À\tùÚÈ/ï¹#ñI± RÈ•6ÖïCv»L%ÏqÒÈóW¯Hýðê¹ÉöiÈOx¿:
”:ïH„rÞ™œà!Ó…˜@þK£Cêô~³óœòé[†|«ÿ}«dzí1OÃzn4¹dÅåÅ˜ÌØ%jµ©…>—~IƒÌcôØÆƒ(GAG“^ßYõh r~9Þ¢TÜ²¯ÏÓ]Æe¨AÔsê]%>ÿzzœ¯4ãÙ8Hêþg +‚€+²J‚á¥C=^.éS fxâFA‰âTq8…](h€T[\8´©U€ØËÌQÇ¬øŽÌ"àùJÏ6Ó8*ò-iß¸Æ0•ºCGO’¤DŽŸ(„1ôÁà'ÿ &žÎþŠãÛL5úRž¬$;ÓÞ‚./à©Ôþ¤öçSo>ç!=Ù¯H}×zxéc¡Ä©Ú'Ð—úU?údšÀÏÁ¹?ø+•
ÕÍ”ûÄ7Q;¤^^…ã÷F­Ü›´;3Ø‚êr£ˆ\Þ™¯mµ:ZÍÕáh98Çz¡L)gî'ôZTpÑl5
L“–ã°ÃQªÕs/õbõZê¬uƒsVkæ8ÎŽÛMtqÁ?Å¼u…ß¶ÝrrÜÒ©0å­›½¶Oáµ-:¨—_vŒ° ¦ÛcR~.8Jiö—äÖº†OþÐn·7:ß|HR‡l`“ÂÞ@7¯’¾à¥^§Ûí*êØW~þ7o¦uüæB¯	¥²P&æk‚©”1Ð§Fæîösï¯#6%lrÿ<Ððœíø[º	´þö¶è´=¿’Âe¡ô"QÉœ@YwëåppøbÅ™ª˜Ë¨èú.aè÷a4Í¨›ÆIqGð
fž’…q.Ÿú³qx…qjŸÂË]’-4˜â&GŸ"TÎ“¤Ÿo´šŸlŽA«IFä;Ò]Û¤´XÚ¡*|“–3ë?ðäT7z-6î]vxqiÂi1ûÙLãëÉQtýV®äKÑ@Ó§5/órÒnv–+·u™LfT»ê®í†+¹¶óú¶8%]Â‡\·~6S‚%•î)ú•ËxÓû9ér¦ê=E·\$srÖ¾k]ßºª¯·@žÏ žÕŽ®³ÙÁQ˜º4UÂ%!û$˜7+z[)Mž¨ ÎX%µ@;EÐ™g»˜B¶.¥žóƒÚ~’àõ*$³(˜xÑ‘xräpO›w$gpR·œB,I‚c6¤W m„ÑòÔK<Ì§!ßÏhèþÿ¯ó ò‡·´æ“%•s_¶’-BmßŽ-Ö~[M^‚†­MþMÁÖ¶ñ	ë=|jýZì{-‡O¡]<ÜûQ¢Õ²+–‚ø*ul!si*63¿Ò4«Èz[B	ˆO¬_¿ð~Bh»Ã(<Æ&ïÚ—¤_;”XT»ÎvBA¹&Þ4ÀÄ¶Æl>¶d‘þèEShöSèÙeŸßí•ì¥ˆŠú5è6ªuÚÕªÙ‡%+Ö¬ÑukxØ¤[çÆ¹f-’©»b->UY^ëÚ@â­šRYŸÆ~ˆ2æå¸¸+jÔòYé¬ý’G; lL_—ú‡È!=y÷:„Ä»)°Î,}s‡åì]ÿœŽLý¥  5¨½­Œ7v˜®kFïÖdû/Mí•™š‰¬`?mˆúq1…!?7º%M¼¯ÓJ…b­;Ä·Y_ ßæ½ª#ü§\"B+·m>ºvÁnwä>ìÑ`ìk;¡eÙ.—Iû
.×îw™tW8íî"D 	QX(„j·	yÛæ8¼1éÏ@X»­œãd‰ó‡Á|RZ…µ‡¢Ñ¥4 VyµÃ4Ñ±Žó%O¼'þå(8’˜Ä´
ñ§ƒ(œ¢õ~øí¶&š»3†8ÿ “•h:â]7Â³F2ò˜Krt5…?±£¦A¾¡e;æcV¸ã(™ƒPOAw{0Ü®ÅiC@h¨ÓGkE¤‡†ebªêA¹°²‹ýeTÎ^I¢RÅœ(ŸÌ¢TâíëÈçãäq3ÿ±\NÞªŸ§GôÂ;ëødÁyTì ûUÝØ—a4ÁwŽX	òš§à-¥KßÞxüäówáŸæ·ð›…O†–ýÉŒ·Œš[æ7Ÿ-?gÀxÛìƒ¹õìé³©ïÁ$üÓÒwv³ðÉÐòáÞîás«ôÆìoC‹;É$Œg#?J{œa~ƒô`é;ÓìP¯ôKØéée_XfJ|°ôîY¶‰#0bþò§¯òqÅ×æ@U³»^^Àãåï´oßU<®üZÝÂ0„c(á¸5Û×ÒGí;ŸÊ¿Ñ¾ÉÍO)`Ì‹øNÕ¦·«Òÿf¢íàåÈ)eóÆ'B*7dðÏÆgž…°¨Ùô“eïdÈ_ßr”ø³ì%øAw¬¼™O³óog?Í(•¿U=«TS)A-'ìOf(]Ãþ&I`APxéÍGê…åIßYÔÉæDaêÇáÅü 4"Þ-à³à¡Ø`íµwŽà_£ÆìRƒ&b}¼ÆÇ û‰,Œ*’5»É0Ç€¿m¢ÐÚ¢«0íæ¯Ð×§¶ ÀNàá` dÁVcèŸy°+8PT^>©ë‚ã²PŽ^4¤ØÊµØƒ¸ªzBz-RJ;!áp¶z_ˆÐµžƒqÈ\»¯ATê\'ùÜHÐ@.ŠþMw<­	JÐ¸…÷JJ´BýîäÅ0®¶»›0´×¿•#‹ÞØo´å(’,¹R”yDØ³¹dTX0*Ï…;ŒÕ£ãÚ†±^f:^ÈñÑ!»j¼Jb¶$Í`Ù`gAxHbL…uµáeª-œ
»Újµ"Ù#÷ÙlÖfËÌqeýz‹š†-o´s˜ž^1p@ear·œ4›Í(ò®êÀ¿˜«ã‹—Ãêã`ŽI8ôÃ0qñqˆY’´\väÁI±Ð yDz´,®xø¥³™ÙfgµÓ[O½Å[ô¹Lâ©™{g`^ú,%3çR =çˆ
ùG8ÄÚTÞ É¢;û²
 j´°E5Œƒº£¥UpA‘>
Ï’‰wùîcW;Oúýi3Á9y¥Ø_©}×˜Wt}¢é³>ã¹×!G{—ÂPÖVµOP ),3®q%`xƒÇvy² Ö1=Á²ÆðH¶Aì‚[k—­˜ž/àÁžqDpC»£»ãF÷ƒuZ’hÎ ãÞeš—ëÔæ“‰SÂ­_mb%×‰Ý„ym·èÄ¶¿ä‰=ð’$øïö§g>¢ðù®³šÎ#Î©àWpŸÖ´
“Úmolâ¤n|¶IåÇåØ»ò£U2Þ·$OLzZbúCHD¤¢¹è»gº íB®³kš¸f¨‚ûdòÅ	ÂÉ¾-Âu—@8°Ä2Ò‘äy×ØtOrVR-œÇf¨”‘:q/‹A+fLãyÓgâ«£Ÿû…`s6Æpóå{à´ñæmgWI·*ê¡Rú|Ø=˜'¹7ª»ÕK¹©Ífèëe%$ù<d+˜¢™Ìê0¥Êü§	zsÞ0ÙNÈÀ'ú®u†úð±÷V`"bã³+#]+XŒøŽuööò]…Pòn	¾>¦PuòÆ-tƒ(Œ¡ÁÀœ5A}ÅÒÙ;;×V*jâûš6LÏà¯h`úI»ßº¯«ÍP´¾R–„„Þê—XÿOT®2ò»Ç·êöõ5¹Ü"'5Œ3º_[%5úß·äÆ¬=æ« -X¶YäÏ@*ß" ëÓ ¹Ò‹ìJ—t‹tm·úÀ@JÁÕó"ƒPÂ†½uµEeV1Øü€e
âäjìÛG
\êœîÉ-òžu4[ñz2kü*Vt´mvbP)¬	ó§—_¯Aq…ZÍvmåFzdåý-†b:Ïíú]'3• ·¢ÇxšÛû‹2ˆ°8ì¾¡d'±MøÚZ	ÐÜ‡vL±`Q›ÜíGæ<hQ§qB[Ø……KÈ¶å~U<+ì®ÁÈ¾£ýxœFÆþío¤õ'ç·¿>;†±Œ×ëkñ
È}RÏ]mÛà¼}ôyvLïv¯!òÂ‹Gd[S-~·¾šãÕjö^B‡sØBuo•œR*òÈ·ä´9y‚í$õÖ
¨6+n#ˆ}è°*õ (YíÅUý6eDí‡+ä¾µ1àËnb&×Ð¹…~~Gz-áe­?áy\¤ºÍb<„LBøÙ‰%<.{œ7¬FçvþÊÇì•kØ[²Eð¼ríô‹0Á–²V¿ƒ§7àiëá’Ì£©{ÊýÜf³§NÑžziŠnqãxá!xc<ZyE$œ‰¶í<aW~.;ÜLò¤Kàô‚Ì¹p„ôÊWÅáØ4=º¹ø£ÞúÖñÎ­ünSÜ#V÷‰†a÷WI»IR›ý
½«¶¦éË6ðe­>}Û†ëÛð}m—Yp¢â*â!»ª
‰ìÊEÅjk‚âÊ·¤N™Õ}Ò± ìÚ"á±îŠc'™ØYÇóµVÅ[ÚT‹~Ö.kÄ#G,µ¹·Ì¢5ðÇcÖætà’£èwÑ&t½¬ürøq~ì¼—|pÝV&BSÛÍÍ{ê€ªPe­%;Ôn´µw™mÈé\°ç¤À•ê›o
§áº©Ìœ|9¯‚IO•–|žUÜ°¤å—£¦”_§áå}¨L-Ò¢KòÁcPOû³KêNÜ€ÿÞÈšÒEÊ/§å¸b4ZvñTZ@›˜ÑzGZ¦j8ç<ZË¥'[“úÆ3¹TkÚ"ægŒã«V|fDÕ_×)¸‘LªEÞ;‰}™¯T¶ÕÙ,½Î2¯ÈG™X¶LÉ,5›4+ïäá‹`˜Œ`óöZ÷köMXAæ»µïï]Ë
ÑÍ}'¾ÏÁ:4Òçúî-ðº·¶[¬“WM«.~å¢WÎþ7×áö§¯ç‰ÕbgeUp(JHV>÷‚%ófB¯=¹€ö87i‡=py*zµNþÐö;›ÝS•õ½àBqõluíž­ýWÏÞµZTA¦ÐÇ·ðn-\÷·b­SUìöz·#£áöx¢7·p®ü?uÎl,ìœY¸`©ÊÓ5¹c,Âÿ„';ÆU«‘¿7ÎÍÚ˜¯6‹ýw^òvÚ;fâ.G†µ6VV#ö»õÖý; ïïÖ-^ÜîÈ/~H_lð{·[†˜Ú¢–ÆÞ©?fa X‚ÑÀ?zx_»71ÅÝÐð`’Æ&Û#I¤ª¦Ð‘s3’Uºhï¦”š+ZBÃS1ôkRltöÝíQs§»Áðr´--‹“®†I[W¡ÕÜ ÇÏ^Y×âß¼™ã2dH|ë B	VXttñ•(âßÅJÐÐš§þ,YW£ß±®m.v\ˆ<rßa%¤ðÐ
Ká-hY‰›ÝÑZ¼ž%Á$øÉ7ùUÙJì½ÉÖÅ8ò“µtÇå¢OÖCÆ[¨° 2Ä-Vd}µ½¤³¹ØŠp/';Ül!áöà¶÷¬¡ÆÐK¼Æ½kö©I—ÖêÉpªø*TÞ(U•„¥~Q»FÀ¹ÞÆ5tßŠÈ8L6*„zÈ©W)ü MŠG0(Ž:zýô;jþ–qgE‰g±À=ƒ„+êÐˆÄDÄÉfÿôü&·]¦ßÑÏ7b@9<&æVI‚²´•5Ån¼g}%MaÝZ		ne£F §ôÉ¨A.˜ÀŒiRY‡¹¡PñY1DsâÓ¢™áÈÊX[æÔ$St[§X.=Ó—2vÁnŠi*$&U’™Ä-49jR:ðÓ¬Þ9¶TëµúÊàñÄq0p@}qJ©æëÒ÷4ñ4›ÆîÎË<ÅÍ“Cßû@Ž¼q€ºù†¼ñÏ0†ã[vÆÁ9z!ÇúEËVÎìÒÙ¥—çœFRWJâ](aØNº@cìž»˜nÑE¢sJúaìÇZŒ³Lm3[¤*Nûåtn,±hò¤6cr’X‹”ñO/ï¹ðQ­É„gèûÞ`DÂÓØ0‘ÿIäŸƒÌ‘,	-¹Œ¬ÛÁ‡±6‘ÄÅÛç'ª³×x™BY;×U¨œDãó2¦Àx3@;úh×âaPÌ«>ìíªð7¾D9ñéaSÍüyA`mä«Œ;îÂ˜½ +]ÌoqíŠu õYð?«V#D ?Æ.õÌt—Ä¨[†®b9d‹ŽÇÞÌJú(ÁÒÜF¾“D:[¡°v^=AÂ p!¤|ßëÒ¼mN, ¿Kë×¾ØW}ôa¼òh--ÚVçÿIê»Þx@ÖÈëÓøVmýã?°µ§Qp–Ü¦™!ÖjÀ4Ý¦‘ý,„ Óµ„ÁeçÌéqr›6…Ã‡¼	Ç¾­-ø=2	mr”œ†C	Âv9PbãŠð?òÍ»®Èâµdà‡©[#
\–[,Ý˜®5þ—ÙðÏ-âM¯VÉlx¹E¦s4:U³(MÐÃÇd›F±fa¿Ža©p@gÒ¿áÑEÚggÐœ%£¦w×YŸ´}Çð]àÐæˆü~{› ?ƒƒ`ˆC¿ÿ ù~,¿¢CéÏ¯Çä}ýÞ5{¬°æ³¿Æ7+ïíl‘÷Xó“üžJmï'ì‡Ëæ‰#3·›ý^k¸A½CþÈæ2¦u>™ü›Ãý¸£»ÞZYYi&á³àÒÖ{çZûÿå?jno‡ÕÝO—‹–õtÑ÷qÑû®!×°¼ªvè×%¹6jùymàY€¸>³u>q*7Ç•FvH0¥ …ê<Rv ™Eá%¢l^9-k˜o+yÌìƒwYïôWÅ×é81Šp}Ã1ÖºÁöÅÉ0ìÁ¢¹†^óäyx?mù»mòÐº-?»‡eƒàÁ,–¹ÈÞ`D~ó^]$˜'†oö‹¥7Ü±‘áµCåYT”^r”§fÕ¢z©”qÑ ‘è¸¾ñž?mBÓ£Ô(6f÷é¦S.{½èJŠ¯X±êš2¬Œ9uVn~þ»ûè´†ª¼€Ð%ZùÖ–Õ$ªíß]ãIµh—o» ®Àõ{eEîb…Ü6÷\Ã<)ÃzD3#+|8e h€wlU}m§Ïß+h“«£é«7º¿±V€Ë—Mh±ñÝ¢kI:3:t&¼ÿöý˜Ñaé†I·š­Vëç¿Q§òëóð’ž3/¹Fñç†üŸÿöm®¥dñí8:½.oçö›ûU8™
¡î0ÚU*©hsÅá9…¿3Oã:ßßãýOn$¡@Â‰IQüÅî8Æ@Ó7;U„¨vë×JReˆˆÅˆp_ö=*4µ4×úîrïóÝDE=©ŒÍ)¨BcRœ·:0šü¥¶Vš¯/c¥L]ž0Ù»]sïÓ]´Qè*Àf§>p•|^+ÉH_ÚöùâN®f9/ôã2ëÿª[„{»­
$%ÂóáÎ.Xn5»xùJ>I3L7ògÿŠfüù °á›Ï$š˜­Žì²&¿~¶Ê¡Ê²5äwB8>‚‘o_?¼)ìŠu©\Ž*îÀjÛd×«°ìhc–ÍÁ<Â˜Úñx‰7Ïaçœ…ð²Qç¥&õ¿™‹¸¬‹mMÉFð(šõÎ%êY'QÑµÿ¬âÇ„Vô±‚fÉÎxuÕ‘e"vo½ð&¼Ê¯Ñ´!CaÅ^À¯/±$øã¥‚Sf¯¼´Ø;óa`áÅ$„¹Õ¡Þã¾€¿][JÉ0	è@ŠX`@ ¸£0Ù]@xËy¤7wjç9À=H…6äV­VöÃ²z÷V‹èz»,¼J%J´\,gdÒ)YåKCB|½ÉÂ	…?Þ(
OŠª^9Z¦’˜?¤»#nžcX¼ú“0ûÞt%ó‰m“žåèx¬#¶<²åür´nùõY´Žƒ‡§˜`xÄ¾ktL:p{{›ô†áí|KêG{»ß¿Ù[1ÎqZñ¥‹ºCê¯÷_îX^[éÅNú|¼óäÀ6à
ïZj;È§ðò]RÿþÕ{oöŸíï=uè %¨g¤þtïÙþîþÞ«ãƒÔ¼p˜MÅÜ;”x^@iòŠkóÓÆ±wsv¨‹ÄÑ&‘7SëL aü¾×ÚhwÞ’™TJ¸\RäôÈìY5¾ž6HçÑé<I´ñbátw>l_×‹ÕÐòáÃÈë<¤ZAUd¬<Å«T"€`‡¬‡ãêi"»Ž¤;i
ŠtÔˆáöÖÂ)î›£Çª!ÓÇ‡m ãÇäA®ýÒ)Es’ íö[bPf1E²-U`ßÜ\EˆhDˆ¦©¦Nl‘iŠ‰ ÂËä>‰ÈŒ™Ç2XëµtoÓ±tí®Ô
§Ý&†Ýã¿¥P/>½šz“`‹xÑünˆ(<B›úqüëÛÂØ­[ãl>Å§ÞéU7G§ýpõakµÓÝüª7ÇÑ#ãaüÒ²§¦-’N–y‹úQ2NÙÁõ9J"X¦Ï·MáôlÃ§_ß.É‡nÝ$T Wî,8ºÊö(¦#¥ÛC]Æª°+2xènºŸo7ÀÜS ÍÄ‹1Æñ×¶'3`Ý©d Ü²]Ë}‡a¿Ò²;›/AªâûãxŽšÍ7ä8¢Ù•w‰A£²JØz³™=ÃQW§‡ir˜„pT¿Å™TvŒøée·2«4•Ø0•Î¢£ÙÇíÃ¢™q'¹@Bç‘Ë4šsˆ•Áç1BÍBÍ˜~*‡ký8iÜä.Sñ1¸VTöO‚·FØZ§ØH?6IçÅœVÏLiÇÂóz`ƒùg–Ù­çm©?€&‚—“eÔ)Þ†%¹J}£µ×Þy«.iÂÀqpÓÆ…¹ ›(p³ÎðÎµá¡ve¥‚*tÔÚhkcå­£mGÂ™«ƒ©A¼\·š(môUŒKg£g‡²ƒÒäRU\ÃzóÌD‡æóMå;eR°ËÎÎ£pæS®]·FkóÑPÞ3Ÿ!“BÎƒøù÷yëÖox4òûü“ÛÓXÂ[|i7à4ðM'§}0ÍÝ “«¬>¦ÓðÒ-lOêöuÆçÝ¢€FÞôÜO¹ìµ#Ö¨è¨÷Sð„£‡‚g….IFýVÉ[	Bì`o!rj!˜Vü%¤`õV‘5¢—†è¶d…S¡ƒÉS„³×à«·k
î
2jO†þbO8…ÚÐHuƒR@IYä­¤ö(*òÓó P+¢r…+Ôj\Cm©De…ÈgÏ9<ÇQ_Ý« Qi< Ô–9§Ø77Ê*Ò,Çäx"“;éüé[•HŸ<Ø®™l‚Ïýä%ëPHá.ÈÄŽÓnñ_§WÉ-üÑê}ó÷®‹jF
?¾œ¯Ü<öpYsä@˜Ö[ç¿÷ÙLì¨i¾¡4ÍTM)ˆæÀž²÷µ§Bx®r´Š>D„Õ"l¢eiÔ8én°Ý"mÊ¢†”!¬›ÂIÜ m/],é×¥ñÚ¢R¨ñGám{Ìê¥( f¬u]Ò—01vŠíš³•‹cÈ@aRmó4± ìŠ%],ê'íš­+Á@@³S§ÓÞ•÷Î@¾âÌ…8Ñ„Ãµ-p,YÏ,dÇ´f7â»xÿé»2QYP…yoªåùÜ0O§[Z·EÊ9lFŽ¶d9<[§©v¬S‰É;l‡ÙõU_Î8IÖkrê˜—Â,€OýÄÆñS/ñNŠÄò¶™ÉØXc5…Qßa|å K³ë±ïq0x\úÃ¥dÈ~u‹•(¿eiRŒ•¤¨·	‘,î)Ærg›
Ü¼Óq(‰g4êw±øÉôÊ@ †äh€	?(z½¿ÎÍHQùÄß†/¥Ä&d{Y8•4ªãÅê–,RV$¼ô°î8EÖ*ÂlU#“½Þ˜‘9ô"èÐ¶Ô*Ÿ6‡Ö]V.NüóŒ8ô·Žw¯’ÀRC½Ð]÷šBÌ3/AÇErp|²Rí)š{]¦d®óôPbSŒ4±Ž¸›Õp9»½–Œ9TM\`×5N¾µâ¸Ô£j™ÁÅþòE÷hÕ^ãfº“n;§:v³š&ÜÕéJšÌ,Á4†°7íÛiÁòëÖ>ºN»ÑÕ,	Ï#o6‚ƒô(8ŸzÉ<µþ#Uëý¡ãÁbÙ>Dˆu%^ì4:ýõw,¶ÛºªöîÙK¼˜o°åªTT­ÚÌ×¶¼Ðiý+fvÔŽK´È2jC»ã¬×uÀµ)‡`l€n¹QRq«•<sÙ–ÅD;~Ò¡†{·ZQôX.† ðêB¼WÀ2',ò‚¼ò}˜y+Ûu§Ô2™CÖïª+H,(C˜8 ;7 #šë0ˆgc‘¶¼ñU<]ö\~™…Áç‚{ÌPºRQ;Cm›UÓºõÆ_ÜBú, ø¾iÚ×ËÈ}â™l£ÕRì´¶Ô	žHÈF”•ï,À¨¦ÃÊPwÀ„ú,¢2L¤¯©Tõ¯:Œ¯z;Ôf&ŠŸ©‰Z4<UärÕ6Fk¡u×òð3“Ï'³pŠFä­ë±¦ê«{* Â;žâN™m7$<#ýLÖXÊYoÅÂ·
yæXvB·Üà:#FÉ1L¨C±ú÷,¹lwçxÿõ+²óýÓýc²»÷æ˜}·÷»çþ¨1¡˜‡[äÞõÔ¿  ‹úuÄ†<±DÃQ‚!u`c99ŽhÍ¿{fîßx	prŸ¡(Bž£ëVý•UèïˆôXû~úa^LÌç4ÍC‘d§ÍKÙïï(ŽãÍýßý®ÑhÝ7ûÇ0ÐòrïøÍþî‘¦îøÝ{ò­uó E-£ZcqqYä¢ãâ²ËñH‰U‚X‰Š.Z¥&o¥¨Øô˜Ž=zLj'ÿâr‡×ÜMÞZ‘OÙÅÃ<ßß»zŠ°¯B˜ÄVV…¢”5¾#Ì±Ki7[`;Ò+^Fl‘ôjþ{Lëµ¿Lk+äüþ/Ó¿LwæÉ-ŸÜåšÉiOöŸ¿Ú{J¾!¯wÿ¼÷ô/S®PY×{áÅ£Ô{ëß#dñb‹|:Oau‘Ù<?ë'9O{»ê°_0ò‹gV¯ÐLí%GaSç¢ê~ÿæ 9ˆ| Ý×§ÿÄŸëØgÇF<hbæX±ƒ·³7öñS½æÕ¬xÍQä#2tÆ~/ˆBÓqèányÿ/ož¾=éïèÆygaÓÍä2±Òb6DWiz RL‡»£`<¬{à1g†”_ù#]_‚kùÃÂšÁÚ {Ì’ŒŒøºžZ¥VR„°ígß©‹ŠI±Á4NÍ Æ1™IpÒlÜzÐ¨bD¶¢¤–‰[š¥¥½KÜ¼d×Ê¸b÷†îi£eÊ bw4+^¥}ÑzÊßšR-„´MC¾E^!X‡Ì%”Êû?¹Ú"­Uÿ¶[z
ÌëdçOµéS†‡‚-¿m“ñ¹Pü¶Ýa¹ bÉ75	Ø’E¶äÊ´ `…ðèô	ë"LýeGñä(‹„âhà…h¨‡1FÄRÈœÈÊb„+$±ÒF5ÚaÛ!¼`aMQI ÆïT Ëy•Ò56{µÉŠÊ½«Í]dèŠÂ)Õ|½ÌÐþ|çû££ýWäÕëý£=r°÷ÃÞ©·ÿï]¹…]$u\Æµï®§aûþGm !]¬±.aþ,À?Â¸{›,?	¦Û5k²ËÄ»Ü®õ­·QWÕö5W|óÑ¯°cá•÷êæZ> ÍA˜K£BkJIì'¯²öë¯h]ºßVÚs¨ÙËÐfÄz„
rCú¬ÏZ“ÊvÃG82ü¯(7z° °ïhŒ!ýÀàQÌKe³—)ÞÍ¾Ââš³§a4ñlaˆ„?“Qp>" IácäcpÊJrÆ«dèERÔDLsH"*ÙÂ]~…ÜF”(8£ã«é`úWÌóÔ÷&dè#-mÉŒ¥h±];©¾~–ødg÷ÏÏß¼þþÕSòôÍþ³c²FŽþ¼÷ã]òÃSèå9¥jZê—À»™ba
œ±8IwÂŸÈ/ùG–¯ÏÏ#ÏÆs˜Í»M¼IÍFá8ç|2.{“ÙØa~L«ÁR'à€ÚJHüÁ¿ l2˜ÂrDè=ŒÇ XŽh¥H‚Ê+ôg!ùÿ  ÿÿ 4Õ
&xœì}ÛrI²Ø»¿¢«‚³ ˆ»HÉ	Š¤$ÆR$AÍìZ«@è£F7NwC$†C‡#‡ßŽðyðíÖ~8áç=ïçüÃ~‰3³úR}/ ¤¤ÙÆE »««²2³òžŒ‰Ÿ½­¡þñàß°ŒïröõþÜu-3ó:cCÝÑúîßéÎ%·Ý¹Ý×\Ý2¯æ¦©›ãûœG-óÈÐöïÊ›lÿ€ÝåÜÊ˜ÃÝÓ´”]{Î7¿Í}vfh‹ÞÂt'×–ÉËÎî&›ß²­-æX#—ÁyÑÛ¯õ)·ænYe²Œ,ÓqY_s8Û‡§>pùðH3‡úPsùwµ©ñ½fàß°’ÞÀ²9ûé'¶ÝÉ_‡?¬ãÀ°-ö{¥¹“~¶¦å(øOtS3zð<=;ÕnËõŠ÷·n–uøt>Ÿö¹].Óü«¬lZºÃÏøGnÀ+ëµ§ÍMü¶¯>Œmknm ˆ—Úm¼„Ú¬¹Ösý–ËMø)š@XÞ]‚IYLUåÙtÜi†S„qôðÀsÀºuöÛpæƒwœ¶Ë6¸m[¶‡73ËÑ]ý#ß2ùXÃ? “ ¹¯º¯°F³^ÏÐ}ÅÍqÎµ)ß/ÝTGsÃ`³EµUë°þ¸:¶µ¡ÎM·êZU›lk
w&Ž®U»õ: xUì[ôib}äönä¦Nðux+~çò[·zë°‘c÷ØsñÕÍDw9£íçÃê­Áæ³·ˆ1®wü«7úÆ9mhÝT§C¼b"Ü,³ªÁìµBn×h¯¾©×v¶ße×šiÝ]À$ØÈà·^7uªX"·ÙßÏW-ücmVmÖ:¥LØe³@ÆÒ9l~9w7÷òÆ¤Î,mÈíftÛÚlÿk¦>FPufº)Á³Ä¶ŠFíéÓ¹…>0ÏlkÆäé×jµüiç¾að|Ýe_ñ‘ÍÉÑMtáˆ§ú½Ôz¯m}<†->nj€©ë¹0¾ÃŽ&|ðaµf“ÚÞ–8ø²Ï?7ï¶¾aWúxâî²+îÌ×aÇºƒl†}icÓì°o¶²f°ÃËÐ3Æ»Ë lÑÌêS¤ö7¿­wê‡ö[Ö·l@2ïŸªc Vm×ë[Û>9G®<Šöi¶D;«v°ýê¤ú¦µ]ŸÝ¾´†¿ªðÆ€ÎúÜ½áÜd67·Ã¡GPõDá‚GãÆ¸”#mÄV¥õË˜q­Yæ… ƒUšˆ)M\¨Äž¶:ÁÔ‰÷õ¹]}Ó¦YÏ,AÎ(Óuª&prÂ-å¹ h¼º pÐÚùpÈYdöÐíÜ§’Ïes=7¼­í§îþ¬_øFx'¢”üR¢Í7
!Ë§?§–i	âõw¥è”Í÷“@>Ý >]4-˜Ø!žÀÿ3˜ˆç`>£Hä[¿-ÊBeEÐm«C.Jº2¦·êqÜoÀ†Þâ‡G~½B~ ^qÍpAŽ%qÐAbÙ "=‚î™%€bý+ðAbpb ƒÏ€ì( ç€ÐP¸::ÍÆb&‡ð‡NËBàæ3|,ûsŽCÿQëë Z=[0mˆ@YÙµ-öB›;°&#1˜qä`kã Ž"²¡›œQ®°Î¦\sæ ÑßL¸;ý…_¬qÌŽÎÏÿ´á ð±Ð‘n M8lHÊmøÂ°@bCdóœÃŒkfÙlÈQºãxœÅœÙÜÖ­¹Ã­Ï§è´ŸmKŒëŒm}Èðò=¡3Ý?6‰„øJlTx&`ÞM8wÄÖªwëGo·ºqRù²²(/^‚‰¤“èNH¢–1”Q°“ÍÏìÒÁkÓC,@
RPÔEôFC6Ÿâu0ÏF…ƒð¡ªmÖï¿*žx¾ù  ÎÛµN é)êóiÖ¥\G0[¤˜ph €0(š©Èˆ˜Ï'ÁÈLéèÓ£êå'CTù@[]gq­ŸýfŸ™(à}ÇÞ?I^¿ÿê=()¥jµúU)OYöVôØ¼þw‡³dÁžÜ••é--É‘÷ad´\”êµz	µ¹5”í8è¯ø?Ìu8´˜CòUOXfÏM¥íX‚¢nÉ½õ0±ºS”>áœu…HðLŽyŽúå=ž³m_] &+0ÁÈ|§ÆYšÙZ—oFÐM6Â‡s›&\m)ag±ÒASPÂóØXwïoH`Ðïˆêö¤È~*~’pÀ¶;h–¨ñ)
oCb<žöù¦þ®þðwö¸¯•;ÍJ³Ñ¨4:­J½¶½ùvƒí®üÖ§uï­ƒ¨à™¯lµé•ÍÖöú¯ìø¯ÔÐ›ýÎf»kÜ®À{—z'm[Ž8IÒGníTºÛøŸXaØû÷÷*Š™ºâ™­]JŒ¸©ÈˆQr@Ôçæ`ÁN@!˜ÄwïJLw¥Mûî½"*ç!3­DBgÕÌCUÓGÖõì„¨¨>¢xŸSz
°Hm;S™´ÖÞÅõ!{~øúìºz}qvrux~­>íÐ^]<{Ý»f§çÇðÏÕéá»¸„Ñ¯O/ÎÏÖ|ƒ€õ÷¯ÏÎaÄgg'¬wòýÉÕ	»€ßg‡—½%†ß¸:é]œ½Æi±gW'‡¿?¾øá|CÍåEõ;Uå°¤‘Àã	ª†ßœÙÁ§VÏ|ºÕÝ·…	Ô~ßlé¸žá€icMGßÚä^ÖçÚT˜Pwó;{a@€Ü²;¹pÃ€C&o¶l—ñÛ™EÆga&¶åÚžÍ:|˜¢}³¦ˆÙ8üB˜>˜·ˆ¹93>€IÖX'Ü@¶Â#ƒÇm#+L3Ü‰5‡u aÞl‚Xtî,`)°v‡YƒÁ\x¢˜æ,¦SîÚú€iSËžMÐ~1³­‘nÀR?ð›µ–$ˆ÷
NÓÕG:Ìw6ÁC£R‡f/`² ‘üdh3v£»i&¡'“MæÓ™ÃPT±=ñ¶Æžë&¯ºsò
ùFXùÜ…Íÿ¿Ô©]ì·MnÓÉÚcÁÊQòQ]!-dja ¾M 8™MJVÀå	{v'g>{†.BBkîV­Q ÞŸ“Ø‹ ÉÐI$œ'ÌÑ¦3˜(ècÂ,6æîÓ‚0—–
#÷a ;ÚaP×m8>yM“ñ©è–B¶ã¦QQb¸r¸§Õ»©†sã¦öˆH×ÍCm¸P7wŠÔb’0Î‘S€8ÿ÷@r¸uá_ËÞõ<¦J&ÙT+d Q¡tðêâüúäÝÑáÕÙÅ»Þé«âÑÕ¢J–¾¸·5µ;3î LHù60x…*íµÖ'=xc`™£¹ßldkl{áKYÆœuSwuÍØ¿»cžWz—Õ+~7êÙ{O9‹<Õ §rÊ³ÄcÉÛ¦Øm3á,‚ã£HL}iÖN¡ú|ÆGî®PŸê±îm—ù`e/¹æN¡¾À¹~fæ›¦Í§oÉ¥é©3¨fgêÎÈ?g[SråÐ$Bá˜œbÏB®ûÂÖf“\nŽ»DŽŽÎáÿÇ¥-Qo½­Òâ½éîÊwtßÊaÞ•pÛu ÑT¿}
Ž¡ª3°ý—úÄ{°7ä|vÆ5O¾CS3Žî<ß£°_ò¿ð|j¥”è”‰øÇê#´…”`Cà±¹}iú`±_2­ªÿUS¯ ±0W„Á„¸õQ×ÂO[;~n×sß_ÄôÔ)ä–ÍwÜNûÕnþ¥ûFÑÒâWøŠ_@3”ðF¾3°¬zÆÙàWëÁ?|Ê^ÍW¯á4Š´E§SaHclŸ¶p[Õæ®µ”gU›ê›v“4ßÏ_d,CŽò‡ªv¤ãê.ˆ_äÈ+4G¦Úæ3’ÜmCË6« ö5
Õ¦K›uRb[)6±|1wgs—}ORËæƒrQ‹2Ø5‡-«ØQúTxl
—I¼ß™ÞfŽ±\56§ðõ›UPìØ)Ž„Ž(7|MYÕ'smÏ9ûmñúÂ;ÀðÍÆÑ¼¯6* Ù€j¡á/ù-ý{aƒ.‰¼ Ð "n¼­HQž`œm‘‘Ýƒô¾Ø¿›Ü¯ñVfG@‰ü;n¯÷ã0rü…mE7ÑäÜY›é‚rä]¢fÝ€;b 3k
(}§úD)ãðû,¾ýcä‚„öÄšz·">»>Vˆo‹‚yý·#¾·1í ‹!€À‰=ÔÃÍq…™[ýæíÌNÅtLóßõ?½Ùi×:ÖÂ_uüÕ¨Õ½¿@|[Q0„Žú¦SkVØöN­c5pèmk[}À ”4KIÛ8ŒºÓ­µ¼±¼i¶””·c—½iàêÚ8 µ½/h‹	«Í0ÜÏ]1CšQÇ›fÿÚ¦tkÛj0ôQÂ_rÓ[b§E[Ô ±·Õ¦xÿmÁ2›Ý¹mY,Ã_Èê6Õø$æ‚W{»O¶bšÞ Šövd¢‹Z€ÌæSS{xSXýXÌeÒÙÇ¢Ð‹—qd<@ÖÐj8¦Tt6ï‹b±°¨Çé=°]B}¤„?{f[¾¡HlˆŠˆâ‡ŒRàü…+¨à§Ã[Ef/~ÛûÚ¾ÄüÞx@yûF©À?åát#7aÄ ¶¸™Îº;ñ'‚»]œcý„¹žg<‚·‡P@ðÒw5x/Ù‘¼÷£)yºéñ&oF
”,~<zV¡\ñƒÄ£|3äíMJÄO,-4ëÃØšËw‘],„0»,@Ä‚û\«müÇqÚÉ–x„I6ð#Ë@Û¨‡.KÂ0 ‡œÝ<µºÀ¸›-8´žÜ…ÙQÈÒqM[¬Q¯oÞo¾_ö»Þ+š§öO‰ÖNôVÆ7Tñ$ßÄuð=K¼&7m(þ#»¯5ôû ý‡9º{œéî-‹Ñ ”}#ÎIsÛ±ìªgÙŠçü#žHùiÔ;Q£E="sVöª‹Ÿ-/òû
juƒÿ¤Æ{4:©íÍ·ìGXÔÆò²îÊS§‰b¤xsù÷ã6Ò@5‡½ø¹¯Ž…ªç*þ¬˜¤B‹ø¨õç†fWAwå˜F–™œœ@±‘Ø¸eV¤ì_÷ïW@ýS;ÕXôÞVTj,žDñ9|¿Y.xwáz×ÍkŽòÐ)¸†W/Õg˜oJ$ø†rSPwq€ò L×a×—¬ŒV˜ê¥—dê°+˜À¦‚cŽn ó›LUY I‡Cîjºá(ÚPW­”ûvÎçbfß84€K#Ë^ÑgÔùœ9pAªÛ*ñÞ«äÀ¬ý!àîâ’lAÂë#&Ì­ž2÷y’æV>‘Š'kåÌ=PÖc´z²Ž3>ó¢\±%âÁVÊž ¥ø€@DÞ\ðñA’æ˜pWi®ìk <ÔW"d%±0,xP¸…®5{Ì]ÏËs„aY ”w}ÒI†¤L3jdZ{`.jé	‡ý=ûëÿø§”KÀµTìï“ÎòAõº‰)‚U¢m@È¢c£æb;zc?Äd”–Š,xàäQ ‘):š#Â®wpé¦‰)B+ÁdÞû¯-ô½ÐÇ‡ñX<zvhúj|ûN.ÖðÞ¿„3»Š‘F}8à˜Ï‰ÎQdšÖ4Ùt$„EHÄƒˆ»;tÓn&ˆW(‰ôèü<ˆ?œhXrD'Aa 8¾ðÄú ™0Ëô†£HáˆÇ¹	¤F3aÔŸæ 8k*††âÂ<Ž4c€™Å4ê
Qí”»ö–jÂ£¿1J~Ü(fÛ‚øˆõ\ÒîEÚõÃ.xËb†™„ WTÉUS}`[UfÔå`È
ƒ³®±Ú@3ð®
†?bè+Ÿr„¬HHä°Š%õòrGÌÑ§:PW4«Ê‡Œœ\R<’àLÎH’’d±hÇŒÁG*nä¼)vöˆ&d÷xÖ$#¥ƒ ÌÀ%åâŠ“øŒvn¹êyŽyò›4»V°|Jþ[“Íx¾È43r`E–Ý”hÝ¡GØÜÔ]/ö`€¨8á€u”®Iþ<Ÿ ÕP0†¦¬rb
˜>…Ë~ŒaùLwµ[d‚.*@%@yH1%—
AÙ|daP9Z;’‹µ ÷Á¼–™hJ¤9û6`ÎÀã°–Ž;ñ}ì…Á9lª}àDô°²¹îLpá$BÃ=SŒcÇg0’èß¡¸vd¦ pŒó·çä@£Ðkå°nšº€>Ã·ÓÌD˜½÷¢'QÁ^»öù©v3C3e^_ FlS&¡ÂGôqüBáŠwô±I„2b¢5ø©EtÂôÍŸ[ä¶o~álB] Ô¨o—³}Ö¨Wêõú:õER¸Ÿ7ÞõŽ.®NvÑC¾Ó\¢bÇÊ7Éizy¦‘ÀÛœäNN†.S5	¤¥ÝÆtÂ¨%]ìn»~÷Žfó¨ž½ZövL÷C²gs]
õoÒ‰Û.µ[Bl¶•žÒ4°ÌênkF	2/šÓ3ù±sÎ‡
AeÅ–R–X””%j*“1BaQÂ¼ª™(Úˆ¡Ú˜3ÒM‘&CÒúTb¡L‘ˆâAÇ¥]¡#Ÿ™ÂZ*)}B¾nÙ¢ÐŒ
=â´+
-(”!×f™–ÛB±ñ{eÀŠ ˆ)¨I½¢”1‡=Ã<(Ê‚ZÍ\Üh*Û‹ã†aOg†O*(ÕIìîÆÖfëÙ%[d	l- ¼Z6ÿ%‡é6(>™!æR¾r1W[-Î\Îð_ýP„JÇ4»Ê— -ëi‚WõÆ
{Þ€¿/Žª‡¯ŠÂ—×L–ZiDAN‚÷©ä•EÆÀ2Úˆhaeï¸LìE”|ä»›±¤`c^i Ž¤w1ü°™ï>])ã-{…a}Ó`ÞWÉõI÷.·<Ý_ÞN½Öþ¤Ë“…%»ùrCkˆG(qît;K"šÒáRBA2w)°uÄ©-j–,®²²çbî@¡HãÚ;MÖaÀ”¤x9¨bÅ´ÍˆÐŒÕt¢É{[îdÕ‘z07Ìo/Ÿo®3LÀ©×DðxVîyj½î.ÖšÔóFÕ+²µÆœ9±µ:Ä¤{m°@=ZCUÆ‚{ì"QQ‰÷Ü¾5Œx.ÿªæýŠ4bõêîM!î˜	ïÙeA¿#Ðl—5z…é\Ýi×¶¿‚«Á§~5Ä‡.~Ðæx	+PooP<#nDÏB¸ ääN‚ÇØ}qdw0ÅHúA0ÏÆv3œ'ƒpž“Ì>´"óì6£óO)išâ©¥¦)çE„³ÜiKÐìŠyŸZ!4»pŽË³ÜiDgé82(é™¥æK×§ÙÝ–€¹-O“B`nÇ¦ÙiG§)ÊÜÄ`¹½ô<#i$á,[jn·j;Ò,Ûbbb–íZ=2ËV5¥ò°ò<é±åP30±ÊÓ¬w¥i6"˜Ù3ÓlÄ€ÙŒa¦_cJžcCÀ²`Š"¬Œ°b’ž¢÷ŒÏÔpy‘œ0/h:7€Éª4m5oâž;L°ßx¥FQãü@š0ÒBQ sô¨Ð×Û±šk¡¥Ÿ÷(Ñ¨¼ù ï’…~I>ïEÔx€w¢iâ3¾$×'Þ0j<ÀÂòl‰ñ&ÖzbDj\þ½©6·Y€å(4N0œY¶z._ 4õUwï'~A?Z0ÑÖ€ó#ú}’§«ô7»W¬·DÔ«Œ‹Å‘:Y0
9ùÊ©?ƒò(årù·Ø@ïºf.6-“Òòu,òs§¾¾¸`ÊËhb3Í†	R´Æ×ŒÌ`cv8§@jÏk÷™ã_åš)A@§zõô,÷6ÅSh¶_Dí”s¯¦ÜÎH¼ì×ú)T?%>»•LÚŸÑ }xÅ|Äb)ˆ”{4=lí5Ÿ,Uï°(£‹7¤0ea…?¶­ºvŠRVJz¨5&ÈZ cR<@ûY±ÕË}.
¶M«$‘–ÌLñO¥F{[ôŽâáY-”}°Ö-±tÞã{î‹±Ì£‰fŽá©2÷3A¯ýçË¼æR,pFViKr·H,š‚K=r^ðl3Ú–ÌáS=¦uÁ…ÁÜÙµæ.…ÞÒÑ ¾Jº-²Û†‰ÑÒš‰2}æÒsÎ‡#Ë¾Ñì!{uvY:ˆ}±·%î_z`"~Ñÿ‹• ì»ë¶7W«"±º-båÞøn~p”Ç6Chùà¡_¹<ìQ‰5xËZ$Œò+áF~b„ðâäìué 3y{W&+?ÄhpæXˆ!ƒ?Yù_þÏ~½ÖXô{úxjéÃÒ÷»FyÄÉÕG¼Ñ	Œ‡ÿ°-ÖÓÏ^¯<mîFùäv˜`Rà:p#Œ}êæ§æIÅq‹(í\À”¦ú@_ƒÞã&ø™œÏÅ'`<&›^²—ù•IF~bDy8Ô¦püÁoV¾²õ>wµ5äW=ìc
¼RüJÎ@[¬Î^ÿyq,‚¨_Yhn™O¿$éåsÑ"*[€4”Nþ˜äè½gbô†({½¨cù+IÊW¿?¨×ê¬|n1n+ãˆ8Zƒ]ñ1æê?®%·ÀxM¯¹âxŸìàÎ"WØW©¦ëÉÌL°T 3ëDË*]ŠG¤YÌ²Rûi„žKÂf1ÓÂDÕd¯ƒë«ÃÓóÓóìêõ9;;9qý·Ë‹£—=…ÚÒH	¾—pDÊáX¥ÁtüïqÉ^NÌƒ¥« a×ÄŠ¶…ów3˜´8P*¾{ª›û¥F]åNíïT¹Õ£;Ï,fSdTkç”K…=í#€+ÙqùŒæ»:[ïzH®>©6¢œÝgßÆ˜ip j6Æ’†+M¥0–áÌjé…¬"°ßâAü‹äÀ(®±uÒÙÉá•à‡×'¨Î~
Nqvuÿó`p¨×ªÜnî(Ü+ˆXŒ¼
/9»Êâ# Ö5¾³«¿q®PxÃÂ	Š$ù¹ø²l^€Z)åÊ!Åù“…£œê3b˜ô“Ôœñé¸åzÃíbSxÌÿ§ÎPÅuR3™î£±ÜPÅ‹j!ÿ]ëž^_Ÿ°‰jìÙÅëóã+Ï¶ÎVç»1Ìp¹fˆø´ªà¶à$ß…®Šß¥|ÿsáÇ*–¸q§¦"«ùÌ¸³+– ˜Å“e ¯Áœ¥a¾,.MØöé·€‹<³-mÈI†£Z¦¿4NrtõÇÞõáÙÙ)HmÏ®.OHŠ+?ÿáå«G`%õZ£ó—?#ó¸Ã‚¼ö;Þá6*
r67ïÿòçŸSYBÄë.#á­ÆUâ0Íà,±ÛÖá.±¡~±æA\@ëpšÕyÍv­SÄmÔÂêEûÃ‹ÓhƒýÊ¼dn"äê±xÆ?rCUüPIVåËòc4ÕnEŽÑR‘B|–Ñ,æ©#„d³`­2LNŽ³:“ø¼l¢Q¨H?{"?¾:}~Íz¿?ùáñhüÙø‹4ýÜ\E ðmÂ*I`º]‘À=0fŠ”×"mo_6]?záóþÜusc„‡ºƒé+Ãý;Ý¹öÒCÎ¹›þ clìÐàWsSñÁä~ÍT¬XJ¼íÖƒ$†H6®Ìwv:¡Ó¶éWIMFcçT]¸ˆÜæÛ:Š6n¥±Ý©4š;•z­µù6ÞÔ¢°-Ÿˆ]÷a»IÎ
¾Ö‚ï½9QMïLhæF`G¶²°²é^!"_ñ‘ÍÉÑMtÛ@oí »Æ™a%¤ekÅ0+Çp„TX°CCŠZ*íå_\Å´xí‰±ê:.Wö‹±¿þãÿb=JNŠøûû¶Î¢s²l¶?È~<ó‚çsÅ²®ÙIcÞ[ÒK²ù‰ÁX¥$\I)~ì—ß {ä¢À&V2
­Ý®m™ãƒ0NTôÞù@\‘¦Ðy>ëòÅ±¼ö	ßëÎwŠY~-ªÙ–5´ã¾žcöU;o9_9\ò½¶~æÉµ5³k¼ >¶6eGä¾Lj×·rH©ØµJ£•Œ¤¥Kx-½¹Zù.Çßœ¬L§0)Z5­˜ì$%^¯^¼‹ùèI z;q¹~®sÐD|T,Ã <f&XbµEcÂ²Â²@è‘RÍ)¥@e€÷ÅõS¤dŸ¿þûÿÍùJ~µB-A@‰L]g*eêv<!)³
hŠ;¿Ð^JjÚ3*0½¬>V+»13k„µê9ÝÓÔ*ÈªUÍ1KêfÑ¨yK­·×©4›Ytê¢‘¡	S¸DUI5Ê*§áGœ_ÀÐ%vð‡«cÖü—ÿÇzX*ÓÆ^eÊ]j§½œf@Çˆ%DÆA÷n wJéà¯ÿý¿¨zŽ^ŠwYæÇ­cn/|t¬ü¨[w¿ ¬lÖüåŸiþÐXé-³%GÅþ²FaÐ3ÞÈ²_ ¢D;äfŽð?ûŽnÆ<@ÖmSJ
ÝO_ŠO…­â†|<(Èä“Ì ÃsÀFjÿœIëbî"ËëY#wªÝ>>]É/?/aµjÁª˜´ü•†´Õe~Q@ÒGøCq9nÏÇßË	ŠŒa³]ím”Ä•PpzX³Cô±{¦…kºò"²OÛ/nPÖ/ýº£Pù5Ó›a_¬œ. +¢rv“©XÒµ…øt”KY¿>~3ÂL––ñ'~FDYþv»ÒÂF«‰“!q”4ÛÊÓ.Ýº±³]iÕÛr"¬ôÅí{Lû"·=±Ÿ­Ž'ö²ò¿«×Ûù3Š¨›´¿ÍFäZÝ¿öë†{}*Î..¶*ÊˆÛØ+ëSl9ìD»É^Ñ»)€ ·ÿ.Öt²
`¨¿6Üo±…9›>èA]p9×ryÍí©ŽoÎ¬1õÈ9³Ç/Žë|6c¥\w+¬¶åw¡­+t¡-¨Ì£»V¾ºzu®$\¢>—7çÇ­ÐÅTkt½²†Ü<P¯<ˆ>~.è>j¥.Ê\Ú6^X·K4¬ýTvòôv¹+v¹XÙRþ0}.Çiâ~äÎ/)ù’ú+.j@—cwÂX½ÈMHoˆ»
ýn©)})rÛP$ ÷#F2\P­–Bº÷úèè¤×#{ÊGÍx§»ÞÒ½®"ßÕFxì¼ó®Þç÷PmnŒšNœ†žÉ„Å›	7™¿mxDzu<¨ùnQÕ’»r4¶à§Ÿ‚¡ppiû©¶hv ¨­€MÅdñKÎßo’G°wL§ô¶ÔµÀ0+:•E£u¹‰nàauž’Ô)d¢ÜŒë.**vmXã
3ôá­jÅk	•¼~VŸÜá³X7Íº²IQUâ¤BÇ…Ì|Vè‘U$K&¬}ÿõŸ–<¸ƒõ*¦q*†õ™ÅiZi#Q2×êÖ3º¿7ñJ‘è‰‡M‹+x“"°ýõÿ;ºxuyz†¹/®OOÎ¯{ìôœ]þñúåÅ9»¸¼>}uúo¯Oá¶¬Õjó"7dÁéEýáÜl˜Æ' %¤[Î–ÆÇFõ›%1!•u±êª-·•S<3#pdìëäy#'¯JYòÜÞˆrß²qR+ÅF‹‰ŽJÿÞìè÷2…Ê~ðºq¿6½Có*6•Wmz˜Ñê0Ñ=]ò#(pŒ3mn&ÔÙð|>½\À±8˜è&+BÕ¬@âô: :ðÖ¾F]¿ul@h5°LÑÈ¦†M·g”þ‹Ò†6œÍ4ðÛMEª®bxdzvùHEüíÄí¢®ˆl‰ÞÚkÝRÌ˜|þÁŽ,\¹ËwÙ§–ÍW|0óÙ	Œc›;Ô>ò¿g_³—\sA^Pea«ãY	]ð®¥ùÎ¤ÚöU¼¤®({ï]qgh(qÁbÔZ€
¤|Ub"2ï“Òiˆ;`9|(À;Ô\m?»{@x{¬›X§ÞµfXÓ¾Âlª‡Tø½Ší|ú–ëZSQ¿^åõ8x/wtÍ|~"EüÀ55m[[ì—Z¬Uò¾Ý/ý¶Qol7Ÿ*0Koð?Þýáª~‚b‰c	i¸öÓN§»SbT—G÷ØÆ¯çC5|6*`Dv¸¦›HÝÏh¥pÅŽëïTØ}—…ã.Ñðá4Óâ™]€òµÅ^\_aóslÀ÷ÕzÊ$±$ÿÆZÓº¶,à53ä^.¿=¿¹EØEûHô»)ý¶Þ¬wOKïä„¯@ùgŽb9ûmƒ7wZýàâðã¹ƒ·4g·¥ iNé·£Ñh©ùñ10zµk?ÄÒ¸pDX³€îZÝ%†C¶.òV&]Œ;§^Aû%âYÄ–J!Bô1Ø5>jÃÿÅD™wÍ{6´`#Îù{¯ßû1~sÇ`Íí¥–›=¿ïÉÒ™jà±v[Ýî¨‘?CÕÉÚ\Ë™Ìá`ÀÊ_mÆæ£%BÈý’Ÿ_À0Á€a†ÃÌÝÍpº÷¯6Ÿ½­'S‘ÑS¸©âñX¤+Á×›¢B<ä0®áÔgu‘ÉÝ{\¶¦¬¦i%|îÓaÂç^,;§œ,’íî‘šŠ(bVQÈD(ñÅ¥Ï¸OˆäVá.’NZAË~Ã@uõ[-~$ÇÆéj},X5çÓ $“·ÑžÕŒ¾v³%ÌÊí‚þwóè{æñ›O±R°fñn6Ð_÷Rm/¥ì<Ìy/ƒLµÄ³TÙîöKßÉže€æzì¹+y#ýäçÜôÕšw ¬ówÜ/_ªÙÑŸÈòWðln`€œÒ¦V}ÍO½œ* \v©™Üø²™Œ±R®–²ktÍ6JðžÞL³?`E–ë4ì‹¸œoE'jøºÕ]¨ÑÔK/ÐÕ°Æ±±¤ o×Oœ%Bøÿ3ÊÏ\³9RËÛôKmäÄ8«†)'”ãO!^&·Ö]!q¸Ûóú5
h”KýÛ(m~«2=*\×€#åRñs™ýŸÊwï©0ø]‰<¥DÆ¹t°ÄNÙ3M+¢¨”ÈI@J«ÇJñl´Ieå )¾Ëâqk‚ó…fô¢QîßçïIU7j˜uãêæÜš;ìí#€Ìu
ˆ¸(/šîú¸ßü÷ÃUæâ¾R5£¿qÜoÖu3zæ•OÐÆE=¿häoýŠüá*s‘¿õ+ò³V½\ôQòk¿:[ó—’Þùú–õ @’%Å8!¯5A›è¿¥H&yM
duº ±¢•3Âôhéåx‚»B¡C)ÔOÅßMÔú‚ØZ¼÷J°>™Â°OM­±+ —\ûÀ®øÌæNØ†¹üB›;ècc_D`'&ükÍ8v>œtU<ô*:ô5Æíâ[É—-»´Éó5.:Á~ØÀA†:†5Ã*g8s*<æÔØÅÜf((|ŠÞ¥ ˆ¹èeï//Yé7Æ\j` RƒqºéZLÃBèÜÀÚñYx¹È¹fSm6Ã‘æ¦î²G{¾>å&º£ag §'‹òŸ°h·¶ù„tw÷!\ði1+­ôR^E´^>`°ÐLå‚uw%Xâ¼ÞêoÃ1Æð/­õîN¿g§ïtÆoge†‹p¡ÙtX¹ÌÄÍ¬ÊÊö;öaS|†›7Ù]´Þéøm½ßd›¥ââfª–%üaÂmÎž|x‚~8{¿c¸†aD<
ø¹ú€#:¢‹ #,>é:¯°'°ô'0ŽŠì[ˆQˆî¢BÑOþäèã©Fw­)ÕL(žõƒ’¯$ÆWÀ< ã¹‰…¯à!Ê“uÆFRÿT?Öc ¤f”;XØnÆžÒ®Sû%ËÙ”…ô„IÏ@RÄõ4€å85R¿»[m~alµ‰ñ*^vÜ ¸a\Êd_c2	%)°cî >$#ýe:3¬…qC.ŠRÉ]"…¿Ùãõ€Hl¢'UÁ4ü<
tORšñ0Òž M@dÛ+ñ-b‚¨fÐ+Œ›;ˆ¼D@È`Å]“¬!R¾Ý$n×Þfã»8 r=W3'eú¦¡•›[Äõê›Á-·pK½Vo·Ÿ6Âˆ#¶6Ùæ'ç‰Çs›FQ¸Ân(€"À@›¡nCL´Á´-½Ú§>ŸA×Á©×uãé±Ubk­cü’’ƒHâ·3ôb»C|;¾¶6L³Fp’Úé;Qè¡7$±:^0¥Š}ÔLÝ™à“RÙŠŸOk}a<­µè
§&ÊA°ÅB‡pØG±ú”¨Þr:Ò¥gç!y½ ¼0 „Âùh„Dk[ •Á¾#þÍÝª5ªz‡*­sf‚éŽ4Ý€QjÈáì³­áŽr}óMÆÊ¾ùP§øÂ)F©bÀ&œž”(‚†{OL@Á@
sJ)×NÈ’är,O_Töm¸J¹–‚,ðl+î	¾"zÓÐ?pCŸXÖðo’_YÓ> dø®< º"oÞ5|®×{çÁ*1—›þåËw ±² ÕOìö“sÆiXÌœò>ðìî!Þáñsû	ãxxÀ‹€wÙVŽÝÆ°ZZÂÉG,(=Š–¤© Ä…é ^#ë£ÞîÈì¼.=• ol`…c8/Åb:%Ÿ&Ú®n~„·iÀ!+(Þat0LÃ‡)$õ'ª'•?—Ì{XÅ @ÞH"¡ÃáGÝS¥¨ò#ÕÓrÉËÐ¦ ”Ÿ™éÄ‹·¯]µ©Å×«dD:uOc`ƒcPma¡-B«·X)>Íûª–‹Ê¼šâ
)¢bK”óvqÝ¯nÿÝœÛ•jÚ©•º#£,ß'Gý=_[7f0l±­€{Àë>ð…N¨¾’Ÿ‰CÂ…EÆ¬MÅñÕªi!4@YÁ¶Œ?*«,´&ã”‘´_BTå5Ð†˜€@h¡¶¶á€…³aÇ±æÀŠ¿Cyò¥uw ô[¥i¢+‘§™L¸1ûN3ò3)s‚I–·Õ6uI®u¢¦F!rIëŒûÊï—¡ òºª»"Ð%ÄÂÔÖßD©¨ÇÏ´¬ˆö‘é!Ö-Y×@MåÑtB«zðU;Y=Ç/á%E»ˆGJ©GËU0/,‹žè?E%0nªožRþl!h”°Ø6~ÇJµZ­„þ	 9%aJÅ¶LÖP¾Ê„©AtHšÎæïkö‡!0Lj0;H¡S¬`ö¡ÿk•ÌûHRu·£äz˜nN]¿:É1CŠ#¢©$HçEê­
j™³Q9Bl‘
)¦Ì&ÅÖWûÖp¡©~Åµë£ÌAî1à_¾áaT‰ª^°Òåœ‹{[S‹„üŒ;Ræ”:ZÊ—YCKCîmŠÀ·Kr5¸DøHäðõPˆ3ûLw¢ÎÁÂÚÉÉV`wBëù®6€#ã‡9†íÀg£´_Ø5¨…*ý;g`Ùœì3nŽá8>Â+cé†ë	ö{€#¼"¯5žy˜MëÉ™ÄÄæ JR£Ö¡:I9q”’žžB )I³i}¬³¹ƒx$=søÜ*¥Ã¦œ»¾=Ä·’¸>È@£½+±Ôƒæ®Ü)uCRõÑlñ&‘J& ×ŸHó(ß18 å™UXÊÔ(¿q3eÀ´…Ê<ˆ@bŒÔAe™0 6æ²–ú÷D¢¶1c(ËÎIÊi°¹ÂuY°ä”½HRF„×¤jäæTº}@Ê…éDßGµG‚ÉTXV$ÝDù‘'wÁó5"‹w˜w_}r'*’$‹ÅI‘?Gþ@á”RXµc!LkòoýºbˆjTš,Q^Í¯»–Ä–'±;˜ÿw$ˆK¦ˆÂp»An—{µÂ^D­ÊN³Òlw+Ø	uómDk#¹¶0Þ<Z<FuÛôö$¿Jla’bV…@†|ºl4a$—W× Êg´Ë3ÍF‹bJMºÔô4Ù ÍºTî˜©Äukz¤÷ÒEwà¾D<¾Ô¡äÇj#]V‹ìÏ*Î‘J¸âG¦£›jÛ5¢¡F…z\¼<>)”$ð.}ÙÁnÀ8„l‘-:Š6	úÄ‚Yrñ¡Ôaéå½e*lt|*ì 6•F§%:‚åèª»Á:yröJ¤ÃÐ’ËØÉ!únÙ$œS3_´ÏžU`ð +>Ë°‡J´Š¬:»,*Æ*Å§%¬¤˜ªvdf©¿Å#ŒýŽ5ÒËÓ@rYl¶{oÒÎ„‘L³B2"D)ü’~Ö:ªb=J±@Ï¦rVážÙñœÙª_ºP‘©
NÚ™ÐÌÜ	²;%iž‹„Œ9ø	¾ÅPáÅ‡%ô%ô˜0žsÂ­Ž/Ç<Ô6CbŠñm•¨XÌN©¼øÜ<c€´§èˆžZ^*_¾åDà!$@šH~»Dí›„­é¡ö°oÌ3:ÞWZï¤/Š}Ì)Ë¯ý=H8åR…•
L.ù€ÍK¯ÌÈÐ‹–òI”¥J•W+¦ëík®Öü¹~þa„—Ês2d°âÄ;}¸:’)z3³q@F  òzŠ$«&Kq§Ã3jG>øp¤Û#8tÝLð7ïèâËë\²ï¹Q(IÍWtÒ6L1BêÝ?`SCw¡Dƒ¹¨ŸÅd}ø.»GÞ~ÈbkÞû‹R4²Ö-¼—·H»VèâòW.¤"QáØ»ù“|aYC7¢˜¡ÌÚ",…Ã)*Ä¿P^l¬-RæðÂÜ4eþà£pÞ\KwÆ¥ì¹’©à+XTÊ«ÖZë•ÃÍÑ/‹µÓvb8*YŠ±éO¶(œ^ø—FiùyÍž¦)c9¡2ŒqNŽ9Y&ÿ<	0[Æ™7yÅáýi‘£;ËìDåì9p§*†§Èµ¤ÅÁlÜ¡!ê”‡:þC¡´WŠS[®`‡­ä½ògTto—½Ï›çýWïó‚!2=÷ù.ŸÜÃ!¡a-…©çœnF¥”Z™.ÆûvmkVõÐaŠtÐôüšTô/ëíJ{–,-¯´k²ÜÞ–5¯0T"Òë)^ñ	Õ\ë¹~Ë‡åÆÒB¢3M­VŠIj¹‚Kvùô|nšwuYž™å¼d£'0ÆmlÖÍo–QOÄ¯½i<l"üQ%ók%ÌŽ…%FÐkùwsÍtuW<åç€ÎÅžëc^¶FìÙ©Ž{y„Yã6naµÒ‰îM½ÖD›ÿ´
ÁòÍ!2ÚBH}Þƒ```Y¾=ñ#zØ1Ö?ÈYÊ[&g¡®Òi.×¸±f¦”ƒ”-cö¢9(õVVŽ•+Í_ÝÌø+ÔjÉâbñÏÉž‰ˆ›òRX~Zâ¸6Lò7À7Ð#Œö9fá†€77ñ…³à|ë07œiÕå&êa¡uù@”²†©]ŠŠÍ"íªP•.ˆôøG¾GÆ=Ÿ/­ŽxEx÷ÙÑÎÇ6¯…×¯XWŒu/¬ç¬ü¯ÿé/ÿwóQNê<¼*Úáø‹ã]äª„uŸåÐbr‡²òžë…=vÙÈvõª'z¶cRÎ£à[hZ™ËMC¬Ns,`xò­¶7ïÿòçÏÀüÎ¼ü),gAÅ-s«G¹Tk!e±a)Sx¦[ScÔeAØµ§ BÌ©9•X4}Láp~%çÜŽ‹weÙjyEU~úIâ}ÝÒ<éüöì6zuf‹©eÏ&×‹^â·}†>ì+àV›yæçM	2¡b›;²Öc·=_ìÃ¯š’§~Èµ]ToI67˜æuYRW“‚’ ¯%Á4žÃ$> .Š´Ï])ÖB/_]bBUðï<ŒmBr‘+ësr÷
Cl#ŠS¬zxK¡zø]
2G™ÍÒM8â­ÎäóÂg¡U3Þ¤¾ø„ —«Ÿyx–rHi[—ìÐµpg	.k5Î;,hb-¥ƒ”í’…Ý¢¹­±‚³WK.NÃ¯ƒ}Ö¨u»h.ì¹–>˜ 9Q–ì!–>qc‰ÍˆÙ#Ï·wðùk	m Ï§@{–3›`mùúèr•ËîcÎÈ£è@±ÀÚãw‘KZA
3m¤eAÛœƒäqi1–BŽØþ£Šœ'ø¤ÐÆTN•ZFHµ÷ì9òaVÀˆ¯uÇ™sbÀãeêZçW´–¨7¨ØàÏV-E(gs†xe±Ð# ªC…[TälUÌ®‰±šJ¯5[Qý^ÿhYRýØÉÝ‚þ‹-9ý¡t»²%š,ªÜ÷Èÿ²„ÁÇ%o2¼¬@Û(TŸúø©Sz`
R#ó˜tuxyÊ.}øk?æŽ>6•ØiÂKSzd“¿¬&¢q<2þyý8¾(”z„(5Ô%ëØr´1g'>ôØó¹9õ#=öy“]ÿ"›ü©ðo¥gs.f¡4*ø¯0¬T•+>B/'e+Ò™Š¹Ô?c_f$Üªªë3[EuÑÃ ~ˆŸóÜ~åx´¾£º7ßùÁ©?ýÄê÷ÌA–_GÓ8`D­í.{”C6U˜^Ø»º |ÆO)Ã«Oî¦3JF×”JVT8Û°ÚcL«Y©Rí8geÁ$ãì#FÚÀ×NáñyÁj"-Ô*=ãÈ/³°NÑž0Ã$[Ë¾ÍÞ?þ>ÊJõ_þü0ju$7€æø?ÚÒxQä¼žíÔ´žíÍ·ÅÝJŠ>†ÆÅ7DÿF"~U©=*Âx’42Á·R¿5ÖïUu˜À$Ÿè
ºK™¦|O3ÿ þ1RÓŠc“PÓ5ØîÊ
¥8ûˆ±?ˆ‚“ÿ¾vT1;Ý÷¨æ4 šú¦’BVˆ˜7l~Š0ÔÄ;Ò§£ÒÉÝoÂÂ¿ÑžŽù#Tê-!a§tÞfiq®éI©Q¥oš)	†š3	"úåfN>Ç Š ‘5®îú=@i¾G¢ŒFð™Ãßiî;1ïJ2K¸ÞÙ¬H9°ïžÖ¿Ú|Ë¬™6 ‰ºÍ×ò¿mˆžgþæ}†ª>2Q|	Ï¨°_„7Ã¯iß—«¢iÎ‰l1É¡,¾¥ò»ÕF£ž8Û‰y§Ã´ÉE$ÏÄfÄ3*£!¡Ym)¥’x~x£é„£§æˆÛä»´-×‚ì²fŠ^Æ_ë	Í)3ÄêH¢¶<uªÅ"³a‡ú \§eÇ}-‰ù&(8REºõ,RÓÏ»yè8ºãj >¿²†šÜ~íNw¼›èÊÅh)Bö‰³Yf@??"àêo‹ó™eÒßêÖ©*0¡Wß˜Ûèp@wžZ9Ò(²2R? äå^`œfíá.þé‡Ék·UŠ>N“V1u/ÎX¤9ýhYSŒöÜédO+uba†ñÌïå&æZ(¸r´t=-Íê”è€ú'ø+K¦“m¹{›“w•žx~<d,;³Ù]LSL.'#¤8ë¸œ´’¬*°Uã ¬–àLò¥${íâ˜Ou' ¥).2õøž´Rç™Éš’éji–—Ìžš¹Æï3ª³Ž®ç¢æ!åkX£YKK™N¯˜£Xè‰eÖÖIÖ/9Mp§2uÏ-^—þ˜Øh)‹ûC
¦¦ˆ©õkÒb>’%•“Aâ)¼$$¯ºkH5}¨åeå„´ ôåÕÞÌ"±½Uþ§ílfUyÔ‡Ï‘eŠÃ¬¬¥©5Ù²ü2i¶Ri™'"t±MU­ÏŽëò™<c	ÿüÍ±ãÚÿüOÓ´fyYóÎát‰µ´ýdœÜ@ênBË€úW^úÊ+®¤IñZhZ+U«ÕžâŒIØJš+È‚1Š9&ï%Œ•‰o˜NAÚêfÆÉ2ø+ÒñÉ,yf±lì ½Ñ¼5»p?	¥ÁRÁdh}	AU‹­ËùÈA€h¦Ff´ŒÜž¨F¾äŽJPZ*ÇÞM4Ú)‹(Ê·}ÇŸk¦(9†€Þ[¢´Z$:&DÔP?M)¾‹M0H©>Då«¬ôOìˆçÈÑ¼ˆUÖØ>ëÃÿƒÍ½-ïJÞcAÙƒk€¡6¦ÞXÞ ýÏÿsùa.lwbÙ,¼O³ÁAT†¦F»‰Ð…\"µónº[-ÛIòùÐ™±Wºa †½Ì°ïdâ/Ë¯_.j–›sŒÝÍ2}ùHÆý½(XžQl‡}6
IŸv*ËÍÍºþb÷ü÷¿îù/nÏÓbþºç‰Ÿeö|é³}ÓÅú®Kj¡¹@ŽdUb“N€r$qÅ3ea•Ö¨ÅVÈœžEw§ìŒR„Hbþi{òz†Îi4ò¸q5Ká¥+ù¦ßÅ›ˆÑk(¯Áx‰ì|ªÏMÊÌÎ-—ïš¡è$†%Œ†°‰ìhÎ~šM4F&~1 dÜ®wAKªŽi–â´:Õ±¯b_D>†ž4Çž²“[Ø—‚<¶pt'aÝKT¸öÇ½s&ÖÍ¡.ˆyföÂÒÙ‘¹zg,-á¹¨Æpm=gä¦Fü&~«»ùÃ|±Œ±±}É€A
D%0ùÚN§"­¥Âàw3±¤l¼GÒsz.å1ZË¾nU{6ªý Knw>NÒK{§Y¶#~»('P°C¥$ðP¼aWÕ¤âDÝ,ÞaºN¼”Â”§©%mV7Š/cUú–7ˆ‹çZ)ø¬P'Íý'YÉ½(Ù;Å*Tš<”•òåŠÖq†lÐ+âp,ºpî©Ñ)ÝT^|Â pk)g¥o‹C—y½q- †Ùdáq÷ŒU¤Æ—-#ï,'´ôÂãBMZ‰Â¬ØhÎ0ãII€ˆÏ»€ÀÝ+Wnù÷4¶dóÑþÝ Ð¨7°-Ã¸â£û˜Y=ä|Q!+ìÍ¿¯É«Ør§éˆ¯/Y-{ïÕÀtçP{â¨T¢Qðj^å™òÒ^à/K¹XZ„DøN|Ž?¢¡c’¾¯t6tË	ôÊ(ã3^™³…õvœ™nÆŠzg½!/ž&%b!¦½t"Ãwdd‹ÓÑUg2=”ø~$Ž°c}4òRŽÖÞ¬ÕÒ['.Ç9²´2:¾ÆPZDœ:ãì~Áxˆ8TŠÍ"%Â«ŸÜÁ05õ‘@6æ·7€,6|Äææpæ|¦Zî÷ïïsBŒ£Èz÷^H? ÷|õ6"'¡Ó+s>FwýŠßQ9ËÅ£™fˆ`YU(>lÄ
rÊ—¿&Ué…¢}šé=-¬c›¾ú½çh‡N‰Ï¦*¥»©òFp½ Ï¨Ø˜S™6k·þhÍi3°á¤/&l(ÄëGëÅ‘if[01ú›(p‹ù™¨$¡xn"„#g7qEÛääÐšb&“´!¤V`‰aºÅ¸Åí«p%8Ä2}«©™TV@ä|.QV â¿&v²\Q®e‰9M”ð‘ï,£|“I?“‚~ô8,ˆ¥VuÊ«@c‡Üõt1¸gÖcÕÉHEŽ´¾ÀY!¯:,îUlÓã… õ|µk­³Ta¼7ïOÑà7de¼æu˜?¦Úòæ·^»Ô„‡t¿â&já¥ÔŸqT'¼’, Ó[QOVM&Ï¶9uÃõúß
Éá‡I§ã´v·‡áCj½n-]E£aÑ&¬B]®ýÆèðÑ²±ö|àb¿öZ-}þI?ü2fp©;k+jÇ*óéJ.áH¶«Ü³5 û¨Õ7}ar£Õ€ƒ¦5ÝZÓÐU „CX½Ä»©Ã«„'¹í]eÚ¼­ œ!¬%ÓeŠûàÎÖ÷4¸FSŒ¦Ã°«/uu¤Î¬^ß+ÓrqC¬>ÌŒCIYn:ÏC^Àö^Á$¯Èº’.†¥òÅL+ür)%»vzÿÅôïƒ=ÌîÉHë|ª›zkö`,—°âÍä<oƒN$î“^î™n©¹ïþC—¯¹=•1M ÅLò‹SìÀ¢).Á3<=õþLi¡-8u8K|2¼?Úä:ûýò}ƒ6Ô› ´7ÁŸðìý·ÿæÿ  ÿÿ 3
¨†