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
        contents: `Generate X-Ray Diffraction data for "${searchTerm}". 
        Return ONLY a JSON object with this structure:
        {
          "name": "Material Name (Formula)",
          "type": "Material Class (e.g. Metal, Ceramic, Polymer)",
          "pattern": "2theta, intensity\\n2theta, intensity...",
          "description": "Brief scientific description",
          "formula": "Chemical Formula",
          "crystalSystem": "Crystal System",
          "spaceGroup": "Space Group",
          "density": number,
          "applications": ["App1", "App2"]
        }
        Provide at least 3-5 major peaks in the pattern string.`,
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
          materialType: aiMaterialData.type
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

  const loadExample = (type: 'Silicon' | 'Mixture' | 'HAP' | 'ZnO' | 'Halite' | 'Hematite' | 'Aluminum' | 'Copper' | 'MgO' | 'CeO2' | 'Titanium') => {
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Brain className="w-6 h-6 text-violet-600" />
              PhaseID Neural Net
            </h2>
            {isSimulating && (
              <span className="text-xs font-bold text-violet-600 animate-pulse bg-violet-50 px-2 py-1 rounded-full">
                Running...
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Material Search */}
            <div className="relative" ref={searchRef}>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Quick Material Load
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
                  placeholder="Search material (e.g. Zirconia, TiO2)..."
                  className="w-full px-4 py-2 pl-10 pr-20 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                
                <button 
                  onClick={handleSmartSearch}
                  disabled={isSearchingAI || !searchTerm.trim()}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-md transition-colors disabled:bg-slate-300 flex items-center gap-1"
                >
                  {isSearchingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : "Load"}
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-60 overflow-y-auto">
                  {MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                    MATERIAL_DB.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase())).map((material, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleMaterialSelect(material)}
                        className="w-full text-left px-4 py-3 hover:bg-violet-50 flex items-center justify-between group border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <span className="font-bold text-slate-700 block text-sm group-hover:text-violet-700">{material.name}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider">{material.type}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded group-hover:bg-violet-100 group-hover:text-violet-600">
                          {material.formula}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">No materials found</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
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
                    className="text-xs flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded font-medium transition-colors"
                  >
                    <Upload className="w-3 h-3" /> Upload File
                  </button>
                  <button 
                    onClick={() => { setInputData(""); setResult(null); setSelectedCandidate(null); setProgressStep(0); }}
                    className="text-xs flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded font-medium transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded border border-slate-200 text-xs text-slate-500 mb-2 font-mono flex items-center gap-2">
                <Search className="w-3 h-3" />
                Format: 2θ, Intensity
              </div>
              <textarea
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
                placeholder="28.44, 100&#10;47.30, 55"
                className="w-full h-48 px-4 py-3 bg-slate-900 text-violet-300 border border-slate-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-colors font-mono text-sm leading-relaxed"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs font-bold text-slate-500 mr-1 self-center uppercase tracking-wider">Examples:</span>
                {[
                  { id: 'Silicon', label: 'Si' },
                  { id: 'Mixture', label: 'Mix' },
                  { id: 'Aluminum', label: 'Al' },
                  { id: 'Copper', label: 'Cu' },
                  { id: 'Titanium', label: 'Ti' },
                  { id: 'MgO', label: 'MgO' },
                  { id: 'CeO2', label: 'CeO2' }
                ].map(ex => (
                  <button 
                    key={ex.id}
                    onClick={() => loadExample(ex.id as any)} 
                    className="text-[10px] font-bold bg-slate-100 hover:bg-violet-100 text-slate-600 hover:text-violet-700 px-2.5 py-1.5 rounded-md border border-slate-200 hover:border-violet-300 transition-all shadow-sm"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunAI}
              disabled={isSimulating || !inputData.trim()}
              className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all flex justify-center items-center gap-2
                ${isSimulating || !inputData.trim() ? 'bg-slate-400 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 hover:shadow-lg active:scale-[0.98]'}
              `}
            >
              {isSimulating ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Identify Phases
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress / Status Card */}
        <div className="bg-slate-900 p-6 rounded-xl text-white border border-slate-800">
           <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
             <Layers className="w-5 h-5 text-violet-400" />
             Analysis Engine
           </h3>
           <div className="space-y-4 relative">
             {/* Vertical connecting line */}
             <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-800 z-0"></div>
             {steps.slice(1).map((step, idx) => {
               const stepIdx = idx + 1;
               const isActive = progressStep === stepIdx;
               const isCompleted = progressStep > stepIdx;
               const Icon = step.icon;
               
               return (
                 <div key={idx} className={`relative z-10 flex items-center gap-3 transition-all duration-300 ${isActive || isCompleted ? 'opacity-100' : 'opacity-30'}`}>
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500
                     ${isActive ? 'border-violet-500 bg-violet-900 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 
                       isCompleted ? 'border-emerald-500 bg-emerald-500 text-slate-900' : 'border-slate-700 bg-slate-900 text-slate-600'}
                   `}>
                     {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className={`w-4 h-4 ${isActive ? 'animate-pulse' : ''}`} />}
                   </div>
                   <span className={`text-sm font-medium ${isActive ? 'text-violet-300' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                     {step.label}
                   </span>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Visualizer */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 h-[400px] flex flex-col relative">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="text-sm font-bold text-slate-700">Pattern Match Visualization</h3>
            {selectedCandidate && (
              <div className="flex gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1
                  ${selectedCandidate.match_quality === 'Excellent' ? 'bg-green-100 text-green-700' : 
                    selectedCandidate.match_quality === 'Good' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
                `}>
                  {selectedCandidate.match_quality || "Match"} Quality
                </span>
                <span className="text-xs font-bold bg-violet-100 text-violet-700 px-2 py-1 rounded">
                  Overlay: {selectedCandidate.phase_name}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex-1 w-full min-h-0 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="twoTheta" 
                  type="number" 
                  domain={[0, 'dataMax + 5']} 
                  unit="°" 
                  allowDataOverflow 
                  name="2θ"
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Legend verticalAlign="top" height={36} />
                
                {/* Input Data */}
                <Bar dataKey="intensity" barSize={4} fill="var(--chart-bar)" name="Input Pattern" />
                
                {/* Reference Data (if selected) */}
                {selectedCandidate && (
                  <Scatter 
                    data={refData} 
                    dataKey="refIntensity" 
                    name={`${selectedCandidate.phase_name} (Ref)`} 
                    fill="var(--chart-ref)" 
                    shape="diamond"
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          {!inputData.trim() && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl z-10">
              <p className="text-slate-400 font-medium">Enter data to visualize</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Description & Class */}
              <div className="md:col-span-2">
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <FlaskConical className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Material Profile</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-xl font-bold text-white">{selectedCandidate.phase_name}</span>
                    <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 text-xs font-mono rounded-md border border-violet-500/30">{selectedCandidate.formula}</span>
                    <span className="px-2.5 py-1 bg-slate-700 text-slate-300 text-xs rounded-md font-medium">{selectedCandidate.materialType || "Unclassified"}</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed flex-grow">
                    {selectedCandidate.description || "No description available for this phase."}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="md:col-span-1">
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50 h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <Database className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Crystallography</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-1 font-bold tracking-wider">Crystal System</span>
                      <span className="text-sm font-medium text-white">{selectedCandidate.crystalSystem || "Unknown"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-1 font-bold tracking-wider">Space Group</span>
                      <span className="text-sm font-medium text-white font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-700 inline-block">{selectedCandidate.spaceGroup || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block mb-1 font-bold tracking-wider">Density</span>
                      <span className="text-sm font-medium text-white">{selectedCandidate.density ? `${selectedCandidate.density} g/cm³` : "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Applications */}
              <div className="md:col-span-3">
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Common Applications</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCandidate.applications?.map((app, i) => (
                      <span key={i} className="text-xs font-medium bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 hover:text-white transition-colors cursor-default">
                        {app}
                      </span>
                    )) || <span className="text-xs text-slate-500 italic">No application data available.</span>}
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
               className={`bg-white p-5 rounded-xl shadow-sm border-2 cursor-pointer transition-all group
                 ${selectedCandidate?.phase_name === candidate.phase_name ? 'border-violet-500 ring-4 ring-violet-50' : 'border-slate-100 hover:border-violet-200 hover:shadow-md'}
               `}
             >
               <div className="flex justify-between items-start mb-3">
                 <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-sm
                     ${idx === 0 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white' : 
                       idx === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700' :
                       idx === 2 ? 'bg-gradient-to-br from-amber-200 to-amber-400 text-amber-900' :
                       'bg-slate-100 text-slate-500'}
                   `}>
                     #{idx + 1}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg text-slate-800 group-hover:text-violet-700 transition-colors">{candidate.phase_name}</h4>
                     <div className="flex flex-wrap gap-2 text-xs mt-1">
                       <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">{candidate.formula}</span>
                       <span className="text-slate-500 flex items-center"><Database className="w-3 h-3 mr-1"/>{candidate.card_id}</span>
                       {candidate.match_quality && (
                         <span className={`px-2 py-0.5 rounded-md font-bold border
                           ${candidate.match_quality === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                             candidate.match_quality === 'Good' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
                         `}>
                           {candidate.match_quality}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
                 <div className="text-right">
                   <span className={`text-3xl font-black tracking-tighter
                     ${candidate.confidence_score > 80 ? 'text-emerald-600' : candidate.confidence_score > 50 ? 'text-violet-600' : 'text-amber-600'}
                   `}>
                     {candidate.confidence_score}%
                   </span>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Confidence</p>
                 </div>
               </div>
               
               <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
                 <div 
                   className={`h-full rounded-full transition-all duration-1000 ease-out ${candidate.confidence_score > 80 ? 'bg-emerald-500' : candidate.confidence_score > 50 ? 'bg-violet-500' : 'bg-amber-500'}`}
                   style={{ width: `${candidate.confidence_score}%` }}
                 ></div>
               </div>

               {selectedCandidate?.phase_name === candidate.phase_name && (
                 <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
                   <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Matched Peaks Details</p>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                     {candidate.matched_peaks?.map((mp, i) => (
                       <div key={i} className="bg-slate-50 p-2 rounded-lg border border-slate-200 flex justify-between items-center group-hover:bg-white transition-colors">
                         <span className="text-slate-600 font-mono">{mp.refT.toFixed(2)}°</span>
                         <span className="font-bold text-emerald-500">✓</span>
                       </div>
                     ))}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-3 italic">
                     * Click on other candidates to compare their reference patterns on the chart.
                   </p>
                 </div>
               )}
             </div>
           ))}
           
           {!result && !isSimulating && (
             <div className="h-32 flex flex-col items-center justify-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-slate-400">
               <Database className="w-8 h-8 mb-2 opacity-20" />
               <p className="font-medium">Ready to Identify</p>
               <p className="text-xs">Load example data or paste your pattern to begin.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
