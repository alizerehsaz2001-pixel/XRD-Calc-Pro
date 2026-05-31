import React, { useState, useEffect, useRef } from 'react';
import { parseWAInput, calculateWarrenAverbach } from '../utils/physics';
import { WAResult } from '../types';
import { LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area } from 'recharts';
import {  Info, BookOpen, Activity, TrendingDown, Sparkles, Loader2, Atom, Binary, ShieldQuestion, Ruler, Zap, Database, Settings, FlaskConical, Network, Component, ChevronDown, RefreshCw, Trash2, Download , Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const MATERIAL_PRESETS = [
  { 
    label: 'Gold (Au)', 
    d1: 2.3551, 
    d2: 1.1776, 
    desc: '(111) and (222) reflections',
    data: "# L[nm], A(d1), A(d2)\n1, 0.98, 0.95\n2, 0.95, 0.88\n3, 0.92, 0.82\n4, 0.89, 0.76\n5, 0.86, 0.71\n8, 0.78, 0.58\n10, 0.73, 0.51\n15, 0.62, 0.36\n20, 0.53, 0.25"
  },
  { 
    label: 'Silicon (Si)', 
    d1: 3.1355, 
    d2: 1.5678, 
    desc: '(111) and (222) reflections',
    data: "# L[nm], A(d1), A(d2)\n1, 0.99, 0.98\n2, 0.98, 0.96\n3, 0.97, 0.94\n4, 0.96, 0.92\n5, 0.95, 0.90\n8, 0.92, 0.84\n10, 0.90, 0.80\n20, 0.80, 0.60"
  },
  { 
    label: 'Aluminum (Al)', 
    d1: 2.338, 
    d2: 1.169, 
    desc: '(111) and (222) reflections',
    data: "# L[nm], A(d1), A(d2)\n1, 0.97, 0.92\n2, 0.93, 0.84\n3, 0.89, 0.76\n4, 0.85, 0.69\n5, 0.81, 0.63\n8, 0.71, 0.48\n10, 0.64, 0.40\n15, 0.50, 0.25"
  },
  { 
    label: 'Copper (Cu)', 
    d1: 2.087, 
    d2: 1.0435, 
    desc: '(111) and (222) reflections',
    data: "# L[nm], A(d1), A(d2)\n1, 0.95, 0.88\n2, 0.89, 0.77\n3, 0.83, 0.67\n4, 0.78, 0.58\n5, 0.73, 0.51\n8, 0.61, 0.35\n10, 0.54, 0.27\n15, 0.41, 0.15"
  },
  { 
    label: 'Nickel (Ni)', 
    d1: 2.034, 
    d2: 1.017, 
    desc: '(111) and (222) reflections',
    data: "# L[nm], A(d1), A(d2)\n1, 0.94, 0.85\n2, 0.87, 0.72\n3, 0.81, 0.61\n4, 0.75, 0.52\n5, 0.70, 0.44\n8, 0.57, 0.28\n10, 0.49, 0.21\n15, 0.35, 0.10"
  },
  { label: 'Silver (Ag)', d1: 2.359, d2: 1.179, desc: '(111) and (222) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.96, 0.90\n2, 0.92, 0.81" },
  { label: 'Platinum (Pt)', d1: 2.265, d2: 1.132, desc: '(111) and (222) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.98, 0.94\n2, 0.95, 0.87" },
  { label: 'Iron (alpha-Fe)', d1: 2.027, d2: 1.0135, desc: '(110) and (220) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.93, 0.82\n2, 0.85, 0.68" },
  { label: 'MgO', d1: 2.106, d2: 1.053, desc: '(200) and (400) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.99, 0.97\n2, 0.98, 0.94" },
  { label: 'Zirconia (ZrO2)', d1: 2.966, d2: 1.483, desc: '(111) and (222) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.97, 0.93\n2, 0.94, 0.85" },
  { label: 'Zinc Oxide (ZnO)', d1: 2.814, d2: 1.407, desc: '(100) and (200) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.96, 0.91\n2, 0.92, 0.82" },
  { label: 'Ti-6Al-4V (alpha)', d1: 2.342, d2: 1.171, desc: '(101) and (202) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.92, 0.80\n2, 0.84, 0.65" },
  { label: 'Stainless Steel 316L', d1: 2.078, d2: 1.039, desc: '(111) and (222) reflections', data: "# L[nm], A(d1), A(d2)\n1, 0.94, 0.86\n2, 0.87, 0.74" }
];

export const WarrenAverbachModule: React.FC = () => {
  const [d1, setD1] = useState<number>(2.3551);
  const [d2, setD2] = useState<number>(1.1776);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setD1(MATERIAL_PRESETS[0].d1);
    setD2(MATERIAL_PRESETS[0].d2);
    setSelectedMaterial(MATERIAL_PRESETS[0].label);
    setInputData(defaultData);
    setShapeFactor(1.0);
    setStrainModel('Gaussian');
    setInstrumentalCorrection('Stokes');
    setBackgroundModel('Linear');
    setInstrumentalFactor(0.005);
    setBackgroundOffset(0.02);
    setCutoffRadiusValue(50.0);
  };

  const handleClear = () => {
    setInputData("");
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "L_nm,A_size,RMS_Strain\n";
    const rows = result.sizeDistribution.map((row, i) => {
      const strain = result.strainDistribution[i]?.rms_strain || 0;
      return `${row.L_nm.toFixed(2)},${row.A_size.toFixed(6)},${strain.toExponential(6)}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wa_analysis_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMaterialMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Default Data: Simulated coefficients for a nanomaterial
  const defaultData = `# L[nm], A(d1), A(d2)
1, 0.95, 0.90
2, 0.90, 0.81
3, 0.85, 0.73
4, 0.80, 0.66
5, 0.76, 0.59
6, 0.72, 0.53
8, 0.65, 0.43
10, 0.58, 0.35
15, 0.42, 0.20
20, 0.30, 0.11
25, 0.21, 0.05`;

  const [inputData, setInputData] = useState<string>(defaultData);
  const [result, setResult] = useState<WAResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [shapeFactor, setShapeFactor] = useState<number>(1.0);
  const [instrumentalCorrection, setInstrumentalCorrection] = useState<string>('Stokes');
  const [backgroundModel, setBackgroundModel] = useState<string>('Linear');
  const [strainModel, setStrainModel] = useState<string>('Gaussian');
  
  // Advanced Refinement Parameters
  const [instrumentalFactor, setInstrumentalFactor] = useState<number>(0.005);
  const [backgroundOffset, setBackgroundOffset] = useState<number>(0.02);
  const [cutoffRadiusValue, setCutoffRadiusValue] = useState<number>(50.0); // nm

  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);
  const [burgersVector, setBurgersVector] = useState<number>(0.25); // nm
  const [youngsModulus, setYoungsModulus] = useState<number>(110); // GPa

  const [isDEstimatorOpen, setIsDEstimatorOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [calcMode, setCalcMode] = useState<'bragg' | 'bragghkl'>('bragg');
  const [calcLambda, setCalcLambda] = useState(1.5406);
  const [calc2Theta1, setCalc2Theta1] = useState(38.18); // Gold 111 example
  const [calc2Theta2, setCalc2Theta2] = useState(81.72);
  const [calcLatticeA, setCalcLatticeA] = useState(4.078);
  const [calcHKL1, setCalcHKL1] = useState('1 1 1');
  const [calcHKL2, setCalcHKL2] = useState('2 2 2');

  const loadTestData = (type: 'high-strain' | 'large-size') => {
    if (type === 'high-strain') {
      setInputData(`# L[nm], A(d1), A(d2)\n1, 0.96, 0.75\n2, 0.92, 0.60\n3, 0.88, 0.45\n4, 0.84, 0.35\n5, 0.80, 0.25\n6, 0.77, 0.18\n8, 0.71, 0.08\n10, 0.65, 0.03\n15, 0.50, 0.01\n20, 0.35, 0.00`);
    } else {
      setInputData(`# L[nm], A(d1), A(d2)\n1, 0.99, 0.98\n2, 0.98, 0.96\n3, 0.97, 0.94\n4, 0.96, 0.92\n5, 0.95, 0.90\n6, 0.94, 0.88\n8, 0.92, 0.84\n10, 0.90, 0.80\n15, 0.85, 0.70\n20, 0.80, 0.60\n25, 0.75, 0.50`);
    }
  };

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic Fourier coefficients for Warren-Averbach analysis of ${searchQuery}.
        Provide 8 to 12 data points. For each point, provide:
        - L (column length in nm, starting from 1 or 2, increasing)
        - A1 (Fourier coefficient for the first reflection, e.g., 111, starting near 1.0 and decaying)
        - A2 (Fourier coefficient for the second order reflection, e.g., 222, starting near 1.0 but decaying faster than A1)
        Make sure the decay is physically realistic (A2 decays faster due to strain).
        Return ONLY a JSON array of objects.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                L: { type: Type.NUMBER },
                A1: { type: Type.NUMBER },
                A2: { type: Type.NUMBER }
              },
              required: ["L", "A1", "A2"]
            }
          }
        }
      });

      if (response.text) {
        let rawText = response.text;
        rawText = rawText.replace(/```json\n?/g, "").replace(/\n?```/g, "").trim();
        const data = JSON.parse(rawText);
        const header = "# L[nm], A(d1), A(d2)\n";
        const formattedData = data.map((p: any) => `${p.L.toFixed(1)}, ${p.A1.toFixed(3)}, ${p.A2.toFixed(3)}`).join('\n');
        setInputData(header + formattedData);
      }
    } catch (error: any) {
      console.error("Error generating data:", error);
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      const isQuota = errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED');
      const isPermission = errorStr.includes('403') || errorStr.includes('PERMISSION_DENIED') || errorStr.includes('permission');
      
      if (isQuota) {
        alert("Neural link quota exhausted. Please wait for buffer reset.");
      } else if (isPermission) {
        alert("Neural link access restricted (403). Permission denied for AI data generation.");
      }
    } finally {
      setIsThinking(false);
    }
  };

  const handleCalculate = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const points = parseWAInput(inputData);
      const computed = calculateWarrenAverbach(
        d1, 
        d2, 
        points, 
        shapeFactor, 
        strainModel,
        instrumentalCorrection,
        backgroundModel,
        instrumentalFactor,
        backgroundOffset,
        cutoffRadiusValue
      );
      setResult(computed);
      setIsAnalyzing(false);
      
      // Allow DOM to update then scroll
      setTimeout(() => {
        document.getElementById('wa-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 600);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050914]/90 backdrop-blur-3xl p-6 lg:p-8 rounded-[2rem] border border-white/5 shadow-2xl relative group transition-all z-20">
          <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          </div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400 relative">
                  <Settings className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-medium text-slate-100 tracking-tight font-sans">WA Config</h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest font-mono">
                  Warren-Averbach Engine
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-white/10 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn font-mono"
              title="Reset config to defaults"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Material Presets */}
            <div className={`p-5 rounded-2xl border transition-all relative ${isMaterialMenuOpen ? "border-rose-500/30 bg-black/60 z-[100] shadow-2xl shadow-rose-900/20" : "border-white/5 bg-black/40 hover:border-white/10 z-10"}`}>
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-bl-full pointer-events-none group-hover/params:opacity-10 transition-opacity overflow-hidden"></div>
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-3">
                Material Preset
              </label>
              <div className="relative z-[100]" ref={menuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 hover:border-white/10 rounded-lg outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-sm font-bold text-rose-400">
                    {selectedMaterial}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMaterialMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A101C] border border-white/10 rounded-xl shadow-[0_30px_70px_rgba(0,0,0,0.9)] overflow-hidden z-[100] py-2 backdrop-blur-3xl"
                    >
                      <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {MATERIAL_PRESETS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => {
                              setSelectedMaterial(m.label);
                              setD1(m.d1);
                              setD2(m.d2);
                              if (m.data) setInputData(m.data);
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 flex flex-col items-start hover:bg-white/5 transition-colors ${selectedMaterial === m.label ? 'bg-rose-500/10' : ''}`}
                          >
                            <span className={`text-sm font-bold ${selectedMaterial === m.label ? 'text-rose-400' : 'text-slate-300'}`}>
                              {m.label}
                            </span>
                            <span className="text-[9px] text-slate-500 font-bold font-mono uppercase tracking-widest mt-0.5">
                              {m.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMaterial('Custom');
                          setIsMaterialMenuOpen(false);
                        }}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors border-t border-white/5 mt-1 ${selectedMaterial === 'Custom' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-300'}`}
                      >
                        <span className="text-sm font-bold">Custom Parameters</span>
                        <Settings className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Smart Load Section */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/smart shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Synthesis Engine
                </label>
              </div>
              <div className="flex gap-2 relative z-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Nanocrystalline Gold"
                  className="flex-1 px-4 py-2.5 bg-black/60 text-rose-400 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-white/20 outline-none text-sm transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:from-[#0A101C] disabled:to-[#0A101C] disabled:text-slate-600 disabled:border-white/5 text-white font-bold rounded-lg transition-all flex items-center gap-2 border border-white/20 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:shadow-none"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 shrink-0 text-white" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    d₁ (Peak 1)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={d1}
                    onChange={(e) => {
                      setD1(parseFloat(e.target.value));
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-4 py-2.5 bg-black/60 text-rose-400 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-white/20 outline-none font-mono text-sm transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-mono text-slate-500 uppercase">Å</span>
                </div>
              </div>
              <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    d₂ (Peak 2)
                  </label>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.0001"
                    value={d2}
                    onChange={(e) => {
                      setD2(parseFloat(e.target.value));
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-4 py-2.5 bg-black/60 text-rose-400 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-white/20 outline-none font-mono text-sm transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-mono text-slate-500 uppercase">Å</span>
                </div>
              </div>
            </div>

            {/* Advanced d-Spacing Estimator */}
            {/* Advanced Analytical Parameters */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all space-y-4 relative z-0">
              <div className="flex items-center gap-2 mb-2">
                 <Settings className="w-3.5 h-3.5 text-rose-400" />
                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                   Refinement Parameters
                 </label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Shape Factor (K)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={shapeFactor}
                    onChange={(e) => setShapeFactor(parseFloat(e.target.value) || 1.0)}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:border-white/20 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Strain Model</label>
                  <select
                    value={strainModel}
                    onChange={(e) => setStrainModel(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:border-white/20 transition-all shadow-inner"
                  >
                    <option value="Gaussian">Gaussian</option>
                    <option value="Lorentzian">Lorentzian</option>
                    <option value="Dislocation (Wilkens)">Wilkens Disl.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Inst. Broadening</label>
                  <select
                    value={instrumentalCorrection}
                    onChange={(e) => setInstrumentalCorrection(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:border-white/20 transition-all shadow-inner"
                  >
                    <option value="Stokes">Stokes Deconv</option>
                    <option value="Voigt">Voigt Func</option>
                    <option value="None">None</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Background</label>
                  <select
                    value={backgroundModel}
                    onChange={(e) => setBackgroundModel(e.target.value)}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:border-white/20 transition-all shadow-inner"
                  >
                    <option value="Linear">Linear</option>
                    <option value="Spline">B-Spline</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Adjustable Advanced Refinement sliders */}
              {(instrumentalCorrection !== 'None' || backgroundModel !== 'None' || strainModel === 'Dislocation (Wilkens)') && (
                <div className="pt-4 border-t border-white/5 space-y-4">
                  {instrumentalCorrection !== 'None' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                        <span>Inst. Decay Factor (α)</span>
                        <span className="text-rose-400 font-mono font-bold">{instrumentalFactor.toFixed(4)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.001"
                        max="0.020"
                        step="0.001"
                        value={instrumentalFactor}
                        onChange={(e) => setInstrumentalFactor(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {backgroundModel !== 'None' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                        <span>Bkg Baseline Offset</span>
                        <span className="text-rose-400 font-mono font-bold">{backgroundOffset.toFixed(3)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.000"
                        max="0.150"
                        step="0.005"
                        value={backgroundOffset}
                        onChange={(e) => setBackgroundOffset(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}

                  {strainModel === 'Dislocation (Wilkens)' && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                        <span>Outer Cutoff Radius (Re)</span>
                        <span className="text-rose-400 font-mono font-bold">{cutoffRadiusValue.toFixed(1)} nm</span>
                      </div>
                      <input
                        type="range"
                        min="10.0"
                        max="150.0"
                        step="5.0"
                        value={cutoffRadiusValue}
                        onChange={(e) => setCutoffRadiusValue(parseFloat(e.target.value))}
                        className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative z-0">
              <button
                onClick={() => setIsDEstimatorOpen(!isDEstimatorOpen)}
                className="w-full text-[9px] font-bold text-slate-400 hover:text-rose-400 uppercase tracking-widest font-mono flex items-center justify-between transition-colors"
                title="Calculate d-spacing from peak angles or Miller indices"
              >
                <div className="flex items-center gap-2">
                  <Atom className="w-3.5 h-3.5" />
                  d-Spacing Calculator
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDEstimatorOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDEstimatorOpen && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 mt-4 border-t border-white/5 space-y-4">
                      {/* Calculator Modes */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setCalcMode('bragg')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest transition-all ${
                            calcMode === 'bragg' ? 'bg-rose-500/20 text-rose-400 border border-white/20' : 'bg-black/60 text-slate-500 border border-white/10'
                          }`}
                        >
                          From 2θ (Bragg Law)
                        </button>
                        <button
                          onClick={() => setCalcMode('bragghkl')}
                          className={`py-2 px-3 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest transition-all ${
                            calcMode === 'bragghkl' ? 'bg-rose-500/20 text-rose-400 border border-white/20' : 'bg-black/60 text-slate-500 border border-white/10'
                          }`}
                        >
                          From (hkl) + Lattice
                        </button>
                      </div>

                      {calcMode === 'bragg' ? (
                        <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-mono">Wavelength (λ) Å</label>
                              <input
                                type="number" step="0.0001"
                                value={calcLambda}
                                onChange={(e) => setCalcLambda(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none"
                              />
                            </div>
                            <div>
                               <div className="text-[9px] font-bold text-slate-500 font-mono uppercase tracking-widest mb-1.5 flex gap-2">Presets</div>
                               <div className="grid grid-cols-2 gap-1.5">
                                  <button onClick={() => setCalcLambda(1.5406)} className="text-[8px] py-2 bg-white/5 hover:bg-white/10 rounded font-mono text-slate-300 border border-white/5 uppercase">Cu Kα</button>
                                  <button onClick={() => setCalcLambda(1.7890)} className="text-[8px] py-2 bg-white/5 hover:bg-white/10 rounded font-mono text-slate-300 border border-white/5 uppercase">Co Kα</button>
                               </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-center font-mono">Peak 1 (2θ)</label>
                              <input
                                type="number" step="0.01"
                                value={calc2Theta1}
                                onChange={(e) => setCalc2Theta1(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none text-center"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-center font-mono">Peak 2 (2θ)</label>
                              <input
                                type="number" step="0.01"
                                value={calc2Theta2}
                                onChange={(e) => setCalc2Theta2(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none text-center"
                              />
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const d_1 = calcLambda / (2 * Math.sin((calc2Theta1 / 2) * (Math.PI / 180)));
                                const d_2 = calcLambda / (2 * Math.sin((calc2Theta2 / 2) * (Math.PI / 180)));
                                setD1(parseFloat(d_1.toFixed(4)));
                                setD2(parseFloat(d_2.toFixed(4)));
                                setSelectedMaterial('Custom');
                              }}
                              className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[9px] tracking-widest font-mono uppercase rounded flex items-center justify-center gap-2 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" /> Compute & Apply Spacings
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4 bg-black/20 p-4 rounded-lg border border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block font-mono">Lattice (a) Å</label>
                              <input
                                type="number" step="0.0001"
                                value={calcLatticeA}
                                onChange={(e) => setCalcLatticeA(parseFloat(e.target.value))}
                                className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none"
                              />
                            </div>
                            <div className="flex flex-col justify-end">
                               <p className="text-[8px] text-slate-500 italic pb-1">Cubic crystal systems only.</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-center font-mono">Peak 1 (h k l)</label>
                                <input
                                  type="text" placeholder="e.g. 1 1 1"
                                  value={calcHKL1}
                                  onChange={(e) => setCalcHKL1(e.target.value)}
                                  className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none text-center"
                                />
                             </div>
                             <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block text-center font-mono">Peak 2 (h k l)</label>
                                <input
                                  type="text" placeholder="e.g. 2 2 2"
                                  value={calcHKL2}
                                  onChange={(e) => setCalcHKL2(e.target.value)}
                                  className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-lg text-xs font-mono outline-none text-center"
                                />
                             </div>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => {
                                const parseHKL = (str: string) => str.split(/\s+/).map(Number).filter(n => !isNaN(n));
                                const hkl1 = parseHKL(calcHKL1);
                                const hkl2 = parseHKL(calcHKL2);
                                if(hkl1.length === 3 && hkl2.length === 3) {
                                  const d_1 = calcLatticeA / Math.sqrt(hkl1[0]**2 + hkl1[1]**2 + hkl1[2]**2);
                                  const d_2 = calcLatticeA / Math.sqrt(hkl2[0]**2 + hkl2[1]**2 + hkl2[2]**2);
                                  setD1(parseFloat(d_1.toFixed(4)));
                                  setD2(parseFloat(d_2.toFixed(4)));
                                  setSelectedMaterial('Custom');
                                } else {
                                  alert("Please enter h k l values correctly space delimited.");
                                }
                              }}
                              className="w-full py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[9px] tracking-widest font-mono uppercase rounded flex items-center justify-center gap-2 transition-colors"
                            >
                              <Sparkles className="w-3 h-3" /> Compute & Apply Spacings
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all relative overflow-hidden z-0">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-rose-400" />
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Fourier Array
                  </label>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest font-mono">L[nm], A(d₁), A(d₂)</span>
                  </div>
                  <button 
                    onClick={handleClear}
                    className="text-[8px] font-bold font-mono text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/30"
                  >
                    <Trash2 className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              </div>
              
              <div className="relative group/textarea z-10">
                <textarea
                  value={inputData}
                  onChange={(e) => {
                    setInputData(e.target.value);
                    setSelectedMaterial('Custom');
                  }}
                  placeholder="L_nm, A(d1), A(d2)&#10;1, 0.95, 0.90&#10;2, 0.90, 0.81&#10;3, 0.85, 0.73"
                  className="w-full h-40 px-5 py-4 bg-black/60 text-rose-400 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-white/20 outline-none font-mono text-xs leading-loose resize-none transition-all shadow-inner custom-scrollbar"
                  spellCheck={false}
                />
              </div>
              
              <div className="mt-4 flex flex-col gap-3 relative z-10">
                <div className="flex items-start gap-2 text-[9px] font-bold text-slate-400 bg-black/40 p-2.5 rounded-lg border border-white/5">
                  <span className="leading-tight uppercase tracking-widest font-mono text-rose-500/80">
                     <span className="text-rose-500 mr-1">&gt;</span> Req: <span className="text-rose-400">L</span> (nm), <span className="text-rose-400">A(L)</span> ordered.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-400 border border-white/5 bg-black/60 px-2 py-1.5 rounded-md text-nowrap">Load Test:</span>
                  <button
                    onClick={() => loadTestData('high-strain')}
                    className="flex-1 text-[8px] font-bold font-mono uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1.5 rounded-md border border-orange-500/30 transition-all text-center"
                  >
                    High Strain
                  </button>
                  <button
                    onClick={() => loadTestData('large-size')}
                    className="flex-1 text-[8px] font-bold font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-md border border-emerald-500/30 transition-all text-center"
                  >
                    Large Size
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={isAnalyzing}
              className={`w-full py-4 uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${
                isAnalyzing 
                  ? 'bg-rose-500/50 text-white cursor-wait' 
                  : 'bg-white text-black hover:bg-rose-400 hover:text-black font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)]'
              }`}
            >
              {!isAnalyzing && <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />}
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <FlaskConical className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              )}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Data'}
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-slate-950/80 backdrop-blur-2xl p-8 rounded-[2.5rem] ring-1 ring-white/10 ring-inset text-white border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group hover:border-white/10 transition-all">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-16 -translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-black/40 rounded-xl border border-rose-500/30">
              <BookOpen className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium tracking-tight font-sans text-slate-100">Context</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold font-mono mt-1">Fourier Microstructure</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">
              <div className="flex items-center gap-2 mb-3">
                <Atom className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Core Model</span>
              </div>
              <div className="bg-black/60 py-3 px-4 rounded-lg font-mono text-[10px] text-emerald-400 border border-white/5 shadow-inner flex justify-center">
                <div className="inline-flex items-center gap-3 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span>ln A(L) = ln A_S(L) - 2π²L²ε² / d²</span>
                </div>
              </div>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all shadow-inner ring-1 ring-white/5 ring-inset backdrop-blur-md">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Separation</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono font-bold uppercase tracking-widest">
                Uses Fourier coefficients from multiple reflection orders. The size contribution is independent of order (1/d²), while strain increases with it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div id="wa-results-section" className="lg:col-span-8 space-y-6">
        
        {/* Chart 1: Size Coefficients */}
        <div className="bg-slate-950/80 p-8 rounded-[2rem] shadow-2xl border border-white/5 h-[450px] flex flex-col relative overflow-hidden group/size ring-1 ring-white/10 ring-inset backdrop-blur-2xl">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none group-hover/size:bg-rose-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-medium text-slate-100 flex items-center gap-3 tracking-tight font-sans">
                <div className="p-2 bg-rose-500/20 rounded-lg border border-white/10">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                Size Coefficients
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1 font-mono">Fourier Distribution A_size(L)</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 text-[9px] font-bold font-mono text-rose-400 uppercase tracking-widest">
                  Validated Matrix
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold font-mono uppercase tracking-widest text-[10px]">Initialize Sequence Output</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.sizeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="sizeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length L [nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    domain={[0, 1]} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#fb7185', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="A_size" 
                    stroke="#f43f5e" 
                    strokeWidth={3}
                    fill="url(#sizeGradient)"
                    name="A_size"
                    activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: RMS Strain */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group/strain">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl group-hover/strain:bg-cyan-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-medium text-slate-100 flex items-center gap-3 tracking-tight font-sans">
                <div className="p-2 bg-cyan-500/20 rounded-lg border border-white/10">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                Microstrain Distribution
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1 font-mono">RMS Displacement √⟨ε²⟩ vs L</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[9px] font-bold font-mono text-cyan-400 uppercase tracking-widest">
                  Dynamic Strain Analysis
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold font-mono uppercase tracking-widest text-[10px]">Awaiting Harmonic Computation</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.strainDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="strainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length L [nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(val) => val.toExponential(1)}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                    itemStyle={{ color: '#22d3ee', fontSize: '11px', fontWeight: 'bold' }}
                    labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '8px', fontWeight: 'bold' }}
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                    formatter={(val) => val.toExponential(4)}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rms_strain" 
                    stroke="#06b6d4" 
                    strokeWidth={3} 
                    fill="url(#strainGradient)"
                    name="RMS Strain" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        
        {/* Chart 3: Defect Heatmap */}
        <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2rem] shadow-2xl border border-white/5 flex flex-col relative overflow-hidden group/heatmap ring-1 ring-white/10 ring-inset backdrop-blur-2xl">
          <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none group-hover/heatmap:bg-purple-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-medium text-slate-100 flex items-center gap-3 tracking-tight font-sans">
                <div className="p-2 bg-purple-500/20 rounded-lg border border-white/10">
                  <Layers className="w-5 h-5 text-purple-400" />
                </div>
                Defect Topography
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1 font-mono">Microstrain Variance Heatmap</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20 text-[9px] font-bold font-mono text-purple-400 uppercase tracking-widest">
                  Active Dislocation Mapper
               </div>
            )}
          </div>

          {!result ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold font-mono uppercase tracking-widest text-[10px]">Awaiting Harmonic Computation</span>
              </div>
          ) : (
              <div className="w-full relative z-10">
                {(() => {
                  const validStrains = result.strainDistribution.filter(d => d.rms_strain > 0 && Number.isFinite(d.rms_strain));
                  if (validStrains.length === 0) return <div className="text-slate-500 text-center text-sm font-mono py-10">No valid strain data</div>;
                  
                  const maxStrain = Math.max(...validStrains.map(d => d.rms_strain));
                  const minStrain = Math.min(...validStrains.map(d => d.rms_strain));

                  // Ensure safe index mapping
                  const activeIndex = Math.min(selectedDomainIndex, validStrains.length - 1);
                  const activeItem = validStrains[activeIndex >= 0 ? activeIndex : 0] || validStrains[0];

                  // Physics Calculation constants
                  const b_m = burgersVector * 1e-9;
                  const L_m = activeItem.L_nm * 1e-9;
                  // Dislocation density estimation
                  const dislDensity = activeItem.rms_strain > 0 ? (2 * Math.sqrt(3) * activeItem.rms_strain) / (L_m * b_m) : 0;
                  // Hydrostatic Strain Energy estimation: WH = 3/2 * E * <e2>
                  const strainEnergy = 1.5 * (youngsModulus * 1e9) * (activeItem.rms_strain ** 2); // J/m3
                  const energyKJ = strainEnergy / 1000; // kJ/m3

                  // Defect Status categorization
                  let criticality = { label: "Stable coherent lattice", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", desc: "Minimal grain defects detected inside this domain zone." };
                  if (activeItem.rms_strain >= 0.001 && activeItem.rms_strain < 0.003) {
                    criticality = { label: "Defected grain slip", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", desc: "Moderate stacking fault density or dislocation slip bands." };
                  } else if (activeItem.rms_strain >= 0.003) {
                    criticality = { label: "Severely distorted zone", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", desc: "Severe localized lattice mismatch or dislocation pile-ups." };
                  }

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                      
                      {/* Left Side: Heatmap matrix of domains */}
                      <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                            Crystallite Domain Field View (Click domain nodes to analyze)
                          </span>
                          
                          {/* 2D Grid Representation of the domains */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {validStrains.map((item, index) => {
                              const delta = maxStrain - minStrain;
                              const normalized = delta > 0 ? (item.rms_strain - minStrain) / delta : 0;
                              // Cool mapping: blue/violet (low strain) to crimson/orange (high strain)
                              const hue = (1 - normalized) * 220; 
                              const isSelected = index === activeIndex;

                              return (
                                <button
                                  key={index}
                                  onClick={() => setSelectedDomainIndex(index)}
                                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-24 overflow-hidden group/cell ${
                                    isSelected 
                                      ? 'border-purple-500 bg-[#0C1123] shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30' 
                                      : 'border-white/5 bg-black/40 hover:border-white/20 hover:bg-black/60 shadow-inner'
                                  }`}
                                >
                                  {/* Dynamic color light pill */}
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full absolute top-3 right-3 animate-ping"
                                    style={{ backgroundColor: `hsl(${hue}, 85%, 50%)` }}
                                  />
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full absolute top-3 right-3 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                    style={{ backgroundColor: `hsl(${hue}, 85%, 50%)` }}
                                  />
                                  
                                  <div>
                                    <span className="text-[10px] font-mono text-slate-400 block font-bold tracking-tight">L Param</span>
                                    <span className="text-sm font-sans font-medium text-slate-100 tracking-tight">
                                      {item.L_nm.toFixed(1)} nm
                                    </span>
                                  </div>

                                  <div className="text-[9px] font-mono text-slate-400 mt-2 flex justify-between items-center w-full">
                                    <span>⟨ε²⟩:</span>
                                    <span className="font-bold text-slate-200">
                                      {(item.rms_strain * 1000).toFixed(2)}m
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Color Legend */}
                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <div className="flex justify-between items-center text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                            <span>Rel. Strain Variance scale (⟨ε²⟩)</span>
                            <div className="flex gap-4">
                              <span>Low ({minStrain.toExponential(1)})</span>
                              <span>High ({maxStrain.toExponential(1)})</span>
                            </div>
                          </div>
                          
                          {/* Continuous gradient element with current value pointer */}
                          <div className="relative">
                            <div className="w-full h-3 rounded-full bg-gradient-to-r from-[hsl(220,80%,45%)] via-[hsl(120,80%,45%)] to-[hsl(0,80%,45%)] opacity-90 border border-white/5 shadow-inner"></div>
                            
                            {/* Current selection tick marker */}
                            {activeItem && (
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-950 shadow-lg flex items-center justify-center -ml-2 transition-all duration-300"
                                style={{
                                  left: `${
                                    maxStrain - minStrain > 0 
                                      ? Math.max(5, Math.min(95, ((activeItem.rms_strain - minStrain) / (maxStrain - minStrain)) * 100)) 
                                      : 50
                                  }%`
                                }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600"></div>
                              </div>
                            )}
                          </div>
                          <div className="text-[9px] font-bold font-mono text-slate-500 text-right uppercase tracking-widest mt-1">
                            Ordered by Fourier Column Length L
                          </div>
                        </div>

                      </div>

                      {/* Right Side: Crystallite Grain Defect Analyzer Sidebar */}
                      <div className="lg:col-span-5 bg-black/60 border border-white/5 rounded-2xl p-5 flex flex-col justify-between space-y-6 relative overflow-hidden shadow-inner backdrop-blur-md">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                              Grain Defect Analyzer
                            </span>
                            <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold font-mono uppercase tracking-wider ${criticality.color}`}>
                              {criticality.label}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-xl font-sans font-medium text-slate-100 tracking-tight">
                              Crystallite L = {activeItem.L_nm.toFixed(1)} nm
                            </p>
                            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                              {criticality.desc}
                            </p>
                          </div>

                          {/* Calculated Physical Estimates metrics */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                              <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest block">
                                Est. Dislocation Density
                              </span>
                              <span className="text-sm font-mono font-bold text-slate-100 block">
                                {dislDensity.toExponential(2)} <span className="text-[9px] font-sans text-slate-400 font-normal">m⁻²</span>
                              </span>
                            </div>

                            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1">
                              <span className="text-[8px] font-bold font-mono text-slate-500 uppercase tracking-widest block">
                                Stored Elastic Energy
                              </span>
                              <span className="text-sm font-mono font-bold text-slate-100 block">
                                {energyKJ.toFixed(2)} <span className="text-[9px] font-sans text-slate-400 font-normal">kJ/m³</span>
                              </span>
                            </div>
                          </div>

                          {/* Interactive adjustable tuning criteria sliders */}
                          <div className="space-y-3 pt-3 border-t border-white/5">
                            <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest block">
                              Physical Constants Tuning
                            </span>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Burgers Vector (b):</span>
                                <span className="text-slate-100 font-bold">{burgersVector.toFixed(2)} nm</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.15" 
                                max="0.40" 
                                step="0.01"
                                value={burgersVector}
                                onChange={(e) => setBurgersVector(parseFloat(e.target.value))}
                                className="w-full opacity-80 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 animate-none pointer-events-auto"
                              />
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                <span>Young's Modulus (E):</span>
                                <span className="text-slate-100 font-bold">{youngsModulus} GPa</span>
                              </div>
                              <input 
                                type="range" 
                                min="40" 
                                max="250" 
                                step="5"
                                value={youngsModulus}
                                onChange={(e) => setYoungsModulus(parseInt(e.target.value))}
                                className="w-full opacity-80 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500 animate-none pointer-events-auto"
                              />
                            </div>
                          </div>

                        </div>

                        {/* Quick Physical Description Footer */}
                        <div className="flex items-start gap-2 text-[9px] font-sans text-slate-500 leading-normal pt-2 border-t border-white/5">
                          <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                          <span>
                            Densities computed using standard crystallite shear models ρ = 2√3⟨ε²⟩¹/²/ (L · b). Fits gold, copper, silicon and oxide crystallites.
                          </span>
                        </div>

                      </div>

                    </div>
                  )
                })()}
              </div>
          )}
        </div>

{/* Data Table */}
        <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] ring-1 ring-white/10 ring-inset shadow-[0_0_30px_rgba(16,185,129,0.05)] border border-emerald-500/20 overflow-hidden relative group/table hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover/table:bg-emerald-500/10 transition-all duration-1000"></div>
          
          <div className="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center relative z-10">
             <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20" />
                  <div className="p-2.5 bg-black/60 rounded-xl border border-emerald-500/30 relative">
                    <Network className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-slate-100 tracking-tight font-sans">Indices</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono mt-1">Microstructural Tabulation</p>
                </div>
             </div>
             
             <div className="flex gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-lg border border-white/5 shadow-inner">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-widest">Sync Active</span>
               </div>
               {result && (
                 <button
                   onClick={handleDownloadCSV}
                   className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                 >
                   <Download className="w-3 h-3" /> Export CSV
                 </button>
               )}
             </div>
          </div>
          <div className="overflow-x-auto relative z-10">
             <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5 font-mono">
                   <tr>
                      <th className="px-8 py-5 font-bold tracking-widest">L Parameter [nm]</th>
                      <th className="px-8 py-5 font-bold tracking-widest">A_size (Fourier)</th>
                      <th className="px-8 py-5 font-bold tracking-widest">RMS Strain Level</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                   {result && result.sizeDistribution.map((row, i) => (
                      <tr key={`${row.L_nm}-${i}`} className="group hover:bg-black/40 transition-all duration-300">
                         <td className="px-8 py-4 font-bold text-slate-300 border-l border-transparent group-hover:border-emerald-500/50 group-hover:pl-10 transition-all">
                            {row.L_nm.toFixed(1)}
                         </td>
                         <td className="px-8 py-4 font-bold text-rose-400">
                            {row.A_size.toFixed(5)}
                         </td>
                         <td className="px-8 py-4 font-bold text-cyan-400">
                            <span className="text-white">{(result.strainDistribution[i]?.rms_strain * 10000).toFixed(2)}</span> <span className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-sans">× 10⁻⁴</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {!result && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                   <Binary className="w-12 h-12 text-slate-800 animate-pulse" />
                   <p className="text-[10px] font-bold font-mono uppercase tracking-widest">Awaiting Spectral Input</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
