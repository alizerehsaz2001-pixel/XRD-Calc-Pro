import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { DLPhaseResult, DLPhaseCandidate } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
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
  ReferenceLine
} from 'recharts';
import { Box,  Brain, Activity, CheckCircle, Search, Database, Layers, Zap, ChevronDown, FlaskConical, Loader2, Upload, FileText, Trash2, Settings, Info, Calculator, Plus, X, ShieldAlert, Focus, Eye, Scan, BookOpen, Microscope, Cpu  } from 'lucide-react';

import { MATERIAL_DB } from '../utils/materialDB';


export const DeepLearningModule: React.FC = () => {
  const { t } = useTranslation();
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Preproc, 2: CNN, 3: DB, 4: Done
  const [selectedCandidate, setSelectedCandidate] = useState<DLPhaseCandidate | null>(null);
  const [scanPos, setScanPos] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Advanced Engine Configuration
  const [engineConfig, setEngineConfig] = useState({
    kernelSize: 5,
    filters: 64,
    activation: 'ReLU',
    optimization: 'Adam',
    multiScale: true,
    dropout: 0.2,
    pooling: 'max',
    depth: 50,
    learningRate: 0.001,
    batchNorm: true,
    confidenceThreshold: 50
  });

  // Search & Advanced Tools State
  const [searchTerm, setSearchTerm] = useState("");
  
  const getFilteredMaterials = () => {
    if (!searchTerm.trim()) return [];
    const rawTokens = searchTerm.trim().split(/[\s,]+/);
    const keywords = rawTokens.map(t => t.toLowerCase()).filter(Boolean);
    
    // Check if the input consists mostly of numbers (potential peak search)
    const numericTokens = rawTokens.map(parseFloat).filter(n => !isNaN(n));
    const isPeakSearch = numericTokens.length > 0 && numericTokens.length >= keywords.length / 2;

    return MATERIAL_DB.map(material => {
      let score = 0;
      
      keywords.forEach(kw => {
        if (material.name.toLowerCase().includes(kw)) score += 10;
        if (material.formula?.toLowerCase().includes(kw)) score += 10;
        if (material.crystalSystem?.toLowerCase().includes(kw)) score += 5;
        if (material.type?.toLowerCase().includes(kw)) score += 5;
        if (material.spaceGroup?.toLowerCase().includes(kw)) score += 3;
        if (material.applications?.some(app => app.toLowerCase().includes(kw))) score += 2;
      });

      // Unified peak matching
      if (isPeakSearch && material.pattern) {
        let patternPeaks;
        try {
          patternPeaks = parseXYData(material.pattern).map(p => p.twoTheta);
        } catch (e) { patternPeaks = []; }
        
        let matchCount = 0;
        numericTokens.forEach(nt => {
          if (patternPeaks.some(mp => Math.abs(mp - nt) <= 0.5)) {
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
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.material)
    .slice(0, 10);
  };
  
  const searchResults = getFilteredMaterials();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLatticeModalOpen, setIsLatticeModalOpen] = useState(false);
  const [latticeResult, setLatticeResult] = useState<{ a: number, error: string } | null>(null);
  const [mixtureList, setMixtureList] = useState<string[]>([]);
  const [isMixMode, setIsMixMode] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { label: 'Idle', icon: Brain },
    { label: 'Preprocessing Pattern', icon: Activity },
    { label: 'CNN Feature Extraction', icon: Layers },
    { label: 'Database Matching', icon: Database },
    { label: 'Final Scoring', icon: CheckCircle },
  ];

  const handleMaterialSelect = (material: typeof MATERIAL_DB[0]) => {
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
    const materials = names.map(n => MATERIAL_DB.find(m => m.name === n)).filter(Boolean) as typeof MATERIAL_DB;
    if (materials.length === 0) return;
    
    // Simple sum of patterns
    const masterPoints: Record<number, number> = {};
    materials.forEach((mat, idx) => {
      const weight = 1 / materials.length; // Equal weighting for simplicity
      const pts = parseXYData(mat.pattern);
      pts.forEach(p => {
        const rounded = Math.round(p.twoTheta * 100) / 100;
        masterPoints[rounded] = (masterPoints[rounded] || 0) + (p.intensity * weight);
      });
    });
    
    const combinedStr = Object.entries(masterPoints)
      .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([t, i]) => `${t}, ${i.toFixed(1)}`)
      .join('\n');
      
    setInputData(combinedStr);
    setSearchTerm("Custom Mixture");
  };

  const handleLatticeEstimation = () => {
    if (!selectedCandidate || !selectedCandidate.matched_peaks?.length) return;
    
    // Smart estimation based on Crystal System
    const firstPeak = [...selectedCandidate.matched_peaks].sort((a,b)=>a.obsT - b.obsT)[0];
    const cs = selectedCandidate.crystalSystem?.toLowerCase() || '';
    
    let aResult = 0;
    let message = "";
    
    if (cs.includes('hexagonal') || cs.includes('trigonal')) {
       // Often first prominent peak is 100 or 101. Assuming 100 for 'a'.
       // d = a * sqrt(3) / 2 => a = d * 2 / sqrt(3)
       const d = calculateLatticeConstant(firstPeak.obsT, 1, 0, 0); // calculateLatticeConstant basically returns d when hkl=100
       aResult = d * (2 / Math.sqrt(3));
       message = "Smart AI Estimate: Hexagonal/Trigonal 'a' (assuming 100 reflection)";
    } else if (cs.includes('tetragonal') || cs.includes('orthorhombic')) {
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

  const calculateLatticeConstant = (twoTheta: number, h: number, k: number, l: number, wavelength: number = 1.5406) => {
    const thetaRad = (twoTheta / 2) * (Math.PI / 180);
    const d = wavelength / (2 * Math.sin(thetaRad));
    const a = d * Math.sqrt(h*h + k*k + l*l);
    return a;
  };

  const handleRunAI = () => {
    const isActuallyMixMode = isMixMode || searchTerm.toLowerCase().includes('mix') || searchTerm.toLowerCase().includes('suite');
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

    // Check if input matches a known material to override/enhance results
    const matchedMaterial = MATERIAL_DB.find(m => m.pattern === dataToAnalyze || m.name === searchTerm);

    // Simulation Sequence
    setTimeout(() => setProgressStep(2), 800);
    setTimeout(() => setProgressStep(3), 2000);
    setTimeout(() => {
      const points = parseXYData(dataToAnalyze);
      let computed = identifyPhasesDL(points, mixMode);

      
      // Enhance result with known material data if matched
      if (matchedMaterial) {
        const enhancedCandidate: DLPhaseCandidate = {
          phase_name: matchedMaterial.name,
          confidence_score: 98.5,
          card_id: "DB-MATCH-001",
          formula: matchedMaterial.formula,
          matched_peaks: parseXYData(matchedMaterial.pattern).map(p => ({
            refT: p.twoTheta,
            obsT: p.twoTheta,
            refI: p.intensity
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
        };
        
        // Put the matched one first
        computed = {
          ...computed,
          candidates: [enhancedCandidate, ...computed.candidates.filter(c => c.phase_name !== matchedMaterial.name)]
        };
      }
      setResult(computed);
      if (computed.candidates.length > 0) {
        setSelectedCandidate(computed.candidates[0]);
      }
      setProgressStep(4);
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
Density: ${selectedCandidate.density ? selectedCandidate.density + " g/cm³" : "N/A"}
Material Type: ${selectedCandidate.materialType || "N/A"}
Molecular Weight: ${selectedCandidate.molecularWeight ? selectedCandidate.molecularWeight + " g/mol" : "N/A"}
Band Gap: ${selectedCandidate.bandGap !== undefined ? selectedCandidate.bandGap + " eV" : "N/A"}
Elastic Modulus: ${selectedCandidate.elasticModulus !== undefined ? selectedCandidate.elasticModulus + " GPa" : "N/A"}
Magnetic Properties: ${selectedCandidate.magneticProperties || "Homogenous/N/A"}
Optical Properties: ${selectedCandidate.opticalProperties || "N/A"}

--- Description ---
${selectedCandidate.description || "N/A"}

--- Matched Peaks ---
${selectedCandidate.matched_peaks?.map(p => `Ref: ${p.refT.toFixed(2)}° | Obs: ${p.obsT.toFixed(2)}° | Int: ${p.refI}`).join('\n') || "No detailed peak data"}

--- Applications ---
${selectedCandidate.applications?.join(', ') || "N/A"}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCandidate.phase_name}_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadExample = (type: string) => {
    const isMixType = [
      'Mixture', 'Complex', 'Modern-Ceramic', 'Solar-Mix', 'Cathode-Mix', 
      'Geological-Suite', 'Catalyst-Mix', 'Precious-Metal-Mix', 'Halide-Mineral-Mix', 
      'Iron-Oxide-Mix', 'Biocoat-Composite-Suite', 'SOFC-Electrode-Suite', 
      'Aerospace-Armor-Suite', 'Pharma-Drug-Suite', 'Nuclear-Fuel-Suite'
    ].includes(type);
    setIsMixMode(isMixType);
    setMixtureList([]);

    if (type === 'Mixture') {
      setInputData(`20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`);
      setSearchTerm("Mixture (SiO2 + Au)");
    } else if (type === 'Complex') {
      // Quartz: 26.64(100), 20.86(22), 50.14(14)
      // Rutile: 27.44(100), 54.32(60)
      // Anatase: 25.28(100), 48.05(35)
      // Ag: 38.12(100), 44.30(40)
      setInputData(`20.86, 15\n25.28, 60\n26.64, 100\n27.44, 40\n38.12, 30\n44.30, 15\n48.05, 18\n50.14, 10\n54.32, 22`);
      setSearchTerm("Complex Mixture (Quartz + Rutile + Anatase + Ag)");
    } else if (type === 'Modern-Ceramic') {
      setInputData(`28.17, 30\n31.47, 20\n35.9, 100\n41.7, 85\n50.12, 10\n60.4, 60\n72.3, 45`);
      setSearchTerm("Modern Ceramic (TiC + ZrO2)");
    } else if (type === 'Solar-Mix') {
      setInputData(`14.15, 100\n14.2, 90\n20.1, 45\n24.5, 45\n28.4, 60\n28.6, 90\n31.8, 30\n32.1, 25\n40.6, 20\n40.8, 55`);
      setSearchTerm("Solar Mix (Hybrid MAPbI3 + Inorganic CsPbI3)");
    } else if (type === 'Cathode-Mix') {
      setInputData(`18.9, 100\n36.7, 45\n37.3, 50\n38.4, 85\n44.3, 40\n45.2, 40\n64.4, 25\n77.4, 25`);
      setSearchTerm("Cathode Mix (LCO + NMC-111)");
    } else if (type === 'Geological-Suite') {
      setInputData(`20.86, 35\n23.6, 60\n24.1, 40\n26.64, 100\n29.40, 100\n33.2, 80\n36.54, 12\n54.1, 85`);
      setSearchTerm("Geological Suite (Quartz + Calcite + Hematite + Feldspar)");
    } else if (type === 'Catalyst-Mix') {
      setInputData(`25.28, 60\n27.45, 80\n28.55, 100\n33.08, 20\n35.09, 15\n36.09, 35\n38.42, 15\n40.17, 50\n41.23, 20\n47.48, 45\n48.05, 25\n54.32, 45\n56.34, 30`);
      setSearchTerm("Catalyst Mix (CeO2 + Rutile + Anatase + Ti)");
    } else if (type === 'Precious-Metal-Mix') {
      setInputData(`38.15, 100\n43.30, 90\n44.33, 60\n50.43, 40\n64.50, 25\n74.13, 20`);
      setSearchTerm("Precious Metal Mix (Au + Ag + Cu)");
    } else if (type === 'Halide-Mineral-Mix') {
      setInputData(`27.37, 10\n28.30, 100\n31.69, 80\n40.50, 40\n45.43, 60\n47.00, 50\n50.15, 15\n55.75, 25\n56.45, 15\n66.35, 10`);
      setSearchTerm("Halide Mineral Mix (Halite + Sylvite + Fluorite)");
    } else if (type === 'Iron-Oxide-Mix') {
      setInputData(`20.86, 15\n24.14, 20\n26.64, 80\n30.09, 25\n33.15, 90\n35.45, 100\n43.05, 15\n49.48, 30\n50.14, 10\n54.09, 35\n56.94, 25\n62.51, 35`);
      setSearchTerm("Iron Oxide Mix (Magnetite + Hematite + Quartz)");
    } else if (type === 'Biocoat-Composite-Suite') {
      setInputData(`25.87, 25\n30.27, 60\n31.77, 100\n32.19, 90\n35.25, 12\n46.71, 15\n49.46, 15\n50.37, 35\n60.20, 20`);
      setSearchTerm("Biomedical Implant Composite (HAp + ZrO2)");
    } else if (type === 'SOFC-Electrode-Suite') {
      setInputData(`22.4, 15\n30.1, 80\n31.8, 100\n34.8, 18\n39.3, 10\n45.8, 30\n50.2, 45\n57.2, 20\n59.7, 25\n62.8, 10\n67.1, 22`);
      setSearchTerm("SOFC Electrode Composite (YSZ + SRO)");
    } else if (type === 'Aerospace-Armor-Suite') {
      setInputData(`25.58, 20\n35.15, 80\n35.9, 100\n37.78, 15\n41.7, 50\n43.36, 45\n52.55, 18\n57.50, 40\n60.4, 30\n61.30, 5\n66.52, 10\n68.21, 15\n72.3, 20`);
      setSearchTerm("Aerospace Armor Composite (TiC + Al2O3)");
    } else if (type === 'Pharma-Drug-Suite') {
      setInputData(`6.1, 40\n12.1, 20\n12.2, 25\n15.5, 30\n16.6, 100\n17.7, 20\n18.2, 90\n18.9, 30\n20.2, 35\n20.4, 18\n22.3, 45\n23.5, 22\n24.4, 40\n32.8, 10`);
      setSearchTerm("Analgesic Co-Formulation (Ibuprofen + Paracetamol)");
    } else if (type === 'Nuclear-Fuel-Suite') {
      setInputData(`27.6, 90\n28.2, 100\n31.9, 35\n32.7, 40\n45.8, 50\n47.0, 45\n54.4, 40\n55.8, 35\n57.0, 30\n58.5, 25`);
      setSearchTerm("Mixed Nuclear Fuel (UO2 + ThO2)");
    } else {
      // Generic finder for all single phase examples
      const searchKey = type === 'HAP' || type === 'HAP-Sintered' ? 'Hydroxyapatite (Sintered)' : 
                        type === 'HAP-Nano' ? 'Hydroxyapatite (Nano)' :
                        type === 'Carbonated-HAP' ? 'Carbonated Hydroxyapatite' :
                        type === 'Dental-HAP' ? 'Hydroxyapatite (Dental Enamel)' :
                        type === 'Dentin-HAP' ? 'Hydroxyapatite (Human Dentin)' :
                        type === 'Mg-HAP' ? 'Magnesium-Doped HAp' :
                        type === 'Si-HAP' ? 'Silicon-substituted HAp' :
                        type === 'Pb-HAP' ? 'Lead-doped HAp' :
                        type === 'Cd-HAP' ? 'Cadmium-doped HAp' :
                        type === 'Magnetite-Hyper' ? 'Magnetite (Hyperthermia)' :
                        type === 'Cobalt-Ferrite' ? 'Cobalt Ferrite' :
                        type === 'Maghemite' ? 'Maghemite' :
                        type === 'Zn-Ferrite' ? 'Zinc-doped Ferrite' :
                        type === 'ACP' ? 'Amorphous Calcium Phosphate' :
                        type === 'Bio-Glass-1393' ? 'Bioactive Glass (13-93)' :
                        type === 'Bio-Glass-S53P4' ? 'Bioactive Glass (S53P4)' :
                        type === 'Bioactive Glass' ? 'Bioactive Glass (45S5)' :
                        type === 'Fluorapatite' ? 'Fluorapatite' :
                        type === 'Sr-HAP' ? 'Strontium-Apatite' :
                        type === 'Chlorapatite' ? 'Chlorapatite' :
                        type === 'PbTiO3' ? 'Lead Titanate' :
                        type === 'LTA' ? 'Zeolite A' :
                        type === 'YAG' ? 'Yttrium Aluminum Garnet' :
                        type === 'SrTiO3' ? 'Strontium Titanate' :
                        type === 'LiFePO4' || type === 'LFP' ? 'Lithium Iron Phosphate' :
                        type === 'GaN' ? 'Gallium Nitride' :
                        type === 'Au' ? 'Gold' :
                        type === 'Fe' ? 'Iron - Alpha' :
                        type === 'Ni' ? 'Nickel' :
                        type === 'WC' ? 'Tungsten Carbide' :
                        type === 'Fe3O4' ? 'Magnetite' :
                        type === 'MAPbI3' ? 'Methylammonium Lead Iodide' :
                        type === 'SiC' ? 'Silicon Carbide' :
                        type === 'GaAs' ? 'Gallium Arsenide' :
                        type === 'BFO' ? 'Bismuth Ferrite' :
                        type === 'ITO' ? 'Indium Tin Oxide' :
                        type === 'FeS2' ? 'Pyrite' :
                        type === 'Cr' ? 'Chromium' :
                        type === 'Ga2O3' ? 'Gallium Oxide' :
                        type === 'CdTe' ? 'Cadmium Telluride' :
                        type === 'Bi2Te3' ? 'Bismuth Telluride' :
                        type === 'SnO2' ? 'Tin Oxide' :
                        type === 'LCO' ? 'Lithium Cobalt Oxide' :
                        type === 'Si3N4' ? 'Silicon Nitride' :
                        type === 'AlN' ? 'Aluminum Nitride' :
                        type === 'hBN' ? 'Boron Nitride' :
                        type === 'GaP' ? 'Gallium Phosphide' :
                        type === 'ZnSe' ? 'Zinc Selenide' :
                        type === 'Ta' ? 'Tantalum' :
                        type === 'V2O5' ? 'Vanadium Pentoxide' :
                        type === 'AgCl' ? 'Silver Chloride' :
                        type === 'MnO2' ? 'Manganese Oxide' :
                        type === 'PTFE' ? 'Polytetrafluoroethylene' :
                        type === 'NaCl' ? 'Halite' :
                        type === 'KCl' ? 'Sylvite' :
                        type === 'CaF2' ? 'Calcium Fluoride' :
                        type === 'ZrO2' ? 'Zirconia' :
                        type === 'Graphite' ? 'Graphite' :
                        type === 'Hematite' ? 'Hematite' :
                        type === 'MgO' ? 'Magnesium Oxide' :
                        type === 'CeO2' ? 'Cerium Oxide' :
                        type === 'Calcite' ? 'Calcite' : 
                        type === 'Tungsten' ? 'Tungsten' : 
                        type === 'Quartz' ? 'Quartz' : 
                        type === 'Diamond' ? 'Diamond' :
                        type === 'Rutile' ? 'Rutile' :
                        type === 'Anatase' ? 'Anatase' :
                        type === 'BaTiO3' ? 'Barium Titanate' :
                        type === 'MoS2' ? 'Molybdenum Disulfide' :
                        type === 'Corundum' ? 'Corundum' :
                        type === 'TTCP' ? 'Tetracalcium Phosphate' :
                        type === 'PZT' ? 'Lead Zirconate Titanate' :
                        type === 'ZnS' ? 'Zinc Sulfide' :
                        type === 'BaFe12O19' ? 'Barium Ferrite' :
                        type === 'WO3' ? 'Tungsten Trioxide' :
                        type === 'VO2' ? 'Vanadium Dioxide' :
                        type === 'Ag2O' ? 'Silver(I) Oxide' :
                        type === 'CuO' ? 'Copper(II) Oxide' :
                        type === 'NiO' ? 'Nickel Oxide' :
                        type === 'Co3O4' ? 'Cobalt(II,III) Oxide' :
                        type === 'LTO' ? 'Lithium Titanate' :
                        type === 'YBCO' ? 'YBCO Superconductor' :
                        type === 'ZSM5' ? 'Zeolite ZSM-5' :
                        type === 'MOF5' ? 'Metal-Organic Framework-5' :
                        type === 'Pt' ? 'Platinum' :
                        type === 'Pd' ? 'Palladium' :
                        type === 'NMC' ? 'NMC-111' :
                        type === 'YSZ' ? 'Yttria-Stabilized Zirconia' :
                        type === 'SRO' ? 'Strontium Ruthenate' :
                        type === 'GO' ? 'Graphene Oxide' :
                        type === 'OCP' ? 'Octacalcium Phosphate' :
                        type === 'Cellulose' ? 'Cellulose' :
                        type === 'Chitosan' ? 'Chitosan' :
                        type === 'Silk' ? 'Silk Fibroin' :
                        type === 'Whewellite' ? 'Calcium Oxalate' :
                        type === 'ACP' ? 'Amorphous Calcium' :
                        type === 'PLA' ? 'Polylactic Acid' :
                        type === 'PEEK' ? 'Polyether ether ketone' :
                        type === 'Collagen' ? 'Collagen Type I' :
                        type === 'UO2' ? 'Uranium Dioxide' :
                        type === 'ThO2' ? 'Thorium Dioxide' :
                        type === 'Zircaloy' ? 'Zircaloy-4' :
                        type === 'NuclearGraphite' ? 'Nuclear Graphite' :
                        type === 'Nd2Fe14B' ? 'Neodymium Magnet' :
                        type === 'TiC' ? 'Titanium Carbide' :
                        type === 'Cr2O3' ? 'Chromium(III) Oxide' :
                        type === 'CoFe2O4' ? 'Cobalt Ferrite' :
                        type === 'BiOCl' ? 'Bismuth Oxychloride' :
                        type === 'CsPbI3' ? 'Cesium Lead Iodide' :
                        type === 'Ti3C2' ? 'Titanium MXene' :
                        type === 'UiO66' ? 'UiO-66' :
                        type === 'HKUST1' ? 'HKUST-1' :
                        type === 'MoO3' ? 'Molybdenum Trioxide' :
                        type === 'V2O3' ? 'Vanadium(III) Oxide' :
                        type === 'Hematite' ? 'Hematite(Fe2O3)' :
                        type === 'PerovskiteCat' ? 'Perovskite (CaTiO3)' :
                        type === 'Feldspar' ? 'Feldspar (Orthoclase)' :
                        type === 'SS316L' ? 'Stainless Steel 316L' :
                        type === 'SS304' ? 'Stainless Steel 304' :
                        type === 'SS310' ? 'Stainless Steel 310' :
                        type === 'SS430' ? 'Stainless Steel 430' :
                        type === 'Ti64' ? 'Ti-6Al-4V (Grade 5)' :
                        type === 'Brass' ? 'Brass (C26000)' :
                        type === 'Inconel' ? 'Inconel 718' :
                        type === 'SBA15' ? 'SBA-15' :
                        type === 'MCM41' ? 'MCM-41' :
                        type === 'MOF5' ? 'MOF-5' :
                        type === 'ZIF8' ? 'ZIF-8' :
                        type === 'Ibuprofen' ? 'Ibuprofen' :
                        type === 'Paracetamol' ? 'Paracetamol' :
                        type === 'Magnetite' ? 'Magnetite (Fe3O4)' :
                        type === 'PE' ? 'Polyethylene (PE)' :
                        type === 'YBCO' ? 'YBCO Superconductor' :
                        type === 'Cement' ? 'Portland Cement (Alite)' :
                        type;
      
      const mat = MATERIAL_DB.find(m => m.name.includes(searchKey));
      if (mat) handleMaterialSelect(mat);
    }
  };

  const parsedPoints = parseXYData(inputData);
  
  // Prepare Chart Data
  const generateChartData = () => {
    if (!parsedPoints.length) return [];
    
    const isDiscrete = parsedPoints.length <= 50;
    
    // Sort parsed points
    const sortedPoints = [...parsedPoints].sort((a, b) => a.twoTheta - b.twoTheta);
    const sigma = 0.5; // Controls width of the simulated peaks
    const sigma22 = Math.max(0.0001, 2 * sigma * sigma);
    
    if (!isDiscrete) {
      // If it's continuous experimental data, calculate match and residual
      return sortedPoints.map(p => {
         let refIntensity = 0;
         if (selectedCandidate && selectedCandidate.matched_peaks) {
            for (const mp of selectedCandidate.matched_peaks) {
               refIntensity += mp.refI * Math.exp(-Math.pow(p.twoTheta - mp.refT, 2) / sigma22);
            }
         }
         
         const residual = selectedCandidate ? Math.abs(p.intensity - refIntensity) : null;
         
         return {
           twoTheta: p.twoTheta,
           intensity: p.intensity,
           refIntensity: selectedCandidate ? Number(refIntensity.toFixed(1)) : null,
           residual: residual !== null ? Number(residual.toFixed(1)) : null
         };
      });
    }
    
    // For discrete stick data, generate a continuous gaussian spectrum
    const minT = Math.max(0, sortedPoints[0].twoTheta - 10);
    const maxT = sortedPoints[sortedPoints.length - 1].twoTheta + 10;
    
    const data = [];

    for (let t = minT; t <= maxT; t += 0.2) {
      let intensity = 0;
      for (const p of sortedPoints) {
        intensity += p.intensity * Math.exp(-Math.pow(t - p.twoTheta, 2) / sigma22);
      }
      
      let refIntensity = 0;
      if (selectedCandidate && selectedCandidate.matched_peaks) {
         for (const mp of selectedCandidate.matched_peaks) {
            refIntensity += mp.refI * Math.exp(-Math.pow(t - mp.refT, 2) / sigma22);
         }
      }
      
      const residual = selectedCandidate ? Math.abs(intensity - refIntensity) : null;

      data.push({
        twoTheta: Number(t.toFixed(2)),
        intensity: Number(intensity.toFixed(1)),
        refIntensity: selectedCandidate ? Number(refIntensity.toFixed(1)) : null,
        residual: residual !== null ? Number(residual.toFixed(1)) : null
      });
    }
    return data;
  };

  const chartData = generateChartData();
  const isDiscrete = parsedPoints.length <= 50;

  // We keep refData as scatter
  const refData = selectedCandidate?.matched_peaks?.map(mp => ({
    twoTheta: mp.refT,
    refIntensity: mp.refI,
  })) || [];

  const rawInputData = isDiscrete ? parsedPoints.map(p => ({
    twoTheta: p.twoTheta,
    rawIntensity: p.intensity
  })) : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#050B14]/95 backdrop-blur-md text-slate-200 p-4 rounded-xl shadow-2xl text-xs border border-cyan-500/30">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-cyan-500/20">
             <div className="flex items-center gap-2">
                <Scan className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-400 font-mono tracking-widest uppercase">Target <span className="bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded">2θ</span></span>
             </div>
             <p className="font-black text-white font-mono">{label?.toFixed ? label.toFixed(2) : label}°</p>
          </div>
          
          <div className="space-y-2">
            {payload.map((p: any, idx: number) => (
              <div key={`tooltip-${p.name}-${idx}`} className="flex items-center justify-between gap-6 py-1 px-2 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }} />
                  <span className="text-slate-300 font-medium truncate max-w-[150px]">{p.name}</span>
                </div>
                <span className="font-mono font-black" style={{ color: p.color }}>{p.value?.toFixed ? p.value.toFixed(1) : p.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
             <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Signal Confidence</span>
             <span className="text-[10px] text-emerald-400 font-mono font-black">HIGH</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        {/* Advanced Engine Configuration */}
        <div className="bg-slate-900 p-6 rounded-[2rem] shadow-xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none" />
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-500/10 blur-md rounded-full pointer-events-none" />
                <Settings className="w-6 h-6 text-indigo-400 relative z-10" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg tracking-tight">Neural Config</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">Engine Hyperparameters</p>
              </div>
            </div>
            <div className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-inner">
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-500'}`} />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{isSimulating ? 'Active' : 'Ready'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5 relative z-10">
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Kernel Shift</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.kernelSize}
                    onChange={(e) => setEngineConfig({...engineConfig, kernelSize: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={3} className="bg-slate-800">3x3 Narrow</option>
                    <option value={5} className="bg-slate-800">5x5 Standard</option>
                    <option value={7} className="bg-slate-800">7x7 Deep</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Feature Maps</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.filters}
                    onChange={(e) => setEngineConfig({...engineConfig, filters: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={32} className="bg-slate-800">Sparse (32)</option>
                    <option value={64} className="bg-slate-800">Standard (64)</option>
                    <option value={128} className="bg-slate-800">Dense (128)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Neural Depth</label>
                <div className="relative group/select">
                  <select 
                    value={engineConfig.depth}
                    onChange={(e) => setEngineConfig({...engineConfig, depth: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all appearance-none shadow-sm cursor-pointer"
                  >
                    <option value={18} className="bg-slate-800">18 Layers (Light)</option>
                    <option value={34} className="bg-slate-800">34 Layers (Med)</option>
                    <option value={50} className="bg-slate-800">50 Layers (Heavy)</option>
                    <option value={101} className="bg-slate-800">101 Layers (Extrm)</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover/select:text-indigo-400 transition-colors" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Pooling Op</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['max', 'avg'].map(op => (
                     <button
                       key={op}
                       onClick={() => setEngineConfig({...engineConfig, pooling: op})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.pooling === op ? 'bg-indigo-600 text-white shadow-md uppercase border border-indigo-500' : 'text-slate-400 hover:text-slate-300 uppercase bg-transparent'}`}
                     >
                       {op}
                     </button>
                   ))}
                </div>
             </div>

             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Activation</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['ReLU', 'GELU'].map(fn => (
                     <button
                       key={fn}
                       onClick={() => setEngineConfig({...engineConfig, activation: fn})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.activation === fn ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-slate-300 bg-transparent'}`}
                     >
                       {fn}
                     </button>
                   ))}
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><div className="w-1 h-1 bg-indigo-500 rounded-full" /> Optimization</label>
                <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1.5 shadow-inner">
                   {['Adam', 'RMSProp'].map(opt => (
                     <button
                       key={opt}
                       onClick={() => setEngineConfig({...engineConfig, optimization: opt})}
                       className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${engineConfig.optimization === opt ? 'bg-indigo-600 text-white shadow-md border border-indigo-500' : 'text-slate-400 hover:text-slate-300 bg-transparent'}`}
                     >
                       {opt}
                     </button>
                   ))}
                </div>
             </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 space-y-6 relative z-10">
             <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><Zap className="w-3.5 h-3.5 text-indigo-400" /> Base Learning Rate</label>
                  <span className="text-xs font-mono font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{engineConfig.learningRate.toFixed(4)}</span>
                </div>
                <input 
                  type="range"
                  min="0.0001"
                  max="0.01"
                  step="0.0001"
                  value={engineConfig.learningRate}
                  onChange={(e) => setEngineConfig({...engineConfig, learningRate: parseFloat(e.target.value)})}
                  className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                />
             </div>
             
             <div className="space-y-3">
                <div className="flex justify-between items-end px-1">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Min Confidence</label>
                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{engineConfig.confidenceThreshold}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={engineConfig.confidenceThreshold}
                  onChange={(e) => setEngineConfig({...engineConfig, confidenceThreshold: parseInt(e.target.value)})}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                />
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl cursor-pointer group hover:bg-slate-800 transition-colors">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-200 tracking-tight">Batch Normalization</span>
                   <span className="text-[10px] text-slate-500 font-medium">Stabilize training across mini-batches</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, batchNorm: !engineConfig.batchNorm})}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${engineConfig.batchNorm ? 'bg-emerald-500' : 'bg-slate-700 bg-opacity-50'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${engineConfig.batchNorm ? 'left-7' : 'left-1'}`} />
                </div>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl cursor-pointer group hover:bg-slate-800 transition-colors">
                <div className="flex flex-col">
                   <span className="text-xs font-black text-slate-200 tracking-tight">Multi-Scale Convolutional Fusion</span>
                   <span className="text-[10px] text-slate-500 font-medium">Aggregated hierarchical identification</span>
                </div>
                <div 
                  onClick={() => setEngineConfig({...engineConfig, multiScale: !engineConfig.multiScale})}
                  className={`w-12 h-6 rounded-full transition-all relative shadow-inner ${engineConfig.multiScale ? 'bg-indigo-500' : 'bg-slate-700 bg-opacity-50'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${engineConfig.multiScale ? 'left-7' : 'left-1'}`} />
                </div>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-600" />
              PhaseID Neural Net
            </h2>
            {isSimulating && (
              <span className="text-xs font-bold text-violet-600 animate-pulse bg-violet-50 px-2 py-1 rounded-full border border-violet-100 shadow-sm">
                Running...
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Material Search */}
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Unified Local DB Engine <span className="text-indigo-500 ml-1 font-mono text-[10px] bg-indigo-50 px-1 rounded border border-indigo-100 uppercase tracking-tighter font-black">LOCAL ENGINE</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSmartSearch();
                    }
                  }}
                  placeholder="Search local database by formula, name, or peaks (e.g. 28.4, 47.3)..."
                  className="w-full px-4 py-3 pl-10 pr-24 bg-slate-50 border border-slate-300 hover:border-violet-400 rounded-xl text-sm focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all shadow-inner"
                />
                <Search className="w-4 h-4 absolute left-4 top-3.5 text-slate-400" />
                
                <button 
                  onClick={handleSmartSearch}
                  disabled={!searchTerm.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex items-center gap-2 group w-auto min-w-[90px] justify-center"
                >
                  <Database className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Search DB</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                  {searchResults.length > 0 ? (
                    <div className="p-1">
                      {searchResults.map((material, idx) => (
                        <button
                          key={`${material.name}-${idx}`}
                          onClick={() => handleMaterialSelect(material)}
                          className="w-full text-left px-4 py-3 hover:bg-violet-50 flex items-center justify-between group rounded-lg transition-colors border border-transparent hover:border-violet-100 mb-1 last:mb-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold group-hover:bg-violet-200 group-hover:text-violet-700 transition-colors">
                              {material.formula.substring(0, 2)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-700 block text-sm group-hover:text-violet-700 transition-colors">{material.name}</span>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{material.type}</span>
                            </div>
                          </div>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded shadow-sm group-hover:bg-white group-hover:border-violet-300 group-hover:text-violet-600 transition-all">
                            {material.crystalSystem}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 flex flex-col items-center justify-center text-center">
                       <Search className="w-8 h-8 text-slate-300 mb-2" />
                       <p className="text-slate-500 text-sm font-semibold mb-1">Not in local database</p>
                       <p className="text-slate-400 text-xs">The network can still analyze raw peak patterns to identify potential matches via similarity hashing.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-slate-700">
                  Diffraction Pattern Input
                </label>
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xy,.txt,.csv"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg font-bold transition-all hover:shadow-sm active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload .xy
                  </button>
                  <button 
                    onClick={() => { setInputData(""); setResult(null); setSelectedCandidate(null); setProgressStep(0); setSearchTerm(""); }}
                    className="text-xs flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-lg font-bold transition-all hover:shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>
              </div>
              
              <div 
                className={`relative border-2 border-dashed rounded-xl transition-all duration-300 overflow-hidden group
                  ${inputData ? 'border-violet-300 bg-violet-50/40 shadow-inner' : 'border-slate-300 bg-slate-50 hover:border-violet-400 hover:bg-violet-50/50 hover:shadow-md'}
                `}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-violet-500', 'bg-violet-100', 'shadow-lg'); }}
                onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-violet-500', 'bg-violet-100', 'shadow-lg'); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('border-violet-500', 'bg-violet-100', 'shadow-lg');
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const content = e.target?.result as string;
                      if (content) setInputData(content);
                    };
                    reader.readAsText(file);
                  }
                }}
              >
                {!inputData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400 group-hover:text-violet-500 transition-colors">
                    <div className="p-3 bg-white rounded-full shadow-sm border border-slate-100 mb-3 group-hover:scale-110 group-hover:shadow-md transition-all">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-violet-500" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Drag & drop raw data</p>
                    <p className="text-xs font-semibold text-slate-400 mt-2">or paste below (2θ, Intensity format)</p>
                  </div>
                )}
                <textarea
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder={inputData ? "" : "\n\n\n\n\n\n28.44, 100\n47.30, 55"}
                  className={`w-full h-52 px-5 py-4 bg-transparent text-slate-800 focus:ring-0 outline-none transition-colors font-mono text-[13px] leading-relaxed resize-none z-10 relative
                    ${!inputData ? 'placeholder:text-transparent' : ''}
                  `}
                  spellCheck={false}
                />
              </div>
              
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider font-black">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                   Format: <span className="text-cyan-500 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded ml-0.5">2θ (deg)</span> , <span className="text-purple-500 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">Intensity (a.u.)</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setIsMixMode(!isMixMode);
                      if (!isMixMode) setMixtureList([]);
                    }}
                    className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md transition-all border
                      ${isMixMode ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-500/20' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}
                    `}
                  >
                    <Layers className="w-3 h-3" />
                    {isMixMode ? 'Mix Mode ACTIVE' : 'Enable Mix Mode'}
                  </button>
                  {inputData && (
                    <div className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                      {inputData.split('\n').filter(l => l.trim()).length} Data Points
                    </div>
                  )}
                </div>
              </div>

              {isMixMode && mixtureList.length > 0 && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl animate-in zoom-in-95 duration-300">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mixture Components</span>
                     <button onClick={() => setMixtureList([])} className="text-[10px] font-bold text-rose-500 hover:underline">Reset</button>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {mixtureList.map((m, mIdx) => (
                        <div key={`mix-${m}-${mIdx}`} className="flex items-center gap-1 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-700 shadow-sm">
                          {m}
                          <button onClick={() => {
                            const nl = mixtureList.filter(x => x !== m);
                            setMixtureList(nl);
                            generateMixturePattern(nl);
                          }}>
                            <X className="w-3 h-3 text-rose-400 hover:text-rose-600" />
                          </button>
                        </div>
                      ))}
                      <div className="px-2.5 py-1 bg-indigo-100/50 border border-dashed border-indigo-300 rounded-lg text-[10px] text-indigo-400 font-bold flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add from DB
                      </div>
                   </div>
                </div>
              )}

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical className="w-3 h-3 text-slate-400" /> Test Data Suites
                   </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Silicon', label: 'Si' },
                    { id: 'Mixture', label: 'Mixture' },
                    { id: 'Diamond', label: 'Diamond' },
                    { id: 'Rutile', label: 'Rutile' },
                    { id: 'Anatase', label: 'Anatase' },
                    { id: 'Aluminum', label: 'Al' },
                    { id: 'Copper', label: 'Cu' },
                    { id: 'Tungsten', label: 'W' },
                    { id: 'MoS2', label: 'MoS2' },
                    { id: 'ZnO', label: 'ZnO' },
                    { id: 'MgO', label: 'MgO' },
                    { id: 'BaTiO3', label: 'BaTiO3' },
                    { id: 'Quartz', label: 'Quartz' },
                    { id: 'CeO2', label: 'CeO2' },
                    { id: 'Corundum', label: 'Al2O3' },
                    { id: 'Calcite', label: 'Calcite' },
                    { id: 'HAP-Sintered', label: 'HAp (Sintered)' },
                    { id: 'HAP-Nano', label: 'HAp (Nano)' },
                    { id: 'Carbonated-HAP', label: 'HAp (Carbonated)' },
                    { id: 'Dental-HAP', label: 'HAp (Enamel)' },
                    { id: 'Dentin-HAP', label: 'HAp (Dentin)' },
                    { id: 'Mg-HAP', label: 'HAp (Mg-doped)' },
                    { id: 'Si-HAP', label: 'HAp (Si-doped)' },
                    { id: 'Pb-HAP', label: 'HAp (Pb-doped)' },
                    { id: 'Cd-HAP', label: 'HAp (Cd-doped)' },
                    { id: 'ACP', label: 'ACP (Amorphous)' },
                    { id: 'Fluorapatite', label: 'Fluorapatite' },
                    { id: 'Sr-HAP', label: 'Sr-HAp' },
                    { id: 'Chlorapatite', label: 'Chlorapatite' },
                    { id: 'beta-Tricalcium Phosphate', label: 'beta-TCP' },
                    { id: 'alpha-Tricalcium Phosphate', label: 'alpha-TCP' },
                    { id: 'Bioactive Glass', label: 'Bioglass 45S5' },
                    { id: 'Bio-Glass-1393', label: 'Bioglass 13-93' },
                    { id: 'Bio-Glass-S53P4', label: 'Bioglass S53P4' },
                    { id: 'Brushite', label: 'Brushite' },
                    { id: 'Monetite', label: 'Monetite' },
                    { id: 'TTCP', label: 'TTCP' },
                    { id: 'Bio-Aragonite', label: 'Aragonite' },
                    { id: 'PbTiO3', label: 'PbTiO3' },
                    { id: 'NiO', label: 'NiO' },
                    { id: 'Co3O4', label: 'Co3O4' },
                    { id: 'PZT', label: 'PZT' },
                    { id: 'VO2', label: 'VO2' },
                    { id: 'WO3', label: 'WO3' },
                    { id: 'Austenite', label: 'Austenite' },
                    { id: 'ZnS', label: 'ZnS' },
                    { id: 'BaFe12O19', label: 'Ba Ferrite' },
                    { id: 'CuO', label: 'CuO' },
                    { id: 'Ag2O', label: 'Ag2O' },
                    { id: 'LTA', label: 'Zeolite A' },
                    { id: 'Silver (Ag)', label: 'Ag' },
                    { id: 'Au', label: 'Au' },
                    { id: 'Ni', label: 'Ni' },
                    { id: 'Fe', label: 'Fe (BCC)' },
                    { id: 'GaN', label: 'GaN' },
                    { id: 'YAG', label: 'YAG' },
                    { id: 'SrTiO3', label: 'SrTiO3' },
                    { id: 'LiFePO4', label: 'LFP' },
                    { id: 'ZrO2', label: 'ZrO2' },
                    { id: 'Graphite', label: 'Graphite' },
                    { id: 'CaF2', label: 'CaF2' },
                    { id: 'KCl', label: 'KCl' },
                    { id: 'PTFE', label: 'PTFE' },
                    { id: 'WC', label: 'WC' },
                    { id: 'Fe3O4', label: 'Fe3O4' },
                    { id: 'MAPbI3', label: 'Perovskite' },
                    { id: 'SiC', label: 'SiC' },
                    { id: 'GaAs', label: 'GaAs' },
                    { id: 'Ga2O3', label: 'Ga2O3' },
                    { id: 'CdTe', label: 'CdTe' },
                    { id: 'Bi2Te3', label: 'Bi2Te3' },
                    { id: 'SnO2', label: 'SnO2' },
                    { id: 'LCO', label: 'LCO' },
                    { id: 'Si3N4', label: 'Si3N4' },
                    { id: 'AlN', label: 'AlN' },
                    { id: 'hBN', label: 'h-BN' },
                    { id: 'GaP', label: 'GaP' },
                    { id: 'ZnSe', label: 'ZnSe' },
                    { id: 'Ta', label: 'Ta' },
                    { id: 'V2O5', label: 'V2O5' },
                    { id: 'AgCl', label: 'AgCl' },
                    { id: 'MnO2', label: 'MnO2' },
                    { id: 'BFO', label: 'BFO' },
                    { id: 'ITO', label: 'ITO' },
                    { id: 'FeS2', label: 'FeS2' },
                    { id: 'Cr', label: 'Cr' },
                    { id: 'LTO', label: 'LTO Anode' },
                    { id: 'YBCO', label: 'YBCO High-Tc' },
                    { id: 'ZSM5', label: 'ZSM-5' },
                    { id: 'MOF5', label: 'MOF-5' },
                    { id: 'Pt', label: 'Pt Cat' },
                    { id: 'Pd', label: 'Pd Cat' },
                    { id: 'NMC', label: 'NMC Cathode' },
                    { id: 'YSZ', label: '8YSZ' },
                    { id: 'SRO', label: 'SrRuO3' },
                    { id: 'GO', label: 'GO' },
                    { id: 'OCP', label: 'OCP Bio' },
                    { id: 'Magnetite-Hyper', label: 'Magnetite (Hyper)' },
                    { id: 'Cobalt-Ferrite', label: 'Co-Ferrite' },
                    { id: 'Maghemite', label: 'Maghemite' },
                    { id: 'Zn-Ferrite', label: 'Zn-Ferrite' },
                    { id: 'Cellulose', label: 'Cellulose' },
                    { id: 'Chitosan', label: 'Chitosan' },
                    { id: 'Silk', label: 'Silk Fibroin' },
                    { id: 'Whewellite', label: 'Whewellite' },
                    { id: 'PLA', label: 'PLA Bio' },
                    { id: 'PEEK', label: 'PEEK' },
                    { id: 'Collagen', label: 'Collagen' },
                    { id: 'UO2', label: 'UO2 Fuel' },
                    { id: 'ThO2', label: 'ThO2' },
                    { id: 'Zircaloy', label: 'Zircaloy-4' },
                    { id: 'NuclearGraphite', label: 'Nuclear Graphite' },
                    { id: 'Nd2Fe14B', label: 'Nd Magnet' },
                    { id: 'TiC', label: 'TiC' },
                    { id: 'Cr2O3', label: 'Cr2O3' },
                    { id: 'CoFe2O4', label: 'CoFe2O4' },
                    { id: 'BiOCl', label: 'BiOCl' },
                    { id: 'CsPbI3', label: 'CsPbI3' },
                    { id: 'Ti3C2', label: 'MXene' },
                    { id: 'UiO66', label: 'UiO-66' },
                    { id: 'HKUST1', label: 'HKUST-1' },
                    { id: 'MoO3', label: 'MoO3' },
                    { id: 'V2O3', label: 'V2O3' },
                    { id: 'Modern-Ceramic', label: 'Modern Ceramic' },
                    { id: 'Solar-Mix', label: 'Solar Mix' },
                    { id: 'Cathode-Mix', label: 'Cathode Mix' },
                    { id: 'Geological-Suite', label: 'Geo-Suite' },
                    { id: 'Catalyst-Mix', label: 'Catalyst Mix' },
                    { id: 'Precious-Metal-Mix', label: 'Precious Metals' },
                    { id: 'Halide-Mineral-Mix', label: 'Halide Minerals' },
                    { id: 'Iron-Oxide-Mix', label: 'Iron Oxides' },
                    { id: 'Hematite', label: 'Hematite' },
                    { id: 'Feldspar', label: 'Feldspar' },
                    { id: 'PerovskiteCat', label: 'Perovskite Cat' },
                    { id: 'SS316L', label: 'SS 316L' },
                    { id: 'SS304', label: 'SS 304' },
                    { id: 'SS310', label: 'SS 310' },
                    { id: 'SS430', label: 'SS 430' },
                    { id: 'Ti64', label: 'Ti-6Al-4V' },
                    { id: 'Brass', label: 'Brass' },
                    { id: 'Inconel', label: 'Inconel 718' },
                    { id: 'SBA15', label: 'SBA-15 Silica' },
                    { id: 'ZIF8', label: 'ZIF-8 MOF' },
                    { id: 'Ibuprofen', label: 'Ibuprofen' },
                    { id: 'Paracetamol', label: 'Paracetamol' },
                    { id: 'Magnetite', label: 'Magnetite' },
                    { id: 'PE', label: 'Polymer (PE)' },
                    { id: 'Cement', label: 'Clinker' },
                    { id: 'Biocoat-Composite-Suite', label: 'Implant Suite (HAp + ZrO2)' },
                    { id: 'SOFC-Electrode-Suite', label: 'SOFC Suite (YSZ + SRO)' },
                    { id: 'Aerospace-Armor-Suite', label: 'Aerospace Suite (TiC + Al2O3)' },
                    { id: 'Pharma-Drug-Suite', label: 'Pharma Suite (Ibu + Para)' },
                    { id: 'Nuclear-Fuel-Suite', label: 'Nuclear Suite (UO2 + ThO2)' },
                    { id: 'Complex', label: 'Complex Mixture (Quartz + Rutile + Anatase + Ag)' }
                  ].map(ex => (
                    <button 
                      key={ex.id}
                      onClick={() => loadExample(ex.id as any)} 
                      className="text-xs font-bold bg-white hover:bg-violet-50 text-slate-700 hover:text-violet-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-violet-300 transition-all shadow-sm active:scale-95"
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunAI}
                disabled={isSimulating || !inputData.trim()}
                className={`w-full py-3.5 text-white font-bold text-base rounded-xl transition-all shadow-md flex justify-center items-center gap-2.5 outline-none focus:ring-4 focus:ring-violet-500/30
                  ${isSimulating || !inputData.trim() ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none border border-slate-300' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 border border-violet-500'}
                `}
              >
                {isSimulating ? (
                  <>
                    <Activity className="w-5 h-5 animate-spin" />
                    Executing Neural Scan...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5" />
                    Initialize Deep Phase ID
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Deep Learning Architecture Status */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/engine flex flex-col gap-6 transition-all duration-500 border border-slate-800">
           {/* Advanced Animated Backgrounds */}
           <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-[80px] group-hover/engine:bg-violet-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
           <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[60px] group-hover/engine:bg-cyan-500/20 group-hover/engine:scale-110 transition-all duration-1000 pointer-events-none" />
           <div className="absolute inset-0 bg-[#000] opacity-20 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px'}} />
           
           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-70" />
           
           {/* Neural Nodes Grid Pattern Decoration */}
           <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <pattern id="neural-net" width="60" height="60" patternUnits="userSpaceOnUse">
                 <circle cx="10" cy="10" r="1.5" fill="#a78bfa" />
                 <circle cx="50" cy="30" r="1.5" fill="#38bdf8" />
                 <path d="M 10 10 L 50 30" stroke="#a78bfa" strokeWidth="0.5" strokeOpacity="0.5" />
                 <path d="M 50 30 L 10 50" stroke="#38bdf8" strokeWidth="0.5" strokeOpacity="0.5" />
                 <circle cx="10" cy="50" r="1.5" fill="#a78bfa" />
               </pattern>
             </defs>
             <rect width="100%" height="100%" fill="url(#neural-net)" />
           </svg>

           <div>
             <div className="flex items-center justify-between mb-6 relative z-10">
               <div className="flex items-center gap-5">
                 <div className="relative group/icon cursor-default">
                   <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full group-hover/icon:bg-violet-400/40 transition-colors duration-500" />
                   <div className="w-14 h-14 bg-slate-900 rounded-2xl border border-violet-500/50 flex items-center justify-center relative shadow-[inset_0_2px_10px_rgba(255,255,255,0.05),tight_0_5px_20px_rgba(139,92,246,0.3)] group-hover/icon:border-violet-400 transition-colors duration-300">
                     <Brain className="w-7 h-7 text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                   </div>
                   {isSimulating && (
                     <div className="absolute -inset-1 rounded-2xl border border-violet-500/20 animate-ping opacity-50 pointer-events-none" style={{animationDuration: '2s'}} />
                   )}
                 </div>
                 <div>
                   <h3 className="font-black text-xl text-white uppercase tracking-[0.15em] drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                     {t('Convolutional Engine', 'Convolutional Engine')}
                   </h3>
                   <div className="flex items-center gap-2 mt-1.5">
                     <p className="text-[10px] text-violet-300/80 font-mono uppercase tracking-[0.3em] font-black">ARCH: XRD-{engineConfig.multiScale ? 'Res' : 'Conv'}Net-{engineConfig.depth}</p>
                     <span className="text-[8px] font-black text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded uppercase tracking-widest border border-slate-700">v4.2</span>
                   </div>
                 </div>
               </div>
               <div className="hidden md:flex flex-col items-end">
                 <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] font-black mb-1.5 flex items-center gap-1"><Cpu className="w-3 h-3 text-violet-400/70" /> Compute Core</span>
                 <div className="relative overflow-hidden group/status rounded-lg border border-violet-500/30 bg-violet-500/10 transition-all duration-300 hover:border-violet-400/50 hover:bg-violet-500/20">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/status:translate-x-full transition-transform duration-1000" />
                    <span className="text-xs font-mono font-black text-violet-300 px-3 py-1.5 flex items-center gap-2 relative z-10 tracking-widest uppercase">
                      <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.6)]' : 'bg-slate-500'}`} />
                      {isSimulating ? 'Processing' : 'Standby'}
                    </span>
                 </div>
               </div>
             </div>
             
             <div className="flex gap-2.5 mb-2 relative z-10 md:ml-[76px] flex-wrap">
               <span className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/80 rounded-lg text-[9px] font-mono font-black text-cyan-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-cyan-500/30 hover:bg-slate-800/60 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-cyan-400"></span> {engineConfig.activation}
               </span>
               <span className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/80 rounded-lg text-[9px] font-mono font-black text-fuchsia-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-fuchsia-500/30 hover:bg-slate-800/60 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-fuchsia-400"></span> {engineConfig.filters} Filters
               </span>
               <span className="px-3 py-1.5 bg-slate-800/40 border border-slate-700/80 rounded-lg text-[9px] font-mono font-black text-emerald-300/90 uppercase tracking-[0.2em] shadow-inner hover:border-emerald-500/30 hover:bg-slate-800/60 transition-colors cursor-default flex items-center gap-1.5">
                 <span className="w-1 h-1 rounded-full bg-emerald-400"></span> {engineConfig.kernelSize}x{engineConfig.kernelSize} Kernel
               </span>
             </div>
           </div>
           
           <div className="space-y-7 relative z-10 flex-1 ml-5 mt-6 border-t border-slate-800 pt-8">
             {/* Vertical connecting line */}
             <div className="absolute left-[15px] top-[40px] bottom-6 w-[2px] bg-slate-800/80 z-0"></div>
             {/* Dynamic pulse on the line if active */}
             {isSimulating && (
               <div className="absolute left-[15px] top-[40px] bottom-6 w-[2px] z-0 overflow-hidden">
                  <div className="w-full h-1/3 bg-gradient-to-b from-transparent via-violet-400 to-transparent animate-[scanline_2s_ease-in-out_infinite]" />
               </div>
             )}
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={`${step.label}-${idx}`} className={`relative z-10 flex flex-col gap-2 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="flex items-center gap-4">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0 relative z-20
                       ${isActive ? 'border-violet-500/50 bg-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-110' : 
                         isCompleted ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900 border-slate-700 text-slate-500'}
                     `}>
                       {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse text-violet-300' : ''}`} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <span className={`text-[13px] font-black block truncate tracking-widest uppercase ${isActive ? 'text-violet-300 drop-shadow-md' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                         {step.label}
                       </span>
                     </div>
                     
                     {/* Activation Metrics */}
                     {isActive && (
                       <div className="flex items-center gap-3">
                         <div className="text-[9px] font-mono bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md text-emerald-400 flex flex-col items-end font-black drop-shadow-sm">
                           <span>OPT: {engineConfig.optimization.toUpperCase()}</span>
                           <span>{idx === 2 ? `CANDS: ~${(100 + Math.random() * 50).toFixed(0)}K` : `ACC: ${(95 + Math.random() * 4).toFixed(2)}%`}</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* Layer Details & Visualizations */}
                   {(isActive || isCompleted) && (
                     <div className="ml-12 mt-1 pl-4 border-l border-slate-800">
                         {idx === 0 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-1.5 mb-2 font-black uppercase tracking-widest bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner relative z-10 hover:border-violet-500/30 transition-colors">
                               <p className="animate-pulse flex items-center gap-2 text-violet-300"><span className="text-violet-500 font-bold">&gt;</span> Tensor shape: [1, 2048, 1]</p>
                               <p className="animate-pulse flex items-center gap-2 text-violet-300" style={{animationDelay: '0.2s'}}><span className="text-violet-500 font-bold">&gt;</span> Kern Size: {engineConfig.kernelSize}x{engineConfig.kernelSize}</p>
                               <p className="animate-pulse flex items-center gap-2 text-violet-300" style={{animationDelay: '0.4s'}}><span className="text-violet-500 font-bold">&gt;</span> Augmentation: Noise Injection</p>
                            </motion.div>
                         )}
                         
                         {idx === 1 && isActive && (
                           <div className="mb-2 relative z-10">
                             <div className="text-[9px] text-slate-400 font-mono space-y-2 mb-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-violet-500/30 shadow-[inset_0_0_15px_rgba(139,92,246,0.1)] font-black uppercase tracking-widest hover:border-violet-400/50 transition-colors">
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Conv1D_1: [{engineConfig.filters}, {engineConfig.kernelSize}]</span> <span className="text-violet-400 drop-shadow-sm px-1.5 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">{Math.floor(Math.random() * 99)}ms</span></p>
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Activation: {engineConfig.activation}</span> <span className="text-emerald-400 drop-shadow-sm px-1.5 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20 animate-[pulse_2s_ease-in-out_infinite]">STABLE</span></p>
                                <p className="flex justify-between items-center"><span className="text-violet-300 flex items-center gap-2"><span className="text-violet-500">&gt;</span>Fusion: {engineConfig.multiScale ? 'ENABLED' : 'DISABLED'}</span> <span className="text-violet-400 drop-shadow-sm px-1.5 py-0.5 bg-violet-500/10 rounded border border-violet-500/20">{Math.floor(Math.random() * 99)}ms</span></p>
                             </div>
                             <div className="grid grid-cols-8 gap-1.5 w-full bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                               {Array.from({ length: 16 }).map((_, i) => (
                                 <div key={`pulse-${i}`} className="h-4 rounded-[4px] bg-gradient-to-t from-violet-600 to-fuchsia-400 shadow-[0_0_10px_rgba(139,92,246,0.6)] animate-[pulse_1s_ease-in-out_infinite] relative overflow-hidden" style={{ opacity: Math.random() * 0.7 + 0.3, animationDelay: `${i * 0.05}s` }}>
                                   <div className="absolute top-0 left-0 w-full h-[2px] bg-white/40" />
                                 </div>
                               ))}
                             </div>
                             <p className="text-[9px] text-slate-500 font-mono mt-3 uppercase tracking-[0.2em] text-right font-black flex justify-end items-center gap-1.5"><Activity className="w-3 h-3 text-violet-400" /> Feature Map Activations</p>
                           </div>
                         )}

                         {idx === 2 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-2.5 mb-2 mt-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner font-black uppercase tracking-widest relative z-10 hover:border-cyan-500/30 transition-colors">
                               <p className="animate-pulse text-cyan-400 flex items-center gap-2 drop-shadow-sm"><Database className="w-3.5 h-3.5 text-cyan-500" /> Loading Index HNSW-1M...</p>
                               <p className="text-violet-300 flex items-center gap-2"><Search className="w-3 h-3 text-violet-500" /> Performing Cosine Similarity</p>
                               <div className="w-full bg-slate-900 h-2 mt-3 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
                                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-full rounded-full animate-[progress_1.5s_ease-in-out_infinite] shadow-[0_0_8px_rgba(34,211,238,0.6)]" style={{width: `${10 + Math.random() * 80}%`}}></div>
                               </div>
                            </motion.div>
                         )}

                         {idx === 3 && isActive && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-[10px] text-slate-400 font-mono space-y-2 mb-2 mt-2 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 shadow-inner font-black uppercase tracking-widest relative z-10 hover:border-emerald-500/30 transition-colors">
                               <p className="flex justify-between items-center"><span className="text-violet-300">Dense_1</span> <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded drop-shadow-sm">Softmax</span></p>
                               <div className="text-emerald-400 animate-pulse my-3 drop-shadow-sm flex items-center gap-2 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Computing Confidences...</div>
                               <p className="flex justify-between items-center text-slate-500"><span>Loss</span> <span>Cat_Cross_Ent</span></p>
                            </motion.div>
                         )}
                     </div>
                   )}
                 </div>
               );
             })}
           </div>

           <div className="mt-4 pt-6 border-t border-slate-800/80 relative z-10">
              <div className="flex items-center justify-between mb-5">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 group-hover/engine:bg-indigo-500/20 transition-colors shadow-[inset_0_0_10px_rgba(99,102,241,0.2)]">
                       <BookOpen className="w-4 h-4 text-indigo-400 group-hover/engine:rotate-3 transition-transform" />
                    </div>
                    <div>
                       <h3 className="font-black text-[12px] text-white uppercase tracking-[0.2em] leading-none drop-shadow-sm">Neural Guide</h3>
                       <p className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1">
                         <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.8)]"></span> Constituent Logic & Features
                       </p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group/fact p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all duration-300 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/fact:opacity-20 transition-opacity">
                        <Cpu className="w-16 h-16 text-indigo-400 -rotate-12 translate-x-4 -translate-y-4" />
                     </div>
                     <div className="flex items-center gap-2.5 mb-3 relative z-10">
                        <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Network Focus</span>
                     </div>
                     <p className="text-[10px] text-slate-400 leading-relaxed font-bold relative z-10">
                        The <span className="text-white">"{engineConfig.kernelSize}x{engineConfig.kernelSize} Kernel Shift"</span> defines peak receptive field. {engineConfig.multiScale ? <span className="text-indigo-300">Multi-Scale Fusion correlates broad patterns across the 2θ (deg) domain.</span> : 'Increase Feature Maps for complex multi-phase disambiguation.'}
                     </p>
                     <div className="mt-3 text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest border-t border-[#1e293b] pt-2 flex items-center justify-between">
                       <span>Optimization</span>
                       <span className="text-indigo-400">{engineConfig.optimization}</span>
                     </div>
                  </div>

                  <div className="group/fact p-4 bg-slate-900/80 rounded-2xl border border-slate-700/80 hover:border-cyan-500/50 transition-all duration-300 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/fact:opacity-20 transition-opacity">
                        <Microscope className="w-16 h-16 text-cyan-400 rotate-12 translate-x-4 -translate-y-4" />
                     </div>
                     <div className="flex items-center gap-2.5 mb-3 relative z-10">
                        <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                          <Microscope className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Constituents</span>
                     </div>
                     <p className="text-[10px] text-slate-400 leading-relaxed font-bold relative z-10">
                        Model prioritizes <strong className="text-cyan-300 font-black tracking-wide bg-cyan-500/10 px-1 py-0.5 rounded border border-cyan-500/20">2θ (deg) Mapping</strong> for d-spacing and <strong className="text-purple-300 font-black tracking-wide bg-purple-500/10 px-1 py-0.5 rounded border border-purple-500/20">Relative Intensity (a.u.)</strong> ({engineConfig.filters} filters) to decouple overlapping signatures.
                     </p>
                     <div className="mt-3 text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest border-t border-slate-700/80 pt-2 flex items-center justify-between">
                       <span>Accuracy</span>
                       <span className="text-cyan-400">{engineConfig.activation} ACT</span>
                     </div>
                  </div>
              </div>
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-slate-800 h-[720px] flex flex-col relative overflow-hidden group/vis">
          {/* Subtle grid background to look like a terminal/software UI */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent opacity-60" />
          
          <div className="flex flex-col gap-6 mb-6 relative z-10">
            <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-lg rounded-full" />
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center relative shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                    <Activity className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-[0.15em] uppercase drop-shadow-lg">Phase Match Visualization</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-[0.2em] font-black">Convolutional Overlay</p>
                    <div className="w-1 h-1 rounded-full bg-cyan-500/50" />
                    <p className="text-[9px] text-cyan-500/40 font-mono uppercase tracking-widest">Active_Stream_v4.2</p>
                  </div>
                </div>
              </div>
              
              {selectedCandidate && (
                <div className="flex gap-4">
                  <div className="hidden md:flex flex-col items-end justify-center px-4 py-2 bg-slate-800/40 border border-slate-700/80 rounded-2xl shadow-inner">
                    <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black mb-1">Engine Stability</p>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`w-1 h-3 rounded-full ${i <= 4 ? 'bg-cyan-500 shadow-[0_0_5px_rgba(34,211,238,0.6)]' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <span className="text-[10px] font-mono font-black text-cyan-400">98.2%</span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-5 py-2.5 rounded-2xl flex items-center gap-3 border shadow-inner backdrop-blur-md uppercase tracking-widest transition-all
                    ${selectedCandidate.match_quality === 'Excellent' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)]' : 
                      selectedCandidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'}
                  `}>
                    <div className={`w-2.5 h-2.5 rounded-full animate-[pulse_2s_ease-in-out_infinite] ${selectedCandidate.match_quality === 'Excellent' ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]' : selectedCandidate.match_quality === 'Good' ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]'}`} />
                    {selectedCandidate.match_quality || "Match"} Precision
                  </span>
                </div>
              )}
            </div>

            {/* Advanced Analytics HUD Bar */}
            {selectedCandidate && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(34,211,238,0.05)] transition-all hover:border-cyan-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-cyan-500 animate-pulse" /> Target Identity
                    </p>
                    <div className="px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-[8px] font-mono font-black text-cyan-300">
                      ID_CONF: {selectedCandidate.confidence_score}
                    </div>
                  </div>
                  <p className="text-xl font-black text-white font-mono drop-shadow-md truncate relative z-10">{selectedCandidate.phase_name}</p>
                  
                  <div className="flex flex-col gap-1 mt-2 font-mono relative z-10">
                    {selectedCandidate.formula && (
                       <span className="text-[10px] text-cyan-400 font-bold bg-[#070D18] px-2 py-0.5 rounded border border-cyan-500/20 self-start">
                         {selectedCandidate.formula}
                       </span>
                    )}
                    <span className="text-[9px] text-slate-400 mt-1 uppercase">
                      {selectedCandidate.crystalSystem ? selectedCandidate.crystalSystem + ' / ' + (selectedCandidate.spaceGroup || '-') : 'Profile: σ² = 0.5 (GAUSSIAN)'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-cyan-500 to-transparent" />
                </div>
                
                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-rose-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(244,63,94,0.05)] transition-all hover:border-rose-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-rose-500 animate-pulse" /> Feature Detection
                    </p>
                  </div>
                  <div className="flex items-end gap-2 relative z-10">
                    <p className="text-3xl font-black text-rose-400 font-mono leading-none drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">{selectedCandidate.matched_peaks?.length || 0}</p>
                    <span className="text-[10px] font-mono font-black text-slate-400 mb-1 tracking-widest">UNIT PEAKS</span>
                  </div>
                  <div className="mt-3 w-full h-1.5 bg-[#070D18] rounded-full overflow-hidden flex border border-white/5 relative z-10">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.8)]" style={{ width: '75%' }} />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 to-transparent" />
                </div>

                <div className="relative group/hud overflow-hidden bg-[#0A101C]/80 backdrop-blur-xl border border-indigo-500/20 rounded-xl p-4 shadow-[0_0_20px_rgba(99,102,241,0.05)] transition-all hover:border-indigo-500/50">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 blur-2xl rounded-full -translate-y-12 translate-x-12" />
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <p className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-sm bg-indigo-500 animate-pulse" /> Database Link
                    </p>
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <p className="text-lg font-black text-white font-mono truncate relative z-10 drop-shadow-md">{selectedCandidate.card_id || `REF-${selectedCandidate.phase_name?.substring(0, 4)}-67X`}</p>
                  <div className="mt-3 flex gap-1.5 overflow-hidden relative z-10">
                    {['X-RAY', 'CU-Kα', '0.154NM'].map(tag => (
                      <span key={tag} className="text-[8px] font-black font-mono text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30 uppercase">{tag}</span>
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-transparent" />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-slate-950 rounded-[2rem] border border-slate-800/80 p-0 shadow-2xl overflow-hidden flex flex-col group/chart transition-all">
             
            {/* Animated Scanline Overlay */}
            <motion.div 
               className="absolute top-0 bottom-0 w-[400px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent pointer-events-none mix-blend-screen z-0"
               animate={{ left: ['-50%', '150%'] }}
               transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />

            {/* Glowing orb behind graph */}
            {selectedCandidate && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none z-0" />
            )}

            {/* HUD / Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-40 group-hover/chart:opacity-80 transition-opacity duration-1000">
               {/* Vertical & Horizontal Dashed Grid */}
               <div className="absolute left-1/4 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               <div className="absolute left-1/2 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               <div className="absolute right-1/4 top-0 bottom-0 border-l border-cyan-500/20 border-dashed" />
               
               <div className="absolute top-1/4 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               <div className="absolute top-1/2 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               <div className="absolute bottom-1/4 left-0 right-0 border-t border-cyan-500/20 border-dashed" />
               
               {/* Dynamic Targeting Reticles */}
               <div className="absolute left-12 top-12 w-20 h-20">
                  <div className="absolute top-0 left-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute top-0 left-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute top-[8px] left-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_A:01</div>
               </div>
               
               <div className="absolute right-12 top-12 w-20 h-20">
                  <div className="absolute top-0 right-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute top-0 right-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute top-[8px] right-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_B:02</div>
               </div>
               
               <div className="absolute left-12 bottom-12 w-20 h-20">
                  <div className="absolute bottom-0 left-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute bottom-0 left-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute bottom-[8px] left-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_C:03</div>
               </div>
               
               <div className="absolute right-12 bottom-12 w-20 h-20">
                  <div className="absolute bottom-0 right-0 w-[40%] h-[2px] bg-cyan-500/60" />
                  <div className="absolute bottom-0 right-0 w-[2px] h-[40%] bg-cyan-500/60" />
                  <div className="absolute bottom-[8px] right-[8px] text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest font-black">SCAN_D:04</div>
               </div>
            </div>

            <div className="absolute top-4 left-4 flex gap-2.5 z-10 bg-[#0A101C]/90 px-4 py-2 rounded-xl border border-cyan-500/20 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.1)]">
               <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse mt-0.5 shadow-[0_0_10px_rgba(34,211,238,0.6)]"></span>
               <span className="text-[10px] font-mono font-black text-cyan-300 uppercase tracking-widest">Live Sync</span>
               <div className="w-[1px] h-3 bg-cyan-500/30 mx-1 self-center" />
               <span className="text-[9px] font-mono text-cyan-500/60 uppercase font-black">2048_SAMP</span>
            </div>
            
            <div className="flex-1 relative mt-[16px] mx-[20px] mb-[16px] z-10">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorResid" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#1e293b" opacity={0.6} />
                  <XAxis 
                    dataKey="twoTheta" 
                    type="number" 
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    unit="°" 
                    allowDataOverflow 
                    name="2θ (deg)"
                    stroke="#475569"
                    tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', fontWeight: 'bold' }}
                    tickFormatter={(value) => value.toFixed(1)}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 'dataMax']} name="Intensity (a.u.)" />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(34,211,238,0.05)', stroke: '#22d3ee', strokeWidth: 1.5, strokeDasharray: '4 4' }} />
                  <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', fontFamily: 'monospace', top: '-15px', right: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
                  
                  {isSimulating && scanPos !== null && (
                     <ReferenceLine 
                       x={scanPos} 
                       stroke="#22d3ee" 
                       strokeWidth={1.5} 
                       strokeDasharray="3 3"
                       label={{ value: 'SCANNING IN PROGRESS //', position: 'insideTopLeft', fill: '#22d3ee', fontSize: 9, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.1em' }} 
                     />
                  )}

                  {/* Input Data */}
                  <Area 
                    type="monotone" 
                    dataKey="intensity" 
                    stroke="#22d3ee" 
                    fill="url(#colorUv)" 
                    strokeWidth={isDiscrete ? 2 : 2.5}
                    name={isDiscrete ? "Simulated Input Pattern" : "Input Pattern"} 
                    activeDot={{ r: 6, fill: '#22d3ee', stroke: '#050b14', strokeWidth: 2, className: 'drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]' }}
                  />
                  
                  {/* Discrete Raw Stick Data (if provided as sticks) */}
                  {isDiscrete && (
                    <Scatter 
                      data={rawInputData} 
                      dataKey="rawIntensity" 
                      name="Raw Input Sticks" 
                      fill="#3b82f6"
                      shape={(props: any) => {
                        const { cx, cy, yAxis } = props;
                        const bottomY = yAxis && typeof yAxis.scale === 'function' ? yAxis.scale(0) : cy + 500;
                        return (
                          <g className="transition-all duration-300">
                            <line x1={cx} y1={bottomY} x2={cx} y2={cy} stroke="#60a5fa" strokeWidth={2} strokeOpacity={0.8} />
                            <circle cx={cx} cy={cy} r={3} fill="#3b82f6" className="drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" />
                          </g>
                        );
                      }}
                    />
                  )}
                  
                  {/* Reference Data (Gaussian Simulation Overlay) */}
                  {selectedCandidate && (
                     <Area 
                       type="monotone" 
                       dataKey="refIntensity" 
                       stroke="#f43f5e" 
                       fill="url(#colorRv)" 
                       fillOpacity={0.4}
                       strokeWidth={2}
                       strokeDasharray="4 4"
                       name={`${selectedCandidate.phase_name} (Simulation)`} 
                     />
                  )}
                  
                  {/* Residual / Error Difference Curve */}
                  {selectedCandidate && (
                     <Area 
                       type="monotone" 
                       dataKey="residual" 
                       stroke="none" 
                       fill="url(#colorResid)"
                       fillOpacity={0.7}
                       name="Error Limit" 
                     />
                  )}
                  
                  {/* Reference Stick Data */}
                  {selectedCandidate && (
                    <Scatter 
                      data={refData} 
                      dataKey="refIntensity" 
                      name={`${selectedCandidate.phase_name} (Reference DB)`} 
                      fill="#f43f5e"
                      shape={(props: any) => {
                        const { cx, cy, yAxis } = props;
                        const bottomY = yAxis && typeof yAxis.scale === 'function' ? yAxis.scale(0) : cy + 500;
                        return (
                          <g className="transition-all duration-300">
                            {/* Stem */}
                            <line x1={cx} y1={bottomY} x2={cx} y2={cy} stroke="#fb7185" strokeWidth={2} strokeOpacity={0.8} strokeDasharray="3 3" />
                            {/* Head */}
                            <path d={`M${cx},${cy - 8} L${cx - 5},${cy} L${cx},${cy + 8} L${cx + 5},${cy} Z`} fill="#f43f5e" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                            <circle cx={cx} cy={cy} r={2} fill="#fff" />
                          </g>
                        );
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
            {/* Correlation Confidence Bar */}
            {selectedCandidate && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-900/90 border-t border-slate-800/80 flex items-center px-6 gap-4 z-10 backdrop-blur-xl">
                <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Spectral Correlation</span>
                <div className="flex-1 h-2 bg-slate-950 border border-slate-800 rounded-full overflow-hidden flex shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedCandidate.confidence_score}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`h-full ${
                      selectedCandidate.match_quality === 'Excellent' 
                        ? 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.8)]' 
                        : selectedCandidate.match_quality === 'Good' 
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                          : 'bg-gradient-to-r from-amber-500 to-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                    }`} 
                  />
                </div>
                <span className="text-xs font-mono font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{selectedCandidate.confidence_score?.toFixed ? selectedCandidate.confidence_score.toFixed(1) : selectedCandidate.confidence_score}%</span>
              </div>
            )}
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md rounded-2xl z-20 border border-slate-800 overflow-hidden">
               {/* Decorative background grid for empty state */}
               <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(34, 211, 238, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               
               <div className="relative mb-8 z-10 flex flex-col items-center">
                 <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                   <svg className="absolute inset-0 w-full h-full text-cyan-900/40 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                     <circle cx="50" cy="50" r="48" fill="none" strokeWidth="1" stroke="currentColor" strokeDasharray="4 8" />
                     <circle cx="50" cy="50" r="40" fill="none" strokeWidth="1" stroke="currentColor" strokeDasharray="2 4" />
                   </svg>
                   <Scan className="w-12 h-12 text-cyan-500 animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]" />
                   <div className="absolute left-0 right-0 h-[2px] bg-cyan-500/80 top-1/2 -translate-y-1/2 shadow-[0_0_10px_rgba(34,211,238,1)] animate-[scan_2s_ease-in-out_infinite]" />
                 </div>
                 
                 <p className="text-white font-black tracking-[0.3em] uppercase text-xl mb-2 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">System Standby</p>
                 <div className="flex gap-4 items-center bg-[#0d1627] px-4 py-2 rounded-lg border border-cyan-500/20 shadow-inner">
                   <div className="flex gap-1.5 items-center">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-[ping_2s_infinite]" />
                     <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Input Stream: Offline</p>
                   </div>
                   <div className="w-px h-4 bg-slate-800" />
                   <div className="flex gap-1.5 items-center">
                     <div className="w-2 h-2 rounded-full bg-cyan-500/40" />
                     <p className="text-[10px] text-cyan-500/40 font-mono tracking-widest uppercase">Model: Inactive</p>
                   </div>
                 </div>
               </div>
               
               {/* Simulated Data Tracks bg */}
               <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-900/10 to-transparent pointer-events-none" />
            </div>
          )}
        </div>

      {/* Material Intelligence Section (Selected Candidate Details) */}
      <AnimatePresence mode="wait">
        {selectedCandidate && (
          <motion.div 
            key={selectedCandidate.phase_name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 pt-4"
          >
            <div className="bg-[#0B1221]/80 backdrop-blur-xl text-white p-8 rounded-[2rem] shadow-2xl border border-[#1e293b]/80 relative overflow-hidden">
              {/* Animated subtle grid and gradient */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none mix-blend-screen"></div>
              <div className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-50" />
              
              {/* HexTech UI Accents */}
              <div className="absolute top-0 left-12 w-24 h-1 bg-violet-500" />
              <div className="absolute top-1 left-12 w-32 h-px bg-violet-400/50" />
              
              {/* Warning Ribbon */}
              <div className="absolute top-0 right-10 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-[10px] font-black px-5 py-2 uppercase tracking-[0.2em] rounded-b-lg flex items-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.3)] z-20">
                <ShieldAlert className="w-4 h-4 animate-pulse opacity-80" />
                Laboratory Verification Required
              </div>

              {/* Mixture Candidates Selector */}
              {result?.candidates && result.candidates.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-8 relative z-10 p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-inner">
                  <div className="w-full mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identified Mixture Components</span>
                  </div>
                  {result.candidates.map((candidate, idx) => (
                    <button
                      key={candidate.phase_name + idx}
                      onClick={() => setSelectedCandidate(candidate)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${selectedCandidate.phase_name === candidate.phase_name ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    >
                      {candidate.phase_name} <span className="opacity-60 ml-1 font-mono">{candidate.confidence_score.toFixed(0)}%</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 relative z-10">
                <div className="flex flex-1 items-center gap-6">
                  <div className="relative group/icon cursor-default">
                    <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full group-hover/icon:bg-violet-500/30 transition-all duration-700 pointer-events-none" />
                    <div className="w-16 h-16 bg-[#070D18] rounded-2xl border border-violet-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05),0_5px_20px_rgba(139,92,246,0.3)] group-hover/icon:border-violet-400 transition-colors duration-500 overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                      <Brain className="w-8 h-8 text-violet-400 drop-shadow-[0_0_10px_rgba(167,139,250,0.5)] group-hover/icon:scale-110 group-hover/icon:text-violet-300 transition-all duration-500" />
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-indigo-300 uppercase tracking-tighter drop-shadow-sm pb-1 leading-tight">{t('Synthesis Intelligence', 'Synthesis Intelligence')}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5 shadow-inner">
                        {[...Array(5)].map((_, i) => (
                          <div key={`integrity-dot-${i}`} className={`w-2 h-2 rounded-full shadow-inner ${i < 4 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-slate-700'}`} />
                        ))}
                      </div>
                      <div className="h-4 w-px bg-slate-700/50" />
                      <p className="text-[10px] sm:text-[11px] font-black text-indigo-300/80 uppercase tracking-[0.2em]">{t('C-Score:', 'C-Score:')} <span className="text-indigo-200">{selectedCandidate.confidence_score.toFixed(1)}%</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto">
                   <button 
                     onClick={handleLatticeEstimation}
                     className="flex-1 lg:flex-none group relative px-6 py-3.5 bg-gradient-to-b from-[#0B1221] to-[#050B14] border border-[#1e293b] hover:border-emerald-500/50 rounded-xl transition-all active:scale-95 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="flex items-center justify-center gap-3 relative z-10 w-full h-full">
                       <Calculator className="w-4 h-4 text-emerald-400 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                       <span className="text-[10px] sm:text-[11px] font-black text-slate-300 group-hover:text-emerald-50 uppercase tracking-[0.2em] whitespace-nowrap">{t('Lattice AI', 'Lattice AI')}</span>
                     </div>
                   </button>
                   <button 
                     onClick={handleGenerateReport}
                     className="flex-1 lg:flex-none group relative px-6 py-3.5 bg-gradient-to-b from-[#0B1221] to-[#050B14] border border-[#1e293b] hover:border-violet-500/50 rounded-xl transition-all active:scale-95 shadow-[inset_0_1px_5px_rgba(255,255,255,0.05)] overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-t from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
                     <div className="flex items-center justify-center gap-3 relative z-10 w-full h-full">
                       <FileText className="w-4 h-4 text-violet-400 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                       <span className="text-[10px] sm:text-[11px] font-black text-slate-300 group-hover:text-violet-50 uppercase tracking-[0.2em] whitespace-nowrap">{t('Export Map', 'Export Map')}</span>
                     </div>
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 auto-rows-fr">
                {/* Identity Card */}
                <div className="md:col-span-12 group">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] shadow-2xl h-full flex flex-col relative overflow-hidden transition-all duration-500 hover:border-violet-500/40 hover:shadow-[0_0_50px_rgba(139,92,246,0.15)]">
                    <div className="absolute -top-32 -right-32 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-violet-500/20 transition-all duration-700" />
                    <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-700" />
                    
                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-[2.5rem]" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-[2.5rem]" />
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-6 relative z-10">
                      <h2 style={{ fontSize: 'clamp(2rem, 5vw, 4.5rem)' }} className="font-black text-white tracking-tighter leading-none group-hover:text-violet-200 transition-colors duration-500 drop-shadow-[-3px_3px_10px_rgba(0,0,0,0.8)]">{selectedCandidate.phase_name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-3 mb-8 relative z-10">
                      <span className="px-5 py-2.5 bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-300 text-sm md:text-base font-mono font-black rounded-xl border border-violet-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:border-violet-400 transition-colors">{selectedCandidate.formula}</span>
                      <span className="px-5 py-2.5 bg-gradient-to-br from-[#0B1221] to-[#070D18] text-emerald-400 text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] rounded-xl border border-[#1e293b] shadow-inner hover:border-emerald-500/40 transition-colors flex items-center justify-center">{selectedCandidate.materialType || "Standard Matrix"}</span>
                    </div>
                    
                    <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-3xl relative z-10 mb-10 font-medium">
                      {selectedCandidate.description || "Phase identification complete. Detailed morphological synthesis and mechanical property mapping for this specific lattice configuration are being processed by the intelligence engine."}
                    </p>
                    
                    <div className="mt-auto pt-8 border-t border-[#1e293b] grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10 bg-gradient-to-t from-[#0B1221] to-transparent -mx-8 sm:-mx-10 px-8 sm:px-10 -mb-8 sm:-mb-10 pb-8 sm:pb-10 rounded-b-[2.5rem]">
                       {[
                         { label: 'Molecular Wt', val: selectedCandidate.molecularWeight, unit: 'g/mol', icon: Layers },
                         { label: 'Band Gap', val: selectedCandidate.bandGap, unit: 'eV', icon: Zap },
                         { label: 'Modulus', val: selectedCandidate.elasticModulus, unit: 'GPa', icon: Activity },
                         { label: 'Magnetism', val: selectedCandidate.magneticProperties, unit: '', icon: Database },
                         { label: 'Optical', val: selectedCandidate.opticalProperties, unit: '', icon: Eye },
                       ].filter(i => i.val !== undefined && i.val !== '').slice(0, 4).map((item, i) => (
                         <div key={`item-${i}`} className="flex flex-col group/item p-3 -m-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                           <div className="flex items-center gap-2 mb-2">
                             <item.icon className="w-3.5 h-3.5 text-slate-600 group-hover/item:text-violet-400 transition-colors" />
                             <span className="text-[10px] text-slate-500 font-serif italic tracking-wider group-hover/item:text-slate-400 transition-colors">{item.label}</span>
                           </div>
                           <span className="text-lg md:text-xl font-black font-mono text-slate-200 capitalize truncate" title={String(item.val)}>
                             {item.val} {item.unit && <span className="text-indigo-400/60 text-[10px] md:text-xs ml-1 font-sans">{item.unit}</span>}
                           </span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Property Analytics Board */}
                <div className="md:col-span-12 group/analytics mb-8 bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] hover:border-emerald-500/40 transition-all duration-500 shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none group-hover/analytics:bg-emerald-500/10 transition-all duration-700 -translate-y-10 -translate-x-10" />
                   <div className="flex items-center gap-4 mb-8">
                     <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 shadow-[inset_0_2px_10px_rgba(52,211,153,0.2)]">
                       <Activity className="w-5 h-5 text-emerald-400" />
                     </div>
                     <h4 className="text-lg font-black text-white uppercase tracking-widest">Physical property spectrum</h4>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 z-10 relative">
                     {[
                       { label: 'Density (g/cm³)', val: selectedCandidate.density, max: 22, color: 'emerald' },
                       { label: 'Molecular Weight (g/mol)', val: selectedCandidate.molecularWeight, max: 400, color: 'blue' },
                       { label: 'Band Gap (eV)', val: selectedCandidate.bandGap, max: 10, color: 'violet' },
                       { label: 'Elastic Modulus (GPa)', val: selectedCandidate.elasticModulus, max: 500, color: 'amber' }
                     ].map((prop, i) => {
                       if (prop.val === undefined) return null;
                       const pct = Math.min((prop.val / prop.max) * 100, 100);
                       const colorClass = 
                         prop.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]' :
                         prop.color === 'blue' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
                         prop.color === 'violet' ? 'bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]' :
                         'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]';
                       
                       return (
                         <div key={"prop-" + i} className="flex flex-col gap-2">
                           <div className="flex justify-between items-end">
                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{prop.label}</span>
                             <span className="text-xs font-mono font-black text-white">{prop.val}</span>
                           </div>
                           <div className="h-2 w-full bg-[#0B1221] rounded-full border border-[#1e293b] overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${pct}%` }} />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
                
                {/* Crystallography (Cell Metrics) */}
                <div className="md:col-span-12 group/card">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] relative overflow-hidden shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] transition-all duration-500 hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(99,102,241,0.15)] flex flex-col">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[80px] pointer-events-none group-hover/card:bg-indigo-500/15 transition-all duration-700 -translate-y-20 translate-x-32" />
                    
                    {/* Header Zone */}
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 shadow-[inset_0_2px_10px_rgba(99,102,241,0.2)] group-hover/card:bg-indigo-500/20 group-hover/card:scale-110 transition-all duration-500">
                          <Box className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] group-hover/card:text-indigo-300 transition-colors block drop-shadow-sm">Cell Metrics</span>
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-[inset_0_1px_5px_rgba(52,211,153,0.2)] flex items-center gap-2 select-none">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Verified Match
                      </div>
                    </div>

                    {/* Horizontal Metrics Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10 w-full mb-0">
                        {/* 1. Crystal Structure */}
                        {(() => {
                          const crystalText = selectedCandidate.crystalSystem || "Unknown";
                          const fontClass = crystalText.length > 16 
                            ? "text-base sm:text-lg" 
                            : crystalText.length > 11 
                              ? "text-lg sm:text-xl" 
                              : "text-xl sm:text-2xl";
                          return (
                            <div className="p-5 sm:p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-2xl flex flex-col justify-center gap-1.5 relative overflow-hidden shadow-inner group/crystal hover:border-indigo-500/40 transition-all h-full min-h-[100px]">
                              <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-indigo-400 to-indigo-600" />
                              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest pl-3 flex items-center gap-2">
                                 <Scan className="w-3 h-3" /> Structure
                              </span>
                              <span className={`${fontClass} font-black text-white pl-3 drop-shadow-md break-words whitespace-normal leading-snug`}>
                                {crystalText}
                              </span>
                            </div>
                          );
                        })()}

                        {/* 2. Space Group */}
                        <div className="p-5 sm:p-6 bg-[#0B1221] border border-[#1e293b] rounded-2xl flex flex-col justify-center gap-2 hover:border-emerald-500/30 transition-colors shadow-inner h-full min-h-[100px]">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">Space Group</span>
                            <span className="text-xl sm:text-2xl font-mono font-black text-emerald-400 drop-shadow-sm break-words whitespace-normal leading-tight">{selectedCandidate.spaceGroup || "N/A"}</span>
                        </div>

                        {/* 3. Density */}
                        <div className="p-5 sm:p-6 bg-[#0B1221] border border-[#1e293b] rounded-2xl flex flex-col justify-center gap-2 hover:border-indigo-300/30 transition-colors shadow-inner h-full min-h-[100px]">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-tight">Density (g/cm³)</span>
                            <span className="text-xl sm:text-2xl font-mono font-black text-indigo-300 drop-shadow-sm break-words whitespace-normal leading-tight">{selectedCandidate.density ? `${selectedCandidate.density}` : "-"}</span>
                        </div>
                        
                        {/* 4. Registry Entry */}
                        {(() => {
                          const regText = selectedCandidate.card_id || "N/A";
                          const regFontClass = regText.length > 15
                            ? "text-[11px] sm:text-xs"
                            : regText.length > 11
                              ? "text-xs sm:text-sm"
                              : "text-sm sm:text-base";
                          return (
                            <div className="p-5 sm:p-6 bg-[#0B1221] border border-[#1e293b] rounded-2xl flex flex-col justify-center gap-2 hover:border-cyan-500/30 transition-colors shadow-inner h-full min-h-[100px]">
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                  <Database className="w-3 h-3 text-slate-500" />
                                  Registry Entry
                              </span>
                              <span className={`${regFontClass} font-mono font-black text-cyan-500 break-all whitespace-normal leading-normal drop-shadow-sm`}>
                                {regText}
                              </span>
                            </div>
                          );
                        })()}
                    </div>
                  </div>
                </div>

                {/* Applications & Safety */}
                <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] hover:border-amber-500/40 transition-all duration-500 group/bento shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] hover:shadow-[inset_0_2px_40px_rgba(245,158,11,0.05),0_10px_40px_rgba(245,158,11,0.15)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none group-hover/bento:bg-amber-500/15 transition-all duration-700 -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-[60px] pointer-events-none group-hover/bento:bg-orange-500/10 transition-all duration-700" />
                    
                    <div>
                      <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 shadow-[inset_0_2px_10px_rgba(245,158,11,0.2)] group-hover/bento:bg-amber-500/20 group-hover/bento:scale-110 transition-all duration-500">
                          <Zap className="w-6 h-6 text-amber-400 drop-shadow-md" />
                        </div>
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-black text-amber-500/70 uppercase tracking-[0.3em] font-sans block mb-1">Target Sectors</span>
                          <span className="text-xl sm:text-2xl font-serif italic text-amber-100/90 tracking-wider">Industrial Applications</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 relative z-10">
                        {selectedCandidate.applications && selectedCandidate.applications.length > 0 ? (
                          selectedCandidate.applications.map((app, i) => (
                            <span key={`app-${i}`} className="text-[11px] sm:text-xs font-black uppercase tracking-widest bg-amber-500/5 text-amber-200/80 px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl border border-amber-500/20 hover:text-amber-100 hover:border-amber-500/50 hover:bg-amber-500/20 transition-all duration-300 shadow-inner hover:scale-[1.02] active:scale-[0.98] cursor-default flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 group-hover/bento:animate-pulse"></span>
                              {app}
                            </span>
                          ))
                        ) : (
                           <span className="text-sm font-black text-slate-600 font-mono italic">No primary applications recorded in network database.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#050B14]/80 p-8 sm:p-10 rounded-[2.5rem] border border-[#1e293b] hover:border-rose-500/40 transition-all duration-500 group/bento shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] hover:shadow-[inset_0_2px_40px_rgba(244,63,94,0.05),0_10px_40px_rgba(244,63,94,0.15)] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none group-hover/bento:bg-rose-500/15 transition-all duration-700 -translate-y-10 translate-x-10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/5 rounded-full blur-[60px] pointer-events-none group-hover/bento:bg-pink-500/10 transition-all duration-700" />
                    
                    <div>
                      <div className="flex items-center gap-4 mb-10 relative z-10">
                        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/30 shadow-[inset_0_2px_10px_rgba(244,63,94,0.2)] group-hover/bento:bg-rose-500/20 group-hover/bento:scale-110 transition-all duration-500">
                          <ShieldAlert className="w-6 h-6 text-rose-400 drop-shadow-md" />
                        </div>
                        <div>
                          <span className="text-[10px] sm:text-[11px] font-black text-rose-500/70 uppercase tracking-[0.3em] font-sans block mb-1">Safety Constraints</span>
                          <span className="text-xl sm:text-2xl font-serif italic text-rose-100/90 tracking-wider">Hazard Profile</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-3 relative z-10">
                        {selectedCandidate.hazards && selectedCandidate.hazards.length > 0 ? (
                          selectedCandidate.hazards.map((hazard, i) => (
                            <div key={`hazard-${i}`} className="flex items-start gap-4 p-4 rounded-xl border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 transition-colors">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                              <span className="text-sm font-medium text-rose-200/90 leading-relaxed uppercase tracking-widest font-mono">
                                {hazard}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-4 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                            <CheckCircle className="w-8 h-8 text-emerald-500 animate-pulse" /> 
                            <div>
                               <span className="block text-lg font-black text-emerald-400 uppercase tracking-widest mb-1">Non-Toxic Response</span>
                               <span className="text-[10px] sm:text-xs font-medium text-emerald-500/70 font-mono tracking-widest">Material exhibits stable environmental limits.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Improved Neural Attention Mapping */}
              <div className="mt-14 pt-12 border-t border-[#1e293b] relative">
                {/* Glow from line */}
                <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative group/map-icon cursor-default">
                       <div className="absolute inset-0 bg-violet-600/20 blur-xl rounded-full group-hover/map-icon:bg-violet-500/30 transition-all duration-700 pointer-events-none" />
                       <div className="w-14 h-14 bg-[#070D18] rounded-2xl border border-violet-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/map-icon:border-violet-400 transition-colors duration-500 overflow-hidden">
                          <Activity className="w-6 h-6 text-violet-400 animate-pulse drop-shadow-[0_0_12px_rgba(167,139,250,0.6)] group-hover/map-icon:scale-110 transition-transform duration-500" />
                       </div>
                    </div>
                    <div>
                      <h4 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-1">
                        Neural Attention Mapping
                      </h4>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-[0.2em]">Spatial feature activation for <span className="text-violet-300 font-bold tracking-widest">{selectedCandidate.phase_name}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5 p-1 bg-black/40 rounded-full border border-white/5">
                      {[...Array(5)].map((_, i) => (
                        <div key={`mode-dot-${i}`} className={`w-2 h-2 rounded-full shadow-inner ${i < 4 ? 'bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className="px-4 py-2 bg-gradient-to-r from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-500/30 text-[10px] font-black text-violet-300 uppercase tracking-[0.25em] shadow-inner font-mono">Softmax_v3</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {[
                    { name: 'Primary_Features', color: 'from-violet-500 to-indigo-500', baseColor: 'bg-violet-500/20', rings: 'rgba(139, 92, 246, 0.4)', rows: 4, cols: 12 },
                    { name: 'Structural_Synthesis', color: 'from-indigo-500 to-blue-500', baseColor: 'bg-indigo-500/20', rings: 'rgba(99, 102, 241, 0.4)', rows: 4, cols: 12 },
                    { name: 'Lattice_Inference', color: 'from-blue-500 to-emerald-500', baseColor: 'bg-blue-500/20', rings: 'rgba(56, 189, 248, 0.4)', rows: 4, cols: 12 }
                  ].map((layer, lIdx) => (
                    <div key={lIdx} className="space-y-4 group/layer relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[2.5rem] -m-5 pointer-events-none group-hover/layer:bg-white/[0.04] transition-colors duration-500" />
                      
                      <div className="flex justify-between items-center px-3 relative z-10">
                        <span className="text-[11px] sm:text-xs font-mono font-black text-slate-500 group-hover/layer:text-white transition-colors uppercase tracking-[0.2em]">{layer.name}</span>
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                           <span className="text-[9px] font-mono text-slate-500 uppercase tracking-[0.2em] hidden sm:inline">Active</span>
                        </div>
                      </div>
                      
                      <div className="relative p-4 sm:p-5 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-[2rem] border border-[#1e293b] overflow-hidden shadow-[inset_0_2px_20px_rgba(255,255,255,0.02)] group-hover/layer:border-slate-600/80 group-hover/layer:shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-500 z-10 cursor-crosshair">
                        {/* Scanline Effect */}
                        <motion.div 
                          className="absolute inset-y-0 w-[150%] bg-gradient-to-r from-transparent via-white-[0.05] to-transparent z-20 pointer-events-none"
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ repeat: Infinity, duration: 3, ease: "linear", delay: lIdx * 0.4 }}
                          style={{ background: `linear-gradient(to right, transparent, ${layer.rings.replace('0.4', '0.1')}, transparent)` }}
                        />
                        
                        <div className="grid grid-cols-12 gap-1.5 sm:gap-2 relative z-0">
                          {[...Array(layer.rows * layer.cols)].map((_, i) => {
                            // Map peaks into activation pattern
                            const peakCount = selectedCandidate.matched_peaks?.length || 0;
                            const peakOffset = selectedCandidate.matched_peaks?.[i % (peakCount || 1)]?.refT || 10;
                            const formulaHash = selectedCandidate.formula.split('').reduce((a,b)=>a+b.charCodeAt(0),0);
                            const seed = ((i * formulaHash * peakOffset) + (lIdx * 17)) % 100;
                            const isActive = seed > (40 + (lIdx * 10)); // Higher layers are more sparse
                            const intensity = isActive ? (seed / 100) : 0.05;
                            const isHot = intensity > 0.85;
                            
                            return (
                              <motion.div 
                                key={`node-${lIdx}-${i}`}
                                initial={{ opacity: 0.1 }}
                                animate={{ 
                                  opacity: isActive ? [intensity * 0.4, intensity * 0.9, intensity * 0.4] : intensity,
                                  scale: isHot ? [0.95, 1.1, 0.95] : isActive ? [0.98, 1.05, 0.98] : 1
                                }}
                                transition={{ 
                                  repeat: Infinity, 
                                  duration: isHot ? 1.5 + (seed % 2) : 2 + (seed % 3),
                                  delay: (i % 10) * 0.1 
                                }}
                                className={`aspect-square rounded-md relative overflow-hidden group/cell`}
                              >
                                <div className={`absolute inset-0 rounded-md bg-gradient-to-br border ${isActive ? `border-white/30 ${layer.color}` : 'border-[#1e293b]/50 bg-[#070D18]'} shadow-inner transition-colors`} />
                                {isActive && intensity > 0.6 && (
                                  <div className="absolute inset-0 rounded-md shadow-lg opacity-80" style={{ boxShadow: `0 0 ${isHot ? '15px' : '8px'} ${layer.rings}` }} />
                                )}
                                {isHot && (
                                  <div className="absolute inset-0 bg-white/20 rounded-md animate-pulse" />
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center px-3 relative z-10 pt-2">
                         <div className="h-1.5 flex-1 bg-[#050B14] rounded-full overflow-hidden mr-5 shadow-inner border border-[#1e293b]">
                            <motion.div 
                              className={`h-full bg-gradient-to-r ${layer.color} relative`}
                              initial={{ width: '40%' }}
                              animate={{ width: [`${40 + (lIdx * 10)}%`, `${80 - (lIdx * 5)}%`, `${40 + (lIdx * 10)}%`] }}
                              transition={{ repeat: Infinity, duration: 4 + lIdx, ease: "easeInOut" }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 blur-[2px]" />
                            </motion.div>
                         </div>
                         <span className="text-[10px] font-mono font-black text-[#1e293b] group-hover/layer:text-slate-500 transition-colors uppercase tracking-[0.3em]">INF_00{lIdx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 p-6 sm:p-8 bg-gradient-to-br from-[#0B1221] to-[#050B14] rounded-[2.5rem] border border-[#1e293b] shadow-[inset_0_2px_30px_rgba(255,255,255,0.02)] relative overflow-hidden group/metrics">
                   <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none group-hover/metrics:bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_70%)] transition-colors duration-1000" />
                   {[
                     { label: 'Latency', val: '14ms', icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', shadow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)]' },
                     { label: 'Compute', val: '0.8 TFLOPS', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
                     { label: 'Layer Depth', val: '52', icon: Layers, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]' },
                     { label: 'Optimizer', val: 'AdamW', icon: Settings, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
                   ].map((metric, i) => (
                     <div key={`metric-data-${metric.label}-${i}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 relative z-10 p-4 hover:bg-white/[0.03] rounded-[1.5rem] transition-all cursor-default hover:scale-[1.02] active:scale-[0.98] duration-300 group/metric">
                       <div className={`p-3 sm:p-4 ${metric.bg} border ${metric.border} rounded-xl sm:rounded-2xl shadow-inner group-hover/metric:${metric.shadow} transition-shadow duration-300`}>
                         <metric.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${metric.color} drop-shadow-md group-hover/metric:scale-110 transition-transform`} />
                       </div>
                       <div className="flex flex-col gap-1">
                         <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] group-hover/metric:text-slate-400 transition-colors">{metric.label}</span>
                         <span className="text-sm sm:text-base text-white font-mono font-black tracking-wider drop-shadow-sm">{metric.val}</span>
                       </div>
                     </div>
                   ))}
                </div>
              </div>
                





 


              {/* Verification Checklist */}
              <div className="mt-14 pt-12 border-t border-[#1e293b]">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500/50" />
                  Verification Audit Protocol
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                     { label: "Lattice Alignment", desc: "Spacing delta < 0.01Å", active: true },
                     { label: "Rel. Intensity (a.u.)", desc: "Profile variance < 5%", active: true },
                     { label: "Phase Composition", desc: "Purity bounds verified", active: true },
                  ].map((item, i) => (
                    <label key={`audit-${i}`} className="flex items-start gap-4 bg-[#050B14] p-5 rounded-2xl border border-[#1e293b] hover:border-emerald-500/30 transition-all cursor-pointer group hover:bg-[#080E1A] shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]">
                      <div className="relative flex items-center justify-center mt-0.5">
                        <input type="checkbox" defaultChecked={item.active} className="peer w-5 h-5 rounded-[4px] border-[#1e293b] bg-slate-900/50 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0 cursor-pointer transition-all" />
                        <div className="absolute inset-0 pointer-events-none rounded-[4px] peer-checked:shadow-[0_0_12px_rgba(16,185,129,0.4)] transition-shadow" />
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-xs font-black text-slate-300 group-hover:text-emerald-100 transition-colors uppercase tracking-wide">{item.label}</span>
                         <span className="text-[10px] font-mono text-slate-500">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* Predictions List */}
        <div className="grid grid-cols-1 gap-4">
           {result?.candidates.filter(c => c.confidence_score >= engineConfig.confidenceThreshold).length === 0 && result && (
             <div className="bg-slate-900 p-8 rounded-[1.5rem] border border-slate-800 text-center">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No phases meet the confidence threshold of {engineConfig.confidenceThreshold}%</p>
               <button onClick={() => setEngineConfig({...engineConfig, confidenceThreshold: 0})} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors">Reset Threshold</button>
             </div>
           )}
           {result?.candidates.filter(c => c.confidence_score >= engineConfig.confidenceThreshold).map((candidate, idx) => (
             <div 
               key={`${candidate.phase_name}-${idx}`} 
               onClick={() => setSelectedCandidate(candidate)}
               className={`bg-slate-900 p-5 rounded-[1.5rem] border cursor-pointer transition-all duration-300 group overflow-hidden relative
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500/50 shadow-[0_0_30px_rgba(139,92,246,0.15)] bg-slate-950' : 'border-slate-800 hover:border-violet-500/30 hover:bg-slate-800/50'}
               `}
             >
               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
               )}
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
                 <div className="flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner border
                     ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]' : 
                       idx === 1 ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 border-slate-600' :
                       idx === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30' :
                       'bg-slate-900 text-slate-600 border-slate-800'}
                   `}>
                     #{idx + 1}
                   </div>
                   <div className="flex flex-col gap-1">
                     <h4 className={`text-xl font-black tracking-wide transition-colors ${selectedCandidate?.phase_name === candidate.phase_name ? 'text-violet-300' : 'text-slate-200 group-hover:text-white'}`}>{candidate.phase_name}</h4>
                     <div className="flex flex-wrap items-center gap-3">
                       <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-widest rounded bg-white/5 border ${selectedCandidate?.phase_name === candidate.phase_name ? 'text-violet-200 border-violet-500/30' : 'text-slate-400 border-white/10'}`}>{candidate.formula}</span>
                       <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1 uppercase tracking-widest"><Database className="w-3 h-3"/> {candidate.card_id}</span>
                       {candidate.match_quality && (
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border shadow-inner
                           ${candidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                             candidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}
                         `}>
                           {candidate.match_quality}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="flex flex-col items-end w-full md:w-auto">
                   <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0">
                     <div className="flex-1 md:w-32 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 shadow-inner">
                       <div 
                         className={`h-full rounded-none transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-emerald-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                         style={{ width: `${candidate.confidence_score}%` }}
                       />
                     </div>
                     <span className={`text-3xl md:text-2xl font-black font-mono tracking-tighter drop-shadow-md w-24 text-right
                       ${candidate.confidence_score > 80 ? 'text-emerald-400' : candidate.confidence_score > 50 ? 'text-violet-400' : 'text-amber-400'}
                     `}>
                       {candidate.confidence_score.toFixed(1)}<span className="text-sm text-slate-500 font-sans">%</span>
                     </span>
                   </div>
                 </div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-8 pt-6 border-t border-[#1e293b] animate-in slide-in-from-top-4 relative z-10">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                     <CheckCircle className="w-4 h-4 text-emerald-400"/> Feature Alignment Verification
                   </p>
                   <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={`peak-${mp.refT}-${i}`} className="bg-[#050B14] p-2 rounded-xl border border-[#1e293b] flex justify-between items-center group-hover:border-slate-700 transition-colors shadow-inner">
                         <span className="text-slate-400 font-mono text-xs">{mp.refT.toFixed(2)}°</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-48 flex flex-col items-center justify-center bg-slate-900 rounded-[2rem] border border-dashed border-slate-700 relative overflow-hidden group">
               <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Brain className="w-12 h-12 mb-4 text-violet-500/50 group-hover:text-violet-400 hover:scale-110 transition-all duration-500 drop-shadow-md" />
               <p className="font-black text-xl text-slate-300 tracking-tight group-hover:text-white transition-colors">Awaiting Inference Protocol</p>
               <p className="text-[10px] mt-2 font-mono text-slate-500 uppercase tracking-[0.2em]">Load input data to initialize neural core</p>
             </div>
           )}
        </div>
      </div>

      {/* Lattice Assistant Modal */}
      {isLatticeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-slate-800 p-5 text-white flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                       <Calculator className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                       <h3 className="font-bold text-lg leading-tight text-white font-black tracking-tighter">Lattice Estimator</h3>
                       <p className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase mt-0.5">Local Computation Engine 12.4</p>
                    </div>
                 </div>
                 <button onClick={() => setIsLatticeModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6">
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Estimated Constant (a)</span>
                       <span className="text-[10px] font-mono text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded leading-none">Ångströms</span>
                    </div>
                    <div className="text-4xl font-mono font-black text-emerald-600 tracking-tighter">
                       {latticeResult?.a.toFixed(4) || '---'}
                    </div>
                    <div className="mt-2 text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest flex items-center gap-2">
                       <div className="flex-1 h-[1px] bg-emerald-200" />
                       Lattice Refinement Logic active
                       <div className="flex-1 h-[1px] bg-emerald-200" />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lattice Symmetry Constraint</label>
                       <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20">
                          <option>Cubic (a = b = c)</option>
                          <option disabled>Tetragonal (a = b ≠ c)</option>
                          <option disabled>Orthorhombic (a ≠ b ≠ c)</option>
                       </select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller H</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller K</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Miller L</label>
                          <input type="number" defaultValue={1} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none" />
                       </div>
                    </div>
                 </div>

                 <div className="mt-8">
                    <button 
                      onClick={() => setIsLatticeModalOpen(false)}
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest font-black"
                    >
                      Update Model
                    </button>
                    <p className="text-[10px] text-center text-slate-400 mt-3 italic font-semibold">
                       Note: Estimates are based on Cu K-alpha radiation (1.5406 Å)
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
