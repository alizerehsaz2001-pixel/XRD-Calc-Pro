import React, { useState, useRef, useEffect } from 'react';
import { analyzeDiffractionImage, analyzeImageOCR, isQuotaError, isPermissionError, OCRAnalysisResult } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { 
  Camera, Upload, Search, FileText, Zap, 
  RotateCcw, Info, CheckCircle2, AlertCircle, 
  Cpu, Activity, Layers, Share2, Download,
  Sparkles, MousePointer2, Scan, Filter, History,
  Grid, CircleDot, SlidersHorizontal, Copy, Eye,
  Database, Sliders, Play, Shuffle, HelpCircle, Flame,
  Type, Table, ListFilter, FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';

// CV Diagnostic Logs component
const CVLoader: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const messages = [
      "Initializing high-resolution Google Gemini 3.6 OCR Vision feed...",
      "Normalizing image contrast and suppressing background artifacts...",
      "Extracting OCR text blocks, graph axes, and software annotations...",
      "Parsing 2-Theta peak tables and relative intensities...",
      "Cross-referencing candidate phase labels with ICDD/PDF card indices...",
      "Synthesizing structured crystallographic JSON & Markdown report..."
    ];
    
    let currentIdx = 0;
    setLogs([messages[0]]);
    
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < messages.length) {
        setLogs(prev => [...prev, messages[currentIdx]]);
      } else {
        clearInterval(interval);
      }
    }, 700);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-sky-500/20 shadow-[inset_0_0_30px_rgba(14,165,233,0.05)] relative overflow-hidden my-4">
      <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-sky-500 via-sky-450 to-transparent w-full animate-[shimmer_1.5s_infinite]" />
      
      <div className="flex items-center gap-3">
        <Cpu className="w-4 h-4 text-sky-400 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Google Gemini 3.6 OCR Engine Active</span>
      </div>

      <div className="space-y-2 font-mono text-[9px] text-sky-300 max-h-[140px] overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-sky-500 select-none">&gt;</span>
            <span className={i === logs.length - 1 ? 'text-sky-300 font-extrabold animate-pulse' : 'text-slate-500 font-medium'}>
              {log}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[8px] font-bold text-slate-600 uppercase tracking-widest">
         <span>Model: GEMINI 3.6 MULTIMODAL OCR</span>
         <span className="animate-pulse text-sky-500 font-mono font-black">SCANNING PATTERN</span>
      </div>
    </div>
  );
};

const OCR_PRESETS = [
  { 
    id: 'full_ocr', 
    label: 'Full Character OCR', 
    icon: Type, 
    prompt: 'Exhaustively transcribe all characters, numbers, graph labels, legend items, spectrum peak angles, and ICDD card numbers from this image.' 
  },
  { 
    id: 'table_extraction', 
    label: 'Peak Table Digitizer', 
    icon: Table, 
    prompt: 'Digitize all visible 2-theta peak angles, relative intensities (%), d-spacings, and hkl indices into a clean numerical markdown table.' 
  },
  { 
    id: 'label_phase', 
    label: 'Phase & PDF Cards', 
    icon: Layers, 
    prompt: 'Extract all candidate phase names, ICDD/PDF card entry numbers, chemical formulas, space groups, and Figure-of-Merit (FOM) scores.' 
  },
  { 
    id: 'axis_calibration', 
    label: 'Axis Calibration', 
    icon: Scan, 
    prompt: 'Identify the horizontal X-axis 2-theta minimum and maximum bounds, Y-axis intensity scale, and radiation source wavelength (e.g., Cu K-alpha = 1.5406 Angstrom).' 
  },
];

