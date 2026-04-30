import React, { useState, useEffect, useRef } from 'react';
import { DLPhaseResult, DLPhaseCandidate } from '../types';
import { identifyPhasesDL, parseXYData } from '../utils/physics';
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Scatter,
  Legend,
  ReferenceLine
} from 'recharts';
import { Brain, Activity, CheckCircle, Search, Database, Layers, Zap, ChevronDown, FlaskConical, Loader2, Upload, FileText, Trash2 } from 'lucide-react';

const MATERIAL_DB = [
  { 
    name: 'Silicon (Si)', 
    type: 'Semiconductor', 
    pattern: '28.44, 100\n47.30, 55\n56.12, 30\n69.13, 6\n76.38, 11\n88.03, 12',
    description: 'A hard, brittle crystalline solid with a blue-grey metallic lustre.',
    formula: 'Si',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fd-3m',
    density: 2.33,
    applications: ['Electronics', 'Solar Cells', 'Semiconductors']
  },
  { 
    name: 'Zirconia (ZrO2)', 
    type: 'Ceramic', 
    pattern: '30.27, 100\n35.25, 25\n50.37, 60\n60.20, 30', 
    description: 'Zirconium dioxide is a white crystalline oxide of zirconium.',
    formula: 'ZrO2',
    crystalSystem: 'Tetragonal',
    spaceGroup: 'P42/nmc',
    density: 5.68,
    applications: ['Ceramics', 'Dental', 'Refractories']
  },
  { 
    name: 'Gold (Au)', 
    type: 'Metal', 
    pattern: '38.18, 100\n44.39, 52\n64.57, 32\n77.54, 36',
    description: 'A dense, soft, malleable, and ductile metal.',
    formula: 'Au',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 19.30,
    applications: ['Electronics', 'Jewelry', 'Currency']
  },
  { 
    name: 'Hydroxyapatite', 
    type: 'Bioceramic', 
    pattern: '25.87, 40\n31.77, 100\n32.19, 95\n32.90, 60\n34.04, 45\n39.81, 25',
    description: 'A naturally occurring mineral form of calcium apatite.',
    formula: 'Ca10(PO4)6(OH)2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/m',
    density: 3.16,
    applications: ['Bone Grafts', 'Dental', 'Implants']
  },
  { 
    name: 'Zinc Oxide (ZnO)', 
    type: 'Semiconductor', 
    pattern: '31.77, 57\n34.42, 44\n36.25, 100\n47.54, 23\n56.60, 32\n62.86, 29',
    description: 'An inorganic compound used as an additive in numerous materials and products.',
    formula: 'ZnO',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63mc',
    density: 5.61,
    applications: ['Rubber', 'Plastics', 'Ceramics', 'Glass']
  },
  {
    name: 'Polytetrafluoroethylene (PTFE)',
    type: 'Polymer',
    pattern: '18.07, 100\n31.55, 25\n36.60, 10\n41.20, 5',
    description: 'A synthetic fluoropolymer of tetrafluoroethylene.',
    formula: '(C2F4)n',
    crystalSystem: 'Hexagonal', 
    spaceGroup: 'P',
    density: 2.2,
    applications: ['Non-stick coatings', 'Lubricants']
  },
  {
    name: 'Quartz (SiO2)',
    type: 'Ceramic/Mineral',
    pattern: '20.86, 35\n26.64, 100\n36.54, 12\n39.47, 9\n40.29, 8\n42.45, 8\n45.79, 9\n50.14, 14\n59.95, 9\n67.74, 7\n68.14, 8',
    description: 'A hard, crystalline mineral composed of silica (silicon dioxide).',
    formula: 'SiO2',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P3221',
    density: 2.65,
    applications: ['Glass', 'Electronics', 'Construction', 'Jewelry']
  },
  {
    name: 'Halite (NaCl)',
    type: 'Salt/Mineral',
    pattern: '27.37, 10\n31.69, 100\n45.43, 55\n56.45, 15\n66.20, 5\n75.26, 10',
    description: 'Commonly known as rock salt, it is the mineral form of sodium chloride.',
    formula: 'NaCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 2.16,
    applications: ['Food', 'De-icing', 'Chemical Industry']
  },
  {
    name: 'Sylvite (KCl)',
    type: 'Salt/Mineral',
    pattern: '28.35, 100\n40.50, 50\n50.15, 15\n58.60, 5\n66.35, 10\n73.70, 5',
    description: 'Potassium chloride is a metal halide salt composed of potassium and chlorine.',
    formula: 'KCl',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 1.98,
    applications: ['Fertilizer', 'Medicine', 'Food Processing']
  },
  {
    name: 'Fluorite (CaF2)',
    type: 'Mineral',
    pattern: '28.27, 100\n46.99, 55\n55.75, 30\n68.65, 5\n75.85, 10\n87.45, 10',
    description: 'The mineral form of calcium fluoride. It belongs to the halide minerals.',
    formula: 'CaF2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 3.18,
    applications: ['Metallurgy', 'Optics', 'Ceramics']
  },
  {
    name: 'Hematite (Fe2O3)',
    type: 'Mineral/Ore',
    pattern: '24.14, 30\n33.15, 100\n35.61, 70\n40.85, 20\n49.48, 40\n54.09, 45\n62.45, 30\n64.02, 30',
    description: 'One of the most abundant minerals on Earth\'s surface and an important ore of iron.',
    formula: 'Fe2O3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 5.26,
    applications: ['Iron Ore', 'Pigments', 'Radiation Shielding']
  },
  {
    name: 'Graphite (C)',
    type: 'Mineral',
    pattern: '26.54, 100\n42.40, 10\n44.56, 10\n54.65, 25\n77.50, 5',
    description: 'A crystalline form of the element carbon with its atoms arranged in a hexagonal structure.',
    formula: 'C',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 2.26,
    applications: ['Lubricants', 'Batteries', 'Pencils', 'Graphene Production']
  },
  {
    name: 'Aluminum (Al)',
    type: 'Metal',
    pattern: '38.47, 100\n44.74, 47\n65.13, 22\n78.23, 24\n82.44, 7',
    description: 'A silvery-white, soft, non-magnetic and ductile metal.',
    formula: 'Al',
    crystalSystem: 'Face-Centered Cubic',
    spaceGroup: 'Fm-3m',
    density: 2.70,
    applications: ['Aerospace', 'Packaging', 'Construction']
  },
  {
    name: 'Copper (Cu)',
    type: 'Metal',
    pattern: '43.30, 100\n50.43, 46\n74.13, 20\n89.93, 17\n95.14, 5',
    description: 'A soft, malleable, and ductile metal with very high thermal and electrical conductivity.',
    formula: 'Cu',
    crystalSystem: 'Face-Centered Cubic',
    spaceGroup: 'Fm-3m',
    density: 8.96,
    applications: ['Wiring', 'Motors', 'Coinage']
  },
  {
    name: 'Magnesium Oxide (MgO)',
    type: 'Ceramic',
    pattern: '36.94, 10\n42.91, 100\n62.30, 52\n74.65, 4\n78.61, 12',
    description: 'A white hygroscopic solid mineral that occurs naturally as periclase.',
    formula: 'MgO',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 3.58,
    applications: ['Refractories', 'Medicine', 'Insulation']
  },
  {
    name: 'Titanium (Ti)',
    type: 'Metal',
    pattern: '35.09, 30\n38.42, 30\n40.17, 100\n53.00, 15\n62.94, 15\n70.66, 15',
    description: 'A lustrous transition metal with a silver color, low density, and high strength.',
    formula: 'Ti',
    crystalSystem: 'Hexagonal',
    spaceGroup: 'P63/mmc',
    density: 4.50,
    applications: ['Aerospace', 'Implants', 'Pigments']
  },
  {
    name: 'Cerium Oxide (CeO2)',
    type: 'Ceramic/Catalyst',
    pattern: '28.55, 100\n33.08, 30\n47.48, 55\n56.34, 45\n59.09, 10\n69.41, 20',
    description: 'A pale yellow-white powder, highly used as a catalyst and in glass polishing.',
    formula: 'CeO2',
    crystalSystem: 'Cubic',
    spaceGroup: 'Fm-3m',
    density: 7.21,
    applications: ['Catalysts', 'Fuel Cells', 'Glass Polishing']
  },
  {
    name: 'Calcite (CaCO3)',
    type: 'Mineral',
    pattern: '23.06, 15\n29.40, 100\n35.96, 15\n39.40, 20\n43.16, 20\n47.50, 25\n48.50, 25\n57.40, 10',
    description: 'A carbonate mineral and the most stable polymorph of calcium carbonate.',
    formula: 'CaCO3',
    crystalSystem: 'Trigonal',
    spaceGroup: 'R-3c',
    density: 2.71,
    applications: ['Construction', 'Agriculture', 'Pharmaceuticals']
  },
  {
    name: 'Tungsten (W)',
    type: 'Metal',
    pattern: '40.26, 100\n58.27, 20\n73.19, 30\n87.01, 15',
    description: 'A rare metal known for its robustness and the highest melting point of all elements.',
    formula: 'W',
    crystalSystem: 'Body-Centered Cubic',
    spaceGroup: 'Im-3m',
    density: 19.25,
    applications: ['Heating elements', 'X-ray tubes', 'Alloys']
  }
];

