import React, { useState, useEffect, useRef } from 'react';
import { parseWAInput, calculateWarrenAverbach } from '../utils/physics';
import { WAResult } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Info, BookOpen, Activity, TrendingDown, Sparkles, Loader2, Atom, Binary, ShieldQuestion, Ruler, Zap, Database, Settings, FlaskConical, Network, Component, ChevronDown, RefreshCw, Trash2, Download } from 'lucide-react';
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
    const points = parseWAInput(inputData);
    const computed = calculateWarrenAverbach(d1, d2, points);
    setResult(computed);
  };

  useEffect(() => {
    handleCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d1, d2, inputData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      {/* Input Configuration */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-[0_0_30px_rgba(244,63,94,0.05)] border border-rose-500/20 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl -translate-y-16 translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-rose-500 blur-md opacity-20" />
                <div className="p-2.5 bg-[#070D18] rounded-xl border border-rose-500/30 relative">
                  <Settings className="w-5 h-5 text-rose-400" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-widest uppercase">WA Config</h2>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-black tracking-widest">
                  Warren-Averbach Engine
                </p>
              </div>
            </div>
            <button 
              onClick={handleReset}
              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-1.5 mt-1 relative overflow-hidden group/btn"
              title="Reset config to defaults"
            >
              <RefreshCw className="w-3 h-3 group-hover/btn:rotate-180 transition-transform duration-500" /> Reset
            </button>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Material Presets */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all group/params shadow-inner relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 bg-gradient-to-br from-rose-500 to-orange-500 rounded-bl-full pointer-events-none group-hover/params:opacity-10 transition-opacity overflow-hidden"></div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">
                Material Preset
              </label>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-4 py-2.5 bg-[#0A101C] border border-white/10 hover:border-rose-500/40 rounded-lg outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-sm font-black text-rose-300">
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
                      className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-1"
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
                            className={`w-full px-4 py-3 flex flex-col items-start hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === m.label ? 'bg-rose-500/10' : ''}`}
                          >
                            <span className={`text-sm font-black ${selectedMaterial === m.label ? 'text-rose-400' : 'text-slate-300'}`}>
                              {m.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
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
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl ${selectedMaterial === 'Custom' ? 'bg-rose-500/10 text-rose-400' : 'text-slate-300'}`}
                      >
                        <span className="text-sm font-black">Custom Parameters</span>
                        <Settings className="w-3.5 h-3.5 opacity-50" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Smart Load Section */}
            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all group/smart shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Synthesis Engine
                </label>
              </div>
              <div className="flex gap-2 relative z-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Nanocrystalline Gold"
                  className="flex-1 px-4 py-2.5 bg-[#0A101C] text-rose-300 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none text-sm transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:from-[#0A101C] disabled:to-[#0A101C] disabled:text-slate-600 disabled:border-white/5 text-white font-black rounded-lg transition-all flex items-center gap-2 border border-rose-500/50 active:scale-95 shadow-[0_0_15px_rgba(244,63,94,0.3)] disabled:shadow-none"
                >
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 shrink-0 text-white" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
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
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-rose-300 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none font-mono text-sm transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase">Å</span>
                </div>
              </div>
              <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
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
                    className="w-full px-4 py-2.5 bg-[#0A101C] text-rose-300 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none font-mono text-sm transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase">Å</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-5 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner relative overflow-hidden">
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-rose-400" />
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Fourier Array
                  </label>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest font-mono">L[nm], A(d₁), A(d₂)</span>
                  </div>
                  <button 
                    onClick={handleClear}
                    className="text-[8px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded border border-red-500/30"
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
                  className="w-full h-40 px-5 py-4 bg-[#0A101C] text-rose-300 border border-white/10 rounded-lg focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500/50 outline-none font-mono text-xs leading-loose resize-none transition-all shadow-inner custom-scrollbar"
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
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 border border-slate-800 bg-[#0A101C] px-2 py-1.5 rounded-md text-nowrap">Load Test:</span>
                  <button
                    onClick={() => loadTestData('high-strain')}
                    className="flex-1 text-[8px] font-black uppercase tracking-widest text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 px-2 py-1.5 rounded-md border border-orange-500/30 transition-all text-center"
                  >
                    High Strain
                  </button>
                  <button
                    onClick={() => loadTestData('large-size')}
                    className="flex-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1.5 rounded-md border border-emerald-500/30 transition-all text-center"
                  >
                    Large Size
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <FlaskConical className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
              Analyze Data
            </button>
          </div>
        </div>

        {/* Scientific Context Card */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl p-6 rounded-[2rem] text-white border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -translate-y-16 -translate-x-16 group-hover:bg-rose-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-[#070D18] rounded-xl border border-rose-500/30">
              <BookOpen className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-widest uppercase">Context</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-1">Fourier Microstructure</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-3">
                <Atom className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Core Model</span>
              </div>
              <div className="bg-[#0A101C] py-3 px-4 rounded-lg font-mono text-[10px] text-emerald-400 border border-white/5 shadow-inner flex justify-center">
                <div className="inline-flex items-center gap-3 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span>ln A(L) = ln A_S(L) - 2π²L²ε² / d²</span>
                </div>
              </div>
            </div>

            <div className="bg-[#070D18] p-4 rounded-xl border border-white/5 hover:border-rose-500/30 transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Separation</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-mono font-bold uppercase tracking-widest">
                Uses Fourier coefficients from multiple reflection orders. The size contribution is independent of order (1/d²), while strain increases with it.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Chart 1: Size Coefficients */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group/size">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl group-hover/size:bg-rose-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-lg border border-rose-500/30">
                  <TrendingDown className="w-5 h-5 text-rose-400" />
                </div>
                Size Coefficients
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1">Fourier Distribution A_size(L)</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-rose-500/10 rounded-full border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase tracking-widest">
                  Validated Matrix
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Initialize Sequence Output</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.sizeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="sizeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length [L nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
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
                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="A_size" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#0f172a' }} 
                    name="A_size" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Chart 2: RMS Strain */}
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 h-[450px] flex flex-col relative overflow-hidden group/strain">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl group-hover/strain:bg-cyan-500/10 transition-all duration-1000"></div>
          
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg border border-cyan-500/30">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                Microstrain Distribution
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5 ml-1">RMS Displacement √⟨ε²⟩ vs L</p>
            </div>
            {result && (
               <div className="px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20 text-[10px] font-black text-cyan-400 uppercase tracking-widest">
                  Dynamic Strain Analysis
               </div>
            )}
          </div>

          {!result ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-3xl bg-black/20 gap-3">
                <Loader2 className="w-8 h-8 animate-pulse text-slate-700" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Awaiting Harmonic Computation</span>
             </div>
          ) : (
            <div className="flex-1 w-full min-h-0 min-w-0 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.strainDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="L_nm" 
                    label={{ value: 'Fourier Length [L nm]', position: 'bottom', offset: 0, fill: '#475569', fontSize: 10, fontWeight: 900, letterSpacing: '0.1em' }} 
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
                    cursor={{ stroke: '#334155', strokeWidth: 1 }}
                    formatter={(val: number) => val.toExponential(4)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rms_strain" 
                    stroke="#0891b2" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#0891b2', strokeWidth: 2, stroke: '#0f172a' }} 
                    name="RMS Strain" 
                    activeDot={{ r: 6, fill: '#fff', stroke: '#0891b2', strokeWidth: 3 }}
                    animationDuration={1500}
                    animationBegin={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-[#0A101C]/80 backdrop-blur-xl rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.05)] border border-emerald-500/20 overflow-hidden relative group/table hover:border-emerald-500/40 transition-all">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl group-hover/table:bg-emerald-500/10 transition-all duration-1000"></div>
          
          <div className="p-6 border-b border-white/5 bg-[#070D18] flex justify-between items-center relative z-10">
             <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-md opacity-20" />
                  <div className="p-2.5 bg-[#0A101C] rounded-xl border border-emerald-500/30 relative">
                    <Network className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-widest uppercase">Indices</h3>
                  <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black mt-1">Microstructural Tabulation</p>
                </div>
             </div>
             
             <div className="flex gap-3">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0A101C] rounded-lg border border-white/5 shadow-inner">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Sync Active</span>
               </div>
               {result && (
                 <button
                   onClick={handleDownloadCSV}
                   className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
                 >
                   <Download className="w-3 h-3" /> Export CSV
                 </button>
               )}
             </div>
          </div>
          <div className="overflow-x-auto relative z-10">
             <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-slate-500 uppercase tracking-[0.2em] bg-black/40 border-b border-white/5">
                   <tr>
                      <th className="px-8 py-5 font-black">L Parameter [nm]</th>
                      <th className="px-8 py-5 font-black">A_size (Fourier)</th>
                      <th className="px-8 py-5 font-black">RMS Strain Level</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs">
                   {result && result.sizeDistribution.map((row, i) => (
                      <tr key={`${row.L_nm}-${i}`} className="group hover:bg-[#070D18] transition-all duration-300">
                         <td className="px-8 py-4 font-black text-slate-300 border-l border-transparent group-hover:border-emerald-500/50 group-hover:pl-10 transition-all">
                            {row.L_nm.toFixed(1)}
                         </td>
                         <td className="px-8 py-4 font-black text-rose-400">
                            {row.A_size.toFixed(5)}
                         </td>
                         <td className="px-8 py-4 font-black text-cyan-400">
                            <span className="text-white">{(result.strainDistribution[i]?.rms_strain * 10000).toFixed(2)}</span> <span className="text-[10px] text-cyan-500/50 uppercase tracking-widest font-sans">× 10⁻⁴</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
             {!result && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-600 gap-4">
                   <Binary className="w-12 h-12 text-slate-800 animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Spectral Input</p>
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