export const ImageAnalysisModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [history, setHistory] = useState<{context: string, result: string, date: string}[]>([]);
  
  // OCR & Multimodal States
  const [ocrMode, setOcrMode] = useState<'full_ocr' | 'table_extraction' | 'label_phase' | 'axis_calibration'>('full_ocr');
  const [structuredOcrData, setStructuredOcrData] = useState<OCRAnalysisResult['structuredData'] | null>(null);
  const [ocrSearchQuery, setOcrSearchQuery] = useState('');
  const [exportToast, setExportToast] = useState<string | null>(null);

  // Computer Vision Controls & Overlays
  const [cvFilter, setCvFilter] = useState<'none' | 'binarize' | 'grayscale' | 'negative' | 'contrast'>('none');
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  const [showRings, setShowRings] = useState(false);
  const [ringRadius, setRingRadius] = useState(100);
  const [ringSpacing, setRingSpacing] = useState(30);
  const [ringCount, setRingCount] = useState(3);
  const [copied, setCopied] = useState(false);

  // Python + OpenCV Vision Solver States
  const [analysisMode, setAnalysisMode] = useState<'neural' | 'python_cv'>('neural');
  const [cvResults, setCvResults] = useState<any>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<'original' | 'canny_edges' | 'spot_contours' | 'ring_fits' | 'radial_heatmap'>('original');
  const [rightPanelTab, setRightPanelTab] = useState<'report' | 'structured_ocr' | 'radial_profile' | 'tuning'>('report');
  
  // Adaptive vision hyperparameters
  const [cvParams, setCvParams] = useState({
    threshold: 85,
    prominence: 0.05,
    min_ring_distance: 6,
    spot_neighborhood: 15,
    spot_threshold_p: 93,
    canny_low: 40,
    canny_high: 120
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const [magnifier, setMagnifier] = useState<{x: number, y: number} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pythonFeaturesEnabled && analysisMode === 'python_cv') {
      setAnalysisMode('neural');
    }
  }, [pythonFeaturesEnabled, analysisMode]);

  useEffect(() => {
    if (result && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [result]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | undefined;
    if ('files' in e.target && e.target.files) {
      file = e.target.files?.[0];
    } else if ('dataTransfer' in (e as any)) {
      file = (e as React.DragEvent).dataTransfer.files?.[0];
    }

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(''); 
        setStructuredOcrData(null);
        setError(null);
        setActiveAnalysisId(null);
      };
      reader.readAsDataURL(file);
    }
    setIsDragOver(false);
  };

  const handleAnalyze = async (customPrompt?: string, presetId?: string, overrideMode?: any) => {
    if (!image) return;
    
    setLoading(true);
    setScanActive(true);
    setError(null);
    setResult('');
    setStructuredOcrData(null);
    if (presetId) setActiveAnalysisId(presetId);

    const activeMode = overrideMode || ocrMode;
    const finalPrompt = customPrompt || context || "Perform full Google Gemini 3.6 Multimodal OCR and scientific analysis on this image.";

    try {
      const ocrRes = await analyzeImageOCR(image, finalPrompt, activeMode);
      setResult(ocrRes.text);
      if (ocrRes.structuredData) {
        setStructuredOcrData(ocrRes.structuredData);
        setRightPanelTab('structured_ocr');
      } else {
        setRightPanelTab('report');
      }
      setHistory(prev => [{ context: finalPrompt, result: ocrRes.text, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch (err: any) {
      if (isQuotaError(err)) {
        setError("Quota exhausted (429/RESOURCE_EXHAUSTED). OCR Analysis unavailable.");
      } else if (isPermissionError(err)) {
        setError("Neural OCR access restricted (403). Check API key configuration.");
      } else {
        setError("Analysis Engine Fault: " + (err.message || "Check connectivity or image clarity."));
      }
    } finally {
      setLoading(false);
      setTimeout(() => setScanActive(false), 1000);
    }
  };

  const showToast = (msg: string) => {
    setExportToast(msg);
    setTimeout(() => setExportToast(null), 3000);
  };

  const handleExportPeaksCSV = () => {
    if (!structuredOcrData?.peaks?.length) return;
    const csvRows = ['2Theta_deg,Relative_Intensity_pct,dSpacing_A,hkl'];
    structuredOcrData.peaks.forEach(p => {
      csvRows.push(`${p.twoTheta},${p.intensity},${p.dSpacing || ''},${p.hkl || ''}`);
    });
    navigator.clipboard.writeText(csvRows.join('\n'));
    showToast('Extracted Peak Table copied as CSV to Clipboard!');
  };

  const handleExportPhases = () => {
    if (!structuredOcrData?.phases?.length) return;
    const text = structuredOcrData.phases.map(p => `${p.phaseName} | PDF: ${p.pdfNumber || 'N/A'} | Space Group: ${p.spaceGroup || 'N/A'} | FOM: ${p.fom || 'N/A'}`).join('\n');
    navigator.clipboard.writeText(text);
    showToast('Detected Phase List copied to Clipboard!');
  };

  const handleAnalyzeCV = async (overrideParams?: any) => {
    if (!image) return;
    
    setLoading(true);
    setScanActive(true);
    setError(null);
    setCvResults(null);

    try {
      const activeParams = overrideParams || cvParams;
      const response = await fetch("/api/image/analyze-cv", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          image,
          params: activeParams
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Computer Vision solver failed");
      }

      setCvResults(data);
      setResult(data.report_md); // Sync markdown report with active result viewer
      setActiveFilterTab('canny_edges'); // Default filter display
      
      setHistory(prev => [{ 
        context: "Python OpenCV Vision Core Run", 
        result: data.report_md, 
        date: new Date().toLocaleTimeString() 
      }, ...prev.slice(0, 4)]);

    } catch (err: any) {
      console.error("OpenCV processing failed", err);
      setError(`OpenCV Core Fault: ${err.message || "Invalid matrix projection"}`);
    } finally {
      setLoading(false);
      setTimeout(() => setScanActive(false), 1000);
    }
  };

  const handleParamChange = (key: string, value: number) => {
    setCvParams(prev => ({ ...prev, [key]: value }));
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImage(null);
    setResult('');
    setCvResults(null);
    setError(null);
    setActiveAnalysisId(null);
  };

  const getImgStyle = () => {
    let baseFilter = `brightness(${brightness}%) contrast(${contrast}%)`;
    if (cvFilter === 'binarize') {
      baseFilter += ' grayscale(100%) contrast(300%) brightness(120%)';
    } else if (cvFilter === 'grayscale') {
      baseFilter += ' grayscale(100%) contrast(140%)';
    } else if (cvFilter === 'negative') {
      baseFilter += ' invert(100%)';
    } else if (cvFilter === 'contrast') {
      baseFilter += ' contrast(200%) saturate(150%)';
    }
    return { filter: baseFilter };
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `XRD_AI_Pattern_Analysis_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      {pythonFeaturesEnabled && (
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex max-w-lg shadow-inner">
          <button
            onClick={() => { setAnalysisMode('neural'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              analysisMode === 'neural'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Neural Stream (Gemini)
          </button>
          <button
            onClick={() => { setAnalysisMode('python_cv'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              analysisMode === 'python_cv'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Python + OpenCV Vision
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Input Side - The Laboratory Bench */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
        <div className="bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all duration-700" />
          
          <div className="flex items-center gap-4 mb-8 relative z-10 transition-transform group-hover:translate-x-1 duration-300">
            <div className="p-3 bg-sky-500/20 rounded-xl border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)]">
              <Camera className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase">Vision Core</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-0.5">XRD-AI Pattern Analysis</p>
            </div>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Optimized Dropzone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); handleImageUpload(e as any); }}
              onClick={triggerUpload}
              className={`relative border-2 border-dashed rounded-3xl h-72 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group/zone ${
                image 
                  ? 'border-sky-500/50 bg-black/40 ring-4 ring-sky-500/5' 
                  : isDragOver 
                    ? 'border-sky-400 bg-sky-400/5 ring-8 ring-sky-400/10 scale-[0.99]' 
                    : 'border-slate-800 hover:border-sky-500/50 bg-black/20 hover:bg-black/40'
              }`}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e)} />
              
              
              <AnimatePresence mode="wait">
                {image ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="relative w-full h-full flex flex-col items-center justify-center p-4 min-h-[300px]"
                  >
                    <div className="relative inline-block group/img">
                      <img 
                        src={(analysisMode === 'python_cv' && cvResults && activeFilterTab !== 'original') 
                          ? cvResults.processed_images[activeFilterTab] 
                          : image} 
                        alt="Target" 
                        ref={previewRef}
                        onMouseMove={(e) => {
                          if (!previewRef.current) return;
                          const rect = previewRef.current.getBoundingClientRect();
                          setMagnifier({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                        }}
                        onMouseLeave={() => setMagnifier(null)}
                        className="max-w-full max-h-[220px] object-contain rounded-xl shadow-2xl z-10 transition-all duration-300" 
                        style={analysisMode === 'python_cv' ? {} : getImgStyle()}
                      />
                      
                      {magnifier && !scanActive && (
                        <div 
                          className="absolute pointer-events-none rounded-full border-2 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.5)] z-50 overflow-hidden bg-black flex items-center justify-center backdrop-blur-sm"
                          style={{
                             width: '120px',
                             height: '120px',
                             left: magnifier.x - 60,
                             top: magnifier.y - 60,
                             backgroundImage: `url(${analysisMode === 'python_cv' && cvResults && activeFilterTab !== 'original' ? cvResults.processed_images[activeFilterTab] : image})`,
                             backgroundPosition: `${(magnifier.x / previewRef.current!.offsetWidth) * 100}% ${(magnifier.y / previewRef.current!.offsetHeight) * 100}%`,
                             backgroundSize: `${previewRef.current!.offsetWidth * 2.5}px ${previewRef.current!.offsetHeight * 2.5}px`,
                             backgroundRepeat: 'no-repeat',
                             ...(analysisMode === 'python_cv' ? {} : getImgStyle())
                          }}
                        >
                           <div className="w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,1)] absolute" />
                           <div className="w-full h-[1px] bg-sky-400/40 absolute" />
                           <div className="h-full w-[1px] bg-sky-400/40 absolute" />
                        </div>
                      )}
                    </div>
                    
                    {/* Processed Filter Tabs overlay under the image */}
                    {analysisMode === 'python_cv' && cvResults && (
                      <div className="z-20 mt-4 flex flex-wrap gap-1 bg-black/60 p-1.5 rounded-xl border border-slate-800/80 w-full max-w-sm">
                        {[
                          { id: 'original', label: 'Original' },
                          { id: 'canny_edges', label: 'Edges' },
                          { id: 'spot_contours', label: 'Spots' },
                          { id: 'ring_fits', label: 'Rings Fit' },
                          { id: 'radial_heatmap', label: 'Heatmap' },
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={(e) => { e.stopPropagation(); setActiveFilterTab(tab.id as any); }}
                            className={`flex-1 py-1 px-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                              activeFilterTab === tab.id
                                ? 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}
                    
{/* Calibration Grid Overlay */}
                    {showGrid && analysisMode !== 'python_cv' && (
                      <div className="absolute inset-4 z-20 pointer-events-none opacity-35 rounded-lg overflow-hidden border border-sky-500/10">
                        <div className="w-full h-full" style={{
                          backgroundImage: `
                            linear-gradient(to right, rgba(14, 165, 233, 0.15) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(14, 165, 233, 0.15) 1px, transparent 1px)
                          `,
                          backgroundSize: '20px 20px'
                        }} />
                      </div>
                    )}

                    {/* Calibration Concentric Bragg Rings */}
                    {showRings && analysisMode !== 'python_cv' && (
                      <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                        <svg className="w-full h-full overflow-visible min-h-[240px]">
                          {Array.from({ length: ringCount }).map((_, i) => {
                            const radius = ringRadius + i * ringSpacing;
                            return (
                              <g key={i}>
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r={radius}
                                  fill="none"
                                  className="stroke-sky-400/50 stroke-1.5 animate-[pulse_2.5s_ease-in-out_infinite]"
                                  style={{ animationDelay: `${i * 0.25}s` }}
                                />
                                <circle
                                  cx="50%"
                                  cy="50%"
                                  r={radius - 1}
                                  fill="none"
                                  className="stroke-sky-500/10 stroke-[0.5] stroke-dasharray-[2_4]"
                                />
                                <text
                                  x={`calc(50% + ${radius}px)`}
                                  y="51%"
                                  className="fill-sky-400 font-mono text-[8px] font-bold select-none opacity-80"
                                >
                                  r{i + 1}
                                </text>
                              </g>
                            );
                          })}
                          <circle cx="50%" cy="50%" r="3.5" className="fill-emerald-400 animate-ping" />
                          <circle cx="50%" cy="50%" r="1.5" className="fill-emerald-400" />
                          <line x1="10%" y1="50%" x2="90%" y2="50%" className="stroke-sky-500/15 stroke-[0.5] stroke-dasharray-[4_6]" />
                          <line x1="50%" y1="10%" x2="50%" y2="90%" className="stroke-sky-500/15 stroke-[0.5] stroke-dasharray-[4_6]" />
                        </svg>
                      </div>
                    )}

                    {/* Advanced Scanning Animation */}
                    {scanActive && (
                      <>
                        <motion.div 
                          className="absolute inset-0 z-20 bg-gradient-to-b from-transparent via-sky-500/30 to-transparent h-20 w-full blur-md"
                          animate={{ top: ['-10%', '110%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div 
                          className="absolute inset-0 z-20 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="absolute top-4 left-4 flex gap-1">
                            {[1, 2, 3].map(i => <div key={`pulse-${i}`} className="w-1 h-3 bg-sky-500/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                          </div>
                          <div className="absolute bottom-4 right-4 text-[8px] font-black font-mono text-sky-400 uppercase tracking-widest bg-black/80 px-2 py-1 rounded-md border border-sky-500/30">
                            Neural-Map Active
                          </div>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center p-8 flex flex-col items-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center mb-4 group-hover/zone:scale-110 group-hover/zone:bg-sky-500/10 transition-all duration-500">
                      <Upload className="h-8 w-8 text-slate-500 group-hover/zone:text-sky-400" strokeWidth={1.5} />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Initialize Data Feed</p>
                    <p className="text-[10px] text-slate-600 font-bold max-w-[180px] leading-relaxed uppercase tracking-tight">
                      Drop pattern image or click to browse (XRD, TIFF, PNG)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {image && !loading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-4 right-4 z-30 p-2 bg-black/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700/50 hover:border-rose-500/30 backdrop-blur-md transition-all active:scale-90"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Conditional Controls Section */}
            {analysisMode === 'neural' ? (
              <>
                {/* Calibration & Computer Vision Preprocessor */}
                {image && (
                  <div className="bg-black/30 p-5 rounded-2xl border border-slate-800/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vision Lab calibration</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/10">CV Suite</span>
                    </div>
                    
                    {/* CV Filter Presets */}
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {[
                        { id: 'none', label: 'Raw' },
                        { id: 'grayscale', label: 'Gray' },
                        { id: 'binarize', label: 'Binarize' },
                        { id: 'negative', label: 'Invert' },
                        { id: 'contrast', label: 'Boost' },
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={(e) => { e.stopPropagation(); setCvFilter(m.id as any); }}
                          className={`py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                            cvFilter === m.id 
                              ? 'bg-sky-500/20 border-sky-400/60 text-sky-300 shadow-inner' 
                              : 'bg-black/40 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-750'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Slides details */}
                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                         <span>Contrast Boost</span>
                         <span className="font-mono text-sky-400">{contrast}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="50" 
                         max="200" 
                         value={String(contrast) === 'NaN' ? '' : contrast} 
                         onChange={(e) => setContrast(parseInt(e.target.value))}
                         className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />

                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                         <span>Exposure gain</span>
                         <span className="font-mono text-sky-400">{brightness}%</span>
                      </div>
                      <input 
                         type="range" 
                         min="50" 
                         max="150" 
                         value={String(brightness) === 'NaN' ? '' : brightness} 
                         onChange={(e) => setBrightness(parseInt(e.target.value))}
                         className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {/* Interactive Overlays */}
                    <div className="grid grid-cols-2 gap-3 pt-1.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowGrid(!showGrid); }}
                        className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                          showGrid 
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' 
                            : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                         <Grid className="w-3.5 h-3.5" />
                         Grid map
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowRings(!showRings); }}
                        className={`p-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                          showRings 
                            ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' 
                            : 'bg-black/20 border-slate-800 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                         <CircleDot className="w-3.5 h-3.5" />
                         Bragg Rings
                      </button>
                    </div>

                    {/* Toggled concentric controls */}
                    {showRings && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3 pt-3 border-t border-slate-800/40 overflow-hidden"
                      >
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Concentric Radius</span>
                           <span className="font-mono text-sky-400">{ringRadius}px</span>
                        </div>
                        <input 
                           type="range" 
                           min="20" 
                           max="190" 
                           value={String(ringRadius) === 'NaN' ? '' : ringRadius} 
                           onChange={(e) => setRingRadius(parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />

                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Interval Spacing</span>
                           <span className="font-mono text-sky-400">{ringSpacing}px</span>
                        </div>
                        <input 
                           type="range" 
                           min="10" 
                           max="80" 
                           value={String(ringSpacing) === 'NaN' ? '' : ringSpacing} 
                           onChange={(e) => setRingSpacing(parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />

                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Ring Count</span>
                           <span className="font-mono text-sky-400">{ringCount}</span>
                        </div>
                        <input 
                           type="range" 
                           min="1" 
                           max="5" 
                           value={String(ringCount) === 'NaN' ? '' : ringCount} 
                           onChange={(e) => setRingCount(parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </motion.div>
                    )}
                  </div>
                )}

                {/* OCR Analysis Presets */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2 px-1">
                     <div className="flex items-center gap-2">
                       <Type className="w-3.5 h-3.5 text-sky-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gemini 3.6 OCR Presets</span>
                     </div>
                     <span className="text-[8px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">OCR MODEL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {OCR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        disabled={!image || loading}
                        onClick={() => {
                          setOcrMode(preset.id as any);
                          handleAnalyze(preset.prompt, preset.id, preset.id);
                        }}
                        className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left group/btn relative overflow-hidden ${
                          activeAnalysisId === preset.id 
                            ? 'bg-sky-500/15 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
                            : 'bg-black/20 border-slate-800 hover:border-slate-700 disabled:opacity-50'
                        }`}
                      >
                        <preset.icon className={`w-4 h-4 ${activeAnalysisId === preset.id ? 'text-sky-400' : 'text-slate-500 group-hover/btn:text-sky-400'}`} />
                        <span className={`text-[10px] font-black uppercase tracking-tight leading-none ${activeAnalysisId === preset.id ? 'text-sky-400' : 'text-slate-400'}`}>
                          {preset.label}
                        </span>
                        {loading && activeAnalysisId === preset.id && (
                           <motion.div 
                             className="absolute bottom-0 left-0 h-1 bg-sky-500"
                             initial={{ width: 0 }}
                             animate={{ width: '100%' }}
                             transition={{ duration: 5 }}
                           />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Context */}
                <div className="bg-black/20 p-5 rounded-2xl border border-slate-800/50 group/input focus-within:border-sky-500/30 transition-all">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                    <MousePointer2 className="w-3.5 h-3.5" />
                    Specialist Instructions
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Target specific peaks, identify mixtures, or extract Rietveld parameters..."
                    className="w-full h-24 bg-transparent text-sky-400/90 border-none outline-none font-mono text-[11px] leading-relaxed resize-none transition-all placeholder:text-slate-700 placeholder:font-bold custom-scrollbar"
                  />
                </div>

                <button
                  onClick={() => handleAnalyze()}
                  disabled={!image || loading}
                  className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 relative overflow-hidden group/act shadow-2xl active:scale-[0.97]
                    ${(!image || loading) 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                      : 'bg-gradient-to-br from-sky-600 to-sky-700 text-white hover:shadow-[0_15px_30px_rgba(14,165,233,0.3)]'}
                  `}
                >
                  {loading ? (
                    <>
                      <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] -translate-x-full" />
                      <Activity className="animate-spin h-5 w-5" />
                      <span className="uppercase tracking-[0.2em] text-sm">Synchronizing Intelligence...</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/act:translate-y-0 transition-transform duration-300" />
                      <Scan className="w-5 h-5 group-hover/act:scale-110 transition-transform relative z-10" />
                      <span className="uppercase tracking-[0.2em] text-sm relative z-10">Deploy Analysis</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Advanced OpenCV & SciPy Controllers */}
                {image && (
                  <div className="bg-black/30 p-5 rounded-2xl border border-slate-800/60 space-y-4">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                         <Sliders className="w-3.5 h-3.5 text-sky-400" />
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vision Lab settings</span>
                      </div>
                      <span className="text-[8px] font-mono font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">CV SOLVER</span>
                    </div>

                    <div className="space-y-4">
                      {/* Threshold */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Beam Centroid Threshold</span>
                           <span className="font-mono text-sky-400">{cvParams.threshold} ADC</span>
                        </div>
                        <input 
                           type="range" 
                           min="30" 
                           max="200" 
                           value={String(cvParams.threshold) === 'NaN' ? '' : cvParams.threshold} 
                           onChange={(e) => handleParamChange('threshold', parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <div className="text-[8px] text-slate-500 leading-tight">Minimum luminance value for beam stop centroid calibration.</div>
                      </div>

                      {/* Prominence */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Ring Peak Prominence</span>
                           <span className="font-mono text-sky-400">{cvParams.prominence.toFixed(3)}</span>
                        </div>
                        <input 
                           type="range" 
                           min="1" 
                           max="15" 
                           value={isNaN(Math.round(cvParams.prominence * 100)) ? '' : Math.round(cvParams.prominence * 100)} 
                           onChange={(e) => handleParamChange('prominence', parseInt(e.target.value) / 100)}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                        <div className="text-[8px] text-slate-500 leading-tight">Peak sensing sensitivity for SciPy concentric ring finding.</div>
                      </div>

                      {/* Spots Filter Percentile */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                           <span>Spot Percentile Limit</span>
                           <span className="font-mono text-sky-400">{cvParams.spot_threshold_p}th %</span>
                        </div>
                        <input 
                           type="range" 
                           min="65" 
                           max="99" 
                           value={String(cvParams.spot_threshold_p) === 'NaN' ? '' : cvParams.spot_threshold_p} 
                           onChange={(e) => handleParamChange('spot_threshold_p', parseInt(e.target.value))}
                           className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        />
                      </div>

                      {/* Canny Edge Thresholding */}
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                             <span>Canny Low</span>
                             <span className="font-mono text-sky-400">{cvParams.canny_low}</span>
                          </div>
                          <input 
                             type="range" 
                             min="10" 
                             max="100" 
                             value={String(cvParams.canny_low) === 'NaN' ? '' : cvParams.canny_low} 
                             onChange={(e) => handleParamChange('canny_low', parseInt(e.target.value))}
                             className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                             <span>Canny High</span>
                             <span className="font-mono text-sky-400">{cvParams.canny_high}</span>
                          </div>
                          <input 
                             type="range" 
                             min="80" 
                             max="220" 
                             value={String(cvParams.canny_high) === 'NaN' ? '' : cvParams.canny_high} 
                             onChange={(e) => handleParamChange('canny_high', parseInt(e.target.value))}
                             className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleAnalyzeCV()}
                  disabled={!image || loading}
                  className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 relative overflow-hidden group/act shadow-2xl active:scale-[0.97]
                    ${(!image || loading) 
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700' 
                      : 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white hover:shadow-[0_15px_30px_rgba(99,102,241,0.3)]'}
                  `}
                >
                  {loading ? (
                    <>
                      <div className="absolute inset-0 bg-white/10 animate-[shimmer_2s_infinite] -translate-x-full" />
                      <Activity className="animate-spin h-5 w-5" />
                      <span className="uppercase tracking-[0.2em] text-sm">Solving CV Matrix...</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/act:translate-y-0 transition-transform duration-300" />
                      <Play className="w-5 h-5 group-hover/act:scale-110 transition-transform relative z-10" />
                      <span className="uppercase tracking-[0.2em] text-sm relative z-10">Run Python Vision Core</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Diagnostic History */}
        {history.length > 0 && (
          <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/50">
             <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Extractions</span>
             </div>
             <div className="space-y-2">
                {history.map((item, idx) => (
                  <div key={`history-${idx}-${item.context?.substring(0,5)}`} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-slate-800/50 text-[10px] hover:border-sky-500/20 transition-all cursor-pointer group">
                     <span className="font-bold text-slate-400 capitalize truncate max-w-[120px]">{item.context || "Standard Diagnostic"}</span>
                     <div className="flex items-center gap-3">
                       <span className="font-mono text-slate-600">{item.date}</span>
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}
      </div>

      {/* Output Side - The Neural Result */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-800 h-full min-h-[700px] flex flex-col relative overflow-hidden group/result">
          {/* Header */}
          <div className="p-8 border-b border-slate-800 bg-black/40 flex justify-between items-center backdrop-blur-xl relative z-10">
             <div className="flex items-center gap-4">
                <div className="relative">
                   <div className="p-3 bg-sky-500/10 rounded-2xl border border-sky-500/20">
                      <Cpu className="w-5 h-5 text-sky-400" />
                   </div>
                   {loading && (
                      <motion.div 
                        className="absolute -inset-1 rounded-2xl border border-sky-400/50"
                        animate={{ opacity: [0.2, 0.8, 0.2] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                   )}
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none mb-1">Analytical Stream</h3>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       {loading ? 'Neural Processing...' : result ? 'Analysis Solidified' : 'System Standby'}
                    </span>
                  </div>
                </div>
             </div>
             
             {result && (
               <div className="flex items-center gap-2">
                  {copied && (
                    <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest animate-pulse mr-2 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      Copied!
                    </span>
                  )}
                  <button 
                    onClick={handleShare}
                    title="Copy Report"
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600 active:scale-90 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleDownload}
                    title="Export Report"
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600 active:scale-90 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>
               </div>
             )}
          </div>
          
          {/* Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-10 relative">
            <AnimatePresence mode="wait">
              {!result && !loading ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-slate-600"
                >
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-sky-500/10 blur-[60px] rounded-full" />
                     <Filter className="h-20 w-20 relative z-10 opacity-20" strokeWidth={1} />
                  </div>
                  <p className="text-center max-w-xs font-black uppercase tracking-[0.2em] text-[10px] opacity-40 leading-loose">
                    Deploy analytical probe into sample imaging for real-time decomposition
                  </p>
                </motion.div>
              ) : loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <CVLoader />
                  <div className="space-y-4 pt-2">
                    {[1, 2].map(i => (
                      <div key={`skeleton-${i}`} className="space-y-3">
                        <div className="h-3 w-1/4 bg-slate-800/50 rounded-full animate-pulse" />
                        <div className="h-4 w-full bg-slate-800/30 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (analysisMode === 'python_cv' && cvResults) ? (
                <motion.div 
                  key="cv-results"
                  ref={scrollRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Tab Selector for Results Pane */}
                  <div className="flex border-b border-slate-800 gap-6 mb-2">
                    <button
                      onClick={() => setRightPanelTab('report')}
                      className={`pb-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                        rightPanelTab === 'report' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      Diagnostic Report
                    </button>
                    <button
                      onClick={() => setRightPanelTab('radial_profile')}
                      className={`pb-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${
                        rightPanelTab === 'radial_profile' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      1D Radial Profile
                    </button>
                  </div>

                  {rightPanelTab === 'radial_profile' ? (
                    <div className="space-y-5">
                      {/* Metric widgets */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Centroid</span>
                          <span className="text-[11px] font-black text-white">{cvResults.cx?.toFixed(1)}, {cvResults.cy?.toFixed(1)} px</span>
                          <span className="text-[7px] font-mono text-slate-600">Origin point</span>
                        </div>
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Rings Found</span>
                          <span className="text-xs font-black text-orange-400">{cvResults.detected_rings?.length || 0} circles</span>
                          <span className="text-[7px] font-mono text-slate-600">Debye shells</span>
                        </div>
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Spots Peak</span>
                          <span className="text-xs font-black text-sky-400">{cvResults.detected_spots_count || 0} reflections</span>
                          <span className="text-[7px] font-mono text-slate-600">Peak counts</span>
                        </div>
                        <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/50 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">SNR</span>
                          <span className={`text-xs font-black ${cvResults.snr > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{cvResults.snr?.toFixed(1)} dB</span>
                          <span className="text-[7px] font-mono text-slate-600">Contrast level</span>
                        </div>
                      </div>

                      {/* Line chart integration */}
                      <div className="h-64 w-full bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80 relative">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2">1D Radial projection (Mean Luminance x Pixel Radius)</div>
                        <ResponsiveContainer width="100%" height="90%">
                          <LineChart 
                            data={cvResults.radial_profile} 
                            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                          >
                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="radius" 
                              stroke="#475569" 
                              fontSize={8} 
                              tickLine={false} 
                            />
                            <YAxis 
                              stroke="#475569" 
                              fontSize={8} 
                              tickLine={false}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} 
                              labelStyle={{ color: '#94a3b8', fontSize: 9, fontWeight: 'bold' }} 
                              itemStyle={{ color: '#38bdf8', fontSize: 9 }}
                            />
                            <Line type="monotone" dataKey="intensity" stroke="#0ea5e9" strokeWidth={1.5} dot={false} />
                            
                            {cvResults.detected_rings?.map((rg: any, rIdx: number) => (
                              <ReferenceLine 
                                key={`rad-ring-${rIdx}`} 
                                x={rg.radius} 
                                stroke="#f97316" 
                                strokeDasharray="2 3"
                                label={{ value: `#${rIdx+1}`, position: 'top', style: { fill: '#f97316', fontSize: 7, fontWeight: 'black', opacity: 0.8 } }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-sky-400 prose-th:text-sky-400 prose-th:font-black prose-th:px-4 prose-td:px-4 prose-td:font-mono prose-td:text-[11px] prose-p:leading-relaxed prose-p:text-slate-300">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  ref={scrollRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Toast Notification */}
                  <AnimatePresence>
                    {exportToast && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-[11px] font-mono font-extrabold flex items-center justify-between shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>{exportToast}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Neural Stream Result Tab Header */}
                  <div className="flex border-b border-slate-800 gap-6 mb-2">
                    <button
                      onClick={() => setRightPanelTab('report')}
                      className={`pb-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                        rightPanelTab === 'report' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Markdown Diagnostic
                    </button>
                    <button
                      onClick={() => setRightPanelTab('structured_ocr')}
                      className={`pb-2.5 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                        rightPanelTab === 'structured_ocr' ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" />
                      Structured OCR Inspector
                      {structuredOcrData && (
                        <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[8px] font-mono px-1.5 py-0.2 rounded-full">
                          {(structuredOcrData.peaks?.length || 0) + (structuredOcrData.phases?.length || 0)} items
                        </span>
                      )}
                    </button>
                  </div>

                  {rightPanelTab === 'structured_ocr' ? (
                    <div className="space-y-6">
                      {/* Metric Summary Bar */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Peaks Found</span>
                          <span className="text-sm font-black text-sky-400">{structuredOcrData?.peaks?.length || 0} peaks</span>
                          <span className="text-[7px] font-mono text-slate-600">Digitized 2θ</span>
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Phase Cards</span>
                          <span className="text-sm font-black text-amber-400">{structuredOcrData?.phases?.length || 0} matches</span>
                          <span className="text-[7px] font-mono text-slate-600">PDF / ICDD</span>
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Confidence</span>
                          <span className="text-sm font-black text-emerald-400">{structuredOcrData?.confidence || 'HIGH'}</span>
                          <span className="text-[7px] font-mono text-slate-600">Gemini 3.6 OCR</span>
                        </div>
                        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">2θ Axis Bounds</span>
                          <span className="text-sm font-black text-white">
                            {structuredOcrData?.axis?.twoThetaMin ?? '---'}° - {structuredOcrData?.axis?.twoThetaMax ?? '---'}°
                          </span>
                          <span className="text-[7px] font-mono text-slate-600">Wavelength λ=1.5406Å</span>
                        </div>
                      </div>

                      {/* Extracted Peak Table */}
                      {structuredOcrData?.peaks && structuredOcrData.peaks.length > 0 && (
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-sky-400" />
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Digitized 2-Theta Spectrum Peaks</span>
                            </div>
                            <button
                              onClick={handleExportPeaksCSV}
                              className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-lg text-[9px] font-mono font-extrabold uppercase border border-sky-500/30 flex items-center gap-1.5 transition-all"
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              Export CSV
                            </button>
                          </div>

                          <div className="overflow-x-auto max-h-60 custom-scrollbar border border-slate-800 rounded-xl">
                            <table className="w-full text-left font-mono text-[11px]">
                              <thead className="bg-slate-900 text-sky-400 font-black uppercase text-[9px] sticky top-0">
                                <tr>
                                  <th className="p-2.5">2-Theta (2θ°)</th>
                                  <th className="p-2.5">Relative Intensity (%)</th>
                                  <th className="p-2.5">d-Spacing (Å)</th>
                                  <th className="p-2.5">hkl Index</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                                {structuredOcrData.peaks.map((p, pIdx) => (
                                  <tr key={`peak-ocr-${pIdx}`} className="hover:bg-sky-500/5 transition-colors">
                                    <td className="p-2.5 font-bold text-sky-300">{p.twoTheta}°</td>
                                    <td className="p-2.5">{p.intensity}%</td>
                                    <td className="p-2.5">{p.dSpacing ? `${p.dSpacing} Å` : '---'}</td>
                                    <td className="p-2.5 text-slate-400">{p.hkl || '---'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Matched Phases */}
                      {structuredOcrData?.phases && structuredOcrData.phases.length > 0 && (
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-amber-400" />
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Identified Phase Cards & Formulae</span>
                            </div>
                            <button
                              onClick={handleExportPhases}
                              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-[9px] font-mono font-extrabold uppercase border border-amber-500/30 flex items-center gap-1.5 transition-all"
                            >
                              <Copy className="w-3 h-3" />
                              Copy Phases
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {structuredOcrData.phases.map((ph, phIdx) => (
                              <div key={`phase-ocr-${phIdx}`} className="bg-black/40 p-3.5 rounded-xl border border-slate-800 space-y-1">
                                <div className="text-[11px] font-black text-amber-300 uppercase">{ph.phaseName}</div>
                                {ph.pdfNumber && <div className="text-[9px] font-mono text-slate-400">PDF Card #: <span className="text-slate-200">{ph.pdfNumber}</span></div>}
                                {ph.spaceGroup && <div className="text-[9px] font-mono text-slate-400">Space Group: <span className="text-slate-200">{ph.spaceGroup}</span></div>}
                                {ph.fom !== undefined && <div className="text-[9px] font-mono text-slate-400">Figure of Merit: <span className="text-emerald-400">{ph.fom}</span></div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracted Text Inspector / Live Search */}
                      {structuredOcrData?.extracted_lines && structuredOcrData.extracted_lines.length > 0 && (
                        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Type className="w-4 h-4 text-sky-400" />
                              <span className="text-[11px] font-black text-white uppercase tracking-wider">Extracted OCR Text Lines</span>
                            </div>
                            <div className="relative w-48">
                              <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2.5" />
                              <input
                                type="text"
                                value={ocrSearchQuery}
                                onChange={(e) => setOcrSearchQuery(e.target.value)}
                                placeholder="Filter OCR text..."
                                className="w-full bg-slate-900 border border-slate-800 text-sky-300 text-[9px] font-mono pl-7 pr-2 py-1.5 rounded-lg outline-none focus:border-sky-500/50"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar font-mono text-[10px] text-slate-300 p-3 bg-black/40 rounded-xl border border-slate-800/80">
                            {structuredOcrData.extracted_lines
                              .filter(line => !ocrSearchQuery || line.toLowerCase().includes(ocrSearchQuery.toLowerCase()))
                              .map((line, lIdx) => (
                                <div key={`ocr-line-${lIdx}`} className="flex gap-3 py-1 border-b border-slate-900/60 last:border-none">
                                  <span className="text-slate-600 select-none text-[8px] font-black w-6">{lIdx + 1}.</span>
                                  <span className="text-sky-200">{line}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-sky-400 prose-th:text-sky-400 prose-th:font-black prose-th:px-4 prose-td:px-4 prose-td:font-mono prose-td:text-[11px] prose-p:leading-relaxed prose-p:text-slate-300">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Warning/Info */}
          <div className="p-8 border-t border-slate-800 bg-black/20 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
             <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-500" />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none shadow-sm">Validation Notice</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed max-w-[400px]">
                   AI extraction represents statistical estimations. Always cross-verify critical lattice parameters with standard Rietveld methodologies.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
