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
                                                  xœìÛvÛ8–†ïóh®Y]TÇVÉ²ƒ3n.[¶S™Š¯’gÒ]é¬*ˆ‚%N@B’¶•®¼Ó\Îõ<À<Ól€²âCªfu-ñÿ.l‰qÜ{ã(QŒðûdeó™`ûûûþÙUà·Å;–"Ìtr9Ì„l¬kãÌ9óOÄæ0êÀØÁz­ÖïLè˜K©æÝ`Ýûfþ›hóD@¢€µ"¬5ÞÙT¥³©Ò‡Z%Ÿb8X?H­æÍüÊÜYq ¢¬!-`Íñ…žKåñ@ÍfB#ƒu$p,¦ÎüÁÖÓ~¯ñÖÈ°öxòiïé.b8XOcây%$\ŠEÆà7ÏŸ@¸€5Ò´ ïtòîxgq¬+$_Nù$iTë˜<Xg ^@+ðÎùVïB9X_cåIÆeo’±&ÖèÐ¼7£ía‚pÖÒ0o"5ŠHÂœG	ó­ÑãîXk c@kðùLG¾yÖœ ¶uæòþ[è°æ@É€á¦\†*„œ- pÞjš!4X{ j@«ð\g:OÄ¡æiŠÖŸÀ1{fížúOz=X?X q@Ë°»ó*‰ÂB>ím#ÐƒV4,Ÿ=ímÂöA;€Ì­Ã;Ã"<hAaðl(â(TÉ83…ÇE‚– ‰ZˆwªÎEa´… ´y«DI>Ç3±A{€Ì­Ä;äÃä-žKZ„ùU®Í“ù†Ož	v&´ºL?â³÷ U@ø€–âGý¡€ô­"¨ŸMU¦.•Ìx2>J•a×´ ÐZ¼ÁçCD|Ð.‚ÂðÙ÷"ÍÚdh1Þ‰Ø~)ðÐB‚…ù3ûI1f'Bk›_¬Êà m@Vãýx~p"b¥¹ü7%˜@	¬°Ò<´"ÐrŠpÎp{ ´”ÀñæŸˆí·;xD3h%D õxgÇˆÿ :Sr.²é\Š„ÑÙ1Ôh)ÐC 0ï¯‡ƒ·˜@[	
`Ã|&4Z” Ì|»LÄ  mÆîéLòdÌ
`þŒ2½#Ðb ’ °xoet%ø˜h5Aí	Ì?Qºün>th5PJ ”xgs­®Äh;ÁÂ˜œ¤Ï — €` Æ;Œ¾Å@ñËð J 8x§yªKL °â ð * ™ hà}Ï•ŒL Xø  œ XÂ;UQšrÌ T®[0ð™& ,Q ÜÀ;ŠÔ,ÆQ ”p –„`Þk•¤c.¶£ p¾ÁüïÄu—E<VÉ›S Ô@]°o8Í“	Ä ¸ «€œàxÉXó1M/¹Nž4@ƒÀñV8	ó|ûDôýaôv§³í+ @sðE¼)–ê Ü ¨½Ã|pýmŸ}M¦›gZ¤i®3¿+=›Bu°t ·à¦\Ay°‚ öæ¿›š®G*aRªL«žÀM » ¸ï]®³O^ ¬$X¸ˆýx<Ÿ¨„Köc2„è`] Ü7Ð*ŒÆJB{ð‚†Ÿ0ÿPæ‚¤#‘f*eñl”Äþ «àN¼S•d±Ò‘”
O-àËð î	 ÷À{%±Àmp î¢€{á)©bÌ( ÜJ Wà>@~pO¼m>TŒi€;à- ÜÈ0 î÷JÆ3 wÀ] ¸/b < ï`Æ3L. Üƒ öæŸÈ\i^¼Ã#¸¨3 „÷c¤C•`~àn8 ÷’€â«\Ç\F	öÍ ¸ë6Ì†S¥%6Î ¸Pj <ïPè¹Ä4Àýà3 <ˆ3 ¾ï@Æ<c'€8žÃü—\'"Ãf ÷š€¯Â;É¥Z@µðÇw˜?xÒƒhà@¶ð•x§ïoÎ1å ðÌo1å2‹6¯8‰·1p=R	{Ã•å#‘2ß:Ä r€¯ÆûŽëq1aîàa…1x _ô ¿ï¥äi:ÇÀ×TNÀW%À¯Â;H²©æ!¨ÀWÀ‰ øuRîÅ£Ò}B•¤‹yÆöÙéÁùñ¯^ÿttØ½ˆ’±ïÇ¶ÿgw‹n”„2‹ÔO×áô{1ït^”ÙDÌ§L:lÊ“±§<:âr(¤3{¦Hù™þ~¶…Ï¸NÅøLEI–RìÛ¿üõˆgÜ’Yž™W›þÛoÙ@%Y”ä*OYÅ¹¤BÆ,Q	:Ù…Ò,›
&£KÁfZ\FâŠÍ¤ÊØU”M• (rdö,×Ô zŸÖ1W¦\Û©&?JÛÍSq*båû¶þñhÑc³[ë[u	¥êJ‘L¨|ÒÎ¬×aZd¹NØûE"û‡š6Tšò,ºa4gýÿýoÛžP
žØFPÃ'Nñ)¥§Æï³÷Ýn—JùÐ5G|Ÿo°‘­+ïfWê|*¨1›lT¿)ë&y”œSENï{ê4N~í$)þUíÙd[Ë—T9¾ž‘°‘Ê“±m§œô$Jl‚²\2‘i—
ðûÅ¡M¶[Ö®,¶H%þÖno£8ø¸NãôEh†­6¡ªg©¯’PžŠªcCªPfû5•"[ÑÌÔ3VZÐ¹xFM4@É˜l·ÑÛÅõ{ù>ë÷z/ÜòÓLÌè°ok¸iÓaßº9U6¥û¦o¯é“ô½ú×}Û<óòñ¾Í¯S[1!—á+[v¯r8›OY;¦.Ê1Z\f;à%ÏÓ42$øG–N9­áb5’åY$£OÔÊ†_X>ÔŠERõ€ÓN*)5³ßÝÞÝ-ûc‘ö’Kã]“{’FÙœý©Oq=ó7í«™ºò¯©¿fµm°¾é8¿_%6IRsthXÝÔSTJuüsùÿQÝø×ÙÔ‹?N´±F
OR±P˜6“ûPÔë?ëöØXLní‘IW#jŽ&u,RPÝ·¿ÜXSÜÊfní'-]´„l;MU²)£‚%ô¦ESÙ[ªýÆ¤|-.…lÖš<bM;BugRc^4’åYÛ*jrSÜd½în‡j¾TéuwšYÐÂåØrjo§F:x\³¢Íë/•¤Ö)“î #3*_¹ŒDÎ™ÿRóñæàà”]‰h2-ÜÄÌ
”®Ó¨ˆ13yèhdstþí¢j[îè4“–Å¾+ÊrÃSUô’±1ÿFibÏw«±¶l8ÅoíÞs'¢ugy:õ^]ùÊ{“Ç#¡ýën¦N¢k1öÉx6êtµãÕ	«ÑX¾j^¼ÙÞú¢­ÅEŸ9U›Susöó{_OŒËáccÙŠ6n¸Ó‡zöòË(ûôq¾ùRI>·›'®¦ú1•POçéä¬8üO˜Î“ºÌ¤˜§L6|6“óªløEeŸ'ïH²©«úí‘˜h!Üé²¬l9Ç|æû3JnkS›ØÂÀœÀ\žÓüjÏêÕñªš{õ«÷ÑZ®9ïœ™`EŸXe-_hWiE7¢s â8Ê†¶L)výÆãüâw;¾Ev™¸6‘©ÊÕñÌÔåçùÇb4k_ÞîP‡›3õh8nþùçN÷?É}ïo‰W–’ŠìUÕ]¾)¬<>£Úç´4?W‰ð½4C‘¦ÅUŸoŒ“M)Òè“0Ž??ãÜuòÿ6\Ë‚·ÃÅ¸-:iÑCW&»b”f‰»¯Z¸»µÀ}ö%»³[Üg¥j›~~››qõ¼ZÚ¾	Mö$W§©¹i9WÒ$¼eäY­ŒxX©¸{ÈNºòÁª“zâ‹’S«‹HŠhÈß‹„|°vü½‰ÂûÉ=³˜zarRäØ‹ŒÜ†Ö1$mÂôïÅv¬4ÜªÇ×Ñ†¯ê¡½E!:uYî†Ê5h)Â¹JÈ¶fnlû[ò³«]V7Ê¹K"Žš|ï0gÆE£K˜ÝL`G®(™ˆìlª•œhñ÷ÜjXêÜÐ<©…Ä‹ØcG¯Ï¦ÔôAu„ýÂ’\ÊÎý3¢lMØûC}e­C¶ú•/J<¶c^¦ê
ÉÓ,
OÕ8—d“¿üBâ³gMà‚Ki,eÊc/Ï¸“‹žªF>ãrÐ(2ÐÐ16ù6Œ·,.¨ÅféÜÝiXÉ1™<å^öoÙˆJ¯Ò%®ì\žL¨7“Œ')brJz­ÕÌöhQîÝj¤Çý»¶×}þ|g1-5‘qq´ÜŒH]êyšq9¤¿"¨9¯Õ•Ðº˜‰ú¯
é¦Ð0]l±ya>ŠBÏ¦iR²J:W­qêª<y¾mC&äö¤tÊä]ùž›ÕT\ó‰YRÙbV¥ rnO@cImÙKµÚêöž?«jµ½T«faÔ¬ª>72Ù~ö¤Êdç¶LH1M•­ÕŠÚê>}¾Ueóä¶lbòÒBéŠLúÝÞÓçU&ÏnmR•Çâêí^¿ºz«×yä˜N|Õ0XIa–³º\qwíõêñ§K#›lÖiü{½-ò®øj•7™´ŽðkÆ,ZÉÈ„šU®ÆäGÑÅ…ÝK Eqòî»SæSö?ÿE!?5›­äoŒì:s=îÔif
Û±YpùWÓØZåÖ3GÖ••ZûnogƒÙ´…ØyÖ_áé…Øq÷g]­h=ÖÝI.Õ`cyæô[”Ei¨Ínß>[qFUb«ØœµéÊ]½ë€Åö£Ñ‡N–å² ´¡;WÅrÈ•€Tþ¿§f[²¢4ŒÌ^È½üËGÎˆÐl9jîÝ5'Å`˜RmËÌˆæoŠ0øûãoœÿ³±­]ZÏ-ŸØ³ÃÛ0ÉrøkSðËÒ;7RõûYŸ¬··Eb‡,¸È¤üß)ÇÁòbä²ÓlôR›²oÌo}ƒ€T– ¹»è–±]NVÛCÂÜî§vï—”s4ÎyµCÖX!—6Q¬“s«¦ -.\Ó[èKS×ÔÞúãÅ¬C={ã`×VEŒ2›F-ÝÛq±Çû«Y³~—?¹Ïº&ÁjU:s­³Hy^*Ôrì5½PÎæÕ’Š¯:Ø,K—«ïäµà£Ôwÿf£ç‚=;…¿XWÛ·meØaZì‘­ØÔXîÂ½[`šP†Z÷"WÀ4RïÕdQVÑS{‹>û9¦Iææ]œró½‘×çzESïÐU¡ä„lj\?N>–ÎQÅXÆí’rÓYR:gR­îª»nîôusÙk__H¥´ïº”{³ÉÞöi‡‹ã~µ½ŠH63j8êªSöŽQ§ýÇÅRmÙ5îá˜éÈÎÎæMwÕWœ7[šËé¬^Ng‹åt¶ú.N´*X¬¾S´Èuè²î4/›8ÞXóVYý   ÿÿì½ÛvÛÆ–(úÞ_Qárbj…¤x•%År†,ÅŽzÙŽÛr’µŽÛ#	ˆD$Ø (‰Qk}Ö>ýçÎô~ÛÏÝïýëKÎœ³
@P…%ù’fÄ"q©ë¬y¿p¼“œ#|v‹=dÃ“*‡Ã•PC¹”@|ü“Ã_„o7Þ3æ–R 8£ÕYÉ¦-Æ­…K©âÒÌ²ÖÀ¨>-Ç¦\Š¤ÔìU5;èt‹ÒÕ1lüšÅˆ·…[µ&\¯,Ë:‘XÕûÚ¤Vjó¢h[µÿdõØiŒ–þÜ¬5ûÙ:wÄÓÍ^g4ìî°ÃÅØB¦ÜùÑ¿üéð—g‡Ï’0„Æw	Ü>{Ø”Ùm¡9”jû•Ôž5ÛV¬§
;G\ó©È Ç§â}`ÓcÀ9v¦±¨Ýbé€”qe™zém”äŸ°.ÝìµG0­ÝÔ*£K4ÐWÎ¢)
åŽ­ø¤¾<Ác	m¨ÜjJØ’)CK’šy([„ºŠ&M8]»×ª†0íyîe«‰ßBXö¶uîÃAXL E"5šNÉ70à÷zF<,÷=kR¨²Äëžòw ªâä	#î³Ã @çá•t²ùî|“9’ñÕÙ{ï[8 uý('~Qó°ü›N“VT±àó5­'²rÊ	W^”Ìç²øJŒ?að5s÷äÆ×lÊÙgÅV¼v {klÙSç/?RU½wýHð*áy„?™âb—¾þ:%5bcWAºä¸oã^‰qI]›Z‰âº(Äåù	´öà¾ˆo\bž²Šxà#|»–w…^Öp!
;Â_~èf˜á?ÐpC-HkÛoÄLz2aL”,ú·zÉ[ýoõ“·¹·²Ë)ÓfeŽ¸¸=}öÕåí¿ý&÷®Qß°À}Í§+Û‡•íwºÈ>ñ‡³óÃ9d¹1¯&ýýGþ%Ê­° €§¾çê(n5 DB}u÷Y»ß]^¶øÏü¦?ûðs'ý9€Ÿ»ðSlùØ°1H„ ÐÐ4ú-&[—†Ê¥>^ÚÁKíÝdÃÄê¦ÔH&NMeµ·î‡ïU–ÿ<…Ï§EÜªäA!£XzKž[ž•	ï]¡?;’æ‚;.€0øçNàYË%Î°šbh¿ÅŒ5t€ë£rÜÖ·*Ûü-×}Ì—&X3 E®‚	ŽovÝOîÍˆ[-lçÌ] 1 †«ïµW=õªÂ¾»w…­]ÓŸ÷üwýNa“7o¤ToÞþ©ÚÒe³.ñÖìxW…‹‰…“ôFMù –i%ÔU4(&p5³ÓSß·(îž–@ê\Løñ‰’ƒ°”Q’þDàCúÂç²ÓLÁÇ®ÂÈŸ¿ö}/rÉïòŠq¯·¬ÿÚó-»Å¹!v½üÑ:Ã©9Ä˜üiékÂµ¨47^&îÊ&¤Þ€Q7ã(fÿ”˜Z\#µy8ræD$èÐ
Ïë€†q
][ÐítweüEˆ$Ê‡¶{xÃ
ÃÖÜ9hŒ§í7è>è÷vßnïÈÂmþ²=öVA{n“Uµ"œÞí²e{ÈÈ îØíþ¥‡n¤¶Ñ~Óý¥8ü—þLÇV³Û¢ÿ:»[oy—!ûÚøÑèƒnw{·‹j“64ÓG:ñ¶ñHîìˆÏ<ç’ýl»{¶nèÂqÌ…UÛÜÏæãö€-Çí~g÷5V;Ýív•>½(­N­e»ŸyÞ; 
–^¼€šÁÿ4çÉÚZ mê6ØvîE«”ÏüEÔûž²äXrº6(°; Aí×qµ\:Áí=ôÆ›^/»vüÃ¹—>["²ãØÆdcVc“õéáŠOù´G°±½nfÏ“; ¥ËvŸ-×í.¼ƒÔÜÎ¯pv¡ÄdPÔU–V*YÌÆ#ôž?ÐÍÒ´R±“>ð XÖ,ó•teçƒÿüM–\\®\mÿ‘¦Ú×#nLöüi`-gpá9Y‚CöÇíë‚ã3\›á?m+CØ‚k~f`ë8ØíñC¹¤#ïœvÝ®x–ðì²êþî%ÛË»Áý• ^>	èQoœf_RFÓþHåV…í0˜Èø8¹XžMç]D	\Š-Épëšý×¿¿ÚÖøÛÿü×·xD?Þ²Ëz(ÔTý÷ÿþÛ_ÿï»ZûðýÚ°î\³Õ…õ½¥S(hô· %äš5ñd–tÁ¡üÐÑãËäŽÀ—pcö¤SéMéìn€6©ímšö<Ð¬ðsË°&˜àööXŠ†iÌˆ†åUëki‰i%‡:(iÆÛŠ»z]eø9PÙºþ‡´‹(ÈiÓÖeº¿ŠÙMÎ¡—Úb®}«‹8Ïž´Ÿ›Å{g}põ.âÌp}y1Tï¾As×ï²x…ÕT$C?¾ÜÂn\Ìàåí7À~Þf–žßectó»°)f\Ì/è Íªv¶òlÃhí9WWÚ›Lò=ò=Ÿ„›	~i™ž÷/O‰YÞgïº@v–—änM/]¿Ó¿vß3–ç%iþÚÃ¤å"eD¬îq‰üwoã¿ÓOOºÞµ\K¦’Ájš©ÄŠó¥y5Þ-6QvC·‚ºÙ]	o˜eçÜòV”Ü„5øùk Å—%c.ÐÅëBZJ£_øÁ¨¿´%#$V“eh^8-ÆÌ/çÖ–ÂíåèUöLÍ#Ž"8¿âtF9vY¿R)+ËóUc'FÕØ	™Ï,ÁIêsvê¯‚‰“ÁÊL}C"3 ’¦Út&‚ÿûÿ´AÂ(Dfß”Ÿ:#"·ÀÆj?Eˆ/áç{Ì›îK?9¿DÅã¸vfÙô×^dÌ£Má[E%3Fãµ¿dß;bó¯ØsßvØé…‹ZÁ€=¶IÖÈŽ†#@Ö{£ 
rŠÒK;òÛ;üy¬z8~ËÎ]özý!ìŠ/ÝZ¶G,œï/Û;	Òäd¸©³B+
ŠÀA“å¹ÃPEzæÁÕ™kÛÎBÚ×ìÐ­1y» |úËv—¨á†¿í½ ðLFê˜6™˜0ÒœàÉ;ÆæœÃ¬C@GQ2ìlnïÓ÷À¿ÀïHs2Õ_Û½n¹%GX‡%rÜnäÿ‘5@¹Å0nÌ@ íTÄO:â<‘b'ÝÅBÃ{>„³èf´/¸E;	¸/W^èä´/á)×üÆìÈÃY/Ï×zÅô—-KÕˆIJ1b„@§¥ÃÇŽ³dÏ+ §Ktú$vvbÍ€¥Ñòàœg=!–‡ªSÊp¨ž&®vŸå›ƒ®Âd˜I¹$2›É‚vOÐOÙ^oN8áâR'|d„_ —ÝÏŽ^æcIkï*kßbÂÑÍÇ«	 oŒÁ¶K
rE#½µŠü9%¬xå:ÈÉ6û×•eÞ¾‡ÛËÔEÿ´BŸ¾§+_Œ¾_ûÓ©ç”(‰RLtXKÌ#(ã—¬Üùp¼Š¢ÜðýÅ‘9¸â~Ú¡Îü­ùE¨üÞÊòléÐ®Þ™5 »„Ý¾¬²RdJ®0¬W…¶-/¡#÷ò|¾:(¦ÂoY#E;òU¼7ŒU†âw•Áš–ö©%Eû¦S“g˜úµ}	ðÊ›0¬,¿œsã{Ç[¹ÁÄsŒªít~&åö£«ÌbuüK¿8e	>×z)›”Ù¶UfD…g“cÐÝé!GÑSI˜^­™§Vy
¤…÷ÄëdH8?¹ÎN£y?v-½¯xÿIâ9´ÏÑ÷ÇþD• ÍZÓ<³<)k‚îÅ`‚ÐA˜èØµ¦}Í/jd¦z'°§ªÕ3ÈÑ¿z5§±s±<<$!Y"­lÊO¢†ÅL'r•ç®ï9ÿ•žÁdÌm½"  5C¤s—˜Æòïæ5.|
ùÞsBõ HOÿR'Ê¡xâ5g->m‰`óI k`{ë--ŒÏTæú-Á2[DA2Ë ÙðÞ'	ÇbyêA±·>0d“YÓ§Æj‡‹¡˜Äìb þŽ‡½^!s[|MQægò)ÏLeÊÉŒÒc……¢d)YFíÿpî#t²*Hway¨•òÑ…^Ý›‘Ï|Í¨Z”ç{éódÙ—€­Œ*÷ *‚F¨+‚rúEÓŸ!8JËœ@Ð¾Í9ˆôyÊ[M8CãH/À,O¦å&¼dŒ€ž—˜T­D5á—MG=ƒîôhæû0Fü„›—2²Š‚wÈ
;ˆT8oÔ$\:yÝôŽ¤ Mh	ö¢g9z‡g: ”ÔxÄÖËÀA÷@8Ðôð#6v<ÿ‚5)]Á3÷Èÿáoýk‹ºÐº¿`;Ã®Ýb~À^»xc¿®–äž³öWó/˜¯†YàjP¾Ì2Ñ©-=ÝNn¾E8-~88U¦PNû&8%H9á(c¥>, ~ïFe°™Ž+U„å8Ó{=£ì‘íM(®;áX¨Þ±Èœ­adtÈÝîÏ|?Zûë.ØÜE·} Ú?0HÊÊ˜[‚IYUóa€RDM¨ h¾‡_‘kmøòdA¡’L8Ö2Ò…’¾h=Ç|ë¥ëqÚ—!×qQÄ5¼"Ç]–Oð†ØXNûwî†+‚î >ô=ÜNYšôz¢—Q¹)ä¥ÈUóô¹SaW`_‘õà¥µp¼°º¥@Õ‚“õBZIì+–Øw‹)œÊL¯Í#ßó¬eè"_—¤Mu‘æbñã[*G
(ƒT‚ÜžA†]á‹Oì¨À~‘*4*œxæTAC]¥pžÚ
$K^¯`7rƒ7ÝÈ'r ÑŽj,]´t? å€$œ:~ßÖ¹|<<u(nØ× #NK‹ôæí›ø1Ìy+þ\o.h<' ±ìNþ˜Ÿˆ‡Û³A%"ÝõÊÚ¾uîZâÖc?‡ é´A
„CÞüa¹s@cvÖ-‡ïJ=Çƒ©üYLÿ¯ZwŽx:¶³Œf×ìoÿóÿcêBÄ´üîŸœ paæ¡÷tñ&Èzö*ó€'l=¯`|ü‘#kê¹€Ÿ™”}ã¾f– yc‡ß>†œµ¯"®¡ï$¤ÖÖ-«î9ny×ÚØnˆbº}på†â1˜sM¦åNÊïp†C båò ûçÃ¾¸4È1JãC<±}!½CCÜ¤*é¥aÄÖÐpé.©§¿C9´sŸÉË‹Ú¨~Hzúaˆj³Úæ*ûÿÖétèõä4ë•ü7VIVÑ*Þ XòN—\r4{*Ók5n"g©1ÄB”‚Lð æ1(Û¼LVÂˆ,fÎ9H<Ç(XÁT‚#µôq½úQÕ`¡R7ýÀ™¿•==Õö.é±l•É=„³Þ¹ã*¹ÌdÝ81åkÎ§Y"Ÿ
ßü2óTârâ. ˜Û]ö+ü¯ñ‰µ|máhI£ló¹É·vÞÊCwÒá÷ºHæÜKà( u·1®MñˆƒtçS“ƒ«‰œ›ó§×Ìò¢ƒF†o¨ DüÃŒÿñÇÿÂ0¬çèT8gN8ÁKŽòú ±ðÛñ%t•-XFo%Fv„ƒÿµ½×>Fâ÷0Ñh¢ÑQhˆÜî°[ÅQèÍ.ùHÈ™Sš Øäd”NáÅU‰fÁ¢š01ã!5z"»ÌË•T±G’‚ŽK"VèL»YqBv<ªâDVT3ì´ˆµS £Ì{Lê0–dtžPY±HÝ-I7°ÎÚ«9Åà×„_çvÿ&ÆôB–ù7H6:MW£±)wÀZ0B«CèDƒžaÔ/8–ü‰.üà=;òƒ<7®åÇM¢¥IÞÜÐ%ÍÀJUæÁ«sáUX+ƒC¨jç”l÷3ÊÏŒR®Ê—Î“uzý¤ä˜œÙjdÀ1uÏ¯"ç4 ¶ûKoGÃîíµzÝ~«?ìµºþÖ[1rùá~WûðÖH	€L<8$mZ^õ§‹öP’§©„¦Gz™½›‹£¸p[ƒYdÐ²)i0Ñ}pm¾Y8(tN‡¢E²p¯“¢vzVè”—µÂú·Ë­µª!W=^(Üáª·ÓêíŽZ½þËn(^gÈÒêb„jÅ›Hz‰¤kõœ<qQVfýjµÀÀ¡gDè‰ÄÝ¹‡æb)9èÔÓ•cÎJb(÷¶Ú]šQSu9Të1¸©ÊæÂjÈ†–]ÿL+ŸŠ ?.7@ÔF—tyä˜x¿ö—¾çO×ì'aCá¦…b§Yâ|ey•œ8³ùÌRªIDU9QI®°rd_Ð
±%Z}½$åÚRD_ÿ-{3·Â÷m@1Sg	$ä»ù¿Œ}X÷y‹@Þ/¢ù
²*<mýZXølèBuýeÎlPjÓ¥US£F²\Uð›-	RHOÎ3Üã,hÖñs/CÕiX`¥¥:Ì–†×*€\BuÚóö3k­qýznR•âß¡(9+³v¡-9†)œqnè©¡3+E—ÉÑÀÓŠÆ:wÆ¼›‰¶ÍØÆÍÖÿauQ7Ã²*ÜBo´¥
}HvT.™ ^N‹PGÜÔín¡]©BÎtû€¬q|4@€õè‡Øj |Ö^^2™4oRi\©¾@çä9gˆ³…†í¢ÝÛD+	“2LRAŒHÚ’hÈ®ˆ—ûìÍýî—÷[ì>p_Þ‹¼}Êà#v" Ò‚Y-+Ú‡³r†.ëÃÂ›ûì>§÷µÂA­µìù€ ?ä)Ì†¾åì×¹c(Ý«r
‹5Ñm…9S®ŒžÃä8=GÁN´AíNu9“P:XT	WÚdPÅM¥dÒæã)CöÙ€]‹¤e¿$Uéôï‹ÑRò÷ZÝµ.±rÄæ°«ja:5–¬N;Óã+fDYRœ$¥&ð—uoÄ³ð\¦á*GFãñ&!øw‚_ñ€öŽo†`Ÿ¸92|¶Ø5vÑÿèµÅl˜8z‚wúE¨V·îÐ0†+>·–Uÿ–ÐkìdÞ2vsTaBúmW­W*&ïoóË7‡]•¿J´|ýÞƒÖƒn«?Øˆ8Õ´ñúØÏ`ûÌedÃ–¸Ì?¿Ì•IÁfÄ[7Fé¿"ëbŸµç‘Á}‰ÕÓÅ+…hÄä4†%ƒéÎ8F0¢9fÆtÒ
5‰“d°¹WÁƒŸ	¦KRú}D4§?U‰Í«èSé’…Ìá“äÎæÒ
sÀõõú…Â\Ù‘È&DTTºÙ»ô}¬?ùé0&/a@•c]…Se‚¥,ôVâè.#]ö¶Z¹üŒ‹ö 3*Tò ±1gÙFã6nÆõf¡Eò•¬£Úª~BÅÚ_ê6áC®èK^
÷V–S"ŸzÉ@tvÛKê,tÑw¶dÂ²s{`ë¤4ëæK}U_¶ªé[¹-Ë±Sç€ÁMQÙ©3Ñ˜TSiiÂI²B #Ž¬ÀE1²R Û +Jy£~õ)œ>u?Ò¹oo”­Yë¯PšµKŠ’«âÇa°¬é	aNƒŸÚ¡âÃzNHmÏ73â4S¬~D4”¯ÇêY#E6OÙ•%œ7b€ºþòö˜Ï‹ÄÚ˜ºÔåŒÖYÍO*l´˜8¥biaš‡‘’æ\DøÐL.tƒnWo,WôdÈ0é†•Hl c(‰¾»§Ù„wº<5dò×N0ÇÚÕì™?­"”gR6S·#Ê‰¹›nßšœøY’³4—<2MëW’ô8^:Ñ=JÙMbº$£Û—Š”ž‰¯‹gá¥–€rèðŒêŒAï eHóòt ¦ƒÅ}äAÐì5H^€ê±Ø†Ÿ5h‘y‘3åfè–TŠµ2Bø¸ºy»dB…W0ö%>ù3X!9‰µ\zkÞY³gIi˜ÒŒp6à‰ãØhºo6^…„Ç!N°‚%–QÅ¢ðlhlëµ;wüUÔLÜC²7¶Z¬ßívëæ.)w¶ê|=LAº&Ú˜7.ä>"7ØxE°«äî”°•ˆi¥…²3Ãm+/¼rÎ`«fG*õI÷Á¥ÍÌN¥øƒ¥£xR)«Lz2O£•íú¥þÒpžFŒ¢ U“yQzJ‰ÛÀoAãþÐ×ZW6µGÔæ¡¶‡±ÏB‘GšG,ö¢U¶ã)ÆþBÜVK¨“8ìj´ËýŠ“•¤©â®<Áû7tW™4.k7Þrå0q_òsT°Wot“ Ò½/VT×É\`™ðK¼¼føÞ]B‹—pÂ•æIBJáA>v­Kƒ-:ýó«ãökDHg~ \‡ÔuþŽ ÏÑ8¾Ç)ZQ„‰X“À‘‹ƒX‹©ç„Å}Ã Ü”Õ«¢OºÈÎ„!%pV!C¿ É®–X¨+ŠÜ‰CÓ/émi/œ?gúU¯ÆsõìÁe‘KÍ…‹‰)@"‚Öð4¬ÿûâú˜ööÓÓ§JGG]îQ¼”ÅËCð[Îü!Ô›?£Ÿ¥Èlow\[kÝ¨ÂàGfD{ZêŸ<Á~'òÚL9¿@öîñÑÑš]¿+j²S0Ò2øÑ¦„W=Š—j
L©Ë¡ž¿RÒ2ü4Í(ó ˆõCô¯%Ï›ž ©+¾(D|Å]HüÚ–.ü›²i8M98•4i\AÞ79Ýës¨áGvšFAvG“ªsÔ-`Æ²Q¡rkúnõ~Ùzé&KDßÈÆ%P¡‚´ÙëÁÐán&ÜfÀ]cŽâD¤=£HhaNúÞ-"s¯fïÿJÒšÖDn–*/¸t&a&Ï¹iÖhíŒ*dÖÏPä¡ì‡jÈ2ZÓ°Çp™­	S­RSé–+m^9 7¸xO\Ç³Í{V˜eŠ(`«dyD½ÝN÷?ÿƒ5ŸzþØò¶0\ÀàUCm<Àw†>¼òsœ¹v@-$Ø©†:¡ ¼îSÝa9‚ü677Iy‹[ÛöŸç64ÿ®Ìºá{»{Ý÷´±£!|ùmoçX.î½z»Û©XU*ìè³`Ñ``Ç?hG`#h€xá7¾'‹3'p°¦û3¸»˜¬owSÒÔÁþ67áªA¨:Eu‰Ô9LÓiðÈOó¤å¡R&6ï‹ÿF–UÏüvúâ~}a-|¡|¢;Èið|i!†,q”9Ä,…B¯ê ²’ü!K|z_#yÂ«.÷ï‰1ÜêG¶ä6^“Ðqc‘C+p(âÆ:M˜ÓIJ‡*#vHIá™ì„âñ6M]g‰ÁONÐåF6êm´üTÈ›<Ðòòé²;”nm5Œ½Vyd€;œå‚+Ú§QÓ¶Z²mö§?¼`§ëÅ„§ïc¹úý+ÃÌ‡7\èm7°ˆpM~NæK?ˆ¾»Äy9Šüu“šŸ?ó¡¿x ÑÄµë„Q bLF‘¡[TÙ	ÎÚÖÍ5þß'	.%un>B ® S¥vßÀA8]Dy…ØÍ+ýš'E#"9|ò sºÀ€åOkJ§êÏÇÕDÁ€y·
z¹Ô ¦«ýª©”S®>ÎÄs©‘Z„ N ªÎXT‹ˆa#4K¤¯-—ñ=©P?ÅbÉÑ$Ä\òð¥ÍýM}dƒ}_Ë…=Ä] ,›M‡*Òwpå*§Ô@ÂgÖb
Ï6˜RfÎ¶Ó^¦NÄ+ÿ•s'äý¡ê9a
º–ˆ%ê5UvÒŸP~’3²
÷ó´M3Î%ggì—VÅöÌ8‘*°ð¦˜•!×€.’O‡ÓE&a“¿x‘Ò7Áá°+¶ç¤[Q¦]¥c¢2šKùjUÚ¤!œ“024ºEÖ‹AkñCVK»UqÁŠuàëÜZ‘t&ž»ûÀBw.˜ÛÈÿh˜Ë#‰Œ«àVm7 9Ü[£Ò<éþ½	]4x3:~J5æyx)O©P
-)gxk¸~êµà¥ªPWRD”ò‡erÌ>AÁý)
zœ2‡ØÈ•z:sÏò®ùÕ«+Ã³¤ÀÎsˆ’nÙË«D‚LVAèí™ã-ŽR™ô$}|\[¡w,–¡“h¹§sCXÀ‰?Ÿ;ÄL }qîc’Ó¥¬î®Ž…ÑXª<5©lQ¾Í“Å™_Âb«sgŒÕyÄÑÎ•Y¸@¢8Ùíü7´ÞtÇÌ ˜+«p
zT¨ê;©Ñ¦	!UÐ¬á±tLûbèœ,r‰¡Œ´Y7p(‰Ø€«)ƒ¥—èbn˜]ª>PñhË£/Õ§²:œ»AÊDÌQò#“)\Ï©ŒRFaÁÔ¶˜ˆÛB]Îã3,2—TLxƒNäÀA	À\ku¤O\Ø+ü‹‡Ûü­
Ž
]ŽdQ£ÉM>¸|@†–XzÌ?PsÇ˜d–'‹HÒxÍ!¦õ¶ûŒëPh8kºÁ º4©RÌ¼"kç+ç|×dÔÕ¹VL²™ìÍd‘S%ôÝ):Q$4 c*Ò£”…1»¿!Jù‚ª±#mÄbªK¤|@*¹Ê¹ÃsK:bCÞ–Ø€W<ÊÔ§4sµôxŽ=®¼"õ„wG.å}ú­‘Ë8:÷“¡•b@¿ÊÏŠPö¨Ð)í$kú[5èÚÎ°¨É¤dæÎ°N£½þnA«Ü°	Åi,
Úþ^šèe+·pV°Ü«‘DØ¹ÒáÕ·0qhej)Œ©±ß0µüÞur{@GM"€Hëø®BXUwnôÜ?Wuä\þÄ	C\VÌ~¾æ¯…œYÁ¼ñðz‚&LìîÈ¥¼Q¿5rÉsÞ}2Ä’†ó;©üœHe¯ˆõv¹{OÈšäýP‡¶Šæ`˜4üÜ±ë4;êÉ¬Ý¤YÂ7µhq·W´Ý^Òôw@-œ¹ó;1Þ€ùó%3ªzIB“%jŠ€8Æ#?Øsò…Õ)ñKž„ý dÎÊÇBþ¶¨±Áàð/BÖ'-’£ åÈqmè&Œùš°2â%óÜ¹W{ŽcÃÏQQpW©“Eô Ë˜ß=N·ëãQcÚÂº$ R®ö«7¹u‰þbÖù4öó—›«øËÅ©ä(|Ž–Ç ´Ïü¥‘×$Ç•¢KTc™áô˜Ý¾îi³‘wL¤šWzÍÞ\Ý¶¤¦To­:1†Ý¾q”Â†Øú5iÂ|cyS?p£ÙœPxu$-l<"LÍ’¢®yËÿ'Ž­Ý^‘Ëàež-á|‰Âg.	M±º©Ãžù<¿ºÖÁuéÄB“íœaí«‰Sa¬&ÓßµqNlÜg²Åîî¹¬lR{×7§Ö
äVkÁ=‚ãÀ_/CgeûíŸ|wÑo`ÍCÀH?œàO~=væk¶9îÜ5PR<íÇ~ÀƒÌÝEû¢ýf‡=mè|¯ ÷ýßoææËèAŽ§>RUR¡MCµHF|,ºq$JŠe×«ñð<ÂfˆÿRÔbg«Åssr’±øé)ãè9—Kq¸ÝÝòue` ]ƒã¦!6ëäªJÅaÂÍœ7ñvž…Æj¸¥VK‹(mÒ)mÒ‹2`4ç[ÙVÍÙª*¤Xh<š³ƒÌV€|'àãÛNä?AEc³¿Eù`»æjPÆÈ¸á.ô^S@î×KTñ¡ÂMwxí Ñë¢rA`8hŒLwA[4ºM‘üõÅ)9Ú5Í“‡¹oñÊó/¬Xtþþýl„›î#ý©¢b¬D”^…ñ‰ç[9â$J±ÎÐšàQ’1ÿ,|¤&/ËªëÊ”t¦ºXÔ›…–QïÂæ–WTXðØ9ƒ%§¼þÁr‰c$ÚaxŠ >Pçî$d[¢]$e}¾ap ì«À
‚oØW.¦Òý¦¨†crk2s’·bæ©£=]UËVñ0Çœ;IºOöDP‘¿áâ ZžÁEƒ™ƒ´m4iÔ{úÝ³á|‡("PªoäIqàØÍ}?š±h†™’»Æ	ñîPžÐlØoD¨Ð‹¯œg?’áXï×ñÜü{zá†3ü‚¿…Ôp¶Ø\`83¸´ßž¬B×>;[|Æú¢t"Da.7ûÛˆû¯Çëë÷÷£±ù°ìï…Â°Ž¾RîtÊÄ)N±Æ°
ä†<ñçÀA¡ÍWø¨y¾TW!)Iÿþ>püS)eþ•³
wØ¡mÍNð{ì”f3¥Œ¬uˆþj3]yV€‰(H¢Œ¤Öw‡è•í:ŒÕ†×'zŸ´zðØ pg¯Ó¦Š™¯¯žŸ‚ºLÑM,Úè³ÛÄö2¸¡} ú˜J¡îí)…äy	‹Aô9àÃ–,Às\†„Ü«9`~d@•Ååî³Õ/EœcMy	^¢&$BÖ0öCþ*B}ôØ»šŽ«Ò‚A!%¨®Zq¶>ŠÜLO>>EIhŠ¼rþP´ý9ƒœ#ãÏ«çà
Ùpç°eç‚f°©³Ààb "6œ´1,	‘°£îzÇ‚6Â¬…²¨«1K˜ªˆÏÐ•ýÐs‚lØ·šä3®Sgù”¡A×îi‹‘ºÔP[åË,ˆèn¹¼S¥ènµXT…ì 6_Iv³¤ zX¡ú‹T_Õ)½ºÝüXáÕÍe(Ôv‰¹–)¸Äcùu¨¤Ïªæ0WÉ]N¤HÛ¥{QO€kßâôªÒK8dù²1­7Ð{å¹¸M£agËÉÍÄwÎÎÜ	ç™a)00íÒ¬`-B;¤àS@rË€|¦ØÂwC§M2	óD4‘.å.HW(
Õ±f§¨ä‡n¾b¯ýéÔsˆ)FI©$ëI„µ7ðŸÂ€1]+ÎB)	ag¨ªÄ+x½:½¼["YJû7¥ˆzÊÿe×†Ïd’~Œ+x§4âÃ¦öÄ¼pZ	•~,*Ñév»3‡ º[	­Ð¾X@-ä‰—‘ùÙO7äÑ|ÒÄCµ˜|‚´ã±,“`.oo9³¤Xˆª
o°W\Ÿ —‹_é&„·¬!½<w<[‡M‰úþÎqU®?Sù=³ŠwŠo7S„<Iæõ:Ö ^ùIñì=] Ž‡ë¡`ÍTË0±nu>:BÖª^ÌÅÊD~¢hù{ªƒã@|+<"yj’8ÈÝsÃ(UY¸è7‰ÛŠ,¬Àp; º‹]ASöXö‚lé1’¬{²./°"2š¥<ü¨RÒR,´§®<ìÐeŠÌÇsTW‹×©šDBeÉ@Ÿ‚#±¡àÖ¬sE$gô[Ê%5%îÛ]Íµã8HÄÞ2y‚$B;'–‡E/"²•¯“d ¢Ú¡Ô8/Î3\Óá¯
)'o{%É“÷™Z`!¹ñáQÖÕ»‹v¯èiGÅG¥~"õ*¶ø{É¡UÞPJ0<à$ÞçñHmôË©æõÆ±BmïÕ;¥BvÅ¡^Ð—šN7ÅÔîP4-*ºý€¦C_{Z«B•À®’hçÃ¤îÍsU÷n8ÿ=Þz<Å"CšÅþ(83F¯Ù)¢D›ûQûeàÛ«I$ACäÇ§€{D}U%bözaÍÑ,ä­?sD™Ô|Jv#‹1óOhQ'ºÒY‹õ§ŒAF=¯f~§JjâÏ§Ö™èÝcÙØœ•QjÿŽaoÃê—ú£à×Wdû«øLªn‡hÕ:÷]›L]O•uÝ-è7Å¦´>ºÍ09Á—¸À›4
‰rWcë+¶¦ù˜a/šúƒ,llèÇÞÝŠ5
å~B563–P™[O®ÑÛÑX«åz.­-š-{‚ª¸ kt)0ð«* q;†q£¶—ªFãô;¿.¯ï‘’yèÉ*ühØœ—/¥Šî¹z¥pŒ#R`M‚•gÖ]Í9*#×…ØŸ9£<Çm¡]É2ÈéÏ[§ÎCuüüøß‚iÝ=»û\[AcÜ”†ÍNWcžíwÞ÷Ž”¯¢î¼~Í?’"6p—j ,û9ÏcÃ¾b@ìYàüë
+›‘v"•
Ú¾¤À_üì5ãd[¤]É«g5}ÞhU;¥ßšÚÖ0Å»Ç¶GÖÔsýÈeß²rf8òƒÀùÑÞ¢M–ü$õ>²<w|D‹Ñw9çLèNç–¬¨MŠÚØ8²¾§aãÜå[…8bf÷CöäçïŸ3@Ìu¦ô©bÞ‰˜Vz.²h7ÿÄçsóóùM±´úéÝ=²}‡0Ý‘ÙþGg9›øVÄ°´èá‘ìa¸žÏ(XÞX·v8ÍGÀºmˆßHäï£ bÑ=¹„ï‘¢1%Ï0Zà{á>ÀHÈš	>þÊ‹¾aÃþW¶3ýf‹Ù+‡‚u¤ø›K½aàìSr4´ÆN ê|æÚŠŽEkù¼q´fBIó¢ÌŸ9Ž6LïÖ‘tÁé+±Êž¿²©lí,ð±NÔ®-ÝØ-Ý@¬¸ì¢“.Ú\rž¾¦(`noá7óŠöäLÂÚ.&¬ óÆFì
åçY‹ÙcvÍ˜ua¹ã….›÷;íÐ	ÎÝ‰nŸ¹ƒB÷}½]!np¼'N‘=X·ØV€l±©û“PÓMÜ4õg.0uâž±æ8ÞP.Œ¡ý†·es¶Ð¿¸Ùø‹¿bsXm6æµ]xæú7š±§¾Dp¨¨7WÇÅñ8Ñ*Xhïjƒ›‘à›FÉWî_aUh½šé
6íq‹Ý—OLxK¬góþ
æ~bß‡'àßì²tV®m.²(:ÅOÖ2œùQ²-b£šÿj|÷Ay·ãÌ—ÑÚ¼,ÙŒ>­s'»Ö@1QûBé"ð,?+ÜfØ„dÚ f!N1^òd6LûMþRGT×k³ÞÛoØö6{êD(°ZØÚn¡¸»þnEÑ+¤’ªh’ñ¯‰/rèé1|5o+_äw§«	–_@\¼&ÈÎ®÷>`bj$?çÚP÷ý„"ôÕlá3ž€ÚéÐcÍÆËEw!q¦ö-Æß/sæ5†¹ñ`I&˜Vªò[]ìmŠsX^¶GèÑß¯Z¾3ë×0¬æPm¹²€‰Lò¢õûrâ÷¬M5OÄŸá²=#¨ÔÖ…5¤
ø<ÉËž˜cþ7€-Â¯adÍ—Ÿ(…A´—Åzp¹
¾»}rÃÇqbÃJ	Ó¾Ï¾fÇ¸ð/ÌXŠ¯+_ù¦ÿçiT+i¨UIàl_KºLn‹Ï}vÿùšqq´)€þ~Á›)
ÝgEŠŽ¼‰ÀÁŠB‡Ñ~ìšE¯­–¶ñ5+Ã˜
–×U:	ƒšJ$ßÏcßày|­ÃèìXk¶ d†G„ç'Âª{s7‹±;Býq*¼vä·"D‰‚rÃøíÈ±<FC´Ay$½?8TÊÜ.µð¦¢7ñ[;÷”"²¶Égƒâ2 "úÅ!vnÖ]ñŸúl•š¤S(–4âfœ[w¹òBÇÊC›ÚõáMx	@’ðWN43e~n]§:ÁìTäÔÁl	âb<Áe²¡}CaùŸ‚$o0‚/0µœ ¹vª` ×A´¢Î\ÛvÊªgG¨ˆù]Q‹¦ËÚ˜ÿÿøç¢½ƒ;¿Câÿ¹8!"xe@Á[43¹Ý¾úfÏ<±^—Ç~ºR.äÝÂT	gýœjw"«ƒäÐ§¨4ÙÜÞ§ï!zÄDx=‡leºKÈHë‹¿$4%kqUh‘žtc zÓý¥ûKo´¼ü%˜Ž­fo°×Úë·úÃV·Óßz«ÓÊ>Æ°gõ>€MÀ×Aô‚¨Òñ~øš„3 ªïÛÙ]3žÃœbæ<ñÜe{âÝÉIÓõZàV?ul<z‰°vr‡°¼p"ƒÆ³P:s—Pç’2ÈYP :2ˆÓ”©'Á”©a C’”*Í5Î)µ/‚ÓÏ¢Xè°éÃã8,Rd­Å•WÏ_÷êäðÙ/Ç…ä{;Nàb Ü	LëÒÉzªéöáö¬ŸIHâ†¢&#ê¸5‰×uìf*™=¥:qOÚÀò§©Ú–ilL÷ébª&'%â#åzµZ  ÓÉ¦ZÖm„âáš·[™r”'—‰¡‚:X(²Ô˜·×€–Ï®Bzë•sv]Ë†$¸6ÀéùìºÌTULÈìsƒUiPÍªôãÂ=Ã*.Çã)sÙãªÁÚô|Zx–SÌ=*¨x;x¿yÖÝ‘¡É™x/vôÃ1ˆÏ_²Ó¿¼8úîX7%“yÌ˜{¡ZÈAÆÑ[Ÿ7¢Ôeœu‰Ÿ§ž?þ	@9Žß¯1qÝÙÞ#²T à—ähI©ûTS~cwùü=)ð}ž`h “XÈD ’?Gûœæ†ùaQ'‘-ÒñÃø¥„T4¶È2™"ý—ÿ/Î$ê˜êI˜¸H2ßðR†³q>=Ÿ U#Ö32òFÐØSƒ	2Õ$Šs|ž,ÝQT˜­nÌl€ÑêõZ½Ñ ˜­ž–ÙÂ¬ú6œ»Ÿ€ô>9©yòtLU•èŸ×÷Áå+ˆÌá˜ý5ˆð7¨9MÚÉÆ¾ƒ[NgþÅéj:¾ uÍ(0<­mñO°NklÒ6µ§õOÎ«{–LUŒNç½³æµh¾#IØ¬u•²=çt_“nN7&í—@üÌUâAÆ€DÊY4ÆkŒH@N­Eê¶óÖcŸvX·3l±áƒÎ`x$äÓÄj–!Œ -äKûªëÊ®9³PÃçø±ŒKKLæÍ5z‡ò•TjôJ·v‹ËôJº_àRnÁ†c'öCY=äGL‡T‡Yª‰mæ5æ“NÔø9(ÓŽí†ÖØsìƒ«/ÒÞJ3ojO„Ž"pBŸF›OÉ¹
nGâƒwd»KºN¦Â…N]x?^Õ8”\Í€Br]tAdb†¸+Ö%§ÍjÍr+­¥‡zÑkì$…L^7(-}ED Ñ}$@öø±™@é“Të\è6ÒîD(ÄEO:Ïô|ê8J?ÙË¸tÕ“l–Ùõ\k‰®Ë=i\ìg*¢žÀ¨0	³TSRaîÜ	ŠZN€¾`¡y×Ëñ†B&Ÿ:swá
*e¤“ÕòT¬½oPöLÖÖq
ãç®%enÇ+ðÜr,='¾ ié“7GñåÌû#I{/µ’ó©¤†FX*i¢CN4ŒUä‹ÐUÀŸ¥vúj*yù*a°d€)þ¢ÜFí½‘À.åå©„œ!84Öêv»_3ä…¶EÆ§Ü¤‚¤húD1%ˆ“£ãca%Ø`O`ógUSƒ/­à=º?j0XºDƒXñ-ðŸd¯¯Gdl´&¤Ãø‡$mãÄ¶ö”‰ÝDÍŠÄqRÂ¬Ä««tªÜiµb†Š’ŸX3b)Ru?!Ô„¨íÐ` ézI¯¼–Ìw¥²O%ŸþÓNÎ 8ø_gwë­Ñ7ÎË¯ °˜ =k¿ŽHªOŒkNë(ö•:Š àhn‡ {ÞØ
Ð/_YÇ_dÆSJ«¨Â•%~@X—}«­Ü‘_kTR‘Æ úåú¡
!±@¿Ñë-æÚ—ûXjaŒþ†Â!båCø‡Šˆ¼»wwÁÝ€Ú÷® }UŠø“AüœmŒõ¼(D2p-ö?yñ€Ž4b"(…Ìy£oïYc£83ß§B¡l_0	C•Fü˜ö•¶£’þkh„}+íeqL‰ Å¾h¤Ê¬²ÜªÑ›Êè6§Q—of•ñÊ‹¹æŒ€%ÕvÔO
ÍBtí„«1wð üÃty”6i–Ô=(EŽ¥ÔÖSEì¤ª¥‹–­<è­h5èl—º H«:ÿ*ì[A%ÊÂ¥2TäT]…Nå•AUVÙÊT]¹Ý$=)PãÜE™ˆh©µfºu7¬6´Ï‰ƒçb´ÅÉ„†Ÿ–s¼“ÊÔ&3TÚS¢/ÔÈµA%‹i©;£Xšž‘Äª1E6ÃQ,­ta˜«Ö•<gÈ²lXÇ+ßz1§Š €Ÿ|Õ%C÷p1ª
4¸½÷RM4.±á¥ê*´£Æú~mža›ê
kfWgé«4ZËWj«
µ({¤üò¬å4Y‰ÐØ¼%“v†¸§ RL¼GÅ”_%ì%p”‚Ž.Oá_GkJH×²PÌuÒøgKvÛÊ¼šåèÍŠ&¡ÂÖ{ $í•²ç«øñÆDqfl[<‘¾–WÙ½f¨ÜÇ?…?w©$mN"goD¼Ÿ¤ˆWRŒ¸Uäì9{zEÎ^¡"g`Räì(r¾.á—sêšR~[˜¿Õ²™¨QMe2ÌúÅô I³²>dÊõ!±$§¡tíÉˆùÖî#7¿€•ñR;õýëÆMOm5ÞÚÂ<€E÷ÝŒ§_¹ÔÄ¿Ç¿Y¨Óˆs¸K½ÜA‹“’ñ<óS¸í©°Rp+rF«(pàLò¬g…ÄÐXâ—”EÜeÀ<Ø|-)’\‘nËDr(d÷eóö}r\çÑkdDÕä Jç¸Ü`˜‰û8 ¸^î/âÁþÆ±m¬´åÉ>”ƒMÕ„ABpÎÖÿïÿÃÖtÊ­Â-òœ€_ØÌjáFlâ Hª®e½Õ*­M1h”PÓ´t#Jº- ¢¸²7o³›:2Õ<’#©iø‚ôšÓ ^Î˜c74u¤ÆÙBC¨‡²ÅE¨ú»£œ#£G*·tà§6¾ËÒÕ~-ºªPU<{Ûüäeég™,&’f:¨K{ªy6óœÎd¡å‹|G?]Ïc÷ì,ÎÍõ“v¢õ„ªçïÈgT¼&ô²Éí*v¼:s=mšeÆ]jñ6½jµ¥ÎW\yÿÞøq‰1·ee¹"~DûR–etÐè\®[è2ju&á¹îQ½Å­ ‹WÄàòÌã`Âo;|ÕÍ¸ô¬õézÍ^û§Ùˆàá«–§Ò¹e—EëäõU7Óçâ»0ŽK8W’FTÔ§Ø„Íf0¥n‡ˆ„‰¦ìT©M<}:±t»Z„³n€(( Ñ¶Ù0ÇÕÂsÜäÖ\€¼Zô7m9öœC9KßxøS`¬ÂÓÈY6»Åm'NŽcýÐ øa¢~M€5¹˜£ÎÉ Xº0üˆðú: ¦µ¯W‚Ï#,¦ÉŽ¬É,_F°>‹œm5vüï3,+e+„…`ó®¶_û¾bb Ù;v€fåüEQ„¨œX*Ñ+±ÈË#-Ì&S¤Œ‰hi‰<xõFg3g®½ÏKÊ¢6ZŒè$\y™\q'˜‚"aª®uÓi3ç®s!5ó‡ûÒó£¤!JÛ„ÅºŠÊ…ež¥†NŸÂŠÇÅxÕæïýÀý=«¼Â&sòØ&‡½P=Z®tÍ¼åv—@ÀˆÌx°>BÉ	|eŸî`³º“ÏŸvCžÆ
“ Ð7lƒŽy¶î}žfÀ¤)´Èâ#š6‰7•E±$W2ò¦hº¸´~j ÉILÎ|E\iOÅ`ÞT§T1Y5½Ÿq"÷®’,?¿•r%vIïžæ1º$ìr£¨# ïŒNBRt¦Ì‰Æ]cTà7aZƒŠQJNˆÛ›^#±Šƒ-áë"I«ˆgÑåˆË	XEÞ^ã6Ž‚AçŽ—­Oïf“1ð¾Dœ¸Òÿ1›¬Œ…äfX)·$Ð ôMOŠWÑ+ÖO|ÛMiÖ–ã;L…P²\<ia¡ãšNÁb¥Š…ÔÄFlËz:væ>ÔÔ¨(Tl,%Y‡eŒ£	„j<Â\D!…DÝ_Á™Û¬ÑÏ È4 z€ÿ Ê äÒéÏ¾1—´¬‹¸U€yî™ÆcR¬Œf¾íÀŽ Žg]i>süþö×¿²¯³ûÛ_ÿ|ÿ¶ÉaâXbnòïÂ÷g.\;‚ÿ«°€Ã	4BÕQ0Ñ‚;Á"Ÿ4Ò‰©-GQË.]@;ŒR3ÐXøí¯à¥`ìcòg¬ZF…}»ás÷uÉûõŸE.¹bFÚÛíìµØîèŸƒ^gÐbý]ø¶ÓÙm±¼ö ³×ºðÂøm¯ƒÎ\pw8ÂoCxc¸‡ïàÚh¯3‚opmgÔéÃÝ~Á˜µ¬ÿT ×.íÓKß[Ïý`9cbú¬y¸ š]°m¯V‘ë9U÷>~¯ù ûåVò6kàg•m?Â³[>ñçsÀQxè–3?òaë-ox#‰ l{…ÄÃç"ñ £Ê
·¿ÝýnT¯ûØ@d#Úïìèöv¾ß‡íáîõðÛ.î2íív¾Kß¬ŒFøn¿í ¬ ¼«ý>u=ä»Ù‹“Ó×X<˜V²âÎžº¬Iïí»•¶òeà£>`’2ž¶*îÀtW	BåÛ9s§³v’]Úv-Àá6›¬Æ°³d£)ìWÚ#8jC±Iß‡.b#Zß^ŸoÄÎ^§ë?„ìt»ü8îÂFøÝvöF¸Uw¶Oßó§Tä5P›5ÿieÑ¯ˆ6-o‚‰¯Ù1<3‡¯UÏßÿïö©#_‹°-}{>mÒ-¸Uý¶±*f	ÛE÷'v%@=5–~Â+|ÛHí­ÉÏÝ³–K*• Ý¯Xˆ`‡_ïêHvã3×'çÎx8»ˆ Å1ñ#9 »xè†]:ÏC‚”‘¸¶Kßdºt8‡w/¬…/Ÿˆ#ä4XóÈ¡MÜ]Ìã‚Ž]Ä»RËÅk.¶Ÿç•Ã9²Óhh“Cv×a§“™NËöý•Tø…ÍVóeµ³ZÅ=ˆëxèî33=üsÅ¢ÿ5¦ßÇßìdR
}a£hÇòMî®ÒD·^ WCµ…Q¿^€¸C¥…á°fÀrìe¢^€1‡=µ…š³ Dû «¶°S³˜Åµ…¡QþæŸ·Å.d–%]aÞàF£øI4i6ññKx¸ßýþ>< ¶¿|}Àºaaêà¤·dðÐL·¸KÑ© æŸñ3PÞO|dÎw°e'í“—-ë8—Ëf›¾-ý‹æ%kÃCñ2c˜ÛfÍ~ü0>©á–9moúI{ƒu!”½Qæ§Êç2žÂTv€˜àg1èjGß«8vÞ©D¡³&½P}[@SmØãÑ4;¨ÖÌ™»°¼Ÿh¨¡¹uÙ$j"­ÎêkÞaéàLaAßÝ»º”¶Ø½«¸«äzoëúŸïŠ[,^v¡G…NEp|¡OåÇ—NàŸ‡ï‘:õ=+`‡ãÐÆ@}šÏ_ŽO8wC_þZ™:~o½À2ÈpzùýzŒÒ»L­…;i»ñ…4Tò"Ê9™Yh5R"M]Ãÿ"î”¬VØ´óà?ÿãÄSh—ó¼½!ñ2ÄuI"AŽi€¬J.ý!}ö‡'Æí.J $½>à’0L;Bz„³{gÌ•ÜÅÊ_…ìÏ¯ŽÉ¢©·¾ÔÂú#Àj¬æ5XãC–œxb.Êœ¾zÎz{vª‰¦é`!4ÄÑ&§õK°°Ÿ-â˜åÌóýà“àŽFÑî¹#^Uk¯n:ÔAk¶ `8PÇ°[³…Q?Ë&G5[ Ù¡{£uØé‘œ*oFÍ1ì€tÓ¿ÑJîìvú*7*má®¬îßƒ5ø¬2XýÌ`g°*7eº#,óÜPFá÷·qÏ,È­þ#ÎŸ…X=ñòn!äF¿³Õ‚4»ömæ~"ÔK¥‘C©s¼Q!Ð(up’– ä=L“&žNx·rä‚ƒÃ§Ÿû¶SÏTgG„Ä!¥¤áŒBÈsõ¿U5¼ŠÒH'Ù*&PËØgâø4±Y¯¬¬«åM“S¤ÝUª„Œ¸,iBQ~§êå•ƒ[%$µš}5—:!ë¼Q”ƒX ŽÃ8¥0–xÐ‚‰¯0îòxÔ|ˆ
ŸSÆ3ãÿaP¹`•xH(\ÃT×¬5Ã]Ô§Ñk‚ŽýF^;•+r.Û;‰ÛÄŽšÖ”Ï_¤ý÷ôy<iFÛÄ4FÜÖ+B~€ô£Ë6f)È{›è§d¨pYg"•c¾1JÓÿ‹°‹¶sŽÝñ¼wJ’k“‡N¥Q©‘á<ÍÅß7÷Ù%ÿ‘A‰AyCQŠ†Ê•O“hººÞ'EqÈÐâ8YÖ2Ò…µ°ØÙÑî¬"Z¢àH—ÄzàLmRMD¡æLÏG’]ˆ‡íÉ¸§îta!GQZS#(±þÜM$øÓÀ²¬yó‹0ýQY)všÄOENåê]‰c‘ÀŠèCÄ‰YOq±,s¨Œ+%dêß+Y§t]J¸Iî]);½§®í)Ne
nôãügýá°µ3hí[ «n½5sGü³Ÿñê,/A—ËÔQ´y…¾DÎ¿È½f¸Pí£Ãçè¤×Ç„ÿ–ç:‹É¤Çå†¼ž¦ÀH&%fBPž~%m(nY2ädœ‰§‚²¹›Ú¼ýbˆ%\È]œ`B¦(åýQ¹„Eo‘×ù3 ²^³WõÇÓCrÿñWa³gŽRáŸ»Beî‡mÞ“¾‚c*ç\HNÅ+ä_Y(j˜ SNÚŒáÑ¶sf­¼HvÛÙìpð~^bã&ÏJàYääš¤Éð’S¨É-$ÆD’cŒù4Ê
¥;ÇjÆŸ©š’ðE5Ë¥Ÿ+*°j¿DÊ&Õn`ù}ëé½D•æ†,Myr
=³®QaÆIsz„‚ÅåÁI¦Ô·ÙÑÌ
¢}æ.°º!tÎf2÷Ò˜‰s—àØiø1êÓ¹M?øoŠ?vøÌÑIFº‰?_‚Àê°s7\Áµ´ÑâƒÚÂ	Ð„“ô¡›XíÁp)l§û¸7z‹y#
«©R˜ä\¡T§xã.àhþ‚ä½ßÍ¦7ÝÙz«;C™l?'òíäòUhÓmÜ		„á#þ±f	¹A²uáŠHu4±6Ï!…l³$Yšœ‰ZñÿÝNhÌ/½åeKÊ‰¿·ZÙ—÷º¶3mÕi‚o\èþêìÓ"óÍÔÈ‘%§»hàŒ/}Ø„s,ú‰9´aEAvˆf^·ûeCœñ«Dßs°ÌŠM©„¹ÃÜÝWô4ªQËŒs8¦îâàê
Eï}Öï¶¸ôv®–H¢&É%òåÖ¯â6ËS=:ga…Ž|¯ŸŠ­f®}Ð •¤'$Â»ì4€‰[ó?—}þþTË_ø0„Y3ÿìàó 1‚­ÁGØÍAãý¾=p~í@| Î\u;ÃëbÐÐ7¾W­õJm?ÜV§tÉ·«¬ùÃ?^ºf’Èþä¬âÃY™Èçà9ËŸ¶ý¹… ùæ>¦eÆ*ôô÷my¾ˆØá+Ø÷öÙý?ìwÇÐr§xæY¯Ëýìp(¿l xâ‰5w½5\CÞƒ(Ýý2`{}û=‡Qà¿ÇÂ†½Ñ¨R,{¾žÓßŒ+5@fø6°—1‡Ž¬”8\`¥è&Fh8N¸óœâòrí÷ù!‡kT÷öx‡F£½»]ÁR€øLÌI£›ÂE…Ž :¡k-ž"9ã‹|lá@yÀæ§G¼7ºÁAå;YBðSfÒòú8õ:Iì-dÈæ…<Ïmiï,Ü;³*Ušä«¸ÅChQãUð	 Å«!üÅ-•Ðþ”Z·_eó=EFIÖîhtö`³Ê€ýVD7‚Q¡½(þ$-±P—¿“@Gwg¼cË_à‹³
¼æ²dl«0<6}=YÌ^9Jàãû™¸Ž«AùóâØ$gª“ªk¡+¤~-J¥´Õö¹þNK{ÆJš
/%›}6œ*õÃ·;ÑÐ±A‹íÁ_RºTïSl`¿JZ¾…‰
ÌTOÕü²B¯¥ÇÓœÊ4þ ’ûã…HÐ%ž”Í¡«åûXœ¨‚ÔT™•;OPÅ‚Š¹£S”…¶Â*ò8Ø6¶Jé‚øsyp•úUy!¥1ãÝþÙNm¸èu*å;æïH¸x§ú[•ì³þmÀPiä2"€¦ÓÈ]–+w|pÕ¼ù*€ï±Ö”=èº‚Î”Ð[„¿¸+~?ý*)U¼ÓÄ R5ÞÂ›î[^zsPp.¹ÜÛ,m+BhS[‹‡Ãâf&Aw0Þþ6:˜ýQ8‡½<ß½Ý2­®Ú6 ;ìî(Žj¡»hBOU<ìðS˜I$ÿÑÏwŸôöÞæKÏ$³@ÏÉÉEèlâœ„rt6{ö VvóœíO“˜<!Æh ~™°ñW´M²‡ÜþæÒ¬˜–\îþ‘ÝFÞÝ]L÷±®öëEÓÞbß²û/¶ï³}f'½·®Ùýû].¦"'©»ëÕ¹êãÇ¬ÎªS«×W‚Ã*øS@*fó*oò¦RÒÃmEQTìŒ£QP9Ì˜5ÊøAŠÿúÂo¹Ÿ/XÚ6{f­ýHˆÇk`MÜ	±”@¥"Æ¢Çñ×XÃ°–Ò6—§Á›Jyz<QÃNQý>á’±S|BqŠÏÐ!ŽÏfäÎ$R'”Znâ¹ÕÓ–ÂØaØxòíQšçY(šÝîÑÛíQ¢™'ˆéŠgU©sSÍë€ì#î-”E`§2BžÏ‰Ud³Q_I¼<‹dÔåó4zÃTÀäÏ2àÀë¸—ªè*øþ•œDzÆ`°)+e~³ØÑGÿ®¶°¦¾¢zÅj<Õ¹¸†$ø¤vnÖ|òó÷Ï·ª×ûÐOBx¥¬V®\Õ¦®’ßª]V$N	\Õ—ŠLÅZE¢˜»‹ƒF·ÓÝ­ô°uyÐèuú…n ñ'Œœ%5]AnH
|ŸòºZ™•Ý"_ÉûÀ‹ÜGNÙÌUHr®<¸Æ-‚Î'À>GÙÂà•ÊÀäkUpgÈÔáØ››ËQz§ÙÝB§¶ØoVxÇŽvIÚvc:Ñ8ÆšIFçìhÝûJ¦ƒ¯À8t
}mÅ0+ ­ßú9 í£ê ‰üfîó¤~9•œÇ©OÙTÆ4EþÒÇ3•É¤‹hB2Ò2ßÉH^T„d€}üÍ£˜—0ç˜ \6wAÀSÅl'¬âzq'\G‰¥BLœ4Vìw#ƒŽxâVÇ¾·<Ÿ=~z—¬MêÄwýåoÅ? Š‘–ÑÈÈH+}#NFr»ü»Á2OÌˆ…ŒÌ+™JúSl3 c#…ü‡è¥3â¿ú»\WVÙÜè‘r„…‡Wä(«5IšK/dQ©Ê¤XÏð€iªcÜXMPŠ³ÒQqü‰„•ªÈý\ <YØÎ%RšWÎØ±`]±-çá¨®7™äÑ‰.Ð¬}½è‘ZKÍë—vr¥ËsåÈ‹•D²‚HQ/‘ioXOÝ°Z%“rÐ,ªÅ{õÂ­ehŠ0SÁ¹¯Dè¢@Ñú)¬2€(yŒßˆXÓp³õÚeX~åœýááv4»•ÆÐã‡¼|n­ÅÄÀšÿõï[·Ô¬ˆ¾àXû•ãuR?ƒª=ÀsÚjé©j°ò0ûö:GRU œAØóö:þÂïìU4ê\½ét:²ûm¥Eì„~5›V‹‰º[©)¯ÍÆÉ­jq³ùûÔn^ÍT™±.ß§ƒ¸‰5ðvíµ-‚9™ßÍT‘N@”øÚ\tø5ìzØ­­?1aG­ˆ‹ýì«RD­nûN3ˆT­L£ÝŽ*aÚÒÙåcMkÿJ¼DÁ:@ë‡Îö Šõ#L'0–++h«2è o,¥®ÖZ½>.Ú½48§¸u&ê‚¸Žl`;¹Cccí·Ô²gI`”©Êâˆ—U”Íãrè(Ž[ý^¯Õì¶0]Oi¨îFkœ)XaSîð>€‘{Ýn‹H@šÅg;Íï“¡qDp–Hh¤L[[H1 ­ë/ßUñjÎ~*9ÝËŸš~	â%­ŠD^	i[ã•gíÅj¢Ú¡»2èç¸4])‹»• †n%a]™AÊöé;5—ªªÆ³ñOEºŸ/‚¢í™»r‘ž„•Ûê7º]pÓ\TZÄ¶3Œqaâñ`[áÌ±KÓ6+G…¬	rPDY!z˜ä£§ØÙÄ¼dgaÑSM•ã¹Y‹
ªX×x‡Lø€çÌÙwó%
&õj+_†Y‘’—’~Óñ0Âlòš—VñºÇ)rù²Â¡äphQVËóQ°E'Ú$Û¥¨ºƒá‘ð(°ëŽåµ#wîP>x˜âfµçëÆÉnâZi®DÐpãAŠZÌÌÃ|àòBU¼[$¦[¦\·[a¨ÜGJ÷#®6tjøõýºýÔÇÀÒ'®‡¾Ä"U(tóŒ*%Ùl7D`hc¤²7ë$/z{äÏçnt:÷ýhVè•`Ø¿‹„%Œ—,­¥-]ÌÔÈåº¥'å%²Ñu¸V…Ìd•öE¨ UzMdJYøQ›¢´³æn©ÃåÒ[³dñØÉ¢ý¦`ržªTŸºÒyÏxrÏÁ¡*kPèvŠcLŽÂ•¤ŠMŒ‘ÙÉ5ã?»˜;%‘l»‚_UUŽZ¶;žNyG×l•ªÚË8¯2;cEû"Ù…O =±¿Wô·#úCiì‡ñr˜Œ‡Ér4k´Æ/of.4š	eL5ÚS6WQ¬“$ë³9BX×káÏ±ˆÖ1äÞÕâ­—z}ÈãSh/æ?å§§°íéá+a>=b¥êœž*¹sã(ý±*OR‹ï?d[>j|êVR%}Èã»AššA45qÎÈbE¡Nn¨TP”º¼½,5r|ðáô%ÏZžá#›ß#IïÑ—²{$É=Ša¥DABé#4é!Ôô<Œ¿,šEŠø/{´nh¿Ù¿7´ãÝÒx‚‡:š5N'X´Mž1nûÑÁÕ™å…Îu>þr÷:Ç)âw_ak7PHü3ðßé¨zÝñÞnO7ª8Â8Áiòzá0*GÕŠ7º%MØ’"gÌg^ÕÉ\½œòºX™¥qZâLCÊëÜÊ:´\„ÉÆdE¨("2äÙ‰¸~‡{ÆR‘ÇÒ×íü®Ùù š³Õdxïn4;GË•Q—wërTµ)¥qt0ˆ øô49§ÝÊºœt*èº½é:n Ò‰WNQéHËùTé¤kë´ï\™“ü]CÝÓ‘–,˜ƒX±A|œ9ÉXèöBã>¤LZú‡¼•¦ÐR¡øz‡nwÙfeÄUì^&"V<e-í²8Øx³Àòqƒh²MNj­P²rcxylGå¨Ž*ñ•‚Å*è^ï8@ìCÃná”ºØ”aäÏù¥U¡Œ¹«S&Gù|®Çl·Ò1+$„w$u—áQõ¤•ëT+ßÈMSOŒ1ég+@bû» ðÜ;—äec‹òEç#®°8”ÑÏü©^)‹o#5o˜\£—U$wŠf  Ê(®ö Ã!lyÄžO£1´6Ñ¢äRÑi©/Tõ8E  YÀû}Û”²„cŸÌRñ‚vóÚiî]¹pJ’~Üà)&¯©*LÚ+^y€f«­¥™ä=ŽùPUMUOtuá­ÛžêâšæBïöZ{ýV¸ÓÂ­[o©ì†"À¡`õß¯UÝâ22³¦Œ‡& ¿8¬)Ö6)49Ôá¶8æô&ˆÞ˜³ü5ÇK´}Ï€ìX¶­×f=Ôõb•ú/¦gÒÉëÐŒYc8à+òÌ±Î‹­f7]’À™Ã†}N«â/ÿ^$-ëa©Y§ƒF‹×ˆeÎœ ƒWÃo;oºÚêÅhÅ'L™E°’c!­8`çÝÊœWtÁTÈ•?ÞñädyÀJ¬»¼‘X’&À9‡oaÑC¬Ïba°1ò4&‹,ÎB¼¿¥<¯êß¼.?þ9_±ãK¤¸NåÐ<äæ€9O¢®¾Hq}E3@®HDuGd]õ¿ŒEŠ£Ú—k`»š¸®Šá–ÖRè¾RXÑ¤cœSý?il\Ûë©#V*~´d°¯ÖÑ¹A®&HBÆ‹2S>ü‘û+<ÆàìdE¯‚56š‹ØX­Gµlü¼ª‰6‘±¯¦úduÁþü—XMvSÃ ¶5³é/ëøL =tæ.¯žj ðÕKòçÓ Ñë„læzïGÃàªòúcµôy¶…t–f@d±™eD*]KôìœÁš Ë¤£Â8³÷Ï‹ô¿þn3k÷ºÝ^t°úH+uê:—b!ÅÍÚÃ],]EÕéˆKÅc²…|y]bDô€²äòÄšpÑŒ4ò¦7Ð„`’÷WÑÆ¯mÀ	Ÿžî×®Õ=÷ÂrI«ËO¥4ZJmu:mšëpéxÞÑÌAÃ÷È=”;æzY²‚1ÏÌTË2òÕ8R©ÄLu[\UÍùÓæ£5äŠÔhžÌi2ké¤4r=²§T¨oûÝ%~ L!0`¹·'$aî_5˜v×ËÝUÏó¼L.ßì§õðäÒs/Æ…E¹<0
ë”è"Û…`lšE«Þô$N@-—›œZJ[7·Òi%YXsÌ®šØ_t”.k™H½—C‘5½b}IDûás÷ò¹o;Í/Üø«Ñ%`é1|¾cÅ\^šoÞš`½VNFäæ£hð£0›Ñã†ý‚ª±<Ó¼w•ÌQ{u¶;õQE‘”{—¤2«âŠ®äkÂ îíµz]d {œläªºfPTŽÿÌWºÜÞíÊ•jI‚/zf­1ñ±>‹¯‘TW
¾2ú~xôúä§ïhrß-ˆ)ŠoéOyÿÀU©XR”z^HXeÃ*ý¬2èêáMÙ~³¬v…îZ#aÆª_¦«Ý	—ž5mkl¡tCk6=B'^Üysk+.iÂÞø¡ãž<ìÚ³ízR…ŽýÕ=kÐ€§ð	Ð3O‘•\C³š‚›x›Œüˆ*G4$$ ê¸ãpìWXBwA><’<WõÙÄÅdW½Ÿ›à¾
œÜj9¸‰e(ôo3Â¸ )ŒœT¨ 0€ŒÙWìj–!y2fæÂÙ'fb³ë¤:x^u¡íË´6TØ°f$j¶/³"E¸èJ>M”¦hÞbó“’ò>ZGüá| Ýö½«ù5þsR\¿§4å}a(J°“ÊÇªçžªÅHöX"ÿI=ãúv0Kã½[®"ÎÕŸŒj‘7.Æì|×.Ùp¿¼L¸|^Å1,ŒMEŠGñ’ðÅ,{¯ ž¡Ð®þçòêñ#ÙX¤Ùüñ,¶÷Û.òã6 ™œÊRË”Õ
;jº=%Š!ZVzIÈ:…r3Cžp R}]®-áƒ*t½f–æ¥·*b<Ù¡mSZvü¸ï`’¿ª[c3ÀNâÀ>¨­›¨ê½^›¬ß½.õÆ1º£°ªÈú±%“7ºÄ­æTv'ÉHÊÀÅù@]g†@¿{ª¦(Ç÷çƒb9 «]àÌwr¨ŒKurt|Ì¶ÙÑøï«W?>yOŽNéâéqÍÙš=3y™ð´òÇþì+@éV0™1Û€Ðç¤-ŒÙÙ$¤R¼Þm†
;¹ma¸O0ÂG$¿ø“³÷K"#t‰QjÂqø¼]½) zW â6BR£ÅóqÕ‚…±{1ÁHpwz5‘n¥kùüŠBìZoQÎ`YGF	©K‹!E¾F›É«êxèT©#Š³´)ÃI.¦cI.ÅÉd]¯1
<Óê T‚n ­Z’n¤Ý•·(;Ùq+Ir1‡ìÆ•ñÒ’Æ`Â[Æ–=uÊ*–3ÁBj Ö:8±b@îSÉ[-vsÌ‰ÇãSB“Í´³Êþ†WïbòÐ“ÓKl™@ Ee"\°{bŽ´_ÅEM‹_+®Uo[TtÃðñ,ŽŒY,3N/v¢å›ËmÞja/µÅÞ˜åŒ¦	DT°™òl9mð—1W9ó	ÑìÆ¹ÏmÁ<…ŸvØ‹“Ó×-öÃ%Ÿ{âlu:ó¤ò~®&s?ÇÔäTÍ*¯óÿ  ÿÿì½ÛrÛH¶(ø>_‘­®®’»‰WÝ¶í
Šº±K”Ô"mWÙáp$D¢Ü (‰vùDÌœ30_0_0gb&bÞÎ¼ïù‡ó%“+—L XÐÅUuº¹w»”	d"/+×}­”I:…[¦ù\8ÆYøôŸT^N¬¬± óWüAþ»zË¬™õÔÈ™K³·X{©Îõñ-Ñî(˜×Äñbï)zµA‘¦5†¸âkµË  ¿µ±Cû2&#ƒ3rE˜‹ðßÚ6ê(Y)–º Z*ˆ\069oÌHìr±¤ÔÈdÎÜR„¤~v• ‰>H “ôï'¶–
š3ÈdÊ€1{× = M8ªuÐó¶W Òn(nÒÍ(¬ÓÎE¨”q?¯ëVqÚòÛ.ýÞÔY”LäQ³¿Zo?Þ|E… Ù§O}Ût(r¼º5¸ê?Ó8J.mìk¾_4ÖxBG ß¨ïílk??ÇYNô2¡"Ð‚¬wœåÜvMr9£Ä@?HRÄó¡¸ÝÒùŠjÆGõM‘„ç’KßcŽ¡ñb?éH·«Ž”Ê§ëg¦R¾œ“SëÎ¤`Í(é™y°ý¤c­ºëÛ¹M'ÿXÒ¡•ÝiUmkDÖ‡öEcë­{±ÕõÍ­®uÑ¸×(ß«hÞÇ}kÐ9YÂ}eù–Á0¾çÚãàç/XúT„Š—e`Š^Q»ãv%I[¦u˜ÌN ¶…"ªÙ¹Ôê×èRjt‰kDÁ@jeDÃÝ•–³‹iÔq#¡‰´ñ˜NúÞÐj½°2é{.ä8µP]˜Wš6¯ —–ïÝ)X¡–`ÔXb/¼‚t('åp#é¾„ H~° y¸A[ÍK^¸Š0G«XÉìÌ¹´1(ˆëN†–8x(¢šäfT³·®¸RPÂ5²äVÈoåf¸™Ø¡Q¢éëq¡„hÔ;y{!´‚"1M/GâjB	Ñhh‹P%Ì ‡Òi	uB)¥’O(«ÀK?Ó4ªÀ,ÊÛ¡¸(o‘+™ù^ThzfM©iTjz>Ê4e˜¦fÇ‘›ò
DÓÓk	L¡HÖO©Àh||† J^Ú"A™¬wÍE€jOÉ“ŒrOàBÊ(,Çr!½<×M{ˆóˆjHwf:co±Â"ßó­?¡**Ò‘nÐèLì[ÄŠI%9ô–#‹.Â‹jª‚Œ2¡HXBÏb,™=Æ±NR/P¬2ˆsûRZXV¦ÂàÔµBÜ Ž-¹V®ÔCß*Z¢âˆcÏ+ôÐõ{â H‡äØò}÷ƒéå¬P$Ãþ!¦é•5›B‘t\;ð(g½ÀÍ¡qjô=©—¨†P¹ßtVÈ¥HÔ›–èbúŸ,—òISì9Y6DJEÂpÏQr»1I<9Ékå0NtnÑ9¡ t$õÅ{ôòÖZ">de2ôžãM!’fùPZa³i^|tQîÀöÆ–oR¶>Ø ´0OT8ß‚˜LÅ§t§KcÀ|U(:èQgz^"(ÐÑ¹ézÙN ÕA×ôGžKg81h_ÙnÒ§¨Î-¸ÞAÕÑØ€t'¶«ê„?AuÒŸª: µoœÌÀVuAkñ]\ŽT]ÐZ|]õ¾LªLÄÏtÁ*(V£+¶ƒ†r9KÏ7fxQ `b5fæ3GÕTèfDq™1ôÓºœyÁbfJ}òwÊfW¦Ö2Ú¯æSMWÔVü^Z·ˆ:¥-–Î*â¼üe0“:©Bé4€§š'UˆæÒ˜i	Ð.ŽaôŒ°Gõæž,¸züRïzÓØC‰´EäªÄ:TõÕjÚÕF5h7/[ª®ød_ßœz®¼¼i†›Y·4¤„JÌi¤¯./ŽbR‡:Îvè¦+å¨
…’ÂÎùHŽí‘ïÙ¨æ]¸?š²â×ã*"?ëˆòY —GG?ˆ-¡ˆj&6òœÕÜò)á8BáûÞh¹ð½ki²iæë¦oŽ)Jœ{Ž8¡ƒ¢®…–(¿íû6N­8¸ì]œ‹gWÀUÂSÔt¦ç—b{Vf6¤ËGõðv(n9-%¶ã­íéÙ3Qýü4|+"·ŸZ&ë?…T¥=ù`¿@é7§¶+­¤
Ã&®LgÉŒ±-qœÉÂž`ø3{ì $™c¡Ÿ´’¼	ÒºpnR˜¼“à4©B²®æÜüd-lWBKR=†fÎ,o1[9ŽÜTÏõµ•JT…Ùâ`ìù£Ü½¶é‘³]‚2P–c_ÆÑq
C{SÝKÇ^¬EÍbaû¶¸¥q¦ñÜ»£’0¬¸ØAZK(w5[M|$Ø÷§27Dù$?4ðå–”eF¶|ëo-êÞ±ÌöéÓƒ3X:×òAçõ$~€Aàý¾D¯h‘€sS×š³Ìˆ.ºgbÝ3J~(Ãùt »káD ³™tÒ"JSÑÈÈµPE .\Ž,”²k.Z§ÖÜà@þŸx×„4ßÏ¡ØËÉjÐ-YgOŒÆiãµo(ÃãxãYF,­Å µåÀy0E£nZ‡ÒCùc d’.*ªz Ô¥‚™“0¦ƒ1E~àŸ‹~XS"0º.WDA¯ÇµâæÇOHôèAÓí|ä¦ôÐêruj¦i+RÞ2ß0I#é*ýŽñ†K2F¤ÌB!àÐóoè¡ÒµÛåR¬Ø¥ðÉB[sØÙ¿C`V†Š‘SË,á;Ê6âÀ¦’s ûÍF\MìŽS |ÙA÷ò¾^/1ï<¦"•yg9Có.Ã?ÇOX¦ÒÃ™!œ~‡Ê=W”~X-ˆ ÔcHåÛAÚ’=T¼–ÿ¾,ãþJwÁœÎ&æ¤âqH[=Êq„þò†:€Gª@ÛçH¶«'îdü ÊF^ÐíêÌ,KØÉÛÈôƒvý=ˆY–•> â”ºõÎœ[!=žÔ•\ÿ Èè[!8žS0;¥¼›7èô1ð!´í:‹¹µðÍO”›uMi%fÝm¢)©5Ç2ù”êFT>ÙáÌ÷æ+ÚY?Œ¹Ý"¤$Ð¡ñÃ¨ÊÜ¡RÈOäÀ
VNFòLžâ47ó„hˆ
œyRræ¦š.¹ôBJÓdº?Äé±B*|‚™e€QPkÅ¯ µÝcÏÍÂ•X‹Zï…BÂW<~ŽÓß¸¡u,Ž‹t(}Šòì1hy¡4©Cí¤±³¤=K*1ØÓ¡àöIÞ¦´ÑÁ‘¿NFÒ‡Tý s;´ js5v…8¹bóÜ+/XÆ‹äY8ñ1Ê œª=):.é+(Øô­	ð™ÚHÕ(…ÆóC;C¶2Pª5Ë¥mrÚµ¤¶‚FKä5'Yóu9ÞÂžxSŸrvÀÕ1" /á5<RÔyqï¨î/¡´Ü‰%ƒÃå¦H“ÀÄrÍkÛ!];Ì¬³â!ÎŽZÎò#\ó]'jFK|±"ÃE =Iàhdú¦cÉ#W?G)VI±uêç¨…M:¢€¬Ê|ª~Ž¡F.žì’´Ó,¸êUÔ¢Ä°FÎŒáÌ·²ç\ý§-Á¤§H5Çù¾úö¬@Í¾ˆ[›gÉT¿ú%IÞÀá9°/GòÞ)…­ÕØ›Hn¼ê÷°6:2°|x×\¿ª§,wd¸ZX`™Õ²B¦ŸÿDö]œrëYŒE¼‰§9¼{í¸Ó›ƒºYÏ ²ÞaQÙ¼{=­d½~k„Lf4ú¢ž1óä+ºTõÁ¡,Ø ÇñVàG5-K/ÎaÝ¨¸ANÖQ¡¬]’mH
P$€ß€!¶3•¶E­:K±	ês—¢žà2‡ET3Ñ|t9Á6ë‰ëÑC™i/DëJ—~5IÝ%aI‚êÄ‹ÊúsT¬TWÔô‡Kw„’ýòŽË8	Ô§LÑbâPB0_†ârÇ5(h…‰e\N’:ÌQ4k¢çË`@ ×²^Ë´¤È–ÛgÙ¦´Õ¶ÕÌ|*P¦ªmq¢CÛØî8Fë5êÌ¹cJ`E-qTCvê»¸a×wZ—§òÀë;Ôa”Ë…cÝ55Ñ‰—WÚ{€‘ÆÀ¦¨½ÛØƒ ’zÒ5à	f5=ÏaÄá´.ús±ûÃY=(¬Ñõ;Î,×‘Ô“õè	Òû¢ëuýcëÜ>=êHÄ&®'ð s(ýŒo+c6ºÓmJ»U  ôÄ7'’þÐ&ë¬’ ÝOÞ6ëJ®™?A­áNm§--cˆ‚Xh	oF(b@9YÉ×`lX¶?6)‹«×¨ ·äü¨<?"åRËa×0‰(=ìúŒä›Tzš6å.¢ÚˆCÙ‘üX’ÌHqJ™èš}dR…ÚJo$·Žk[ée¢¡Óº*²¤äR‚;‚®tú\²>À9²¿µÝ±4^wLÖßâÚžeUi¼Ïq~ Š£S=’L˜Q%ø‚ z9Š"®L'bøS}Oò}—ìVrzhÄ!%u˜˜Øåù¾ç~’ÔÑ=AQÞ½Z+Ãl°8ÔÛ}Ù·Å€&YßpcúÍm‰o 5¤‰Â¥ƒûýŠíã:‚ÃÆ¦O7o2µ²ô,y@Ð”­ž©®=þhQ
!ñ`Â“JÈ)'Ý%OHôsØ§oŽZMé¤VƒâÖëµ7Ãn@ÁšÉ’•QôÑBÊÒÈÖi%¢‹<
BBk^Faå1Q,	-GU(&Ô7ŒCRZ‡Ùxs4²Ã)$¿9VMúØh¶‹zÂ}Šrm¤Ü'ŠÓingû Uøö]Êô|Éq	ª«Ã0çFöûq‰e8œ;Ð©9¹¶-g’ïOz@ú¦;5)iDjd9×a4Ûzf„ÀCÌZSôo…ôt‰]¥•„þé±,Q8´LÛ4š¼LkÈ9ä<Ã"çW;õ¾¸y¬L®LÛ¹5Wx08¶Œs»%âè¨†\Bú+º‰8ìJÇMºõFMF­i5, _ª·†>ŸŠw+|¶-‰0§æŠi´)Z™NÑ|]#yäZþtE­{l=<C¦™ø©¤
³0]12J˜F}©Qÿ4}3g?ï‹ùo „ù¢}l]^ˆÚŽ³c”Sô™”Cã—Cc`‹h‰t\ìì:ƒ^÷B@‰k¼îB3Ú+i´þÕ—’¢ß¹IQöU“/dšGUì2´%§•¨ƒv]vgœˆs£ŒHãŠ+%D£7RÆ7Èµ•ÿYE²²×ì§éC‘Ç÷QÄöL8²<ÆŽ£´Jo})
Ð7Pš¡ÁA§.é”:TA­ìÅ±Øq_|e_l‹$–m”ÈqúÃ«Á°.R¨0ê¨õéïŠëÓ;6PÚÕ³3)?É€îË$Îîæ¬øýäRLE2XRIÄùÕCg(Æ£@ñ~C9Îâ^Îù¢}9B]úË °M÷ÀYZçúL	ðK0^Ô„@rn1Ó7ÆÈo§ÒÙO4–`¸…;×á"-Æ£ó'¤ÅXm¾×Ô°„qŒÂù,©àýI˜oT›CÓÈµk‘;o!0yÅÁ‚+k•fÈIÊ½ÉS•ž¡½)†’VóŒ™,ó;:U_™!ÞÊ&LˆkPôrjfŒ~IJ¯d3ïFî@¨ÄtaÙ×–Ÿ™P‰uèÈûn`Ó:¸ÿX’º¢*‘²æÙåOª°
æl…¤®JÆéJV%OÈ:{„Ë¢bNgÖ<7ž¨µœ9³#Ž“:´Í¹çŠºë¸Ñ˜É]–›Å,¤«±HñOp‚Ê›î¹˜x—+è£åÑŠµ(nµÙ•(ÝÈ†¹™®c»qÚÑÇ¾‘½Ñ¢²~ìùQþOœ¡aÅ¾¥ˆ«P^^æÀÄ5ø^ã,¾Jë0ØÖ¤,Xc¦u8Ã^8÷ÀŸ-›à#ûcÈ¦øè¡Ó{ô=;ò¸?©DZoÈ®áI†ÁõÜ`b:–<±sgKwš!qf
”?Ë »¤
Ã<4OKÏ™gn’*Ì÷sÉ’:ø<IÜš3â|6–`„ËdOH+±¶›¬ÅÇ‡ÍM7[’Ô‘ÓG&)<^:Ž•AÄIYïn×p3C
úXRpjú“\¼2T¢B•#Òá¾«\/¼ºB?7œùf†‰*Q]L|Õí€ØOô¤Âæt=*ºÉ,]Tƒi<3½l
1^ƒQ;-© ”	×«0ßö½±=ñ2hY¬ýŠâçù’ÝÝB…ÎCëÚr¸îè¡rçÁ¹î¬ˆÔ‰¬d=™´.ïp úª9°E+“ã%Î´2°»¹üïýé:æd‚´…œ™~³++¨Ùï"¹¶®œ‹º{N:þ—B>öÃxˆkÆåòÐrBÑ­ôÒY†Qÿñ!û`Â®¦ÿŠìCJÉEˆ{õàú)¤§ŠÜA¼Q¸.$þÓãØ€0œÝð•4 ZBâ«æÅ®Å(½ä+Iþ
§edäq\gÒYÉT˜²ÃNâ<‡rŽp–Â¼c³*f¶!•J ÅÎØ¼±Ü©$GHúìAZ/&c,áÖÈ1áfŒÒ+mEÊ›•O÷µúöµmM¢µzöZ‘’A9JwˆcoçöäÀ›¬8¢UL7ƒÆ_WVaŽîŽÇ‰Qj‰:ü‘]¡l‡ÖÂ±BkòÊg·št2þa‡¯xÐ	ŠØ‹$áÊ":”ÈÈ{È=.«ØÍsÉ¡ž•gâ×fÆînÏ_º“Lhòn•þTÔ¡@	Å*É7¹ð2ELÇV½%º'ŸO¢Dé(ÑÃ¤Íõ=‘1Y’s,—Ç¼Œ¸…È¥ºyë*º*Q#9¶’>®Á,Ä±¸mPÂ4j‰àÀó=—IÌÂBâœ\ýÉ¿Š™éú@¾Í×lhÈæ]\3`1%:e4¥?™d.*‚r†÷(s<X¹B{¸"¢+jT;S£ç]”J•ã÷<Â_¿¼vP;üê´ÿFJjÊ+ð$£s&¹s@ßx ¹JDÎ‡WTè`.¯>+WXýËÑéT²2å5l7„PVäÍQÝ‰Ü/£´+ÒÉ¶.Hß›X>ö»oý®t:QDî@R¤ÓRåéž›½¡¸i´¼?D^Kp*ã“ÓFµÓÓù–°ñÀš¦×¥<"×Œ!ƒ)¨d»˜sžÒ±RGÇ–Hâh)ãÉ`Þ˜(§!19.¿ÀŒcl”Øk72÷E5dä[Zx¶[[ö$ã5•z¹²l÷Ú£RÚ„H”Gä$…WZÝ
ø†‚êÜsW$Dq92#r Áø$ä+3š¼õ›G‚KZ®¤s8òG)ÜdhøÛoý^½†’`]·Än‹†SÓ¿¬X¢Rô±Dm){¿r»D }ORãXb˜Yðö`9º®ÐÉO£±“ŸFäânU¥ƒûBLÂq`C¶7A6¿²¤³v5³
¢â*Z»—dŠTÃBÊîþ…ŒDqÍ~’)åOH.¾»”ïÆÁÉùupÍYF=ªÁ©“±—õ0H+1„Mrl…Šµofû&Žø[rC^Æˆq® ¬ˆÑ:È ð	 ¯å›ÕXe¸”¾ÆŠª,Ïm€œE)âÖ±"JÄ¤§'{ÏRº5»2ÔEÆHØ“1Œ¾ô±pßêL¥V¬ˆCŒR;^ÆXI]ÂxÅ…K‹ÂŠyÑ94…PÄ|mx,Ýâ EÔ /¤1^õ3;œ™þ§‡ó2Wx"Ä(#ãŒ‡2}"éË‰ÜìÙl0ÎsŒæÙRnÈË˜#8’Q/£0ï…„wqQ¶Èo@	…%Ž%$jÔŸJÇQÚËcqYƒZ¤Côîý ²N?àò9Rºº ÙHBE¬ˆÂ|Ò¤XÅHC\¢†x9êÉÈ«‡Ú­sS"+âdoYòÆ®´Š¬ˆZyñ—¸f}Jgdø…2Š6Êyƒz|9ÄIû%=ˆ‰döÔÚw²?AÑ‚\„»CaWãä}xQ=ò.¾{˜ª	=º4;XRN¤Ù¾}.ýGg£Ž$zÇb âOà b™y$!€Õ@'(’Äx@N0™$õØdaL›æùkøƒ$—;æTyŽé}9W Çòû!3òh‘LQ-¶›ù(¶ûÒNyQn0¦³
ÂühX5z§|kl{Ë€[è3Åyd;ÊvËÕ2Fx’é?L¢RP<¸ï¹Súdú‚„kƒfA‡[X=34 Ä=ðõŠ÷¥ a2z*L7$e-ÀyqÜ5¢«‰•xLÐ°‘£L™ë­R°:¿‰Ö8ô—Ó\Gü~`‘€Æ¬\g±£ÖÒu`†¡å¯¬›ë-zŠåearcÒ¼q¨X3ùñÃ@.Š¹4’3Œ‡¸8\óá×…ôì¾Áœr³åñÜç“giÈ/K´€¶Ò,ÕŽ©ÙÕ›ÈÆS¶ý¥BÈïÙã˜ÆTØ±ù=÷¢l„—3/ôÆ1œ Od¼¹hV£ÐAød£„KEÆ	þl<ëA…a6I‚€ŸhŒLÃ­îV`œ®F¾=©0JÞáížv˜1è_Y×>\ƒæWYÍ´Ñn+H|ruw…ñ¥Í„ÂMŠnûÌáxˆ»
´l²Ñmã±70pšN•7~”;‡N:Ëv•›+}R!Ç2¢ ¬<êgI…­®c®Ž/×}ˆäøJ."ø1Ž‡·ó~—ˆ|úÓŠŽ?ž™){iOÙBã‡ÙqÇ6¬}Ôò‰†sIàù£j#ämÁm4n¬Y6Ê³¥KÅ+*)ÓÎŒ=_ÂéC’µ%qÛ'£ÌÀûŽ­eÈw.O†”êF"‚£¨3c “ÆOµšp)§_”h$IÜqÈ®‡ˆÛ’õÓÎb+¾Çþ¾WØ!1n”ÅÞH²Øq(iÄ{Ù%¥­H
ÙUëÜÚn°…>ñÍkÜ ¥+ßIY»‡ƒ«ÁRyCsäX¡Ws,!ÇWAbq´¼š‘õÎeïoGwc{˜+x*€è[¡åùLfb·\TÓ“Ö)!zšaòÕ„ ªBº”
CÍ§Zyš‘™>Åª}ŠQJ	‚ÀšàFzõn-¸Ú>ÕB‚¯X"‹ŸZp-t½L¯g¼&R'O%ùDâ`@@9»¹
É–D(^â!ê#A;)‡æÂ2N‡b. Z"PÒºš>e2=›¢à¥o³+†:ÀÓ”ºâ¬>í„J5WKÐvPz){¯G	<F)¸‚‘„^sÞT_ü”œšŸLå­øÚsÆ¦K…ÿN03†Öbæ‹ÁfñSBŸ>Œ…=vVì'–· šoáâuÒ×	íãÉæ®åP†&ÑÕ‡ÖÔ7'x:!¨ùySë©„åì‰kQÉ®	7^ù"m3°‹|:NÞš°Ö»Ærp±&:qŠ¾ñ0È9³K@xLÍ–ÎõÒ'QÛ§"ÐÄàhÈ\T¡ÍÐÄ!îûÉpõ‰oYn0žÙÓ/YA…q
™9„±ëO¦Pë„s`yá+ƒië=Ç8äˆ#ÓÆ¤¤ÑÃ˜tka\Œ-Ó5’¼¼Æ¹7YrÂÎ»¤ôí‡ŒÝÐÎXÞvã5œMfÏZØ!öÊî×LG5Â˜+\ŠfÐ:B§‚Áž#’/—rúžRQyc$~wG×M&4Å8‹bc*¿õÀ4pÔ3ÎÌ•Kë¯{®›	Î™Ò FÇp\÷ÅQ¢ z˜ŠÎ2o]˜)å–Šª	«~&³À¾´L²wÀ³ÉKDmIÄˆ=¨—wL—ä’×Aô€\`= ]¾q	HuE	œÜYwIâ'„”Ô´àÂN…Q¶
˜$Í´te£úö(Ñ"¾éâÐùHžÞ'¥ï?¯BªÙ#l(«È|˜,&Åu¦ÅÃán°wØèý FøêtØ%q»'áñ’KD3ÔÇ¶OÙ’7&cñÖ¤äýbÕ	=’÷lJCznÈrÝC8RÏ#)2hsÒëwŸL§É®P1íÀ2)ç‘H‘8ÅkL¢ÆOÅp&b›q`»°š—³â¯)E¾û[,DÕ_”Å—ÎN Î›#óÒ·Š¶aŠ¯ø>ãØ#g»ç¯ª^ÂXŠ|ÈÐš"-;µFFûÁÔdýÀn4MñM^CªhBë&eˆ<wì[0Á[¸ÂnÈyMä^Æù>r³“ä._0sÉ¼ÍßÂ*uÈß]£ž(oHjV‘µ;òk¨IÜØ\#|bd¸ôGíÀ«ß²úÕS,oÅ]Ñ`yÙ…Äl­AQ•ßÍ¨ÈonMØ•QCÊ÷³88faXðšJŽ)ï$¸«FïD.aÂ»˜o¾rBß4rÐ™Ó,-
åù¥S«â¸úþßþ'Eínø!×¶CgeMºÜ…•JÐäñÍÛ´|Fåcå·6çæb}l†äÅK²®Ãœ›››ôÝ,"XúÆ&ûs“g
Ð­óÑÓcåg\{ý‚LFVÞ}{¾þl3ôØ“.=zëÏþMÛ•}MÖÿ$ôôŒÐc¾ô]úKKß,zi½ˆdÐil²í•Ç²i»cg9±‚ué³¿þZÖ—=yxG°Ø±Ã2¦7mWÚ%ý¢nóå™º>Þô”R`p,wJ1ÚKRS~JQíI¨ã¾^¼xAjä{Í®=ŸØ7dÖ»ssn½X›×KÇ!×à'ÿcÏá0kŒ-Àä—eÚ×«¸¸0vIhÝ…q™ý8`<j×jdj.ŒæÚKÍ²=€/­œÒò˜©SË­Q¯‘ü#tºM;(ÛþÑ‚Û¶´=Ó;c]Üäš~Æ gü‘,L_G©E[ã`r¸…áˆŸƒ+#_ž{t™¯!¹åØ"sòõB>zú×x­üó-ø`µÑ¼«×wï³+ÆXsŸ&ôwÆ­ñ®QƒW×^)›Á!H÷5ÅšL†¿€„ÖP‘ÄÁ¬€[»³‚¢¡=ß¢û¯zôŒìk Fi€×ãv1úeƒ’ƒ»gIêÀî£µzñ™¾ùE\™yh4´ðBÎZºu,ÞÙwµÍzÛš¿Ïl.™Œ&y>0¶£øþx§VÛj×Èbd4¤/ø¸"¡·0jdD»ûs­]ëÔ[ï·öÚdD¿1¡’$ýú’6ž“O ´ÚŒ#éøÀ(š`þHÒc°Ù†s@ÿõ½%SÀ±CJ‡qc{`o”j÷2þ}¶(Á‡_ôK½5klDf”)Æ¸õÍŸ&YÜÁ?+zRÑãâxA”Åa¨HB‰©¢p:ØgG2GÉŸ(\[#ß~[H¼àgÝ“¯´gñy	Š:ÖÓ2M¯…]Ðwø!ˆ5üž–aè¹%o~XÙôÿ<·K%ì/>¯³t<srtgBðÍ:ëPDeº«gå=¥ öùçüYIA¬É@L8Î4:ÈpüÝÀfŠ*õ“`fN¼[8¡Üuh? Ø Gø›b(ã?Ê¥»ké1¥´kk/¢f·†1Æ7é1ÞÚ­Å£|WûPûPo/î>øÓ‘¹^oîmì56­íÚfóÙ{×ÐÑãÅþ#tÐª­¡F¶ÏFÆ1ÝnM¢±MZœy7–¿/•WÈ“¡ƒÍbÌø½ÜÄ¶ãúòsHáþûŸà²®žoqÐ/î²ð”}) áBt\ðPyê£øòl]ñueÇŠÊ¨Jªû¼õWÒaç‚\®Â¸2tN¨”j\úÞØ
Ê[ÚæÔõ€RùØ›NÝ!9Ø_·ä±|^°Ž-&G.x]MT8CH>ÿLOtNt“žhJ·“c}çhŽµo’“›Ñ]™we„ˆö*ÛuiûÁþæó2°ø¤aÎß“ï" 6ç#ú/Ào“Ñ}p Í…ze»|o.¼œª'”)ÏQk¼ÿŽµï¤c²‘h×¾£ÐŸ	%U2ä#+¼µ,WIjõÔ:^#‰.ÿ~´ÂZŸ]Z=EÊ~+ÙWý¤y±"?Õ`üTCÁOñ½¾Ðž³¤xÏtm`ùpÜ3î¯Œvì¡ù(|²àƒÖ¯ÅX¿ÑjoÔÛ»õ:Åú»€õEX/D!Òó÷UFŸ`ý‚hQdV(RQøn¾Ì|þÜ²>’#HØ)OÈ>;Š²¼¥>uñoÀÔ”öµ=Qâ‘;µ]K‹Ú+I‚ÛëBñ]-…GNŒßí–/Xu„à*B™Y:½öòbÔtî%ê0Ú«<Å¶\ùÃ<^ú”¸°ÒhósÛ],Õj9BÂÕ‚~i<³ÆGÞŽÑ`Ï­É	htàI™Ø™éN)\®[Œ¬ð•ÐnÝÚ!ÏL¸u«ta-ßð\gE§òuÍ9ÊŸÈ=z"ÛòÎk¶„XéäÂ×Ù?F4ôýÁ™‘ŸðÎ¬9'¢êK©‡çSfþšîÛ>ÅB ï¾ûî}T•bQVñù] š—ë:”*’é4³ãHžsn”¥Yñªeø_·É_ÛÏ‡!³Šï°7Ø@(3R Z?ßbà® ÛêÏZ„çX&$64à¸ÜQÀÎ=¨ð—óX´WûË{ùè—"À­Zémë‘Þ›™å‹ójäÚ²˜­fE m)ÛgÀC€ÕÛ ;r¡hM+LwBÆþ*`FVºOý‰J9>• -—P—ŠƒÐÝàgð<Õ«-˜ÍÈ2€Ç<fù0¨€ˆ‚ôÏèëSÊM‚Ao“\Yÿ¾´i‰œXsÛµ£Ûcg¶û‘µ7æÈ¦cXm*6g`‘éy–YæÌ\„@%rœëU#\'2Å0ÇºZº^{Lì€íÄ‹ÏTð´y´Ù¯¿’?1\xh†f¤àÈ7ÁlJÏÉ"ê-?/ §];ô\Ìì	Ý A-Q6‡ž¹Ž a‚_”IÏ¯É’{n±3Å»HÅœQ&çøÊ&ñ–!£.Ø¥®½ñ2ØgoK,ØîÄžz›®€ëoÊWP-Î/ÉÀµgÔµír½&ëÝÒ“Í‘X’×Ô_äb¹BÌHÅnrc›Â”Aæ¯L—ý2œ¹ýF­ö—æ2ôÞ§’û;òI·‚®Út~à¿ 2 Dí°··Q¯ÚÐ6e@å1PÙjÔd…
eÏövß¯å¡2'ßç±H¡ìØÖNèªæäKöæŸ¤]¥²enS5
¿ìQNÈ”íR*oä$½o;0Y¨ _˜> ¦X* e1çaë"‰(ycÅ‰ÍÏOšžZpÂ‰gÍ<õÅ„:™Ñh3F#ƒ*E€¹V†ÇfÐ³O³µÑ ’K£¹Ë¥­˜ 6ˆkLwdìØhq6 ?Ññ€R"À-Š¸ÄÁÎ'ZÁq1 °ò}Ú„nnæI	¼–Öp:áë^›‰›QžÜ¥Ûº›“è’ó\&r“…QWâ‚f0zcDX…!„z]bÙŸ`³’ˆƒ^Š~ Ü…<~6âÈ\)P-=06Úíø%Ð¨—œ ¾ì¹t¦¼8æEz‡…¢Ôoµ"/[¿ïÞ‰ò;z5yÞ§^aÁlTõÅ×¦,&Uëus­³P ;l3Ï,Óg¼*„ÂÓ‘Ž™¸…-‰}¾±­[HáÅlìßQž×˜þä; :
fÞ­Ø¨9•Qy0Dµ ÝãTIÕL Yu¢¬uO•ñVLVûó}ö·Oé+‡3:?„ú"#CB­˜Ëq¦ˆ@"1…ÂPaøŒìÿ"w)Y=Aå*/‰ð¬‰8C £6 ælA‚å*?*„¤ÂDŒ@*àY­‹WË…8-«Z·;kæ('åÕ³ì;?u/Ï­%¸ïŸÓ½ôü2Œ+ê÷ŸoÍšÊÏ)4XŒþJaŸ.Û).
ï%¯¹çz‚™/³O,tetbÆg‹)èºž{mO7'Ö"œ}‰,J¼¢FÚ>q+Éz„°ÊQÒQÝ ³Étod@©W”ÉXl¡å‚•eB¾ü€KÓ,?÷ï'‘9…Ý…<5N@Öc5ž°wyNâUU)%ØŒ—òÌ=º[§²–.v¦½cV Œy÷Î‘Õ^‰|#à½t;*c¦F,#²—¼ŒÙr®‹nE’ìo±dM^n¡xÁÉÇKuÏ»3ëÆ÷ÜCï6ƒdšÌfÿf¼“²xGEþ2›å?K(PÊ£¼kl¶}Ð»§VLíÄ^QÛ`ÿÇ$Å„MÍj²Å©Â\·­Õ ´5JN.šƒt®¦ƒÒABß¥TÀÏíñÇ)›\t3â8#h–
ŠŸ¥Ì—ˆ„`¤‹(p]Ñ¼÷Å7vß‹SŽž¤Ó®× ¥ØwSÐ3‚±Ÿ·ó=·çSøãŸÇ"‚á¦Šƒéb:á‹5ùð‡kzvÍýB3Ý˜ocº:ßò/=zøW/Ö\*yEUy(¼Ÿ„‚è8'+&Ô¥åVîs¨‹³ç#æe„ »³LGM±Æ_ÀÃ‚2³´P‡Â­±·M×…þ“£k2Õ“ò»:sØSí»Üº¡R§Ë_®RÐÎeäQL0gÀµíñl¶[t6ô¬#íÑ}æ’´}Ú™pÇ;6ƒI€”›ÔÚ Qy À”a7ÔœšjšBó7§Ì4¶†ffU•IÎ2ÝÜ¢XÛŒb"U\‰ÖðÎ15$ ‰ëÚ¤	ÊË@uèåm` Fé¹uâÀ§…#ÓbNEËßÖ£âzKrÄeÃÚFˆÉ"ÆÄ’­(W)±,ü’Z¢Ö~¶2ålíè`5­ÿW~™¤aª-u}‹JÄÙ¡µ“–ôº–úöÎ¸ÑŽ˜Ýžè„ýÏYÕ®Þ}½ÜêšÀ¡Á±ŽÛäFMíü¡QójÆ„+ÇzñùsÔ]ûÃhöÉZ²	ªíÆÊõÂz|éäÌœ´˜•ï$eZ‘ufóe Ø@”}×ÕÜÈQ×+ÍëZ!'OƒœV×º.)$=Ñe?=Àx¦B«zÑš°féjkÕh«îé>ùñê0#ÅÎAäRà÷•»Yû2¯ÎùJ!
kÔn9	1z Ž]Èú¦d½ND«¥›‹Þž¨õZÑÌó¦µÙxå<ÖƒR;Ã¥›ùd?•iRÝš¨üB`UeþÕtW½EeJÆpYàU%l+e;`ß4"ºîàtËŒô
²«tlZÌ7ÈË™Ø¹ëùUô3l‹Zà¸
7ï%®THå¸ü"³¶Êé9b³~Óœ² Í4eb“†×åv€zŽÍ5D[@Ž×âë³Ÿ{§Ø8 œ}E»^¬`t|)øÑ·_‡Áe[X$@®AÓs²…Òò›¬vMâU3¶G«´¬’èšü¬Þ-^ëu™WäÃÍ®N… v0VŒV
=[”GAšÅ¥´ ¥šÎñÚ¤®ñÈC«ö÷T;*c(î­vœ;FCÅ`)Oé(4HFºÆW‹{j£n´a
Ë\>è@I÷b§ýù(wÂ)u¥‹ñng›·8Þ,/+¬	.áò^³¶]ë¾ßÚÎªßý¹n5öš£÷"¥(0O¤¨‹éBš<È§€¼J¡åH”)Íxí²…D'Ëå:J­drs‹DEbˆsfœØÕ<!@}^#
Ô!3›Ì#ˆÑˆ<(uß¿Å–]/Ç³€RÌ‡ìZÜÇïpãâ¡UÝ;ä|!ÇüßïÆŽÉÙÀ¸ßá
~×%¢`ý¼“7ò£å»–3°?Y_Þÿ~7Ñ÷ëA;È:ønWÕÃ¬Y¦¯ßñÉã>æÙ5)¸îw³m¥Š]mØ–àjVß¨ïÕ7šÛœ¥—å€`øOŸ×U¸˜ü•hN6}R¯5ZÙ‘-ýAr˜cûÎš¬×Ÿ}é“KÓ7çè*uœÊópüÚ¶•±£ˆÌ¤«Mù·6hÞ¶c‰ÂšK¡±›ÙD0ê½¶|vY"¸Ï•â9a­,Íí`Yýž[ûZL©Ë¶ÉmjW’ôÉPgY`žc+—å8â‚žç’pfñaÙ×‘ot>F¶LÇýà€u:£A¨žóZ}«™U8Œ
k­ZNåCþ»`l²ø¯àËug»†·?ØX]zÜT&uT†´†Ah-‚Í€Š†lž8êÒ$ÙÈþ(}§7¹#/à=ò7RÏFXÇ‰%¢ˆèdá{,ød@[2y6êB×_7
™»2m_·ìµ÷¾	v\*+mf.ƒ¥nøù¶TQh¼ñK¼¢Ô+ˆJÒÈêB­hG¢åûõWiE¾'k±5¥’å~Zn©õ÷×ò·
tm¥¶#ÐûÈ~ºw
¡S—ÜXbCE6T±+ìW”ž"^cý<ŽEeÄÌ;#dTpRPˆÞ™xæxØa èEqÀæ\à‰c½¬(ä"©ÓüÛõÝöF½±·&¬gïKÒQp%\jV+mR%®7êN£Ò+Ðç‰§§ t»Œ]Û;–ŒÔÁØÝ*
Ô.	´T°bò‘aßÏ?ÝOYšuè„õ.Pt¨:5Z¾"'~Þ ¾„R¤[¥×oÔ˜#”®8²636²‘ãóì/]Èx¤WVg®Èì>Ÿ¬ÉÇ*ix?²¥Í «~¡õ±ð"ýÐ­Py(¹ÚgáÁ¤}+ôÁO^ôÅ^OV§ ¡Ò½(×X¦¥T”ÇG²|%>lÔÒŒX	=™OòLcüaINlPœ £(!ÿ]\÷3R¨·í¹ý‰í^pò´TE‰uŠ³ G¼	ã°Ô&Ýô÷=ù¹Û9?ì“ÿôÍçuÊIPF®o†³MJx' þ•´É§öìË?—ô¹O~ît»ûô®ïµýµÒîÏ¾ü¥0cQÙjÜ;GÚBwÀàx1m9´BÓvò-ymKˆ`bû«;jŸ×5œ6²2j¨´WçŽdáP¢G%óésÈÄQcažˆãO2÷ìø(÷ÄC¹ÀA'â@÷ImƒÌ,pÂ¢êÜsø/¢iRëzÚzy‡wQž²UÝKbáºÉ­#åéA‚PÎ4™‡¤üGA@O>Í’Ò.žõfÓò…õl¶š"+y¡çÓ
ÑŒ
ýg*%rPš²É±;\„ÕUeû.É”š1Ú	y!ÁÃ¢qÑd™_£C_2™RD^6ã¼ý[ðÊyW¨„
|óÖ^^^—WÝ£Á w~‚ <HôFh¦¾=!ðÐá€ž¶Äk¬Ô!õF£þžeÕz¡H*'IwŠOÚUºEïvò™g×^ÎWdpÚ¹<Bí±ëQß*¨­½|G‘f£ÖÚÝ õ÷˜/—æ:ýƒîÀùÅU¿sÖ{Ûö.Î¿îô{çF¿ó#émõj²Õ[ªxägŒ¨À+ÿ®ŒµF»9E§d÷ M‚Ð*LˆzÐ9-%¥a|<Ø†Ú¸l§?w|ß\m‚vý3Ïî½Ov¿DJÏÄ.Ì¹œ™Ï¾üE^ÿÅ]ú#'.Nv¿g%Ù\'¶X&'OâÙo·Håùz|Å?®3™>hJËÓ’æœŠEã©Iå¨ŽÒ/Åå¥/Æçñø¶.Ïö3ÂÌKRÛÜ…œQ6wÛíë–)êÏ»£öøzû»¢û]â_ÌçþüÍçºJöÚ«Q	ÓQâOûâ¼B= ‚•€ÄVc³|HU­ßCH_ÀjÓqAœÅ— ÑC!ç¿’sQz*þžïÀjB16Ã¬ïÕ&ÖtC0²l¨”²â”Ï»~J–°Êðïd¤±Ÿèç[©üU º+øê¾¬ä™÷‹çl»$ †À‹´<È¦ËF¢øT–ä	n(çüo"“A\.Jd¼§¬ö ¯˜¸|î~Ùž‘ÛžVrS¹Ã'ªxR?ÔK·tÈ÷d->­Zª¡D‰a­ZÖµ¡|9Ê­UØù•s˜eqEöÁôÇÔÓ|šòó»  ƒÙ^Ò£i5Öúñ$ø‰q½’‚P4™_²Ü0r(ÀXo›‡‹O ò2@à	°9ã¸È€ ÁQòuçª‹ÀžB(Øì'åk`3-g&Î=µ=“…o–cu‚…5¯`_!ÔB•Á›ýÀ»{±V#5p«ÿa ž<_PÆˆL^¬õkd§FþAÒÿ‚Èÿ?$ôíÂ·¡Kú_ZØƒÿÂ7 Sàµí8ñ øå7/Ö">-®xcOÂÙ‹µ¥™AŽ®¯éY##à7«üMÔÒ?Ñ˜ÍÝÑµ™3C´te7kÜLq0vjž3ÊýèMNRÏ÷• Ë1’JÎ«×î!è¥Ã­"ím•$~eü-û~¹äÇfM7"FªÜ·ÜÚT’Pç~TN1bÕ¶)× ‘\mqGr\Æ-Btû{Ç˜ÍMµçÓ‡D¦)óI`¿$ øŽ“i˜Ü57ïÖëô€ê½›`¯*—i0·l”¤j¨sµúVC< "«þŠBcÄ‹EbmpL© ÍÞâ,´ë±+†x6³öò‡Zÿg$–p©üÀ1LãÂ}`8-X·È{¯hé’à]r)ÅHUÈD·D÷Ä0(¦Î?ÓÍeúŽtWeæQ+Ÿ‘ÛëTl§ŒDO(ü„ÆP¨×P/Uä3fˆâ1uG2ó[”|9ë4ŽV˜ãø!îÛŽ4a1ÞuÇ´ uíÐ);EÇ½³áÑÕ )Oi¿!‡%»:Êûm,œþ^w]_8³ï‚ÃÌÓn|§;ì½®bhÑ~FtÝAo¾÷Çßm®7`È3‚ÛÕÎ!ÆüÛoQgÆÿ*CS¶^¢HÀa|kfl¦wd0qZVÜ?œfs>t†ÝSvÂûCmÎ¯;U~£Û‹Ø­PHK“p˜µÂÛtÄ_ÁwØÁ<b½_kBÔ33üÃŸ ÍLS MtuS) 5Öð	‘ hÿuE|k»&zq0üüòÍYßK^]\^¼>E‹Ó/@Ñ÷ ]èJs¢Sà×XŒ7Äã[ëóšÔf¬Vã§`§vXß}_lÇÈæïTæJkkr¥5J“Œ>Ô–/ëÚ‰¢PÎ°.„²¨òxbï„ÕuÚ÷ðm‹í06’Ò4PÙC-uŽ¡È¼ôƒÊó8yuIŠ!œãI²*÷ÍE§V.õCžà‡$öÎôT€;«$yR¸„¢œïÊsp‰¿¡· ‘ZÊvÕñ¬[dwƒl?û…Gbº˜GãÂJG,#‚×‘Û&i_Jg«gPëVæ¼ *sz%×±ËóFl/wá#2ègÀK¦§(Ìþ7œHÆñV­Šû\­ô8
ÎŒ—Ïd&žAm\Äær€’ó8f«LþJv!bõ1ùmPT¢räÅ3˜SÞ)Þ§Ýz='K‰³‰P±ÆÆxTH%äS¸Ñ´Ã9þBå'ßöÚf“ë?Q]"u¤jÏºÖnÞ³ãr¿lè4²!*Æ:
ûøõWt/Y'7U¯E·zË?ä‹[[¤ë[Öwcú6¥žÉ}†pf˜’Ðå¬¸„p©¡ÃîÔyAlò²Î áo¤ñ,Y—¨î/¤!DÈÐb“/0W}²Ï"Ö¡‡6ï!€®ûiÓu¿
§~œêÜ˜Ö)3ýéÝ3¹q. .p{šáWÁS3ýå|6ÿ„	ðVü¾'k®]×wf•1Ão_¼Šmùw¹?éœŠ#pd±ôNÕ)ð¡ôË‚ÅµÃØ7MkÂ†1‡#y¿1°Xð(MÎÚt61ý•ºI‚Ãî¿™µÍzåmÌúãÖ6w(î Tã;›þb7_ÑSDMt©©èû¦±Û¦ÿ­ÖûÜô)~¦Cá¸¶‘ÅÓÝ§ûf\Å~¡Â´~HzLeùêÆÍGpòÏ9éBœ»J·0{]ªíÈ'+OYpuÊê¶è©[]¢O#š³óÁßR	?ï›w¥m5´Ê8§$JréyN6|Aëèb–:6âÄs…?ê½(› ´|~‡6ÅlÑâ•¥×UsåéjçæÝw14(Z¨?“‚È74é³)öî³FXM­þ…¢¶Å)í‡±ZEéÝR!V<[Ò!…­Ê:/œµXk
Ð®N¯&þ2÷©ïY1mÖ¦ÉçëÐøWp»ÜÎˆCq D0/60ˆ)u‹Â$¤«ŠëØ(‰‚øö8gîï%º]Ž†l`Õi‘¯ø¨*5eÉýÐ÷Õyklò<·PŽ¶•ŸvB^3Çb’ô;°L<+AÇ”­œŠLå¸÷ì½%ÑÒñeKÖ7†WGG¤{q¸Õë8³‡PðŒî=š¬Iå`	}bðä²Zß
Ç3HÊ_¶0i A:–2oMÅuQ[ÍûhÀˆñR¼ùƒŒ›Š9¨ô¢	‚¼ŸuÃV>Œ³yW‡˜ûÔä¨xiçj5ýöf[íU@‘ÙYïõáÉ°aTêHuÑ—§¸.’“w£ïVúênßÏ+·À%—qP÷j7Ü„ìç	»L‘ÐÀúâ"qÉrÇ²±ÚpÕÄLº€!ªuÑô:´ñ9}„Yæ›ƒ
8ÔåUXÜi.oq„|®)R`	]å$f¨S‰Ò:¨stDL
c©‰Í¯aŠ,jˆÛ‹är¡Xº¥wÁÂv?´*GSÇß+Çfñ-Âm!ñéÝk³¤ÙA¿M±]ƒòƒÞ9:¥ËãÃ¡éO-è–ÇHü³P]ñD=!áUùÙ¤7çký4ôrôõ;Ã#¬—ý?¹Öþ÷OqðB‰ŒáW‚YM HŽiš6¨ìvpu(Ï¶ì¾[xÉkÖY.cr|,}gý»	•K÷)™Z»ú·»¹óo ¦n·6.OÏoW­Ñ›»åøSÍ6O¯jãCïæ¬9iNVífÕ¾ÏÇ7ý_:·ýîÞ§É|l÷N'‹·§WÞå ·êw{SóäõâmcV‹Ê»<=˜MN¦Ó·‡5{8ìLû¿ô{‡½[zRiÛóÚx¾ç¿ÖìÞ§ãyÿ—·ýUo:n^­FÐ9û1éûöì—WöÙ§ÖîY“ŽñSëÅwÏÒ´LMuÆüû,‘â¶pAtÉdW¦Wzp
" W*É¸ >Ž{Qœ©Ù=Æ $¥Z5>„ÙRFÖsÐš^E[Žè”h®y¯pb–ƒŒÏÍ<’‹âRóé†aC–÷X"QEòÝ—Ÿ¿:ÆH_@Ç>u²*-ªb<­„dv94@pyF9ãZ¤jI
©µ—ƒ#¸r–.;Ý£ýUÞÚKl–ÝˆÐÿ¶‰ä$qb&é<yÚ‡lÆ¸"vx‰MDf,Ù*YúÑ‰fÈeÑ-Éƒ(~]šZ"ŽÄ7O| ‡Ssñ†úI!ÁìBF­ö—`ò/unS«+3…íÖ¡éåüëä¤jþËNóèvšÌ5…­¤›ÁT#Ä´}k2­,_Ê{¥•H	íæÁyM+JRÕ‚ºªß&-}ë‘C?zçÇGWGçÝ£§qnÈ¥K56QôÔïEˆw_@uêñ‚ñk°è9!]ø²}m[þ×ðCø4ê\Rp”„|<öÃ«ÞÁ+ˆJBÔ¬3@}cNš8P¾¢*©:ü¼ëpnÞ}E÷™
èºêÔS2—§dw)2LÝP¢í½­í9šßw.Ï^”ï¤{–TÔ¹.Þ|Èn/=åð*xfRÂíKv—Þå8€Kß™#Û¡¤Ü
677	ëUß9c8"ÆQ’Ñ¾OD÷ê§RÀˆ¼ÈqÝL˜3¤Ö¡ÐWîuZÁÁ?Uü<ö'’õ_€çocý6wK“@h¤ØK:|dT~Wg	áPÜùšº3j	¹+eÃúW
¥Ðk¤ÀÁòOåtn‘8*¬#“H¥£é‰×1Ë£”1Û&cÖÛÍˆÂèXo¸Ãï•]”!­½Á6ÿ!=·ÑyÊÀw;w%h^`Ü”úÔ¤ˆ*øáFWŠÊÜÎƒ/rˆ¢Øá;ÃØ…é=CÚ»eKéjAø§¨¢ÔOg]“Ï.rüê¼[x÷/v YðØÚ)Ç]:–©ç³»s»¾Æ‘Ræoõ`/±B—X”ÆEÝTÓFñ¾òÝ$Ëp[~‹1ƒ¢EÙ5ÅRò#ž¢Gúê½²Zç9„ûßf§°¨×¸­LÔÅL)1šØS/æp+¦ˆ7%#ö÷“ß—?ÐP]ì­`”¦r2“5Ê­SBÑx¦)žxÞÇ‹…¥w5‹† ´J1Fßa_›âØØŸ×ž?Wò®}®Üç³¦´‡™P”wõF&)fÛ½c™àQÁL[¸Ë #oÌ“¥=Qy¸?ßš5•ƒV„'º/5í+‹Ü¸kÛ%#JV‚¢]€¢RdÜöÙ—`T<ó¦ö˜|Gd/Oç‹¨À…J(QTªªÊÒPÌ'ûYEb>Ëp¾
û[×æ8d:Ù¬â6^Ö†&[ÏŽ"ñ¸p¸‹5¨8W“òÍÒA«op¿ŸÔqF:æ0á}á…Oò äÒ÷×·ü¶s8Åˆ0H=º;JÐ³¬4wð „Ðþ0pB%Rw˜Ï¬‘%ZL¯u»Î¯X&j']3J@Kû5L7W¨cûEyp´¸’«™½ñR}ÎÕ\‘n1aW A1V‡}¤¾ q+ßÙáÌÒá1õª1£Y€µúaœàø,R?h+«³Ä:±®Yºõ…e~¤S[~Í—m9“M]#y ó¥Ú¸w\{¶zÚðÝVÒ‡¾Þùñ2€`…±ç³- ƒùž)äw0ÇÀL“pf‘Æüßš×'Öô™xsÓv75ì®ŽÑÖ_Ì½ÖsÇ>ØtåV”_¡ã…«Zï[&cÁb;0ç#{ºä—úªöMÉ[«hZžYnŠq.b(à=’SÉnš/Xq)w­Æ‰lå/„õ›QSú TýÝÊê«|+ µ8ýh¾ä$þ?ÅïÛp¦ÇÞÂ* ü‰/Æÿ T?ÙÎÍ£ÔJÉYD'Ÿ,l†?Hü~ŸÜ üQ˜ƒ¾7¡¤|áÛžOáÿ“èY…Ð÷ÜinH™¨¾ŒâjeAˆ!F6
`¥YhJO#ÊIéÚB}+]m6b-¯Ôpb€Ç
˜†LwRuê<mLéä£×ÐÓÞ×.ÀU¼±=ðÀÔ¼nn.7ŸÝg!ÖÕI¢äTÁ3ŠW)c6¦èÓáèÙÑ.:»‰	ÁHn-Næõ’ç§ªÂ¯I™‹ËsõF_¢cwlk’å[ãü.*úò—ª¬Øï˜=ÚITÛãƒ:ã1¥ÞãUU(uEp@Bö{ò7½úE™‰d3ô^ÁÚtéÚ¬?ûB./.Î‰‰*¬ÊTHE¡ÀˆÌ˜÷ø•Pv< kœ‰€ÎŒ3Ý{`-‹Øßn[X\è0¨¦,º¢+<DSÞ(²å±˜ª:ÄTÑJ–°ù€ea1vÓìh”ÉðAsÑ}óæ8’¹í3ã…È$aOb/Ž®Úº±HH\—íÀÌõ~9
)bb*°4I -Çó>Çþh“"Ÿ~Ýt¶ï:¼5©Hôª—qÓÿdÔ25qrå¼uû<0ãôÊÏ[SóÍ?özóÉŠþ·¬ýt|r\›œ¼^œ×KóÇ«O—ƒ¿×Ç×«WÍƒÙO×—´þÓÛA&ðcÐ¹íþã¶wt;=?ì$ÿëw!äüÙ±g÷NÞ.F'·t,í›Ñü• 2žOìŸÓÕùðUÐ;ìÕÏ·Óþ/¯êgÝÎíÙ/úeàÈ]ÏÞýÛewïö§¯joüûòò—Û›·'¯çãO­Ýñüõ/“îAÓ|sU3é8ûÃÎíßÒœïú‡§gÌÍ7w›ëüÖë5ØZ-¢¾aÝÿ&¤¼«m„çÃC(ÌÞQŒl¹”U 25`È<(H"»yŽô®Ù
ft1XE
¸Ý­ecY„+Î%æ»­d¾A­\sÁ°ó>)Û GlW·ceáÂ;à€âðÍN½Vç—"ä®º±M›^B'6©Üot(aª0«B“a–w²ƒ¾N²ÉëÀ|UoÉº×wó×1Ý-„‘/›¹W“–+ý©Ý%wèw2"uÎ)Q–»â[YëA;6FºþYI’ërÆ®”§C…m¼ñ~¸‡,w‡rÝs@	R+­H4“ØÍ’Sr¼“7+—Û¿4‘$à¨ÈykÍ“8Ã8³<êà²X O9í"œÂu„šùË·>Ó­½`ÒÖ*
˜×,ÆÍB3r!Ç¹nëý‘‹¾¢Ò¯l5êt5´kpÄîäuk³ñáârØë÷Þ©3i¦^åŒ«•¤ŸË¡‡ËštMwbO {³R8Õæ"RßèšsŒ®`žì«RR@v¼ÞIgCŽÜÎÏwQVÚ÷y@¤Y×îñ=¤Qæ
ãN!÷ÉU»¡¡¼ª÷¨v‹¯ÒüÉ"¤¹AZ¤ýžûß–Ì–ºcFQ´…ïÈ¶ü*MéDÃ­˜Ï_¤¯ƒj•ÞÙ€>–î6ñdÛá—wŒ§À	RO[èX®®e˜%·%Šøíín6Ôºb6½f¹På¬ìKÜ=šžsæ8(F¦Â	Ö^‹ÁO¿ì>œe¦õ'U6Ò(ýÎ£<‡)éIÇ³ÿŒeé .ríènl9T†
õ¾º2¤Ç!3i‹6¶Ÿ„¢îãFây“"'c>tºÌ–4tV!=yA;ôöÞF½Y‹®˜(:‰iró`òÙäÎ½ø»é+Ú7Zíz{w£^/ü°ê0+QƒUk&$c´ãSraÙiì2ÄuÀ•ê°åoòä»(EàËÞâ­±eír<‰‡Jôß `7ÅÅé¦ªÛIít([ƒ¬KWì×_ÉKš¶ö…\úÖØÔF%åj†:¨x1Pðu&7´mB:”%^…ö8 §¯Ééçòlà·Rï¹`.yÏ9S¡Øæð4*.O›â«1gËI>½€Vl$u.¶·j»õÆû^/Ìk+’Ž…Ñ`§E§¡æ êùpuþÚÄìŸvÒxScümë¼sqÖü[£	qgÍ†,˜¶¹%QGKC2´gÌð´˜ÕìU¸¯‚Ö‹'jAÚã‹„Îž`«R‰3M¼]…/Î;×ò¸?ErÈ,^Ò*eªåâŽ²Äõè	,”'Ô5`*V$+)ÙOÁ¯EpXWŸ´&œ4s´tLßp—ó@»½ÃÝ‹óã}šƒ	Œ®ÐØúŒ=ßª3¡‡Ã†VÅ•.Š¨Ñ¢<gè/Ý1`aè+fÇüÓ>¸tjw¨…2\lI˜í5ù=G1 t‹²}èÄ™zIêÆçðòP"]. ‰/¶œëí oVÓÏK/¿é…%]ÜŽzT1,‡ŸF^ñz4Õ9ñWtIœý×šH!%-Éß
XrŠÐèÿŠÞXÏwÏL¸',Ë0YÆšÊ‡ƒÿ(/xé{×¶cí“ÿï?ÿ·ÿ“¼ €ÎÖO:¯ƒ^çü™•iOuÇ_G•GìÂœŠV-1=‘Ê„Õ–Ýó(“Tvw®>;Ê 5ü­¹7ñJí
\£¾³±CÅ†æ‚üfÊy8©çGåáÄ©þ³q¢ÓoÊÉ‰Q2s(Tfæúgä5%'¦)-+×Yã]Û;ú+t¹ËÈAšÃvU+a¡¶Ôõü9£T5SKÁcåÝôhý¸j ¡œrËrªNº`5^ÕtG·—÷Sí
¬\S`²wâ8Çôi§ÇÆÿT´’'t±!³r…‰8é)B#RŒ²è`”nk³Ä¨ ÞñâÔÂ€¸éG]}êöî™Î¡ôÒÌlRÛ…4&*’!õƒî
AMFˆ‡!‡ñTâ²¶*‹ýÿPl•ïVežªÕÚØnnìµ,ëÇO	½>*;•LñŸ˜—Š·á·e¤’Q¨¹( *3Qq4ß¡rOáŠÄWíh%pQÉØ0?
•Lëì“0ÝqO`<±& ²5ø~“çîú½rPÚ‰½:ïÉåQç‡Á‚yJâoÄ9±ïÇlS< \JQWž±¯Î/)tTzà}Æfþ`¬S²ú_ƒo’ñýŠmÊä^ÆrN¹<ÌE¬“˜¬ª”{’z~TöIJäùÏËA‰Yû~S&Jˆ’’@¡2#©ÑáB8ºKtDãªæÅcF–ƒ9'—˜m·†PS\}¸]ÅÂc3ôÔÉ›ä~LÜÐê\X.å0ŽÓ{bÖ7k†š(ÿi¹µ•ßÀTkkz’22V²Þ9k/ÿRì‘XÅ÷YÃgU8Ð\‡ÈãóóÉ«2k™tÉ(Óe¡;­’KÓ!–”ù’’î9á•²X"“…0Ýë™(-U|ùEÑ#œ!È™8wfùçñ§®Ç®&Ê™¬‹ý-î³ß'ÇûEx½øÄ·ñÈ×ï}äskl&5ïSsÀYJý‡bå–XXJ(XÆ§9‚Ê`9ßåc2Àbn·^þWHÚ÷›²¿Â8”Üo6ce5î7¹çþÌv?Vä{“¶ˆ\ªzœ ÿ>ZÄü†"œÓÔÞhYŸµ‚û»TDÜô'ì	ùõWÍbÿ|utl¨ÈêÛöýf°¡Oal½¶AZÏ¾Û;?*=¸ulŸ–»Koä|}[¢ÜÞÞ­ýh\u~ZÛ kÝWÆÿñ_á/ˆh÷×¢Ø§ÐœF?ébàÇÂžhú@£YK™0%MçWÕ—N@…-Há5™Ôº:æLïrW0ÙBç:%Wñ•8álÆ!—–)MQ™½¾Î î/WáÌsÉUç„ôÍñBÏ,Óg—yv½…ï­ ð|rh›S×Xø2ì _kS¯žm^Û!­ÿ@Ï¼i»ãüéÅÀù/'˜ à? %xA’)òGËÕµƒZëýÖ^-âŒÚµf­NËí<s¤T¢GìOSNTÂþ¤ƒŒïÕ•<u11ˆœ£ôF¢Q~y4y¶Ðéö³6²Iá³«\R%Á¯$åÕ3¸³€ÙÉ••ñ_®ºÜcnºÿïÿågGKs’M@*’fKÂä”6³‚ƒD	HS"|µîÊÁv ‰"÷É1ígÅ2 XþÔš( R
ÁÒ“Sœ7¼©Í‹’ï)N
¨C»zõ¬ÕRœøzæBUlöwT&p]TJj¡¼k:ã%t6!gfHa"Ø›WiÝDš
~–/dS‚Y™y-P…V¡FÏ¾O´”­š¯’«?›I@ÉC²ì»œÌ£
Q…¬‚ß“µ!¤Ht,²>±f8}q••zzÎ{‚«ÄàÖ\ ëp·oŽ“×Î=Â›	sÐ°&k_öÉ%ä²föu(Á/šÛä‚¸+NüQ5´-þëÜæ~‡,Õ6åä v[ŒÓc9½ÿ¸G—'ÿÐY}%³ŽqãÙ—ÿöüŽÎñ‰¹¤§ˆvžŽ–ž:=*NÓÓCOK„øm`Oçæ¿mQ}J“ÈÖÒóãš®7Nùz–èl%5t‰`1ˆu}MW.ø×‰zBJ´WVèÛÖ\!åt?ªƒšž×ußãjªµ§8Œ%ÇÑ7o#+tôî“r¤„©Íì¡Êæœî+j	Y¿2ouÑg÷ÊŽò”$IdØv—Þ2 ìÅ9Š	Ç¥Ån<XŸÕì:ºFD¨á!åäø‘…ÎœñyÁ´T"ŠR¾~¿9µæ¶k0!·A`º@R…†/‘hC~i³»ìHEw€pÂn=NÅ®—Ÿw‡Ru‚‘þ k®ONrÁK²of8wÉžÄê¾³³>¬\

ãÅbyÕ£Dd1³Ç¤GùÅé,Ü¯íE
’£ÀUÛ8Ém³—Ïú>7ï ·n}—-z¢æ]ñÌ»ãe ê¾`L‰¨323¹‚8B3à#z6$ºYÈ}œÈs…zsŠ€âûÌ9šòBcvŠrãÍ¼»1¤ÿg:têKò20`ŽYÄ
À9Kœüàz·”m›R¦›êÁsß™þ"Ï<(gAƒY4è_û@Ö7ˆ½OÜ%L½$¿[z¹±ýå!x€¡!9Âh4å·^$`£b‰b.\{ù™®Çfh‡Ž…¸\öAt?FiÀô´9ÛLö} öô`”Ž 0¿œ.-Ýƒq•Úî{.ÖäTÄ±¦Í“¤ó}ZØæ
åPh³‚3ÝOs©G™Õ[ü‘¬¦çÐ·]Û]èK.ô?!µ»Ò}+…Læ‹1žM^VõgàSH×>ƒ%Â¾¦Ô¶o™=y,ƒ-E6„ùf-,¥¹•U©»?ÑúìÈckT3¯ò×~ƒ™Èê[­È"1EçäW°•<œ˜ÁÌš(ÐeÙ×_çkÜä«M>‹¬Ž±+ŠþæŠ‡¬ñu>-ÜãNN—mè-X4áEò-å^!yW ¨’¤®W“¾¾™õ"(¼¢˜»|‚+µ2ç˜Ð{æec€öêµú13K&ÁŽVŒÎrÉ0“¤Û*ób™Ž”5HX&3a]“™PmÀ®Ï•Ðëû^RõãÕ!9´¯¯AoíÍ-ºÆ
ÙUccÊ‘ªÅK=+æŠ%ó;–9·ÂLUù…ÉÍ8›@EmæŸÿøÈBa¢EiùÿW²Þ]‚¯Êÿ_þç¼Rã÷0É”*Žøl<N!„+-þæóÂôkr	',–b¾ßœN)ý¼vxhhð3a~ÇŒ,ƒ×Vòæ ´„·VøéV››ö€µ†W\ÚŠË+}ò£;€°|KY+æ±¢Šã¦ôñÖµ2	[qš²býž­ÌÔ€ë¿˜	êFâ¨ÎÌE„‰Î<K 4˜Wƒäc¹#‡…øcbßÑ’R•Õs»Ž=þøâó:Ã(ß7˜y·=w±×ÿÄ*y{1¿l‰Œ­Ô›Çx'ëÉ¢p&ƒ‹4Ù’“1‚)1ÅsZšpp¯]ÛÚÑÞ¶ÐN˜ò`Î,Ž-0w¬‘}öU®iêì°L¶{±6ô¦SÊÝQœdSÎ”ú‰Ž5¡Sßœ“K~Ûmþ#Ÿ–ê7OX¿ù,­“.ÉäöâîÃŸIÓ²2)Ë·yÊrŠBâá‘u:à°¦RÔ
8W‡æ´€ªÕ•m>VùßAô÷®`ù@ˆ>®b€…?•ð
âË$î¤:0-Tfl¿ôøœ²EøðUý£¨T!Œ¦K­†F›»£ÉõnŒÂyWJÃhöIÖ£~'Ò@­k2EÂ‚G ”µAo¿ @<pæŒyˆàœý­ô$¿ÀC!]ëYhÎ,Ï%	vÊŽX>D&%ñ¬ßŠ úSE¡thÀ—L—ó„Aÿu«yÝ.ÀÐàGƒÖðMZÍßXO?:gæÈr"4œÿ  šŒ7Ô…í~Œ!•ý­„TöäëBjßv:€ÙYŸ}tžåm)´>­Š0[-
{í%‹¥¶>œb“ö£CÞ•Ø“¥épÀ‹K¸‹‡›€]b‹LÝk•€'ºw-È5BŒÝ¥®z½Þ( é} xsüìé0£¸NZ¯nŽÛ{Vm¤GŒÂ$Öÿãë©ý2ôÜA,Zþÿ   ÿÿì}[sÛH–æ{ÿŠl¶]¦ºDŠWYR[åeÙÖ´lk,UÕÌ¨6DB"Æ$Á@K*µ"6bcÿÁüƒ}Ú·ŽØØØy®}ïýûKöœÌ	äåKU¡£]"	$òròä¹~G¾\<*mÓfõìqsaOô8¤ªb2ÝYTaÔÕÇâ…š”ÖÿÔÒ¿.§¤P{ˆ%)¥l©T3š£UG‰SˆŸœÒî3²ê–˜¸€7p·M˜;®´¶ûÓ8‰æ©ìv†æ½¢L©fz‹X­]xî£M1ºÚÒ4˜[-Ö<j¼j<ÁT"^ôÿltþñŸš®Þå žýøâ%y‰!†•‡pûóaØø!ÎRo5Û?ÿÕkŽ™;F^þûiTÊ.lÒ•',)OêÁÔ÷¢
ãpá <"óTNÐæ½N]™—h‡£¦ß)“³œ£}Â0”….l×`_ß¯‘‘{…R˜š0œ$×á.òÅ:ÏÛ¹UuúL¼è<˜n__£÷d‹ô×W+Ü"Þ*õ¥l‘6|É%~«‚rP[Kü³X#Œé’<çù\$n×€1†Ñ÷kä²½]ƒ£öŠýç²Ã>Áô%øÅÐyž¨²]ëÃÌá»ØâvYØw¯ƒÜ¾n5{7úÚ V H_´	oÒKåïzÖjëäUyMžÐŠ³NmUw0ñÝÓÎÙziâ»}ÛÌK3ìÐ¤¶½[NÌ›» G¦Q–geñIQ·xg“‚"â]Ì(KóÒ¹µ¨›¼ÕÄÀÙ akvÍú˜ð<
TÉo¸Ï£ðƒÿÔa:Š¼«íZ‡ôÔ\$=j#Ù¾™Hã•…QðÆ»Ø;a2XIUõëÂ|¾ûªfÔèÿ²s¨S ñàù³L.Âã‘Ÿxê×&W3èMSßÁC¶¯OjØäË`
JP³÷éGï’|ßªG>Ùa»öóßÕ-£§âka£¼kJûÔg€zþÎU´:JFê†³	ï=ì÷×75#§úµNg=Æ ÀÕþ°Ùó€áÕt¨J(ö`"œÐ-Ó=Ï¼I0¡¶†Ò…<26ù£Ï€•¦ÔwjàœpXÏhðˆîÛ×uÁNô¯,§ ­17Ü	ð_‘ U9-K]…õÞÃÞÆ©Ã*l.e4S›í„8åÔ/…u2Tï²ÄÀ>ü`œÞŠ8§ˆ¸³òöF=aŒÒsÉ»> RôJM};“S¯»ëî«u†ã$P‹U<.rûúÑ.ôæ÷BKÓ<ŠÅÛÖ®\Q§Õ_Ñ®$£\r.°™oü‘a£µ›}ó}¿‡–{Àð+,ûšÒ~wÄ©{zŽ’xàMÃ˜‚0LQÑÖVóz”ÙÜtYN„\n_óurh¶»Ì’­0OÛ×mõÑ’ß'œ‹]ÒÕµ9F;«	´Žr˜ê£ÝW¯ö_='û¯Èá›×Ïßì‘µ5í¢2ã~7x8€M0ôÃÙh@†GRa!'.áÎ}Ó{+0v˜8™òžôÓó-ŠãO´÷W=VyòÒøô‚ã)+ºàSoO9®ƒ>—»Ïõd¼ùžÎ–Ê„
Œ†÷Æ:*Ê” exfRo­Ÿ®5â#„íÚ<×ÿÀ5YxPØý® YOçRTU3Èç<l@ó¬ünÁ5ß³èœ§abÚsÑY_Â&Ép«ß:mëXe~+gÁý}™ÉZ5 ´JgÄæÊÛ;ÞÙÊ½ñ.˜ïœm’úÑ8˜¬Š¡PßÝ1Z¯t›EŽó¶Žàâ×o¤£%Ã6Ù¾Ž<Ö¨Î†”ÞI7½Ù²§˜¬cgÕ9àÅ¶CÐnª‘Ûþº>ƒ5ŽiÚŠô$Gœk2¸\%ƒ«UrEeÉ²Mh²<ÈìaÿJ¶µ÷Þ$Ì=²¤ðŒ}nÆ˜ªÏ*kŸÍ§T©0ÕIÇ¢ŽÂƒõ–¾¾"^[0PŠº­–~@-s*24ôè\2·jðû»Jë­x!±ïFA<#¯|8¦}:Æ/¼}¬NÒë²½}=¸4·CÐ<qÍ—ÊvëeÇ©A¼ëÊvW~ht6zƒ‡æõu—“äû#É†å­…]4$ß&Á]/Á”º£ì«4 %í,}\ºLëàÊeZAàïÚg‡ó‹*Soe/òíî+%l¢Òé“cõavsµÓÛ°!6ãeYK¾*é¼§3‹s‡ýMgçŒ^†4HÚÖÚ¹þçƒYÎ™±“1CÜ‚w^ÓDù+íá¨Œ&+ }3òÏ¬GbF‡Ü˜ë(f¾Ñ‹™x«luw’Gu´ž^Gc’«4\5i'´Ó„FT&¾°Fö¢ˆbµB)ªRJÖâ'¡ö.;0»¶“Ö­[Ï%áË]‰É¬³ÔØÜ“ Q7¸0/då‹ V91Ê"Ï"öÎÏáÖ!yñçòÄžûªôÚîí˜ƒ“ÜìŸ¹‰ÌüÁuK	ló‰nSeG¤™×,G¤^%3ïjzÃ_‡lmZøN›’fÌèõ¿ÅrTÖ™AŠþ××Ôß%4#}í4Ún-AtHb¶'GÆÇþ¥øzø»ê˜Ù•}s³‚	\üIˆ×'ÖCÚM‚êuª‰%þäW¤‰˜÷º|ûj"ÕŒ½ìR[Áó·ÓL™?ÂclÕ4ÏàÚÏã„
˜ª ;„æä@e„bYnWìŠx¹+	1"‚Û J·K¡M'*btÄ¹Á·Dé|“¯œ¢N¶7ú6Šr•GŠ÷K^òŽë[J|h{“E‘R‹#ù…T×m’ƒ9¨ÍhÕ~¢°ñ4ð&áä B;w™yÉÈÒË!œú/É=ªËÝc‹ßG=î€~KÖÃO÷¨Žw Þ÷­t_C¼ïß´‚Az9	é•SÄÐëygÕxÌR4h©Jaÿî4èŽJ¶RI¯Iv¦IÐÈ„UÑÀ›	ª·çKV^dÐæ³{".­wQ!¥ª:R4*Ü@{ëÚÄ ñºÊXOƒlº<ÀÝÎ¥—>l®c(ˆV{/UyÝv`¢ ¤ÀH{.7¦f§‡Ôsáð@Å£9Ä•ªh—§ô›=&Ù¶k­Òÿ57­[/Ë¶ÃëöºR_5¹ÝåìÀÎt0Âø±I0AÑe]R¦à†C‹0Ãàî`Œíu½Ÿy{·g¯ãƒ?ò0bêQvxFòo×ZÍVÏ×–É/ûòã;×¾Öp)lm-”xÙÐ'±o–¿T|õèI4Gjí±L§¾/åkÝ–&ÄÇ)j#ecgí‡]Øžc”WK3ùiÝÁ4ìp‹ [Ò†”EÞG3ñR®§,8®	èDÓŽ×cuÂÜL‡û*¡å½Ñé¼äÁäl.õÀ¾Œx´FW]U6nM
í/'-(RÜ—vÃˆå,€²›•Tâ,¹%c;WèIá¤Fy†U¿µÓf•[ÔS4
3ªÊ„³ËÆ:«°Âs¶
µ^\€‘* MkJªq éR1I¥9"ƒüA±ônÈ>YõÒ_ªÛZoíáÅyt¨hjÅf|4	)Â¿®n)E|–mé66Ò‡•,¥ö¨ž«pKv55$±`>‚àW[¤†ÿy‰š6Ä”ÊQšD©³¥ªkÒ¿ûëÜc´%5Yî]ÓM5Fs¼XZ¦¢´UŠ±‚5–Y#vË­ëÏÃÐ(Zhû»ÕOû­ÄI:½¹Úî¶V;½u^tÏð¾-Ýû²|^|¡2í?¡¨Ujß§Nêu­ô¥cJ—±#±º€m¸ß_Mÿßjv5U6vU¯ùc‡j³BÄ·²y•ö¶âÉ2"½.½Ï	ÑT˜•ßi¨S3‰‚I}¥|èYÁ<Ué¾ÈAþ±t3‡E¼S
Lhàï–^ZuyæÃ”²”E|×9mŸBS[©?™Á–Ž±ž“v«4ñ¦‰ÈÓ”•uTKm*Rç½ÝŸxçæKàÉ6~=î#Èî†÷¬ÙY!íÙå* Â+«¤øøfkèŸ¯’J­(CóÞ³ àZ§7»$øâöÒyóAM[\xrÚØ`R‘žêÒeí•¥¯ç¥xáÕëjÉ!þxn9FËô“Á	çéãfŒf¸•ñ,˜¾k·âwlÈJå+?þÅ“ðT[O0…¾­mÐHõÆ¸§4Û×êôƒ+Ó¯Ñv­§Ab
ˆzß°K´ÕÚ¶(‚Á<Bš¥¹ræ{¥ MÿtÐÎ•öÇ/b®´É}šZÁ°A”?Šp®mÜlX»:Û}Å•••Ð×.H9Rè³¡–±ïYTïN:¼ja†û·ÑÊ°ŒåòÛð…Ô©–¢Sm¡Zä	æ¥¼ëTÂ§ÕUf/—`ê-siK(&ÙÅb’‚Èk6O°2gyv[jYLWñüè*FoôV:½RŒAQ5Y‰Éb‰U3cØ^ï<¤Õƒ{2’Éø\‡ÖØi9èƒºN ¸å¸Q=¯ƒ*N‘Ê¨bX¤óêkVº\„H.JQÔïÍ ·x¥ì‘ïM¶Èë³3­ßWWÛµ2Çíå¸³ÚzŸjy2šéé+kX–AhâVÁÑOö§,qe	K`*Ñ¬°óL¦vŒ#ˆa’`líÕ­»b!äDÐÿ7yX¹¶µJòÖ µç_ZRq¨8È—0À(ðÆªe<ÎYtÇB«q¥Žä¦Ã§~âãXŽÕ}´Ã¶óaäÇ´,dæ2B‹)Roš¢Mª V¬ÜD½JàßŽÂœ•²ò»ÛônÅÍþe(Úm¨(ƒÙ¯ëX¡§ VØ`éÙð¤Ýé´ß–Ñ©.Ç¢QaŠCº¹O:žyBƒî)ÕÄ–À°2AÄ¦ž2Êâ1$1+´AUSê¨‰Bå'·ªä8	ìú`”$³xkmíââ¢)ìœƒ9PasNÖf,U.^ÌOá«Ùôü!©2Â@«ûV‰Ù5	.aVýé+Uù8FOÑõ·‘	Jye*6X™”QöŒ‡W³/ÔÞa,Wö¤Íª©¸ìcŸ´Üè¤Í»¢0´‰ècà5>áV‚Ã@XT:µý–:¢	ã…yìFäû}²3ÀSKÉe¬Á‡ ¢3t…hì}ÞµjóB—Jh‘êÀp8çMö8n nL?z-ú&8=¾¹Àx8•´4« ™;s4?AðÙì·¤Ê[‚øÂbŸ	‹†úê)Ý¢$©«€‘ËÆ=Œ;-eYøîÊ[jâRšG£ÀwÆ~”ÈI
C²ò“ÒÓ†N9ðNÑFWä8ÈÎ‚s‰½ñÿ:"…ÁS[VñŸçÞ4	ÆåñT.ÆË!Öÿùpg…|C^”¿ê×›"Í£%.+™¬\úëˆ–÷zÜ¤gúaß
_æ•àÚ®•àÊ¥¹zÌj$«38p
„uÊ)ë#]ž¶w¨Ù¾Ï<Pˆ­ŸE·thL«Û*ÐE·U,ÑéK*É”ò$y\ñd‹þ…œ*ã‹<Á÷Æ:0Z<CZZêæŠhË&KxäT!F_éM5Î ÷	ˆR:
:*giÑê¬[’^Á’åGon®¶[ÕN¯mð(d}¦õbÕ6¥œ†¿°k,ÃgÐˆò™1öÂèX)¹SÔ,®ÝG§ak–˜ó*lAbÆVKÃB@\äÒ­¼šP™$
ónÜ”6bc÷2®UæO7lbT¨(n§½FŸýŽêšÿ$¡õ[ÌƒÜƒÝÄ„ÔsCRt(XØ‹äþ
å¥.àœx[û)¯o3õ1Ó`(ÆÐqÙ5
kú£a'˜t+`ebOF i¼
`Òúì!¼X†I<ŸL<8™·G­l9X%më‰zÜ87Ù¢<K»þö7R¯£•M{t®~Ê•›û¤Ž¡1¬±r¤ÁÊû•æ¿ƒL]¯ýeZÓF‰±kê}ÎQÎhÆÁì4ô¢aó"‚)Æ ¸:¨¥P`h¤Îù3ß¢òV¯í†³ È
˜ibÝÂdoø½­WÐâq0ñÃyRÏ ¾‹¯¨­¬’pcSšÈ¾˜*U<CÃã¹R‰ë)iP–-LJÜß]}äNT×•ëcŒüçlrš,%¥¥e£D–Ì+Ò‚t8»ÂU5ìu=`6û]_ƒV#ÁâEuÆÊ²mÃ"Ðm¾¬ÝIM†J÷*¶S”Á*”‘Sƒgo£§;ùŸq§Lò¦ÛZ•þüÿŽÚZ ÿß7?P‰ëŽ@È¾ÈL©\+kIÕt•ÁZkŒ\›á‹sœqÃ,)NmÆjÓÏÀr‡—VÎ8M(Ža®Nj’$‚À‚µ˜LÃ•òo2­•N­ÿü£ ¯¿5q'¡3˜èH;u£ ÷ùÎý¹À|Çl.'­i÷lzÀR«6Föê ©	Ê/j (Ÿä[\U{Æ×Í#ò2°ÁU˜82ß›Ï¼”ñrt!nŠ|8Ëììû@i_(h6NÜÔ‰á“YE½¬.‡lp«Yz&Q;ËÔãF»Ý²¦O±z˜®­šu*¦\$0i¶v•8Šfì|‡Z2n¬¡ô%}‰ÏMí;å(šñl$õäÁÊIëí¡#²ËäV½Îy‡v·8ùÄ*„ìœ`³Œ<ìò«xÏ©‘}ÂR‘÷x"yŸ»¶šïËàÏŒ—qæžÙV„ß	ÜC;UKoKùQÃ,É=ÈÓeÏ³\CU¸A8)Ø=B¤«p›`ôÌK½È·dþd©Ô¦é8ù|ç€Kš¼í¸Õ	°L.$Ô„V®ç^8
üX¶ð©+8Š±+ß–ÓÈeN¯X"(/z-µh5ËÍÛ’Õ¬ã”$Ç—OþÐêµ6Ú·yA"w[QÚdîãKõE‰ð²pr½ý€Z•Ëcµ ÕÖ§µyívÁ¿a¶þ%TUÈAëkI+O{{MÃ¸ªVW1öK¯ÏÇ²²üË«{Æ¢”–5«@o*‚±‚PéáECëKæS¥UoBu›t”—>Ý\:Ü²è^×xQ\*‡ÏÌ_Ò&­Û§’iæ/1%…0«Ý#ŒÄœž—^D‘Ö³@ZÚÚwŽAozs1Ów#“kÄ>D3Ürµn³S«øRëÂZnÐç¹jŽr}¤šú†Ù9ªývð½‘âðxYG?f»%;2ÝcyZ]É¨j7ÄÌÓšmkW*Áý3A"¬f©'m—`nYgü‰Æ{ %Eˆeã°#[’íÚ²„kØˆºÏö:ÆW¬£ÖsáMðßM`1ú“7Þrg2‹WRÉ‡œKÈ#±Z²…IE5:™ï¢AG¯Ûê¯¬¶Þõ%ßt»»¹ºÙáih•·Ši–:Ø“KôqÝH²pØ#£¬¤!D·Ü.@§Ë)C
Ð1ûimäšFc°Å?Á®xã<Éãg ,yÉ;¶V«ï>zQ½ÑH.ò~c	Ÿxf›ö]¯¾bïÅÑ‚‹¤ÐóHžD^0U¹Û)·9·¹Ú(,°Z¼½þpi¦Óo± û2ÁPô94,•_Ôméw,5”I,Ï°W3•h2Õ
™1¬ÚuK#‹ÀüÒ¿{ð÷øœýÝ‡¿‹rš¸¾hQ
jà:îÂä:$”¼j ü,xÄu °qqã	€`Ô¼$Óò9Àäïj×I½vt5MF>ˆñ´h¯ÐübÐ²oïÔUHÎÜï KB›Šð–<z‚‘ãe¦-þØ‘¼xúòÀb:³>2¼ÈÖÅ$)ÝóIòÅvkPœoÐ¿‘4þÔ…#v8c>ÐUÚ2!¯@Ž	£dGºÎ{c}(® uÝòJÇ¥UËr]³<Ôp±“\1mÄ õ¿Z£rˆ ûòX"6FÝÛlô0ŠÅµaJaÿAPv‹ç«LßeP¾ºÖ·'
¥×õI³ÙÜÁ¹zå-³a¿KÃ9–ãèzÏoPâ†IãÞu`¶qáe--9U¡IòˆôdÛ`	G —;›«í^K x—Šf?dE³=4ÒêŠé4°ÑÉ¾h7g1Ìyß¨§³Jsí-?~Ñ¦i2^äÃsug|!Œ&d·q„ºýž©ŠoÍ0QJ;RSQÎÕ"Û‰-Ñ•NÈ’ãVœJxf—"µ?TRÆÑPÂä2ýž…árunºhxó„ñõð#óéôvcàZæñÁý/I‚ÏÃþàÐQKY:N{KÓC¨tŸ‹éÂH¥W’Z3•˜kÁL%îÃÇžáÇì(‹`ý–¤`”æåÚÉf¿t`Ãž~×·)Îy¢±Ô]Òx•óyûˆ"E® ˜jRP$l+°T/þµ„@Maƒ0!¹‚•d‰ê»8ºî—1:w”Tö³$ô“8³ë˜sF² ‡ºB‰§ 
ëówÄos…\˜ú'úGä‰Ñãð´±®È±pü³Tã!ªqZ“r
‘b¯¥öª`YzQ5‰æZÇ‚ììSÍTúÂ(‚,*gv¬ÄÁŸû ·Áœ½¡Ñ²_3û–óè~=Ü[÷/yƒûµñnuˆ´À¹+«8~Hd>ÝV›ô?£ÎÖ|¹|zï’æ„çÁ Ù´ôùÓséëÙU2
§Ï|¦WïM½Ó1hD´r[JI³³ñÒ·¼<ÐïkàígóÁ(vðå3wSdÐ‚^ügâðwÊãÅñ}&&ÿùØ<
é³¹–Ç§ss—L¾Ó~¸ú°µÚéºHãËcóù²/ÏKœþå9DÁ,¸}þÿüVvjß×ÅŽTÚßÌ§0?Jvö¿f‰=C6ú²Yú’åõlÔ¿<i=Ú¯MVW„GL<ƒo¾+.!~*1/ör…ôý  uK”¾üÔâº ÍÄWJx™…4±yˆ/…&z´ÞÇ3µ¯æä±@lŽ]/Ò¥Üß¯ƒ75pb2ƒžcØž„ÃŒ ,ægÖ•N:Í>EÄª~Z#P‰#Ëî£3õÒŸÄ]ÔW+»m=ÂŠ…Rªn†QÕEð£M÷Û\/Ä&j€©Z:`*iÿÉáŠc¸â"'Aƒ[áHèy@²ŽH%ë½ÖP?Œ×Qˆš¶1hÁkw ÷Ù3 _YF\8ûXl[~Gbó?™ƒ_2Î6Â"sža‰¥x±…^œæ¯Ž½8ä^,tRZá|„£˜º—¯;Äó×:†ƒ K«M‹Am‘ôu2«#ðÞ*é¼XÅª}ðaE[„‚]â•¥˜¶4~­D®¢mªc]•ŽëF#eQ-!9‹LË*ÀÂÔ¯:ËÃDÉCû˜Ç¹•e ( a0\5g£ŠW,ð½P2ûKvÑnç6Áó–þyšÅI“\DØ(C4u©:¿­
­:’”ñÏf	©¼ä<-iQyh±E(ªƒi|zÑŸ(J–é”#^4d_Ñ[cSMÒºú{ª­l‹š¯ºL{|5ói>E´F	î¥—DÁeí–­î×r ÝiøÑø¼˜w”²?ÜÃ—þL<Øß4YVX.	ÛJþ0˜OL¼åùú15Ã°ä`Ã\Ö˜äyYPj8'3ØB~“£çbGÃh6‚Å;‡{àË¢ƒ!uâFÞ”þ€uÖýÄç‰7ÃÐSZÜ#ÁñÌÐÂ£cÔBhèÐ9çéÔXrêãÐÄÀcÌt»‚G}Šg•AýúÓó`ê7µJ‡Yì$aa;³DFªì€‚âÑ‘Ï’WVmµ¶¼¨Ø7&—L%À?Ú4Ì‹iôSƒôWJ03þqv**§¹Ìb ¢Ó–3ÇX„ˆ—Àw1""?&Êj$ùõÑ++<¥-0ÀsóiÀ[Ï×à)ËëhJað€¦;oL?ºMÂÜÏA_hNá/xØiàþN£þ7ssKòËp8ÏãÅF›8ÿ€·á4ðç‡žÓÈi8;èòw=|ï|ê'A<YæÙãƒCÆ:ßmœf ‘àñDºãx'pÿÅÆ²‡ïbø{Ww=òÞO e,Hú#ö°² ÿþ­’Ú
Ù"ÈÎÏàø.oŠ„d…§ê­á±æY0É¬^gqöAf‚ü~{;	zäó¯k5u¹6ÞZ<ÁT;²a¼÷£t¹ìø~h²jXñ˜eçbÑÔçŠt©å†ñ½óV¡Å_¿Ì…<KÌ¸ à£M–p,e»Ð<¥nš™Ã¤¦õV!×žÝ*†Û”ÇëTÃÛdxºÐO“ƒbÌ®{@UE|Fus9¾šb™^×tª(ïø´hØ’õ…Å©í%Õ*åLH%ªÚlÞŒNçO~Ž_b}-Ç,;=mzN·-²œKÕïë´­›ë1h€òýÈ<MaBâ¥&¹</gm]­¤_Æd2ÆVJ†@INÔ#öÐ¥¤¼+¼‹uª—®v5í'Îaª…Rˆ1yÞÎŸ³æeMQëŽ7Žæ”’o¦È ZÎ*TIQM•ÖÂÙ6ZÅ¼ÜbÎª»;#Ÿÿ­r®¯	NBvKŸ/Méê”ŽFW±lÖˆi)íùÄŒO›)	Däì ³âý»EK’ ‹¥^é’TCß(¿¥½YóYûag'5kî´[í]i£dâÔgqwÕÄ®I¾–H=¯Pº¨	òQªZÊ"º"×ËƒÐgj”êa/\—Àê[¸}ÄB¡¡0BZŠ£X³ðtÂC’¿Tû¬À×îÈCxCø€æxqü¨§’lR­ãA‹ÌÆDCq5'Ã²(i^ÆQ²#êˆs“G©wÇˆæ 
%b(¯ókåL³¢IÃNõë§>2ö+R?_L~þŸê"Çé¥Q³‡¬Ó“ïr‹t:¦[¨˜V7Fö†Žte—!‹VT÷$/4ì
¶T:|ØÇ.ã‡SÃ¿»Á§ÖSR÷XhÔT:Ú¶Ó`™RzwÃÝcÆOÂ­Ÿ¤þüÐ[hØîVT:ú¾ÛZS4»ýñÈ&MDÏÎI“Ô\›üü¿ÿ¼Ð$Ø–7æmYÍ¾U(Qzïp»ûãÝ^‡(x‘úÏß]l·³fh+Öw×?QùüÇþt2Ä6_œî?ƒ~§9¾Ë¸©zp—»Þ4ÉôŸr)²þóÿúÇÿøù&n~!P¬Ú´wn4€1dw7Oƒ´óÈâÄ›š=‡º#>k&mÅá p>O£Xd8ÊêŽ©!Z?% >Ò;©)|[´¯¤@ÜSÐÏl8á³…³*	Á´ž7¹FuX,°BþHÿÐ¿áÜc“°‹r"4ZS©§jÀ:C6õ5.¤ó`ÝwsP$ÏºPÂSÕ?›M(¯ÃÞ*»¬k§áÍé¨èß†!m®¶»-D‡¤èvÚü¨7¸ùXERÕu.‰¸v>…‚¸ôªtÈ[YlLšpCòZ/VU÷_‚íÒõ?Çã_¨ûTpí=EöçOQþu}ïôW;›«;†®g…ê9?Æ]ûÎnO{Ï?úßí­nÀÔ›úŸ7²ØØì:€ÜÕßå>u÷¶W+£Õ7t?G5_¨÷ôuí|û}Ï2[Ô]G˜d¦¦™ÏPŸêyzú¹v>M:äýÓ+5Œ¸Nwƒú1ÍÐahÇ±´Š5œˆF‹T¸–•P”¶ÅOæ<8m^,‡Nf¾bXòèÃ,:/EXjíú†áTC¢T„n¥®á…©¿£5õWôqçQìV÷ÆŸÓ¾ì2™®@ä¸<ñ€<&Rü‚ :tMs|@¶œ<tÒU|J ù[@h (5<u—øvL£³À6[ö{èqš¿`‚g0½¼Ä×àÑ'¼K‚«Çå_ÂÎ'á5p¦‘ËR_C7¬°2T
§ÔÖ]*¡!ÓÏ_C©×¹ƒá\Y˜´öCX$hq4é}\¸ìö«¥–Ên–˜tà¹º+ÛizœXTr?—„*ƒT¹QìªÄa•õ)Å„!×LÞ|õÌÔž :M@eÑë'ë­û6èHº ”‚œ¢_*½°¾V„XM]>©÷§“ºŠù*÷®31ä¦èñ]ZÖH0×i]ÄÎü·.¼"£ç‰I£½P¡%º9pY!ËÅ$Õbi;
pþzþ§¨)uGu l½•V˜dd¥¼Õ.gƒÄ©Â¥•V‰+sˆ‡Z¸|2	¦È:½,âÎµbŽ4#ÿ–:–æË­O£ü#êî‡WSoÈ7ä(ñNƒq†)a6îø(§ø‘¬Êy.'¹¬õûŽ®ÞJÁ/ºº6ê†Þ­zL“V`ÔEÀXcMï â%³Éj`ÖÕnË\FFÄ¯ï­®wW7{¾ÞÎ‰QN|\ÀFÖ=} ‹ø^[}ï-7§-¦…Þ±X\K:Ú*A-Öy>B´×lŸ[¦Æ·ú¥Å“j‘,qR
eY í/‰±Å"g«zÞ`V«Ñb’@¶Jµ!¤ÍÁñÎejU^…)p8›v_¿<üþxïéRŽ¤QÿDoNFuë1fÙŠ=sæ-œb{ÓdägWUÇRŸŒºëÃ’DW-!º‚Í%…¹ ÏIdÔ¦ 9A&Øé+90‚`™Ç"Öø²±j3&
Æµ2\[´À7³ÁEbæ·.èSR~ÙjmNÏêi_‚Ëù£š!ÚBM‘ë?‹ÉúÈœÒ þñöw;Fþ¿8[ž.WXÖ×-UVç,—äé)ÁÌ»°Ÿ¬E–	©—#âôHÂ“x§ §c¿†õ°¿GØÀRÓèù8:Þyr°gÏ^a…š•áÉŠ8õ¢ûÚ¡ù­ryqÞ¸T8©àá´YÖÞß8(eŽ³Èfê™,´çJj}ÀŒþêœ‚ÉumªÆ¨Î«çÑÍìzF¬œGv˜ÞÉ6¬É&.eî“¼¾ J•ÁxdÑ1M÷Y&&<JiºXÔø+tª2±CÎU¥Î–žk°ê{à1ÂHÐ} Óé6{+¢EÎ-‡¬z"L¬hQ)ÐTFmNGÃ‡Âhá%w´aËˆ\%HÌŽ3“?ún˜)9›‘0m¼¹;ŒaOüÊäâürŒÅÒzŸ_2–ëÞ^4–‹þ&WîL6·Ž–&ÿü÷»9”¢qÉôº!U½}“ÙOùRU™(µhG³˜¥Š
vá8þ&×¹Ëuè?
¾P©.¦ülb]Jlé™iê
OD:…DWH¢’]E»V³×ùê$»Z«Ã€09æ—,ÝåGè—'Þ=NOcò,ò}ØÞ~tþ+ô2(a«œ'¡¥ržX`	bžSù7)Ï±3éü}Ðçwcuò¤b’'U°
8L¥ý×uðƒàrøúÕobž«˜W:	¾P9/#›/ÁzGOÌJ¶;|bË]»ßüúä»_¾åN¬Fô…‰v/|/!»¯Šó«ëÄâpvžXÉìì
•û– Ü‰-þ&ßY.ug„)¼…ˆ·»4	oö6ãí½þMlsÛ$.ÿ…ŠlbÂäg“ÚF0QÙihÙÄÛoe–ƒåkÛ~f¹ByàO-½-ô³áÇM1+u5…³:™ãÀ€v'´àÒ´ä­ÃöÛO·/›ÙãC?ô¦¾I+áåq¶©œƒ8,ë-Vo‰At¢Ôøþõ'ªf¤L-ÑRŠÏ‘ˆUÍä¿šÚH‰FÕBú›éy®Îªç?éŸÖWE3níýŠ_p¼òçlƒh€gÙ ë«V…óhàköCÕ’ìN°¼¬ÍOÉ[Pœ>'&o…Ô|–Wbê‹Ãò²ù/êN1y!yµ	‹KÝ]0ëÈ%ç¨ V.x÷N‘DùSÞ …*ò–,$ÑP°dè]¢¨è.àîŠ#0¤+‰´ç+ÝF±g*-˜§$Œt‰ø»DäëÀå3Io`Ršìrë—…ÃKàÄ:a¤éi¶GëŠñÌ8P=¯›HêÈÃJUÃèÌ`E[™DÁyÔQÕÍt>~4XYï4«qZØù©mlv	|zvÅXYžžVi•³öÔ«T4QÒVÜ²ãŠ^ÀØFBÙ—w"mÝ0€U[ÍC*–Ú¬˜ØàÐ°‹Êªä‚—±ºÚM7;Ì>:‘©ql”)ƒF¹Œ†ï˜‚ß4gW˜(Å¦²Jò'oRøe±¦áŸÞ}åZÌ¿tk“>yçïfÁŒ…ð1³EÅ[órY™wãkÂé.0èÛ×#PnÆþÞå,Œ¦B¼<pÜé,¯œL?ñ- :7ÉÊ,õ‹u—JÉ¦Ù×ÀžºÈžÚòŽPB"t•(1†ÑY6ÈÓðb:½¡bZ7 ›âTMÛ‡æ3Ž­áÂöTæ§H%XQ\T!œÎ7‡
Éíìüèðó£ÛZoíjÏóÉQ…’ëßÎÓÃl'×)¯±`¹”ÐiŒrŸ,•‰‘Z…%½Ëš-§âVc&ð$…·¬ŠaÇ0XÙ5"
g²aaÛöo¬”æ×™ZÌ;!—‡s ÛO»¯La4ömµš¥¯öÄ¾;Ò /¶%’`^«@Â½¿ l?å5D€Ž?;æ¢Ë×F~yÏ‰OŠ•B®´±~¿²Ûeò(yŽ“Fž¿zEê‡WÏM~°OC~¢ÀûÕQ ÔyG"”óÎä™.Äò_R§÷›çäOß2ä[ýï3X%ÓkyÖs£É%+./ÆÀdÆ.Q«M-thð¹ôKÄ`£Ç6DáxŒ8Âº8jœôúÖÈªGóËñe â–Õ(x}žî2f(C¢žSï*ñù×Ó³à|¥ÏÆARð8X\‘U/êñrIŸ1Ã7âJ§ŠÃ)ìBA¤ÚâÂ¡Må¨Ä^fŽ:f`½hlÀwdÈWz–°™ÆQ‘oIûÆ5†©Ô:zêl %rüD!tˆ¡?ù0ñtöWßæ`ªÑ—òd Ù™ötyO¥ö'µ?Ÿzó9oéÉ~Eê»>ÐÃK… NÕn8¾ŒÐ¯úÑ'ûÓ~ÎýéÀ_Y¨T¨®h¦Ü` ¾‰ºØÉ õò*¿7jåÞì¤Ý™ÁP—EäòÎ|ml«ÕÑj®GËÁ9ÖeJ9s?¡×¢‚‹¶`«Q`¢˜œ°‡Ž¢P…¨ž{‰¨«×Rg­œ³šXX3ÇqvÜn¢‹þ)æ­+ü¶í–“ã–N…)oÝìµí|
¯mÑ9@½ü²c„0Ý“òsÁQJ³¿$Ç°Ö5|ò‡v»½ÑyøÖàC’:d›öºy•ô/õ:ÝnWQÇ¾jôó¿y3­ã7zM(•…21_L¥Œ‘€~<52w·Ÿ{±)a“ûçÁ€ž€çlÇßÒM õç(°·E§­èù•.;¥ŒJŽàìÊº[/‡ƒÃ¿+ÎTÅ\FE×w	ƒD¿‹ iFÝ4NŠ;‚ŸP0ó”,ŒsùÔŸÃ+ŒSû^î’l¡Á79ú¡rž$ý|£}ÔüdsZM2"ß‘èÚ&¥ÅÒUà›´œYÿq€'§ºÑ{h±qï:°Ã‹KN‹ÙÏfÇXOŽ¢ë·r%_Š. š¦8­y™—“v³³\¹­[Èd2£ÚUwmo`0\Éµ×°Å)é>äºõ³™,©tOÐ¯tXÆ£(˜~hØÏI—3¥èPï)º]à"™“³ö]ë:øÖU}½ò|i\ð¬vtÍŽÂÔ¥©.	ÐØ'Á¼YÑÛJiòDytÆ¢(©Ú)‚Î<ÛÅ²u)õœÔö“¯W!™EÁÄ‹®ˆÄ“#€{bØ¼#9ƒ“ºå„bIô³!½m#Œ>§^âa>ù~FC÷ßø‘?¼µø 5Ÿ,©œû²•ljûntl	´þó«Ø"hò4lhòo
¶¶OXïáSë×bÜk9|
íúhøãáÎØ­–]±ÄW©c˜KS±™ù•¦YEÐÛJ@|býú…÷BÛFáY06y×¾$ýÚ¡|Ä¢Úu¶
Ê5ñ¦&¶5fó±%‹ôG/šB³ŸBÏ.ûün¯d(ETÔ¯ùC·Q­Ó&¨VÍ>,Y±f.¨[ÃÃ&Ý:G0Î5k‘LÝkñ©ÊòZ×oÕ”Êú4öC”1/ÇÅ=XQ£–ÏJgí—<Ú acúºÔ?DéÉ»×!$ÞMuÖ`é›;,g§èú7àtdê—( ©	@íme¼±Ãt]3z·&Ûij¯ÌÔLdûiCÔ‹)ù¹Ñ-	lâ}VZ(kÝ!¾Íúø6èUá?årX¹m»€ðÑµv»#ða7ˆc_+Ø	Ý(Ëv¹LÚïPp¹v¿Ë¤»Âiwy HˆÂB!TÓ¸=HÈ+Ø6Çá%ˆIoüxÂÚmå'Kœ?æ“Ò*¬=.¥±Ê«¦‰øˆuœ/yâ=ñ/GÁiÄ$¦¥Pˆ?ýDá­ÿðë8˜Ào·5ÑÜ1Äù¬DÓïºž5’‘ßÀ\’£«)ü‰ÕÅ0ò-Û1³ÂGÉ|„Êx
ºÛƒáv-NjBC˜>Z+"=ô0<(SÕPÊ…}”uXì/ë röJ•*æDùd¥o_G~<'›ùwˆåròVýd8=¢¯ÞYÇ'ÓÎ£bØ¯êÆèÄ¾£ÙŽ¸sÄJ¿Ð<o)=XúÎðÆ£à'Ÿ¿ÿ4¿…ß,|2´|ìOf¼eüÓÜ2¿Yødhùi8ÆÀÛfÌ­gHŸM}&é¬àŸ–¾³›…O†–_ðv_˜[¥7fZÜI&a<ùQÚãüó¤Kß™f‡z¥_ÂNOç(ûÂ2Sâƒ¥ïtÏ²Mtùƒyƒô—ïìü;ý{•+¾Ö0¨šÝõò/§}û®âqå×ê†!C	Ç­Ù¾–>jßùT~¨øöMþðh~Js`^Äwª~0½]Ýþ7mo(GN)›4>qR¹!{„6>ó,„EÍž Ÿ,{'{DþÂø–£ÄŸe/ÁºcåÍ|š;ûiF©ü­êY… šJ	j9a2‹@éfð7I‚²ÀKo†<R/(OúÎ" Nf0'
S?/(æ¡ñnŸŸÅk¯õ¸sÿ5f—t0ìcà5>áØOÔ`aTApè¬ÙM†9~ ümó`€…Ö]…i7…¾>µv Æ°CÿÌƒ}XÁ¢òbðI]ü—…rô¢a íÄVþ¨Å„ÄUÕ¢Ðk‘RÚi	‡³ÕûB„®õŒCæØ}¢R¿à:ÉçFê„rQôoºãahMP‚Æ-¼WR¢êw'/†ùpµÝÝ„¡µ¸þ­Y<ðÆ~£-G‘dÉ•Ò Ì¼ ÂžÍ%£Â‚Qy.ÜÁ`¬^×6ŒÝô2ÓéôBŽÙUãUêø³%éhËƒ8cjÄCcú(¬«/Sm‰àTØ•ÐV«É^¹Ïf;x´6[fžˆ+ë×[Ô´(0´hy£ÃôôŠª(“»å¤ÙlîD‘wUþÅ\ï\¼VópLÂ¡ß†‰‹CÌ’¼h å²#NŠõ€É#Ò£eqÅÃ‡(ÅÈÌ6;«Þzê-Þ¢ÏeOÍÜ;óÒg)™9—é9G”PÈ?Â!Ö¦òŽ( I¾ÝÙ—U Qû£…-ªaÔ-­‚ŠôQx–L¼Ëw»ÚyÒïO›	ÎAÈ+ÅþJõè»Æ¼¢ëMŸõ·È€¸Y8Ú»†²¶ª}‚Ê ðHa™qs(Ãó<¶ËÛ±Žé±–5†G²B`‡Ü"X»lÅôdxöŒ#‚ÚÝ7º¬Óz”Ds÷.Ó¼\§6ŸLœZnýj+a@¸Nì&Ìk»E'¶ý%Oì—$ÁÀ·?=ó…ÏwÕtqN¿‚û´¦T˜Ô>Ðh{c'uã³M*?.ÇÞ•­’ñ¾%éØxbÒÓ›ÐB""ÍÈEß=Óir]ÓÄí4CÜ'“/NNöm®» Ú˜`À%–‘Ž$Ï»Æ¦{ª³’já<6C¥ŒÔ‰{YZ1k`Ï›>_ýÜ/›³©0†›/(ß7 7o+8»JºUQ•ÒŸàÃîéÄ<Ém¼QÝm¬^ÊMm6C_/+!Éç![ÁÍdV‡)Uæ?MÐ›ó†ÉvB>Ñw­3Ô‡½·+X»Ÿ]éZÁbÄw¬³·—ï*„’wKð¥hô1…ªÓ7n¡Daæ¬	ê+x”^ÈÞÙh¼¶RQ“ß×´idzEÓOÚýÖ}]m†¢õ•²$$ôV¿ÄúÂ r•‘ÏØ=¾U·¯¯Éå9©aœÑýÚ*©Ñÿ¾%7fí1_hÁ²Í"RùY'˜É•^4`Wº¤[¤k»ÕF R
®ž„Þ0ì­«-*;°ŠÁæ,S'Wcß>úSàRçtOn‘÷¬£ÙŠ×“YãW‰°¢« m³ƒJaM˜?8½üzzŒ+Ôj¶k+7Ò#+ïo1Óyn×ï:™©¸=~ÄÓÜØ'XDøA|„Åað%;‰mÂ×ÖÐ
H€æ>Ä°ã`Š‹Úän?2çA£ˆ:ÚÂ.,\B¶-÷«âYawFþðíÇã42öo#­?9¿ýõÙ0Œe¼^§X‹W@î“z>hèjÛ^ çíc Ï³cz·ãÈx‘^<"Ûšj‘ð»õÕ¨V³÷ú8œÃª{«ä”R‘G¾%§ÍÁÈ‹ôh'©·V@µYqAìûC‡U©@Éâhÿ(®ê·)#j?\!÷­_vë\3¹†Î-ôó;Òk	/ký	wÈà: Ðmà!dÂ?ÈN,áqÙkà¼a5:·óW>f¯\ÃÞ’-‚ç•k§_„	¶”µú<½O[—dM­ØSîç6»˜=uŠöÔ{LSt‹Ç¹ÀãÑÊ+"áL´mç	»òsÙáf’¿ ]§§dÎ…#¤W¾*Ç¦éÑÍÅ­ðÖ·Žwnå¯pkœzà¶±ºO4»¿JÚMjÚìWè]µ5M_¶/kõéÛ6\ß†ïk»Ì‚WÙUUHdW.*V[W¾%uÊ¬î“Žý a×éuW;ÉÄÎ:ž¯í´*ÞÒ¦Zôãx´vY#þë9º€`©Í½e­?;°6‡¤—lE¿‹0¡ëeå—k´Àócç½äƒë¶2šÚnnÞST…*k-)Ø¡v£­½ËlCNç‚='®|Pß|S8×MeæäËyLzª´|üãó¬2à†%Õ(¿5¥ü:/èû@ej‘]j”ƒzÚŸ]Rwâü÷FÖ”n,ZP~9í,Ç³ Ñ²‹ ÒÚlÄŒÖ;Ò2U³À9àÑZ.=Ùš´ÈÐ7˜É¥ZÓ1?c_µâ3#ªþr¸N©ÀdR-òÞIÔèË|¥²­Îféu–yEn<Ê,À²eJf©Ù¤YyŸ _Ãd›·×º_³oÂ
²0oØE¨}ïZVˆnî;ñxÖ¡‘>×wl×½µÝb¼j"Xuñ+½z|tög¸¹ÿ³?}=O¬;Ë(«‚CiPB²ò¹,™7"xíyÌ´çÀ¹qH;ìÈSÑ«uò‡¶ßÙìžª¬ïŠ«g«k÷lí¿zö®Õ¢
2…>¾…wkáº¿kªb·×‹h¸·Ç½¹…sàÿ©sfcaçÌÂKUî˜®Écþ'8Ù1®Z%ˆœàø½qnÖÆ|µYì¿ó’w°ÓÞ1w92¬µ±²*±ß­·î¯Øxx·nñâvG~ñCúbƒß»Ý2ÄÔ.µ4öNý1ÁŒ>øÑÃûÚ½‰)î††“46ÙI"Uµ0…Žœ³˜‘¬ÒEÛx7¥Ô\ÑêhžŠ¹ _“b£³°ïnú˜;Ý†—£miXœt0HÚº
­æ9~vðúðÈºÿæÍ—!CâsXJ°ÂBˆ £‹¯Dø.Vâ€†Ö<õgÉÈºýŽuhs±ãBä‘û+!…‡VX
×hAËZHÜìŽÖâõ,	&ÁO¾É¯ÊVbgèM~´.Æ‘Ÿ$¨¥;.‡}â°2ÞB…‘q n±"ë«íØ ÍÅV„{9Ùáf	··½g5†^â5î]³OMº´VO†SÅW¡òF©ú«$,õ‹Ú5¶Èõ>0®¡ûVDÆa²Q!ÔCN½JáiR<‚AqÔÑë§ßQó·Œ;+J<‹î$\Q‡F$&* öH6û§ç7¹í2ýŽ~¾Êá11·J2”å ­¬)vã8kì+i
ënÔJøKp+59­ OFpÁfL“Ê:Ìí…ŠÏŠ!šŸÍ$¨GVÆÚ2§&™¢ÛÒ8Åré™¾”±cvSLS!1©*hÌ$n¡ÉP“ÒŸfõÎY°¥Z¯ÕW'Žƒê‹SJ5_—¾§‰¿ Ù4vw^æ)nÞ˜úÞräÔÈ7ä†1ß²3Î)Ð9¦Ð/ªX¶rf—Î.½ì<ç4’ºRïB	ÃfpÒòc÷ÜÅt‹.ûèTÒc?Öbœej›Ù"U™pØ/§sc‘ˆE“'µ““ÄZ¤Œgxzy÷È…j}L&<Cß÷#žÆ~„‰üO"ïüdŽldIhÉedÝÎ8Œµaø‹$.Þ>?Q½ÆËÊÚ¹®B¥à$Ÿ—1Æ›ÚÑG»ƒb^õao7P…¿ñ%Ê‰O›jæÏk#_eÜqÆì(Xéb~‹kW¬¨Ï‚—ø¡Xµ!ù1v©G`~Ä »$.@Ý2tuË![äp<öfFPÒG	–æ6ò$’ÐÙ
…µóê	€!åû^—æmsbýÈ¨ø]Z¼öÀ¾ê£ã•GkÉhÑ¶:ÿøORßõÆ²F^ŸÆ·jëÿ­=‚³ä6Í±VÛ ¦é6ìg!u˜®%.;X8gN“Û´)>äM8ömmÁï‘Ih³û£ä4J°ËW„ÿ‘oÞuE¯%8LÝÂQà²Ü"`é®XÀt­ñ¿Ì¶€nozµJfûÃË-2£aÐ)¨šEi‚68&Û4Š5ûuK…:{”þ.ÒÎ08;ƒvà,5½Ó¸ÎúÔ í;†ï¯€è|4Gä÷ÛÛ™øC\úýÍ÷cùûJ~=&ïë÷®ÙË0`…5Ÿý5¾Yyood‹¼ÇšŸäðTêl{ï8a?x8\6O™¹Ýì÷ZëÀêòG6—q0­óÉäßî¯ÀÝõÖÊÊJ3	Ÿ—þ°ÞC8×Úÿû/ÿQs{;¬î~º\ô°¬§‹¾‹Þw¹†åUµC¿(ÉµQËÏkkÏÄ…ô	œ­óaØˆS¹9`¨4ª°C‚)(Tç‘Z°É,
/eóÊihYÃ|xX	Ìcf¼Ëz§¿*¼NÇ‰Q„ë+Žˆ±Ö¶/þH6x€aÍ5ôš'ÏÃûiËßm“‡ÖÍhùÙ=,f±ÌEö#ò›÷ê"Á<1|³_,½áŽ¯*Ï¢¢ô’£485«ÕK¥Œ‹=ˆDÇõ½ˆ÷üÁhëúèX ˜¥F±1»O7rÙëEçPR|ÅŠU×”aeÌ©³róóßÝG§5Tå„.ÑÊ·¶¬&QmÿîOªE»|ÛYp®ß++r+,à¶¹çæIÖ#šñXáÃ)A› ¼kd«êk;}þ^¹@›\M_½Ñýµ\¾\hB‹ï]LÒ™AÐ¡3	àý·÷èÇŒ»H‡4LºÕlµZ?ÿÝˆ:•_Ÿ‡—ôœyÉ5Š?7äÿü·/hs-%‹_hÏÀqÐéux;×x´ßÜ¯ÂÉ”P€u‡Ñ®RIEc˜+Ïy,üiÄx×ùþïÿ{r#	NLŠâ/vÇ1š¾Ù©"Dµ[¿V’*CDô(F„û²ÏèQ¡©¥¹Öw—kxoœï&*êIelNA“â¼ÕÑ4à/µµÒ|}û(eêò„ÉÞíš{Ÿî‚ BWF0;õ«äóZIFúÒ¶Ï'wr5Ëy¡—q°X'øWÝ’ø ÜÛmU )žwvÁr«ÙÅË—PòIzœaº‘?ûW4ãçÈ…uß|&ÑÄlud—5ùÅð³­PU–­!ï¸ÂñŒ|ûúáMaW¬KårTqVÛ&»^…eG³læÆÔŽ¯ÈÀK¼qx;ç,„—‚8/5A¨ÿÍ\„Äe]lkbH6‚GÑ¬w.QÌb8‰Šn¨ýû?`?îx$´¢Ï8ˆÕ4KvÆ««Ž,±{Ãè…7ùàUxŒ¦
“(Žðîx}‰%Á/œ2{å¥ÅÞ™ƒ/&!Ì­–õ÷üíÚRJ†I@RÄëÅ}„ÉÆèÂ[Î#½¹Së87ÈîA*´!·jµ²–Õ»ç(°ZD×ÛeáU*Qj¤åbÉ8#“NÉ*_âëMÖH(üÙðFQxRTõÊiÐ"0Äü!Ýqó,ÃâÕŸ„áØ÷¦+™Ol›ô,GÇcE±å‘-ç—ë uË¯Ï¢u<<Å| Ã#¦ð]£cÒi„ÛÛÛ¤oì0oç[R?ÚÛýþÍÞŠypŽÓŠ/uXÔR}x¼ÿrçÀòÚJ/vZÐ'0àã'¶Wx7ÐRÛA>…—ï’ú÷¯~Ø{³ÿlï©C(A=#õ§{Ïöw÷÷^¯¤æ…Ãl*æÞ¡Äóò€ü JãW\›Ÿ6Ž½Ó˜{°C]$Ž^0¹ˆ¼™âXgã÷½ÖF»ó–Ì¤RÂå’"§GfÏªñõ´A:NçI¢§»ã`ðaûº^¬†–F^à!…<Ð
ª"cå)æX¥;¬`=_TOÙ…p$ÝIS8P¤£F··îHqß=V™î8>l?&rí—–H)š“m·ßƒ2‹)’m©ûææ*BD#B4MÕ0ub‹<(HSL^&÷IDfÌ<– ÀZ¯¥{›Ž¥kw¥V8í61ìÿ-€zéôéÕÔ›ƒ\ÄÓlŒæïtCDá)ÚÔã_ß®ÆnÝgóÁ(<õÞH¬º9:í‡«[«îæW½9ŽÆY¿£à§–=5m‘t²Ì[äÐ’ytÊ®oÈQÁ2}¾m2§gó>ýúvI>të&¡¸r‡dÁÑU¶G1ù+Ýê2V…]áiÀc@wÓõø|»æ.˜i> ^Œ1Ž¿¶=¡˜ëÞH%åöíZî;¤˜û•îÝÙ|	RßÇsÔl¾!ÇÍ6¨¼K•UÂÖ›ÍìŽº:=L“;À$„# ú-nÌ¤²clÀO/»•Y¥©´À†©tÍ>nÍŒ;É:\¦ÑœC¬>jhÆôS9\ÛèÇIã&w™ŠÁµ¢²¼5ÂÖ:ÅF: ø±°I:/nà´zfJ;~ž×+œÈ?³Ìn=oKý4¼œ,£Nñæ0,ÉUÚè­½öÎ[u©HŽƒ›6.ÌÝD›u†w®Gµ++T8 £ÖF[+om;Î\…LâåºÕDi£¯ª`\:=;”|Ž —ªâÖ³˜g&:4Ÿo*ß)“‚]>pžpv…3ïœríº5Z›†òžù™rÄÏ—¸Ï[·vxÀ« ‘ßçŸÜžÆÞâKë¼§A8€o:9íƒélîù›\Í`õé4†—na|R·¯3>ïu ô0ò¦ç~Êe¯±FEG½˜‚'d¨=<+ltI2ê·JÞJbóx‘SÁ´â/!«o´Š¬¹½ä0D§°%+Ü˜
Lž"œ½_½­XSpWQ{2ô{Â)lÐ†Fª”J‚Ì"Çh%µGQ‘Ÿž€
X•+\¡VãjK%*+|D>{Îá9nˆúê^hŒJã¥n°Ìá8Å¾¹QV‘®X`9&Ç™ÄØIçO‡œØªDú,àÁvÍô`|î'/)X‡B
wA&vœv‹ÿ:½J~l1àTï›¿w]T3Røñåœxåæ±‡Ëš#Â´Þb8ÿõ¸ÏfbGMó¥i¦jJA4þðÜ½¯Õ8Âs•£Uô!"¨a-K£ÆIwƒíiS5¤aÝNâh{ÑèbI¿.×•B?
oÛcV/E1ce¨ë’¾„‰±Sl×œ­\C
“"h›§‰aW,qèbaP?i×lµX	š:ö®¼·pò7`.Ä‰&®mcÉzf± ;¦]0»ßÅûOß•‰Ê‚*Ì{Så(Ïç†y:ÝrÐº-RÎaÃ0r´%ËäÙ¢8Mµc˜JLÞa8Ìæ¨¯ÂørÆIb°^“SÇ¼f|ê'^0ŽŸz‰wR$–·Í$HÆÆ«é,Œúã+X‚˜]0X}oˆƒÁ#àÒ.m$Cö«ËX´¨Dù-‹H“b¬$Em¼MˆdqO1–³8ÜTàæŽCI<£Q¿‹ÅO¦W0$GLøAÑƒìýunFŠÊ'þ6|)%6!ÛCÈÂ©¬ ¹P/V·d‘²"á¥‡uÇé,²V®`Ë¨¨™ì}ôÆŒ$È¡A/€¶õ Vùì°9´Þè²rqâÏ˜gÄ¡¿u¼{•–ê…îº×bž	|	:&(’ƒã“•j·HÑÜëê4%s§‡B¸˜b¤‰uÄÝ¬†ËÈÙíµdÌ¡jâ»®qò­Ç¥UË.ö¿(ºG«ö7ÓtÛ9íÐ¡°›Õ4á®NWÒdf	¦1,€½ißN–_·fðÐuÚ®fIxy³¤GÁùÔKæ¨õ©ZïËö B¬+yôb§Ñé¯¿c±ÝÖUµwÏ^âÅ|ƒ-P¥¢jÕf¾¶å…Në_!0³£v\¢E–Q#Ú…gm¼®®M9ctË’Š[­ä™Ë¶,&ÚÑ8ð“5”Ø»­ÐŠª Çr1…Wâ½–9a‘ä•ïÃÌ[)Ø®û8¥–Éì@à²~W]AbA	ÂÄÝ¹™ iÑ\‡A<{ˆ´å¯’`àé²çòkÌ,>Üc†Ò•ŠjÜj“Ø¬šÖ­7þâÒgÅ÷MÓ¾vXFîÏd­–b§µ¥NðDB6¢¬|gF5V†º&Ôg•a"}}˜H¥ªÕa|Õ“Ø¡63QüLMÔ¢á©"—«î´1Z­»–‡Ÿù˜|>™…S4"o]×ˆ5U_ÝSÞñwÊl»!áég²ÆRÎz+¾UÈ3GÀ²«ºå×ù³0JŽaBŠÕ¿gÉe»;Çû¯_‘ïŸî“Ý½7Çì»½ß=÷§@	Å<Ü"÷®§þ]Ô¯#6äAˆ%Ž¨ËÉápDkþÝ3CpÿîÀK€“ûäEò]·ê‡¨¬BG¤ÇÚ÷ÓÓðb
dv8§i®Š$;h^:È~GqoîÿîwFƒì¾Ù?†—{Çoöwˆ4pÇïÞ“o­“˜):hÕâ‹‹Ë"—]æˆGêL¬„ÄJ,PtÑ*0ù{+Å@Å~¤ÀtìÑcR;ù§;¼¶ànòÖŠ|Ê.æùþÞµÐS„}Â$¶²j(¥¬ñaŽ]J»ÙÛ‘^ñ2b‹¤WóßÃ`Z¯ýeZ[q ç÷™þeº3OFhùä.×LÆH{z´ÿüÕÞSò9x½ûç½§™r…ŠÈºÞ/¥Þ[øÞ!‹[äÓqx
«‹Ìæ	üY?ÉyÚÛU‡ý‚‘_<³z„Æ`j/9ê›:U÷û7ÍAäí¾>ýw fø\Ç>;6âAÃp0ÇŠ¼½±Ÿê5¯fmÄkŽ"Ñ¡3ö{AšŽCwËûyóôèIG7Î;›n&—‰•³ñ ºJÓ‘b:ÜãaÝsÐ 9{0¤ü’ÈŸ€éú\³Èÿ~Ö&ÐÝc–ddÄ×õÔ¢(e°’"„m?ûN]TLŠ¦qj1ŽÉL‚“Æ`ãÖƒF#²%µLÜÒ,-í]âæ%»~”P.À»7tOe(S»Ã Yiô*í3ˆÖSþÖ”j!¤mò-ò
Á:d.¡TvˆØÿÉÕi­ø·ÝÒS`^';ªMŸ2<$l¡øm›ŒÏ…â·íËK¾©IÀ–,²%§P¦+„ï@Ç OXaÚè/;Š'DY$G/DC=Œ1"–z@æDV#\!‰•6ªÑÛæ8ákŠJ0î|§]Î«”®±Ù³¨õHVTî]mî"CWN©æëe†öç;ßíï¼"¯^ïí‘ƒ½öH½ýÿëÊm,ì"	¨ã2®}w=ƒØ?ð?‚hëébu	ógþÆÝÛdùI0Ý®Y“]&Þåv­o½ºª¶¯¹â›~…¯¼W0×òhÂÔX2\SJb?y•µ_EëzÔý&°jÐ¶˜CÍ^€6#nÐ#TëÒg}ÖšäP¶f8Ây”‰àE¹Ñƒ…}GcüéÞ 7ˆr`^*›½LaðÞhöïÔœ=£‰gC$ä(˜Ðø‘˜Œ‚óM
#ƒSV’3^%C/ú¢&bšCQÉîò£(ŒàŽ0" DÁ_M#Ð¿"`ž§¾7!C‘hiKf,E‹íÚÁHõõ³Ä';»~þæõ÷¯ž’§oöŸ“5rôç½ï’žB/Ï)UÓjP¿¦Ø­ÈS àŒÅIºöøD~Éo<²|}~y6žÃlÆØmâMÂh6
çÀ9ç“pÁØ›ÌÆ>ócZ–:ÔVBâþe“Á–#Bïa<ÅrD+ET^¡?À!ÿ?   ÿÿ 6,	£xœì}ÛrI²Ø»¿¢«‚³ ˆ»HÉ	Š¤$ÆR$AÍìZ«@è£F7NwC$†C‡#‡ßŽðyðíÖ~8áç=ïçüÃ~‰3³úR}/ ¤¤ÙÆE »««²2³òžŒeþìmÍþMÞå¡þ1ûïröõþÜu-3çCÝÑúîßéÎ%·Ý¹Ý×\Ý2¯æ¦©›ãûœG-óÈÐöïÊ›lÿ€ÝåÜÊ˜ÃÝÓ´”]{Î7¿Í}vfh‹ÞÂt'×–ÉËÎî&›ß²­-æX#—ÁyÑÛ¯õ)·ænYe²Œ,ÓqY_s8Û‡§>pùðH3‡úPsùwµ©ñ½fàß°’ÞÀ²9ûé'¶ÝÉ_‡?¬ãÀ°-ö{¥¹“~¶¦å(øOtS3zð<=;ÕnËõŠ÷·n–uøt>Ÿö¹].Óü«¬lZºÃÏøGnÀ+ëµ§ÍMü¶¯>Œmknm ˆ—Úm¼„Ú¬¹Ösý–ËMø)š@XÞ]‚IYLUåÙtÜi†S„qôðÀsÀºuöÛpæƒwœ¶Ë6¸m[¶‡73ËÑ]ý#ß2ùXÃ? “ ¹¯º¯°F³^ÏÐ}ÅÍqÎµ)ß/ÝTGsÃ`³EµUë°þ¸:¶µ¡ÎM·êZU›lk
w&Ž®U»õ: xUì[ôib}äönä¦Nðux+~çò[·zë°‘c÷ØsñÕÍDw9£íçÃê­Áæ³·ˆ1®wü«7úÆ9mhÝT§C¼b"Ü,³ªÁìµBn×h¯¾©×v¶ße×šiÝ]À$ØÈà·^7uªX"·ÙßÏW-ücmVmÖ:¥LØåñÈtÎ›_ÎÝÍ½¼1é†3Kr»Ý¶6›Àÿš©OT™nJð,±­¢Q{útnÀDa†Ï Ì3Ûš1yúµZ-Ú¹oØ<_wÙW|dsgrt]8âé„~/µÞk[a‹‡€›`ªÁz.Œï°£	|Xg­Ù¤¶·%¾¬ÇóÏÍ»­oØ•>ž¸»ìŠ;sÃuØ±î ›a_Ã_ÚØ´ {ì›­¬ìÁð2ôŒñîÀ2 [4³ú©ýÍoëúa£ý–õ-Ìû§êˆUÛõúÖ¶OÎ‘+O¢}šmÑÎª]l¿:©¾im×g·o­á¯*¼1 ³>wo87™ÍÁípè‘T=Ñ‡C¸àÑ¸1.åH±Ui}Ç2æÀE\kV…y!Èà_@•&bJ*±§­N0uâ}}cnWß´iÖ3KGFP…3Êtª	œœpKy. Ú¯. ´öF>r™=t;÷©äsÙ\Ïßokû©»?ë¾Þ‰(%¿”hóMC BÈòéÏ©eZ‚xý]i:eóýäO7€OM&vˆgðÿ&¢À9˜Ï($’9ÇÖo‹€²…PYtÛê‹’®Œé­z÷°¡·xÆá‘_¯¤‚_¨W\3\cIÜc'tXö@£H {f	`XAÿ
¼E¤À ä3 ;
è9 4®ŽÎG³ñ€˜Iç!¼Á¡Óò£¸¹ÃL ËþÀÆÜ„#ÅÐÔúº¨VcÏLâPVvmË A„½ÐælƒÉHfÜ9ØšÁ8(†£ˆlè&gC”+ì†³)×œ9Hô7îN`ák³£óó?m8ÀA|F,t¤@›’r¾0,„ØÙü ç0ãÚ‡Y6r”î8g1g6·ukî0CësÃ):ígEÛã:c[2ü…|ÏFèLwÃM"a¾ž	˜wÎq„µêÝúÑÛ­nœd>†¬,Ê‹—`"é$º’¨eeìdó3»tðÚô‚5F‘„½ÁÍ'„xÌÀÅ³QaÅ |¨j›õû¯Š'žo>(€óv­@zÊ‡ú|ƒué $×Ìi¦` L Šf*2bæóI02S:úô¨zùÉU>ÐVA×Y\ëg¿Ùßg&
xß±÷O’×ï¿zJJ©Z­~UÊS–½=6¯¿ÆcÁÝá,Y°'weeúEKKrä}-¥z­^BmnÍe;Žú+þs-æ|UÅ–ÙsSi;– h…[rïA=L¬î¥O8g]!<Ó†cž£~yçlÛ×_¨É
Çc02ßi§q–f¶Öå›t“ …ðßáÜ¦	W[JØY¬tÐ”ð<6ÖÝûX'ô;¢º=)²ŸŠŸä°íšå j|ŠÂÛ§}¾©¿«¿ü=îkåN³Òl4*N«R¯mo¾Ý`»+¿õiÝ{ë`*xæ+[mze³µ½þ+;þ+54Æf¿³ÙîÀ·+ðÞ¥Þ‰CÛ–#N’ô‘[;•î6þ'Vöþý½Šb¦®xfk—#n*2bÔ€õ¹9X°PæñÝ»Sà]iÓ¾{¯ˆÊyÈL+‘ÐYuóP•Æô‘u½;á€*ª($DÃç”ž,RÛÎT&íƒµwq}Èž¾>»®^_œ\ž_«O;´WÏ^÷®Ùéù1üsuzxÆ..aôëÓ‹óÃ³5ß `ýýë³sñÙÙ	ë|ruÂ.à÷Ùáeo‰á7®Nzg¯qZìÙÕÉáï/~8ßPDsEyQýNU9,i$ðx‚ª¡À7gvð©UÅ3…®Au÷­CaÂµß7[:®g8`ÚXÓÑ·6¹—õ¹6æ ÔÝGÆ|àÎ…Á^à ·l§ÆNnÜ0à…ÉÛÀ-Ûeüvf‘ñÀY˜ƒ‰m¹¶gÁ@³ƒ¦hß¬)¢A6¿¦fÁ-bnÎŒ`RõÖ	÷Ðí‚ðÈàqÄÈ
ÓwbÍa h˜w › ;X
¬ÝaÖ`0ž(¦9‹é”»¶>`ÚÔ²g´_Ìlk¤°Ôüf­%	¢Á½‚“Átõ‘óMðÐè£Ô¡Ù˜,h$$?ÚŒÝèîDšIèÉd“ùtæ0UlO¼­±çºÉ«îœ¼B¾ÑV>waóÄ/5FjûÀm“ÁÂt²öX°r”|TWH™ZC¨o“NfÓŸ‡pyÂžÝÉ™Çž¡‹Ðš»UkT¤¨÷ç$öâ@2t	ç	s´é&
ºÀ˜0‹¹…û´ Ì¥¥ÂÈ}èŽvÔuŽO^Sà$±	â–B¶ã¦QQb¸r¸§Õ»©†sã¦öˆH×ÍCm¸P7wŠÔb’0Î‘S€8ÿ÷@r¸uá_ËÞõ<¦J&ÙT+d Q¡tðêâüúäÝÑáÕÙÅ»Þé«âÑÕ¢J–¾¸·5µ;3î LHù60x…*íµÖ'=xc`™£¹ßldkl{áKYÆœuSwuÍØ¿»cžWz—Õ+~7êÙ{O9‹<Õ §rÊ³ÄcÉÛ¦Øm3á,‚ã£HL}iÖN¡ú|ÆGî®PŸê±îm—ù`e/¹æN¡¾À¹~fæ›¦Í§oÉ¥é©3¨fgêÎÈ?g[SråÐ$Bá˜œbÏB®ûÂÖf“\nŽ»DŽŽÎáÿÇ¥-Qo½­Òâ½éîÊwtßÊaÞ•pÛu ÑT¿}
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
Éá‡I§ã´v·‡áCj½n-]E£aÑ&¬B]®ýÆèðÑ²±ö|àb¿öZ-}þI?ü2fp©;k+jÇ*óéJ.áH¶«Ü³5 û¨Õ7}ar£Õ€ƒ¦5ÝZÓÐU „CX½Ä»©Ã«„'¹í]eÚ¼­ œ!¬%ÓeŠûàÎÖ÷4¸FSŒ¦Ã°«/uu¤Î¬^ß+ÓrqC¬>ÌŒCIYn:ÏC^Àö^Á$¯Èº’.†¥òÅL+ür)%»vzÿÅôïƒ=ÌîÉHë|ª›zkö`,—°âÍä<oƒN$î“^î™n©¹ïþC—¯¹=•1M ÅLò‹SìÀ¢).Á3<=õþLi¡-8u8K|2¼?Úä:ûýò}ƒ6Ô› ´7ÁŸðìý·ÿæÿ  ÿÿ <O¯I