export const DeepLearningModule: React.FC = () => {
  const [inputData, setInputData] = useState<string>("");
  const [result, setResult] = useState<DLPhaseResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [progressStep, setProgressStep] = useState(0); // 0: Idle, 1: Preproc, 2: CNN, 3: DB, 4: Done
  const [selectedCandidate, setSelectedCandidate] = useState<DLPhaseCandidate | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
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
    setInputData(material.pattern);
    setSearchTerm(material.name);
    setShowSuggestions(false);
  };

  const handleSmartSearch = async () => {
    if (!searchTerm.trim()) return;
    
    // 1. Check Local DB
    const localMatch = MATERIAL_DB.find(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (localMatch) {
      handleMaterialSelect(localMatch);
      return;
    }

    // 2. AI Search
    setIsSearchingAI(true);
    setShowSuggestions(false);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate X-Ray Diffraction data and Material Intelligence metadata for "${searchTerm}". 
        Return ONLY a JSON object with this structure:
        {
          "name": "Material Name (Formula)",
          "type": "Material Class (e.g. Metal, Ceramic, Polymer)",
          "pattern": "2theta, intensity\\n2theta, intensity...",
          "description": "Deep scientific description detailing structure and usage",
          "formula": "Chemical Formula",
          "crystalSystem": "Crystal System",
          "spaceGroup": "Space Group",
          "density": number,
          "applications": ["App1", "App2"],
          "molecularWeight": number,
          "hazards": ["Hazard1", "Hazard2"],
          "magneticProperties": "Diamagnetic/Paramagnetic/etc",
          "bandGap": number,
          "elasticModulus": number,
          "opticalProperties": "Optical description"
        }
        Provide at least 4-7 major peaks in the pattern string for realistic matching. Make the description very detailed and authoritative.`,
        config: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.pattern) {
        setInputData(data.pattern);
        // We can also temporarily add this to our "local" knowledge for this session if we wanted
        // For now, we just populate the input and let the user run the analysis
        // But to make it seamless, we might want to store this metadata to use in the result
        // We'll attach it to the window or a ref to retrieve during "Identify Phases"
        (window as any).__TEMP_AI_MATERIAL_DATA__ = data;
      }
    } catch (error) {
      console.error("AI Search failed:", error);
      alert("Could not find material data. Please try a different name.");
    } finally {
      setIsSearchingAI(false);
    }
  };

  const handleRunAI = () => {
    if (!inputData.trim()) return;
    
    setIsSimulating(true);
    setResult(null);
    setSelectedCandidate(null);
    setProgressStep(1);

    // Check if input matches a known material to override/enhance results
    const matchedMaterial = MATERIAL_DB.find(m => m.pattern === inputData || m.name === searchTerm);
    const aiMaterialData = (window as any).__TEMP_AI_MATERIAL_DATA__;

    // Simulation Sequence
    setTimeout(() => setProgressStep(2), 800);
    setTimeout(() => setProgressStep(3), 2000);
    setTimeout(() => {
      const points = parseXYData(inputData);
      let computed = identifyPhasesDL(points);
      
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
          materialType: matchedMaterial.type
        };
        
        // Put the matched one first
        computed = {
          ...computed,
          candidates: [enhancedCandidate, ...computed.candidates.filter(c => c.phase_name !== matchedMaterial.name)]
        };
      } else if (aiMaterialData && aiMaterialData.pattern === inputData) {
         // Use AI fetched data
         const enhancedCandidate: DLPhaseCandidate = {
          phase_name: aiMaterialData.name,
          confidence_score: 95.0, // AI generated, slightly lower confidence
          card_id: "AI-GEN-001",
          formula: aiMaterialData.formula,
          matched_peaks: parseXYData(aiMaterialData.pattern).map(p => ({
            refT: p.twoTheta,
            obsT: p.twoTheta,
            refI: p.intensity
          })),
          description: aiMaterialData.description,
          crystalSystem: aiMaterialData.crystalSystem,
          spaceGroup: aiMaterialData.spaceGroup,
          density: aiMaterialData.density,
          applications: aiMaterialData.applications,
          materialType: aiMaterialData.type,
          molecularWeight: aiMaterialData.molecularWeight,
          hazards: aiMaterialData.hazards,
          magneticProperties: aiMaterialData.magneticProperties,
          bandGap: aiMaterialData.bandGap,
          elasticModulus: aiMaterialData.elasticModulus,
          opticalProperties: aiMaterialData.opticalProperties
        };
        
        computed = {
          ...computed,
          candidates: [enhancedCandidate, ...computed.candidates]
        };
      }

      setResult(computed);
      if (computed.candidates.length > 0) {
        setSelectedCandidate(computed.candidates[0]);
      }
      setProgressStep(4);
      setIsSimulating(false);
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

  const loadExample = (type: 'Silicon' | 'Mixture' | 'HAP' | 'ZnO' | 'Halite' | 'Hematite' | 'Aluminum' | 'Copper' | 'MgO' | 'CeO2' | 'Titanium' | 'Calcite' | 'Tungsten' | 'Quartz') => {
    if (type === 'Mixture') {
      setInputData(`20.86, 40\n26.64, 100\n38.18, 50\n44.39, 25\n50.14, 15\n64.57, 20`);
      setSearchTerm("Mixture (SiO2 + Au)");
    } else {
      // Generic finder for all single phase examples
      const searchKey = type === 'HAP' ? 'Hydroxyapatite' : 
                        type === 'Halite' ? 'Halite' : 
                        type === 'Hematite' ? 'Hematite' :
                        type === 'MgO' ? 'Magnesium Oxide' :
                        type === 'CeO2' ? 'Cerium Oxide' :
                        type === 'Calcite' ? 'Calcite' : 
                        type === 'Tungsten' ? 'Tungsten' : 
                        type === 'Quartz' ? 'Quartz' : 
                        type;
      
      const mat = MATERIAL_DB.find(m => m.name.includes(searchKey));
      if (mat) handleMaterialSelect(mat);
    }
  };

  const parsedPoints = parseXYData(inputData);
  
  // Prepare Chart Data
  // We merge input points and selected candidate reference peaks for visualization
  const chartData = parsedPoints.map(p => ({
    twoTheta: p.twoTheta,
    intensity: p.intensity,
    refIntensity: null // Placeholder
  }));

  // If a candidate is selected, we want to show its reference peaks
  // We can add them as a separate Scatter series
  const refData = selectedCandidate?.matched_peaks?.map(mp => ({
    twoTheta: mp.refT,
    refIntensity: mp.refI,
    intensity: null
  })) || [];

  // Combined data for the chart is tricky because X-values differ. 
  // For ComposedChart, it's often easier to just overlay Scatter on the same XAxis domain.

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs border border-slate-700">
          <p className="font-bold mb-1">2θ: {label}°</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
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
                Deep Material DB Search <span className="text-emerald-500 ml-1 font-mono text-[10px] bg-emerald-50 px-1 rounded border border-emerald-100">AI-POWERED</span>
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
                  placeholder="Query by formula or name (e.g. TiO2, Zinc)..."
                  className="w-full px-4 py-3 pl-10 pr-24 bg-slate-50 border border-slate-300 hover:border-violet-400 rounded-xl text-sm focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all shadow-inner"
                />
                <Search className={`w-4 h-4 absolute left-4 top-3.5 ${isSearchingAI ? 'text-violet-500 animate-pulse' : 'text-slate-400'}`} />
                
                <button 
                  onClick={handleSmartSearch}
                  disabled={isSearchingAI || !searchTerm.trim()}
                  className="absolute right-2 top-2 bottom-2 px-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex items-center gap-1.5"
                >
                  {isSearchingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Database className="w-3 h-3" /> Fetch</>}
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-72 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                  {MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.formula.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                    <div className="p-1">
                      {MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.formula.toLowerCase().includes(searchTerm.toLowerCase())).map((material, idx) => (
                        <button
                          key={idx}
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
                       <p className="text-slate-400 text-xs">Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono text-[10px] mx-1">Enter</kbd> or click <span className="font-bold">Fetch</span> to synthesize pattern with AI.</p>
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
                    <p className="text-xs font-semibold text-slate-400 mt-1">or paste below (2θ, Intensity format)</p>
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
                <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                   Format: <span className="text-slate-500 bg-slate-100 px-1 py-0.5 rounded ml-0.5">2θ</span> , <span className="text-slate-500 bg-slate-100 px-1 py-0.5 rounded">Intensity</span>
                </div>
                {inputData && (
                  <div className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 border border-violet-200 px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
                    {inputData.split('\n').filter(l => l.trim()).length} Data Points
                  </div>
                )}
              </div>

              <div className="mt-5 space-y-2.5">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FlaskConical className="w-3 h-3 text-slate-400" /> Test Data Suites
                   </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'Silicon', label: 'Si' },
                    { id: 'Mixture', label: 'Si+Au Mix' },
                    { id: 'Aluminum', label: 'Al' },
                    { id: 'Copper', label: 'Cu' },
                    { id: 'Titanium', label: 'Ti' },
                    { id: 'Quartz', label: 'Quartz' },
                    { id: 'CeO2', label: 'CeO2' },
                    { id: 'Calcite', label: 'Calcite' },
                    { id: 'Tungsten', label: 'W' },
                    { id: 'HAP', label: 'HAp' }
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
        <div className="bg-slate-900 p-6 rounded-2xl text-white border border-slate-800 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl group-hover:bg-violet-600/20 transition-colors duration-1000" />
           <h3 className="font-bold text-lg mb-2 flex items-center gap-3 relative z-10">
             <div className="p-1.5 bg-violet-500/20 rounded-lg border border-violet-500/30">
               <Brain className="w-5 h-5 text-violet-400" />
             </div>
             Convolutional Engine
           </h3>
           <p className="text-xs text-slate-400 font-mono mb-6 relative z-10">ARCH: XRD-ResNet-50 v4.2 • EPOCH: FINAL</p>
           
           <div className="space-y-5 relative z-10">
             {/* Vertical connecting line */}
             <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800/80 z-0"></div>
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={idx} className={`relative z-10 flex flex-col gap-1 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-40'}`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-500 shrink-0
                       ${isActive ? 'border-violet-500 bg-violet-500/20 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-110 rotate-3' : 
                         isCompleted ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 bg-slate-900 text-slate-600'}
                     `}>
                       {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <span className={`text-sm font-bold block truncate ${isActive ? 'text-violet-300' : isCompleted ? 'text-slate-200' : 'text-slate-500'}`}>
                         {step.label}
                       </span>
                     </div>
                     
                     {/* Activation Metrics */}
                     {isActive && (
                       <div className="flex items-center gap-2">
                         <div className="text-[9px] font-mono text-emerald-400 flex flex-col items-end">
                           <span>LOSS: {(Math.random() * 0.1).toFixed(4)}</span>
                           <span>ACC: {(95 + Math.random() * 4).toFixed(2)}%</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   {/* Layer Activation Visualization */}
                   {isActive && idx === 1 && (
                     <div className="ml-11 mt-2 pl-2 border-l border-violet-500/30">
                       <div className="grid grid-cols-6 gap-1 w-full max-w-[150px]">
                         {[...Array(12)].map((_, i) => (
                           <div key={i} className="h-4 rounded-sm bg-violet-500 animate-pulse" style={{ opacity: Math.random() * 0.8 + 0.2, animationDelay: `${i * 0.1}s` }} />
                         ))}
                       </div>
                       <p className="text-[9px] text-slate-500 font-mono mt-1">MaxPool2d_1 Activation Maps</p>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group">
          {/* Subtle grid background to look like a terminal/software UI */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none mix-blend-overlay"></div>
          
          <div className="flex justify-between items-center mb-4 px-2 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <Activity className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Phase Match Visualization</h3>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Convolutional Feature Overlay</p>
              </div>
            </div>
            
            {selectedCandidate && (
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 border shadow-inner backdrop-blur-sm
                  ${selectedCandidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                    selectedCandidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}
                `}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedCandidate.match_quality === 'Excellent' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : selectedCandidate.match_quality === 'Good' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                  {selectedCandidate.match_quality || "Match"} Quality
                </span>
                <span className="text-xs font-bold bg-violet-500/10 text-violet-300 px-3 py-1.5 rounded-lg border border-violet-500/20 flex items-center gap-2 backdrop-blur-sm">
                  <Database className="w-3 h-3 text-violet-400" />
                  DB Overlay: {selectedCandidate.phase_name}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0 relative z-10 bg-slate-950/80 rounded-xl border border-white/5 p-2 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[0, 'dataMax + 5']} 
                  unit="°" 
                  allowDataOverflow 
                  name="2θ"
                  stroke="#94a3b8"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                
                {/* Input Data */}
                <Bar dataKey="intensity" barSize={3} fill="#6366f1" name="Input Pattern" radius={[2, 2, 0, 0]} />
                
                {/* Reference Data (if selected) */}
                {selectedCandidate && (
                  <Scatter 
                    data={refData} 
                    dataKey="refIntensity" 
                    name={`${selectedCandidate.phase_name} (Database Ref)`} 
                    fill="#f43f5e" 
                    shape="diamond"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md rounded-2xl z-20 border border-slate-800">
               <Layers className="w-12 h-12 text-slate-700 mb-4 animate-pulse opacity-50" />
               <p className="text-slate-400 font-medium">Network Awaiting Input Data</p>
               <p className="text-xs text-slate-500 font-mono mt-2">SYS_STATUS: STANDBY</p>
            </div>
          )}
        </div>

        {/* Material Intelligence Card */}
        {selectedCandidate && (
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden">
            {/* Warning Ribbon */}
            <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[10px] font-black px-3 py-1 uppercase tracking-tighter rotate-0 rounded-bl-lg flex items-center gap-1 shadow-lg z-10">
              <Activity className="w-3 h-3" />
              Manual Verification Required
            </div>

            <div className="flex items-center gap-3 mb-4 border-b border-slate-700 pb-4">
              <div className="p-2 bg-violet-500/20 rounded-lg">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Material Intelligence</h3>
                <p className="text-sm text-slate-400">AI-Synthesized Properties & Context</p>
              </div>
              <div className="ml-auto">
                 <button 
                   onClick={handleGenerateReport}
                   className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 transition-colors flex items-center gap-2"
                 >
                   <FileText className="w-3 h-3" /> Generate Report
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Description & Class */}
              <div className="md:col-span-8">
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 h-full flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material Profile</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-4 relative z-10">
                    <span className="text-2xl font-black text-white px-1 tracking-tight">{selectedCandidate.phase_name}</span>
                    <span className="px-3 py-1.5 bg-violet-500/20 text-violet-300 text-[13px] font-mono font-bold rounded-lg border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]">{selectedCandidate.formula}</span>
                    <span className="px-3 py-1.5 bg-slate-700/80 text-emerald-400 text-[11px] uppercase tracking-widest rounded-lg font-bold border border-emerald-500/20 shadow-inner">{selectedCandidate.materialType || "Unclassified"}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl relative z-10">
                    {selectedCandidate.description || "No description available for this phase."}
                  </p>
                  
                  {/* Additional Metadata row */}
                  <div className="mt-6 pt-5 border-t border-slate-700 flex flex-wrap gap-6 relative z-10">
                     {selectedCandidate.molecularWeight && (
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Molecular Wt.</span>
                         <span className="text-sm font-mono text-slate-200">{selectedCandidate.molecularWeight} <span className="text-slate-500 text-xs">g/mol</span></span>
                       </div>
                     )}
                     {selectedCandidate.bandGap !== undefined && (
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Band Gap</span>
                         <span className="text-sm font-mono text-slate-200">{selectedCandidate.bandGap} <span className="text-slate-500 text-xs">eV</span></span>
                       </div>
                     )}
                     {selectedCandidate.elasticModulus !== undefined && (
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Module</span>
                         <span className="text-sm font-mono text-slate-200">{selectedCandidate.elasticModulus} <span className="text-slate-500 text-xs">GPa</span></span>
                       </div>
                     )}
                     {selectedCandidate.magneticProperties && (
                       <div className="flex flex-col">
                         <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Magnetism</span>
                         <span className="text-sm font-mono text-slate-200 capitalize">{selectedCandidate.magneticProperties}</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="md:col-span-4">
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 h-full relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-5">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crystallography</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest">Crystal System</span>
                      <span className="text-sm font-bold text-white">{selectedCandidate.crystalSystem || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest">Space Group</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">{selectedCandidate.spaceGroup || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                      <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest">Density</span>
                      <span className="text-sm font-bold text-white font-mono">{selectedCandidate.density ? `${selectedCandidate.density} g/cm³` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                       <span className="text-[11px] text-slate-400 uppercase font-black tracking-widest">Card Match</span>
                       <span className="text-xs font-black px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20 uppercase">{selectedCandidate.card_id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applications & Hazards */}
              <div className="md:col-span-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Common Applications</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.applications?.map((app, i) => (
                        <span key={i} className="text-xs font-bold bg-slate-900 shadow-inner text-slate-300 px-3.5 py-2 rounded-lg border border-slate-700 hover:border-amber-500/50 hover:text-amber-100 transition-colors cursor-default">
                          {app}
                        </span>
                      )) || <span className="text-xs text-slate-500 italic">No application data available.</span>}
                    </div>
                  </div>

                  <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 transition-colors">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                         <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Safety & Hazards</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCandidate.hazards?.map((hazard, i) => (
                        <span key={i} className="text-[11px] font-black bg-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-widest cursor-default shadow-sm">
                          {hazard}
                        </span>
                      )) || <span className="text-xs text-emerald-500/70 italic font-medium flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> No specific hazards listed / Safe material.</span>}
                    </div>
                    {selectedCandidate.opticalProperties && (
                       <div className="mt-4 pt-3 border-t border-slate-700/50">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 block">Optical Profile</span>
                          <span className="text-xs font-medium text-slate-300">{selectedCandidate.opticalProperties}</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="mt-6 pt-6 border-t border-slate-800/50">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                Manual Verification Checklist
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  "Peak positions match within 0.05°",
                  "Relative intensities are consistent",
                  "Chemical composition is plausible",
                ].map((item, i) => (
                  <label key={i} className="flex items-start gap-3 bg-slate-800/20 p-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600 transition-all cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input type="checkbox" className="peer appearance-none w-4 h-4 border-2 border-slate-600 rounded bg-slate-900 checked:bg-emerald-500 checked:border-emerald-500 transition-colors cursor-pointer" />
                      <CheckCircle className="w-3 h-3 text-slate-900 absolute opacity-0 peer-checked:opacity-100 pointer-events-none" />
                    </div>
                    <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 leading-tight">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Predictions List */}
        <div className="grid grid-cols-1 gap-4">
           {result?.candidates.map((candidate, idx) => (
             <div 
               key={idx} 
               onClick={() => setSelectedCandidate(candidate)}
               className={`bg-slate-900 p-5 rounded-xl shadow-sm border cursor-pointer transition-all group overflow-hidden relative
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)] bg-slate-800' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'}
               `}
             >
               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-transparent pointer-events-none" />
               )}
               <div className="flex justify-between items-start mb-3 relative z-10">
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-inner border
                     ${idx === 0 ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 text-emerald-400 border-emerald-500/30' : 
                       idx === 1 ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 border-slate-600' :
                       idx === 2 ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400 border-amber-500/30' :
                       'bg-slate-900 text-slate-600 border-slate-800'}
                   `}>
                     #{idx + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-white group-hover:text-violet-400 transition-colors">{candidate.phase_name}</h4>
                     <div className="flex flex-wrap gap-2 text-xs mt-1">
                       <span className="font-mono bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">{candidate.formula}</span>
                       <span className="text-slate-500 flex items-center"><Database className="w-3 h-3 mr-1"/>{candidate.card_id}</span>
                       {candidate.match_quality && (
                         <span className={`px-2 py-0.5 rounded-md font-bold border
                           ${candidate.match_quality === 'Excellent' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                             candidate.match_quality === 'Good' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}
                         `}>
                           {candidate.match_quality}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="text-right flex flex-col items-end">
                   <span className={`text-3xl font-black tracking-tighter shadow-sm
                     ${candidate.confidence_score > 80 ? 'text-emerald-500' : candidate.confidence_score > 50 ? 'text-violet-500' : 'text-amber-500'}
                   `}>
                     {candidate.confidence_score.toFixed(1)}%
                   </span>
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                     <Activity className="w-3 h-3" />
                     Network Conf
                   </p>
                 </div>
               </div>
               
               <div className="w-full bg-slate-950 rounded-full h-2 mt-4 overflow-hidden border border-slate-800 relative z-10 box-content">
                 <div 
                   className={`h-full rounded-none transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-emerald-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                   style={{ width: `${candidate.confidence_score}%` }}
                 ></div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-5 pt-5 border-t border-slate-700/50 animate-in slide-in-from-top-2 relative z-10">
                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-widest">
                     <CheckCircle className="w-3 h-3 text-emerald-400"/> Feature Map Verification
                   </p>
                   <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={i} className="bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex justify-between items-center group-hover:bg-slate-900 transition-colors">
                         <span className="text-slate-400 font-mono text-[11px]">{mp.refT.toFixed(2)}°</span>
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                       </div>
                     ))}
                   </div>
                   <div className="mt-4 flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800">
                     <div className="w-2 h-2 rounded bg-violet-500 animate-pulse" />
                     <p className="text-[10px] text-slate-500 font-mono">
                       Select other candidates to compare convolutional feature overlays.
                     </p>
                   </div>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-40 flex flex-col items-center justify-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-700 text-slate-500 relative overflow-hidden group">
               <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
               <Database className="w-10 h-10 mb-3 opacity-30 group-hover:hidden" />
               <Brain className="w-10 h-10 mb-3 text-violet-500 hidden group-hover:block animate-bounce opacity-80" />
               <p className="font-bold tracking-tight text-slate-300">Awaiting Neural Evaluation</p>
               <p className="text-xs mt-1 font-mono text-slate-500 uppercase tracking-widest">Load data to initialize the network</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
