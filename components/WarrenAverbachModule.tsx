import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseWAInput, calculateWarrenAverbach } from '../utils/physics';
import { WAResult, WAMetrics } from '../types';
import { ScientificMathControl } from './ScientificMathControl';
import { DislocationMetricsVisualizer } from './DislocationMetricsVisualizer';
import { WarrenAverbachMetricsSummary } from './WarrenAverbachMetricsSummary';
import { WarrenAverbachPeakConverterModal } from './WarrenAverbachPeakConverterModal';
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine
} from 'recharts';
import {  
  Info, 
  BookOpen, 
  Activity, 
  TrendingDown, 
  Sparkles, 
  Loader2, 
  Atom, 
  Binary, 
  Ruler, 
  Zap, 
  Database, 
  Settings, 
  FlaskConical, 
  Network, 
  ChevronDown, 
  RefreshCw, 
  Trash2, 
  Download, 
  Layers,
  Wand2,
  Sliders,
  BarChart3,
  GitBranch,
  ShieldCheck,
  Flame,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from '@google/genai';

interface MaterialPreset {
  label: string;
  d1: number;
  d2: number;
  d3?: number;
  burgersVector: number; // nm
  youngsModulus: number; // GPa
  desc: string;
  data: string;
}

const MATERIAL_PRESETS: MaterialPreset[] = [
  { 
    label: 'Gold (Au) Nanocrystals', 
    d1: 2.3551, 
    d2: 1.1776,
    d3: 0.7850,
    burgersVector: 0.288,
    youngsModulus: 78,
    desc: 'FCC (111), (222), and (333) reflections',
    data: `# L[nm], A(d1), A(d2), A(d3)
1, 0.985, 0.952, 0.910
2, 0.960, 0.895, 0.820
3, 0.932, 0.835, 0.730
4, 0.901, 0.774, 0.640
5, 0.868, 0.712, 0.555
6, 0.832, 0.650, 0.475
8, 0.755, 0.530, 0.335
10, 0.680, 0.425, 0.225
12, 0.605, 0.330, 0.145
15, 0.500, 0.215, 0.070
20, 0.360, 0.095, 0.015
25, 0.240, 0.035, 0.002`
  },
  { 
    label: 'Copper (Cu) ECAP Deformed', 
    d1: 2.0871, 
    d2: 1.0435,
    burgersVector: 0.256,
    youngsModulus: 128,
    desc: 'High dislocation density FCC (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.970, 0.885
2, 0.925, 0.770
3, 0.875, 0.665
4, 0.820, 0.570
5, 0.765, 0.485
6, 0.710, 0.410
8, 0.605, 0.285
10, 0.510, 0.190
15, 0.330, 0.065
20, 0.200, 0.015
25, 0.110, 0.002`
  },
  { 
    label: 'Silicon (Si) SRM 640', 
    d1: 3.1355, 
    d2: 1.5678, 
    burgersVector: 0.384,
    youngsModulus: 130,
    desc: 'NIST Standard low-strain (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.995, 0.988
2, 0.988, 0.972
3, 0.980, 0.954
4, 0.971, 0.935
5, 0.962, 0.915
8, 0.930, 0.850
10, 0.905, 0.805
15, 0.835, 0.685
20, 0.755, 0.560
25, 0.670, 0.440
30, 0.585, 0.330`
  },
  { 
    label: 'Nickel (Ni) Ball-Milled', 
    d1: 2.0340, 
    d2: 1.0170, 
    burgersVector: 0.249,
    youngsModulus: 200,
    desc: 'Nanocrystalline Ni (111) & (222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.965, 0.870
2, 0.915, 0.745
3, 0.860, 0.630
4, 0.800, 0.525
5, 0.740, 0.435
8, 0.580, 0.235
10, 0.485, 0.145
15, 0.300, 0.040
20, 0.175, 0.008`
  },
  { 
    label: 'Stainless Steel 316L', 
    d1: 2.0780, 
    d2: 1.0390, 
    burgersVector: 0.254,
    youngsModulus: 193,
    desc: 'Austenitic work-hardened (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.960, 0.880
2, 0.910, 0.765
3, 0.855, 0.655
4, 0.798, 0.552
5, 0.740, 0.460
8, 0.585, 0.260
10, 0.490, 0.170
15, 0.315, 0.055
20, 0.190, 0.012`
  },
  { 
    label: 'Tungsten (W) Heavy Alloy', 
    d1: 2.2380, 
    d2: 1.1190, 
    burgersVector: 0.274,
    youngsModulus: 411,
    desc: 'BCC Refractory (110) & (220)',
    data: `# L[nm], A(d1), A(d2)
1, 0.975, 0.920
2, 0.940, 0.835
3, 0.900, 0.745
4, 0.855, 0.655
5, 0.810, 0.575
8, 0.680, 0.380
10, 0.595, 0.280
15, 0.420, 0.120
20, 0.285, 0.040`
  },
  { 
    label: 'Ceria (CeO2) Catalyst', 
    d1: 3.1240, 
    d2: 1.5620, 
    burgersVector: 0.383,
    youngsModulus: 220,
    desc: 'Fluorite oxide nanocrystals (111)/(222)',
    data: `# L[nm], A(d1), A(d2)
1, 0.975, 0.930
2, 0.935, 0.845
3, 0.885, 0.750
4, 0.835, 0.660
5, 0.780, 0.575
8, 0.630, 0.370
10, 0.535, 0.265
15, 0.350, 0.105
20, 0.215, 0.030`
  },
  { 
    label: 'Zinc Oxide (ZnO) Nanorods', 
    d1: 2.8140, 
    d2: 1.4070, 
    burgersVector: 0.325,
    youngsModulus: 140,
    desc: 'Wurtzite hexagonal (100)/(200)',
    data: `# L[nm], A(d1), A(d2)
1, 0.970, 0.920
2, 0.930, 0.830
3, 0.880, 0.735
4, 0.825, 0.640
5, 0.770, 0.550
8, 0.615, 0.340
10, 0.515, 0.230
15, 0.320, 0.075`
  }
];

export const WarrenAverbachModule: React.FC = () => {
  const [d1, setD1] = useState<number>(MATERIAL_PRESETS[0].d1);
  const [d2, setD2] = useState<number>(MATERIAL_PRESETS[0].d2);
  const [d3, setD3] = useState<number | undefined>(MATERIAL_PRESETS[0].d3);
  const [d4, setD4] = useState<number | undefined>(undefined);
  const [showOrder3, setShowOrder3] = useState<boolean>(true);
  const [showOrder4, setShowOrder4] = useState<boolean>(false);

  const [selectedMaterial, setSelectedMaterial] = useState<string>(MATERIAL_PRESETS[0].label);
  const [isMaterialMenuOpen, setIsMaterialMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [inputData, setInputData] = useState<string>(MATERIAL_PRESETS[0].data);
  const [result, setResult] = useState<WAResult | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [shapeFactor, setShapeFactor] = useState<number>(1.0);
  const [instrumentalCorrection, setInstrumentalCorrection] = useState<string>('Stokes');
  const [backgroundModel, setBackgroundModel] = useState<string>('Linear');
  const [strainModel, setStrainModel] = useState<string>('Dislocation (Wilkens)');
  const [hookCorrectionMode, setHookCorrectionMode] = useState<'linear_tangent' | 'polynomial' | 'none'>('linear_tangent');
  
  // Advanced Refinement Parameters
  const [instrumentalFactor, setInstrumentalFactor] = useState<number>(0.005);
  const [backgroundOffset, setBackgroundOffset] = useState<number>(0.02);
  const [cutoffRadiusValue, setCutoffRadiusValue] = useState<number>(50.0); // nm

  const [selectedDomainIndex, setSelectedDomainIndex] = useState<number>(0);
  const [selectedOrderPlotL, setSelectedOrderPlotL] = useState<number>(5);
  const [burgersVector, setBurgersVector] = useState<number>(MATERIAL_PRESETS[0].burgersVector);
  const [youngsModulus, setYoungsModulus] = useState<number>(MATERIAL_PRESETS[0].youngsModulus);

  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'size_pv' | 'strain_wilkens' | 'order_plots' | 'defect_topography' | 'metrics_report'>('size_pv');
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isDEstimatorOpen, setIsDEstimatorOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [calcMode, setCalcMode] = useState<'bragg' | 'bragghkl'>('bragg');
  const [calcLambda, setCalcLambda] = useState(1.5406);
  const [calc2Theta1, setCalc2Theta1] = useState(38.18);
  const [calc2Theta2, setCalc2Theta2] = useState(81.72);
  const [calcLatticeA, setCalcLatticeA] = useState(4.078);
  const [calcHKL1, setCalcHKL1] = useState('1 1 1');
  const [calcHKL2, setCalcHKL2] = useState('2 2 2');

  const handleReset = () => {
    const defaultPreset = MATERIAL_PRESETS[0];
    setD1(defaultPreset.d1);
    setD2(defaultPreset.d2);
    setD3(defaultPreset.d3);
    setD4(undefined);
    setShowOrder3(true);
    setShowOrder4(false);
    setSelectedMaterial(defaultPreset.label);
    setInputData(defaultPreset.data);
    setBurgersVector(defaultPreset.burgersVector);
    setYoungsModulus(defaultPreset.youngsModulus);
    setShapeFactor(1.0);
    setStrainModel('Dislocation (Wilkens)');
    setInstrumentalCorrection('Stokes');
    setBackgroundModel('Linear');
    setHookCorrectionMode('linear_tangent');
    setInstrumentalFactor(0.005);
    setBackgroundOffset(0.02);
    setCutoffRadiusValue(50.0);
  };

  const handleClear = () => {
    setInputData("");
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const header = "L_nm,A_size,P_V_L,RMS_Strain,MS_Strain\n";
    const rows = result.sizeDistribution.map((row, i) => {
      const strain = result.strainDistribution[i]?.rms_strain || 0;
      const msStrain = result.strainDistribution[i]?.ms_strain || 0;
      return `${row.L_nm.toFixed(2)},${row.A_size.toFixed(6)},${(row.Pv_L || 0).toFixed(6)},${strain.toExponential(6)},${msStrain.toExponential(6)}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warren_averbach_analysis_${selectedMaterial.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
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
        cutoffRadiusValue,
        hookCorrectionMode,
        showOrder3 ? d3 : undefined,
        showOrder4 ? d4 : undefined,
        burgersVector,
        youngsModulus
      );
      setResult(computed);
      setIsAnalyzing(false);
      
      // Auto-set selected order plot point if available
      if (computed.orderPlots && computed.orderPlots.length > 0) {
        const defaultPt = computed.orderPlots.find(p => p.L_nm >= 4) || computed.orderPlots[0];
        setSelectedOrderPlotL(defaultPt.L_nm);
      }

      setTimeout(() => {
        document.getElementById('wa-results-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 300);
  };

  // Run calculation on mount once
  useEffect(() => {
    handleCalculate();
  }, []);

  const handleSmartLoad = async () => {
    if (!searchQuery.trim()) return;
    setIsThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Generate realistic Fourier coefficients for Warren-Averbach XRD analysis of ${searchQuery}.
        Provide 10 data points sorted by L (column length in nm: 1, 2, 3, 4, 5, 6, 8, 10, 15, 20).
        For each point, provide:
        - L (column length in nm)
        - A1 (Fourier coefficient for the first reflection order d1, starting around 0.98 and decaying)
        - A2 (Fourier coefficient for the second order reflection d2, decaying faster due to microstrain)
        - A3 (Fourier coefficient for third order d3, decaying fastest)
        Make sure the decay is strictly monotonic and physically authentic.
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
                A2: { type: Type.NUMBER },
                A3: { type: Type.NUMBER }
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
        const header = "# L[nm], A(d1), A(d2), A(d3)\n";
        const formattedData = data.map((p: any) => {
          if (p.A3 !== undefined) {
            return `${p.L.toFixed(1)}, ${p.A1.toFixed(3)}, ${p.A2.toFixed(3)}, ${p.A3.toFixed(3)}`;
          }
          return `${p.L.toFixed(1)}, ${p.A1.toFixed(3)}, ${p.A2.toFixed(3)}`;
        }).join('\n');
        setInputData(header + formattedData);
        setSelectedMaterial(`AI: ${searchQuery}`);
      }
    } catch (error) {
      console.error("Error generating data:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const parsedPointsForMath = useMemo(() => {
    try {
      const pts = parseWAInput(inputData);
      const targetPt = pts.find(p => p.L_nm >= 5) || pts[0] || { L_nm: 5, A1: 0.85, A2: 0.70 };
      return targetPt;
    } catch {
      return { L_nm: 5, A1: 0.85, A2: 0.70 };
    }
  }, [inputData]);

  // Selected Order Plot Line for Regression Tab
  const activeOrderPlot = useMemo(() => {
    if (!result?.orderPlots) return null;
    return result.orderPlots.find(p => Math.abs(p.L_nm - selectedOrderPlotL) < 0.1) || result.orderPlots[0];
  }, [result, selectedOrderPlotL]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 items-start">
      
      {/* Input Configuration Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050914]/90 backdrop-blur-3xl p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative group transition-all z-20 ring-1 ring-white/10 ring-inset">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl border border-rose-500/30 text-rose-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300 tracking-tight font-sans">
                  WA Engine
                </h2>
                <p className="text-[10px] text-rose-400 mt-0.5 uppercase font-bold tracking-[0.2em] font-mono flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Warren-Averbach Suite
                </p>
              </div>
            </div>

            <button 
              onClick={handleReset}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-rose-500/30 transition-all flex items-center gap-2 font-mono shadow-sm"
              title="Reset config to default material"
            >
              <RefreshCw className="w-3 h-3" /> 
              <span>Reset</span>
            </button>
          </div>

          <div className="space-y-5 relative z-10">
            
            {/* Material Presets Selector */}
            <div className="p-4 rounded-2xl border border-white/5 bg-black/40 relative z-30">
              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono mb-2.5">
                Crystallographic Material Preset
              </label>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMaterialMenuOpen(!isMaterialMenuOpen)}
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 hover:border-rose-500/30 rounded-xl outline-none transition-all flex items-center justify-between shadow-inner"
                >
                  <span className="text-xs font-bold text-rose-400 truncate">
                    {selectedMaterial}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${isMaterialMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMaterialMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0A101C] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] py-2 backdrop-blur-3xl"
                    >
                      <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
                        {MATERIAL_PRESETS.map((m) => (
                          <button
                            key={m.label}
                            onClick={() => {
                              setSelectedMaterial(m.label);
                              setD1(m.d1);
                              setD2(m.d2);
                              if (m.d3) {
                                setD3(m.d3);
                                setShowOrder3(true);
                              } else {
                                setShowOrder3(false);
                              }
                              setBurgersVector(m.burgersVector);
                              setYoungsModulus(m.youngsModulus);
                              setInputData(m.data);
                              setIsMaterialMenuOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 flex flex-col items-start hover:bg-white/5 transition-colors text-left ${selectedMaterial === m.label ? 'bg-rose-500/10' : ''}`}
                          >
                            <span className={`text-xs font-bold ${selectedMaterial === m.label ? 'text-rose-400' : 'text-slate-200'}`}>
                              {m.label}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono mt-0.5">
                              {m.desc} (E={m.youngsModulus}GPa, b={m.burgersVector}nm)
                            </span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Quick Action Tools Bar: Peak Converter & AI Synthesizer */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setIsConverterOpen(true)}
                className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Peak to Fourier</span>
              </button>

              <button
                onClick={() => setIsDEstimatorOpen(!isDEstimatorOpen)}
                className="p-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Atom className="w-3.5 h-3.5" />
                <span>d-Spacing Tool</span>
              </button>
            </div>

            {/* AI Synthesizer */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  AI Material Generator
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., Cold-rolled Brass (70/30)"
                  className="flex-1 px-3.5 py-2 bg-black/60 text-slate-200 placeholder:text-slate-600 border border-white/10 rounded-xl text-xs font-sans outline-none focus:border-rose-500/40 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSmartLoad()}
                />
                <button
                  onClick={handleSmartLoad}
                  disabled={isThinking || !searchQuery.trim()}
                  className="px-3.5 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
                >
                  {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Reflection Orders d-Spacings */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5 text-rose-400" />
                  Reflection Orders (d-spacings)
                </label>
                <div className="flex gap-2 text-[9px] font-mono">
                  <button
                    onClick={() => setShowOrder3(!showOrder3)}
                    className={`px-2 py-0.5 rounded border transition-colors ${showOrder3 ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-black/40 border-white/10 text-slate-500'}`}
                  >
                    Order 3 (d₃)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono">d₁ (Order 1, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d1}
                    onChange={(e) => {
                      setD1(parseFloat(e.target.value) || 2.3551);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono">d₂ (Order 2, Å)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={d2}
                    onChange={(e) => {
                      setD2(parseFloat(e.target.value) || 1.1776);
                      setSelectedMaterial('Custom');
                    }}
                    className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                  />
                </div>

                {showOrder3 && (
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[9px] text-slate-500 font-mono">d₃ (Order 3, Å)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={d3 || ''}
                      placeholder="e.g. 0.7850"
                      onChange={(e) => {
                        setD3(parseFloat(e.target.value) || undefined);
                        setSelectedMaterial('Custom');
                      }}
                      className="w-full px-3 py-2 bg-black/60 text-rose-400 border border-white/10 rounded-xl text-xs font-mono font-bold outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Hook Effect & Advanced Physics Controls */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                  Physics & Hook Effect Controls
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Hook Correction</label>
                  <select
                    value={hookCorrectionMode}
                    onChange={(e) => setHookCorrectionMode(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-xs font-mono outline-none"
                  >
                    <option value="linear_tangent">Tangent Linearization</option>
                    <option value="polynomial">Monotonic Regularization</option>
                    <option value="none">Raw (No Hook Corr.)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Strain Model</label>
                  <select
                    value={strainModel}
                    onChange={(e) => setStrainModel(e.target.value)}
                    className="w-full px-2.5 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-xs font-mono outline-none"
                  >
                    <option value="Dislocation (Wilkens)">Wilkens Dislocation</option>
                    <option value="Gaussian">Gaussian Model</option>
                    <option value="Lorentzian">Lorentzian Model</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Inst. Broadening</label>
                  <select
                    value={instrumentalCorrection}
                    onChange={(e) => setInstrumentalCorrection(e.target.value)}
                    className="w-full px-2.5 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-xs font-mono outline-none"
                  >
                    <option value="Stokes">Stokes Deconvolution</option>
                    <option value="Voigt">Voigt Broadening</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 font-mono uppercase">Background</label>
                  <select
                    value={backgroundModel}
                    onChange={(e) => setBackgroundModel(e.target.value)}
                    className="w-full px-2.5 py-2 bg-black/60 text-slate-200 border border-white/10 rounded-xl text-xs font-mono outline-none"
                  >
                    <option value="Linear">Linear Baseline</option>
                    <option value="Spline">Exponential Decay</option>
                    <option value="None">None</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fourier Array Text Input */}
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-rose-400" />
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Fourier Harmonic Coefficients
                  </label>
                </div>
                <button
                  onClick={handleClear}
                  className="text-[9px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1 uppercase"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>

              <textarea
                value={inputData}
                onChange={(e) => {
                  setInputData(e.target.value);
                  setSelectedMaterial('Custom');
                }}
                className="w-full h-36 px-4 py-3 bg-black/60 text-rose-400 border border-white/10 rounded-xl font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-rose-500/40 custom-scrollbar shadow-inner"
                spellCheck={false}
              />
            </div>

            {/* Analyze Action Button */}
            <button
              onClick={handleCalculate}
              disabled={isAnalyzing}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-[0.2em] font-mono rounded-2xl shadow-xl shadow-rose-950/40 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Computing Harmonics...</span>
                </>
              ) : (
                <>
                  <FlaskConical className="w-4 h-4" />
                  <span>Execute Warren-Averbach Analysis</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Scientific Formulation Card */}
        <div className="bg-[#050914]/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/5 space-y-4 ring-1 ring-white/10 ring-inset">
          <div className="flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">
              Warren-Averbach Formalism
            </h3>
          </div>
          <div className="p-3.5 bg-black/60 rounded-xl border border-white/5 text-center font-mono text-xs text-emerald-400">
            ln A(L, s) = ln A_S(L) - 2π² L² ⟨ε²⟩_L s²
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            By plotting <span className="font-mono text-slate-300">ln A(L)</span> against <span className="font-mono text-slate-300">s² = 1/d²</span>, the intercept yields the pure size Fourier coefficient <span className="font-mono text-rose-400">A_S(L)</span>, while the slope yields the RMS microstrain <span className="font-mono text-cyan-400">⟨ε²⟩_L¹/²</span>.
          </p>
        </div>

      </div>

      {/* Results & Visual Analysis Column */}
      <div id="wa-results-section" className="lg:col-span-8 space-y-6">
        
        {/* Verification Control */}
        {result && (
          <ScientificMathControl
            title="Warren-Averbach Microstrain Harmonic Verification"
            formula="\langle \varepsilon_L^2 \rangle^{1/2} = \sqrt{\frac{\ln(A_1 / A_2)}{2 \pi^2 L^2 (1/d_2^2 - 1/d_1^2)}}"
            description="Deconvolve domain particle size from lattice microstrains across reflection orders."
            variables={[
              { symbol: 'A_1', name: 'Order 1 Harmonic', value: parsedPointsForMath.A1, unit: '' },
              { symbol: 'A_2', name: 'Order 2 Harmonic', value: parsedPointsForMath.A2, unit: '' },
              { symbol: 'L', name: 'Fourier Length', value: parsedPointsForMath.L_nm, unit: 'nm' },
              { symbol: 'd_1', name: 'd-spacing (Order 1)', value: d1, unit: 'Å' },
              { symbol: 'd_2', name: 'd-spacing (Order 2)', value: d2, unit: 'Å' }
            ]}
            result={
              (() => {
                const s1 = 1 / d1;
                const s2 = 1 / d2;
                const num = Math.log(parsedPointsForMath.A1 / parsedPointsForMath.A2);
                const den = 2 * Math.PI * Math.PI * parsedPointsForMath.L_nm * parsedPointsForMath.L_nm * (s2*s2 - s1*s1);
                return den !== 0 && num / den > 0 ? Math.sqrt(num / den) : 0;
              })()
            }
            resultUnit=""
            resultName="Calculated RMS Microstrain ⟨ε²⟩¹/²"
          />
        )}

        {/* Analysis Navigation Tabs */}
        <div className="bg-slate-950/80 p-2 rounded-2xl border border-white/5 flex flex-wrap gap-2 ring-1 ring-white/10 ring-inset">
          {[
            { id: 'size_pv', label: '1. Size & Column Length P_V(L)', icon: TrendingDown },
            { id: 'strain_wilkens', label: '2. Microstrain & Wilkens Model', icon: Activity },
            { id: 'order_plots', label: '3. Harmonic Order Plots ln A vs 1/d²', icon: BarChart3 },
            { id: 'defect_topography', label: '4. Dislocation Topography', icon: Layers },
            { id: 'metrics_report', label: '5. Quantitative Report', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAnalysisTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveAnalysisTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Size Fourier Decay A_S(L) & Volume Distribution P_V(L) */}
        {activeAnalysisTab === 'size_pv' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <TrendingDown className="w-5 h-5 text-rose-400" />
                    Size Fourier Coefficients A_S(L) & Volume Distribution P_V(L)
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Initial tangent yields ⟨D⟩_A = {result?.metrics?.areaWeightedColumnLengthNm.toFixed(1)} nm · Mode crystallite diameter = {result?.metrics?.crystalliteSizeDistributionModeNm.toFixed(1)} nm
                  </p>
                </div>
              </div>

              {!result ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-xs">Computing Fourier profile...</span>
                </div>
              ) : (
                <div className="h-[420px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={result.sizeDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="sizeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        domain={[0, 1.05]}
                        label={{ value: 'Size Coefficient A_S(L)', angle: -90, position: 'insideLeft', fill: '#f43f5e', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 1.05]}
                        label={{ value: 'Normalized P_V(L) = L · d²A_S/dL²', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontFamily: 'monospace' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                      
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="A_size"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fill="url(#sizeGrad)"
                        name="A_size(L)"
                        activeDot={{ r: 6, fill: '#fff', stroke: '#f43f5e', strokeWidth: 2 }}
                      />

                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="Pv_L"
                        stroke="#38bdf8"
                        strokeWidth={2.5}
                        fill="url(#pvGrad)"
                        name="P_V(L) Column Distribution"
                        activeDot={{ r: 5, fill: '#fff', stroke: '#38bdf8', strokeWidth: 2 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: RMS Microstrain & Wilkens Model */}
        {activeAnalysisTab === 'strain_wilkens' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    RMS Microstrain ⟨ε²⟩_L¹/² vs Fourier Column Length L
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Wilkens Dislocation Density ρ = {result?.metrics?.dislocationDensity10_14.toFixed(2)} × 10¹⁴ m⁻² · Cutoff radius R_e = {result?.metrics?.wilkensCutoffRadiusNm.toFixed(1)} nm
                  </p>
                </div>
              </div>

              {!result ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-mono text-xs">Computing strain field...</span>
                </div>
              ) : (
                <div className="h-[420px] w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={result.strainDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="strainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                      <XAxis 
                        dataKey="L_nm" 
                        label={{ value: 'Column Length L [nm]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <YAxis 
                        tickFormatter={(val) => Number(val).toExponential(1)}
                        label={{ value: 'RMS Strain ⟨ε²⟩¹/²', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10, fontFamily: 'monospace' }}
                        tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                        formatter={(val: any) => Number(val).toExponential(4)}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="rms_strain" 
                        stroke="#06b6d4" 
                        strokeWidth={3} 
                        fill="url(#strainGrad)" 
                        name="RMS Strain ⟨ε²⟩¹/²" 
                        activeDot={{ r: 6, fill: '#fff', stroke: '#06b6d4', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Harmonic Order Regressions ln A(L) vs 1/d² */}
        {activeAnalysisTab === 'order_plots' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Multi-Reflection Order Regression: ln A(L) vs 1/d²
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Isolate Size (intercept at 1/d² → 0) and Microstrain (slope) for specific column length L
                  </p>
                </div>

                {result?.orderPlots && result.orderPlots.length > 0 && (
                  <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono text-slate-400">Select L:</span>
                    <select
                      value={selectedOrderPlotL}
                      onChange={(e) => setSelectedOrderPlotL(parseFloat(e.target.value))}
                      className="bg-transparent text-rose-400 text-xs font-mono font-bold outline-none cursor-pointer"
                    >
                      {result.orderPlots.map((op) => (
                        <option key={op.L_nm} value={op.L_nm} className="bg-[#0b1120] text-white">
                          L = {op.L_nm.toFixed(1)} nm
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {activeOrderPlot ? (
                <div className="space-y-4 relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Size Intercept A_S(L):</span>
                      <span className="text-rose-400 font-bold text-sm">{activeOrderPlot.A_size.toFixed(4)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">RMS Microstrain:</span>
                      <span className="text-cyan-400 font-bold text-sm">{activeOrderPlot.rms_strain.toExponential(3)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Regression R²:</span>
                      <span className="text-emerald-400 font-bold text-sm">{activeOrderPlot.r2.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="h-[360px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeOrderPlot.points} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis 
                          dataKey="s2" 
                          type="number"
                          domain={['dataMin - 0.1', 'dataMax + 0.1']}
                          label={{ value: '1 / d² [Å⁻²]', position: 'bottom', offset: 0, fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <YAxis 
                          dataKey="lnA" 
                          label={{ value: 'ln A(L, s)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0b1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '10px' }}
                        />
                        <Scatter dataKey="lnA" fill="#f43f5e" name="Observed Harmonic Point" />
                        <Line
                          type="linear"
                          dataKey="lnA"
                          stroke="#a855f7"
                          strokeWidth={2}
                          dot={false}
                          name="Order Regression Line"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-slate-500 font-mono text-xs">
                  Run calculation to view order regression plots.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Defect Topography & Microstrain Field */}
        {activeAnalysisTab === 'defect_topography' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-6 lg:p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 ring-inset">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 flex items-center gap-2.5 font-sans">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Crystallite Grain Defect & Strain Topography
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">
                    Localized microstructural lattice strain energy & dislocation arrangement
                  </p>
                </div>
              </div>

              {result && (
                <div className="w-full relative z-10">
                  {(() => {
                    const validStrains = result.strainDistribution.filter(d => d.rms_strain > 0 && Number.isFinite(d.rms_strain));
                    if (validStrains.length === 0) return <div className="text-slate-500 text-center text-sm font-mono py-10">No valid strain data</div>;

                    const activeIndex = Math.min(selectedDomainIndex, validStrains.length - 1);
                    const activeItem = validStrains[activeIndex >= 0 ? activeIndex : 0] || validStrains[0];
                    const b_m = burgersVector * 1e-9;
                    const L_m = activeItem.L_nm * 1e-9;
                    const dislDensity = activeItem.rms_strain > 0 ? (2 * Math.sqrt(3) * activeItem.rms_strain) / (L_m * b_m) : 0;
                    const strainEnergy = 1.5 * (youngsModulus * 1e9) * (activeItem.rms_strain ** 2);
                    const energyKJ = strainEnergy / 1000;

                    return (
                      <div className="space-y-6">
                        <DislocationMetricsVisualizer
                          dislDensity={dislDensity}
                          energyKJ={energyKJ}
                          burgersVectorNm={burgersVector}
                          youngsModulusGpa={youngsModulus}
                          columnLengthNm={activeItem.L_nm}
                          rmsStrain={activeItem.rms_strain}
                        />

                        {/* Interactive Sliders for Physical Constants */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-black/40 rounded-2xl border border-white/5">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Burgers Vector (b):</span>
                              <span className="text-rose-400 font-bold">{burgersVector.toFixed(3)} nm</span>
                            </div>
                            <input
                              type="range"
                              min="0.15"
                              max="0.45"
                              step="0.005"
                              value={burgersVector}
                              onChange={(e) => setBurgersVector(parseFloat(e.target.value))}
                              className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400">
                              <span>Young's Modulus (E):</span>
                              <span className="text-rose-400 font-bold">{youngsModulus} GPa</span>
                            </div>
                            <input
                              type="range"
                              min="40"
                              max="450"
                              step="5"
                              value={youngsModulus}
                              onChange={(e) => setYoungsModulus(parseInt(e.target.value))}
                              className="w-full accent-rose-500 h-1 bg-black/65 rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Quantitative Report */}
        {activeAnalysisTab === 'metrics_report' && result?.metrics && (
          <WarrenAverbachMetricsSummary
            metrics={result.metrics}
            result={result}
            materialName={selectedMaterial}
            d1={d1}
            d2={d2}
            d3={showOrder3 ? d3 : undefined}
            d4={showOrder4 ? d4 : undefined}
            burgersVector={burgersVector}
            youngsModulus={youngsModulus}
            onDownloadCSV={handleDownloadCSV}
          />
        )}

        {/* Tabular Data Indices Card */}
        <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[2.5rem] ring-1 ring-white/10 ring-inset border border-emerald-500/20 overflow-hidden relative shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-black/40 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-black/60 rounded-xl border border-emerald-500/30">
                <Network className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-slate-100 tracking-tight font-sans">
                  Harmonic Coefficients & Microstrain Indices
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold font-mono mt-0.5">
                  Tabulated Fourier Spectrum
                </p>
              </div>
            </div>

            {result && (
              <button
                onClick={handleDownloadCSV}
                className="text-[9px] font-bold font-mono uppercase tracking-widest text-slate-300 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-white/10 hover:border-emerald-500/30 transition-all flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-black/40 border-b border-white/5 font-mono">
                <tr>
                  <th className="px-6 py-4 font-bold">L [nm]</th>
                  <th className="px-6 py-4 font-bold">A_size (Fourier)</th>
                  <th className="px-6 py-4 font-bold">P_V(L) Dist.</th>
                  <th className="px-6 py-4 font-bold">RMS Strain ⟨ε²⟩¹/²</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs">
                {result && result.sizeDistribution.map((row, i) => (
                  <tr key={`${row.L_nm}-${i}`} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-300">
                      {row.L_nm.toFixed(1)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-rose-400">
                      {row.A_size.toFixed(5)}
                    </td>
                    <td className="px-6 py-3.5 text-cyan-400 font-medium">
                      {(row.Pv_L || 0).toFixed(4)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-400">
                      {result.strainDistribution[i]?.rms_strain ? result.strainDistribution[i].rms_strain.toExponential(4) : '0.0000e+0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Peak Profile to Fourier Converter Modal */}
      <WarrenAverbachPeakConverterModal
        isOpen={isConverterOpen}
        onClose={() => setIsConverterOpen(false)}
        wavelength={calcLambda}
        onApplyData={(dataStr, newD1, newD2) => {
          setInputData(dataStr);
          setD1(newD1);
          setD2(newD2);
          setSelectedMaterial('Custom (Transformed)');
        }}
      />

    </div>
  );
};
