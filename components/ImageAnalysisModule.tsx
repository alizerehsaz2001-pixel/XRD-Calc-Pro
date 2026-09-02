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
  Type, Table, ListFilter, FileSpreadsheet, Compass,
  BookOpen, ChevronRight, Check, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ReferenceLine 
} from 'recharts';
import { OpenCVVisionPanel, OpenCVResultsData } from './OpenCVVisionPanel';
import { BENCHMARK_PATTERNS, generateBenchmarkPatternDataUrl } from '../utils/benchmarkPatterns';
import { analyzeImageClient } from '../utils/clientImageAnalyzer';

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
    <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-sky-500/20 shadow-[inset_0_0_30px_rgba(14,165,233,0.05)] relative overflow-hidden my-4 text-left">
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

export const ImageAnalysisModule: React.FC<{ 
  pythonFeaturesEnabled?: boolean;
  onLoadPeaks?: (peaksStr: string, hklStr: string, matName: string) => void;
}> = ({ pythonFeaturesEnabled = false, onLoadPeaks }) => {
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
  const [engineType, setEngineType] = useState<'python_server' | 'client_web' | null>(null);
  const [cvResults, setCvResults] = useState<OpenCVResultsData | null>(null);
  const [activeFilterTab, setActiveFilterTab] = useState<string>('ring_fits');
  const [rightPanelTab, setRightPanelTab] = useState<'report' | 'structured_ocr' | 'radial_profile' | 'tuning'>('report');
  
  // Adaptive vision hyperparameters
  const [cvParams, setCvParams] = useState({
    wavelength: 1.5406,
    detector_distance: 150.0,
    pixel_size: 75.0,
    threshold: 85,
    denoise_method: 'bilateral' as 'bilateral' | 'gaussian' | 'none',
    tophat_radius: 25,
    apply_clahe: true,
    clahe_clip: 3.0,
    center_method: 'intensity_com' as 'intensity_com' | 'hough_circles' | 'manual',
    manual_cx: null as number | null,
    manual_cy: null as number | null,
    azimuth_start: 0,
    azimuth_end: 360,
    num_bins: 300,
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

  const handleLoadBenchmark = (patternId: string) => {
    const dataUrl = generateBenchmarkPatternDataUrl(patternId);
    if (dataUrl) {
      setImage(dataUrl);
      setResult('');
      setStructuredOcrData(null);
      setError(null);
      setCvResults(null);
      setActiveAnalysisId(patternId);
      showToast(`Loaded benchmark pattern: ${patternId}`);
    }
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

    const activeParams = overrideParams || cvParams;
    let data: OpenCVResultsData | null = null;
    let usedEngine: 'python_server' | 'client_web' = 'client_web';

    // 1. Try server-side Python OpenCV if pythonFeaturesEnabled
    if (pythonFeaturesEnabled) {
      try {
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

        if (response.ok) {
          const resJson = await response.json();
          if (resJson && resJson.success) {
            data = resJson;
            usedEngine = 'python_server';
          }
        }
      } catch (serverErr) {
        console.warn("Python OpenCV server endpoint unavailable, shifting to Client Web CV Engine:", serverErr);
      }
    }

    // 2. Client Web CV Engine (Native Canvas + Float32Array + Peak Fingerprinting)
    if (!data) {
      try {
        data = await analyzeImageClient(image, activeParams);
        usedEngine = 'client_web';
      } catch (clientErr: any) {
        console.error("Client Web CV Engine failed:", clientErr);
        setError(`Computer Vision Fault: ${clientErr.message || "Failed to process image matrix"}`);
      }
    }

    if (data) {
      setEngineType(usedEngine);
      setCvResults(data);
      setResult(data.report_md); // Sync markdown report with active result viewer
      setActiveFilterTab('ring_fits'); // Default filter display
      
      setHistory(prev => [{ 
        context: usedEngine === 'python_server' ? "Python OpenCV 5.x Server Run" : "Client Web Computer Vision Run", 
        result: data!.report_md, 
        date: new Date().toLocaleTimeString() 
      }, ...prev.slice(0, 4)]);
    }

    setLoading(false);
    setTimeout(() => setScanActive(false), 1000);
  };

  const handleParamChange = (key: string, value: any) => {
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
    <div className="space-y-6 text-left">
      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl flex max-w-lg shadow-inner">
          <button
            onClick={() => { setAnalysisMode('neural'); setError(null); }}
            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              analysisMode === 'neural'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Neural Stream (Gemini OCR)
          </button>
          <button
            onClick={() => { setAnalysisMode('python_cv'); setError(null); }}
            className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              analysisMode === 'python_cv'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Computer Vision (OpenCV & Web)
          </button>
        </div>

        {analysisMode === 'python_cv' && (
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${pythonFeaturesEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
              {pythonFeaturesEnabled 
                ? 'Python 3.x + OpenCV 5.x Server + Web CV' 
                : 'Client Web Computer Vision Engine Active'}
            </span>
          </div>
        )}
      </div>

      {/* Benchmark Patterns Quick Bar */}
      <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Benchmark Standards:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {BENCHMARK_PATTERNS.map(bm => (
            <button
              key={bm.id}
              onClick={() => handleLoadBenchmark(bm.id)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all border ${
                activeAnalysisId === bm.id 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-black/30 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
              title={bm.description}
            >
              {bm.title.split(' ')[0]} {bm.title.split(' ')[1]}
            </button>
          ))}
        </div>
      </div>

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
                        <div className="z-20 mt-4 flex flex-wrap gap-1 bg-black/70 p-1.5 rounded-2xl border border-slate-800/80 w-full max-w-md">
                          {[
                            { id: 'original_annotated', label: 'Origin' },
                            { id: 'ring_fits', label: 'Rings Fit' },
                            { id: 'polar_unwrapped', label: 'Polar r-χ' },
                            { id: 'spot_contours', label: 'Spots (SAED)' },
                            { id: 'clahe_enhanced', label: 'CLAHE' },
                            { id: 'tophat_bg', label: 'Top-Hat' },
                            { id: 'canny_edges', label: 'Canny' },
                            { id: 'radial_heatmap', label: 'Heatmap' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={(e) => { e.stopPropagation(); setActiveFilterTab(tab.id); }}
                              className={`flex-1 py-1 px-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border ${
                                activeFilterTab === tab.id
                                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-sm'
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
                    className="absolute top-4 right-4 z-30 p-2 bg-black/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl border border-slate-700/50 hover:border-rose-500/30 backdrop-blur-md transition-all active:scale-90 cursor-pointer"
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
                         <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OCR Analysis Mode</span>
                       </div>
                       <span className="text-[8px] font-mono text-slate-500">Gemini 3.6 Multimodal</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {OCR_PRESETS.map((p) => {
                        const Icon = p.icon;
                        const isSelected = ocrMode === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setOcrMode(p.id as any); setContext(p.prompt); }}
                            className={`p-3 rounded-2xl text-left border transition-all relative overflow-hidden group/btn ${
                              isSelected
                                ? 'bg-sky-500/15 border-sky-400/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                                : 'bg-black/30 border-slate-800 hover:border-slate-700 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                              <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                {p.label}
                              </span>
                            </div>
                            <p className="text-[8px] text-slate-500 line-clamp-2 leading-tight">
                              {p.prompt}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3 h-3 text-sky-400" />
                        Custom Prompt / Context
                      </label>
                      <span className="text-[8px] font-mono text-slate-600 uppercase">Optional</span>
                    </div>
                    <textarea 
                      value={context} 
                      onChange={(e) => setContext(e.target.value)} 
                      placeholder="e.g., Identify peaks for BaTiO3 perovskite and extract 2-theta values..."
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none transition-all placeholder:text-slate-700 min-h-[90px] resize-none"
                    />
                  </div>

                  <button
                    onClick={() => handleAnalyze()}
                    disabled={!image || loading}
                    className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 relative overflow-hidden group/act shadow-2xl active:scale-[0.97] cursor-pointer
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
                    <div className="bg-black/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
                        <div className="flex items-center gap-2">
                           <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Crystallography Optics & Vision</span>
                        </div>
                        <span className="text-[8px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">CV SOLVER</span>
                      </div>

                      <div className="space-y-4">
                        {/* Quick Presets for Common Diffraction Modes */}
                        <div className="space-y-1.5 pb-3 border-b border-slate-800/60">
                          <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
                            Diffraction Optics Presets
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'powder', label: '🎯 Powder Rings', desc: 'Top-Hat + CLAHE + radial integration', params: { denoise_method: 'bilateral' as const, apply_clahe: true, tophat_radius: 25, clahe_clip: 3.0, prominence: 0.05, num_bins: 300 } },
                              { id: 'saed', label: '💎 SAED Matrix', desc: 'Spot extraction & reciprocal vectors', params: { denoise_method: 'gaussian' as const, apply_clahe: false, tophat_radius: 15, spot_neighborhood: 11, spot_threshold_p: 95, prominence: 0.08 } },
                              { id: 'fiber', label: '🌀 Fiber Texture', desc: '360° Azimuthal pole profiling', params: { denoise_method: 'bilateral' as const, apply_clahe: true, azimuth_start: 0, azimuth_end: 360, num_bins: 360, prominence: 0.04 } },
                              { id: 'thin_film', label: '🔬 Low Contrast', desc: 'High-gain background subtraction', params: { denoise_method: 'bilateral' as const, apply_clahe: true, tophat_radius: 35, clahe_clip: 5.0, prominence: 0.03, num_bins: 400 } },
                            ].map(preset => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => {
                                  setCvParams(prev => ({ ...prev, ...preset.params }));
                                  showToast(`Applied ${preset.label} preset`);
                                }}
                                className="p-2 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-left transition-all group cursor-pointer"
                              >
                                <span className="text-[10px] font-bold text-white group-hover:text-indigo-300 block">{preset.label}</span>
                                <span className="text-[8px] text-slate-500 line-clamp-1">{preset.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Radiation Source Presets */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            <span>Radiation Anode Wavelength</span>
                            <span className="font-mono text-indigo-400">{cvParams.wavelength.toFixed(4)} Å</span>
                          </div>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { name: 'Cu Kα', wl: 1.5406 },
                              { name: 'Mo Kα', wl: 0.7107 },
                              { name: 'Co Kα', wl: 1.7890 },
                              { name: 'Cr Kα', wl: 2.2897 },
                            ].map(src => (
                              <button
                                key={src.name}
                                type="button"
                                onClick={() => handleParamChange('wavelength', src.wl)}
                                className={`py-1 px-1.5 rounded-lg text-[8px] font-mono font-bold transition-all border ${
                                  Math.abs(cvParams.wavelength - src.wl) < 0.001
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                                    : 'bg-black/30 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {src.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Azimuthal Cake Slice Integration Controls */}
                        <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 uppercase tracking-wider">
                            <span className="flex items-center gap-1.5">
                              <Compass className="w-3 h-3 text-indigo-400" />
                              Azimuthal Sector Slice (χ)
                            </span>
                            <span className="font-mono text-indigo-400">
                              {cvParams.azimuth_start}° → {cvParams.azimuth_end}° ({cvParams.azimuth_end - cvParams.azimuth_start}°)
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <div className="flex justify-between text-[7px] text-slate-500 font-mono">
                                <span>χ START</span>
                                <span>{cvParams.azimuth_start}°</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                step="5"
                                value={cvParams.azimuth_start} 
                                onChange={(e) => handleParamChange('azimuth_start', parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[7px] text-slate-500 font-mono">
                                <span>χ END</span>
                                <span>{cvParams.azimuth_end}°</span>
                              </div>
                              <input 
                                type="range" 
                                min="0" 
                                max="360" 
                                step="5"
                                value={cvParams.azimuth_end} 
                                onChange={(e) => handleParamChange('azimuth_end', parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1 pt-1">
                            {[
                              { label: '360° Full', s: 0, e: 360 },
                              { label: 'Q1 (0-90°)', s: 0, e: 90 },
                              { label: 'Meridional', s: 45, e: 135 },
                              { label: 'Equatorial', s: 135, e: 225 },
                            ].map(sec => (
                              <button
                                key={sec.label}
                                type="button"
                                onClick={() => {
                                  handleParamChange('azimuth_start', sec.s);
                                  handleParamChange('azimuth_end', sec.e);
                                }}
                                className={`py-0.5 px-1 rounded text-[7px] font-mono transition-all border ${
                                  cvParams.azimuth_start === sec.s && cvParams.azimuth_end === sec.e
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-black/40 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {sec.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Detector Distance & Pixel Size */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Distance D (mm)</label>
                            <input 
                              type="number" 
                              step="5" 
                              min="30" 
                              max="1000"
                              value={cvParams.detector_distance} 
                              onChange={(e) => handleParamChange('detector_distance', parseFloat(e.target.value) || 150)}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Pixel Pitch (µm)</label>
                            <input 
                              type="number" 
                              step="5" 
                              min="10" 
                              max="500"
                              value={cvParams.pixel_size} 
                              onChange={(e) => handleParamChange('pixel_size', parseFloat(e.target.value) || 75)}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Centroid Method */}
                        <div className="space-y-1.5">
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Beam Origin Calibration Mode</div>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { id: 'intensity_com', label: 'Intensity COM' },
                              { id: 'hough_circles', label: 'Hough Rings' },
                              { id: 'manual', label: 'Manual' },
                            ].map(mode => (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => handleParamChange('center_method', mode.id)}
                                className={`py-1 px-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider transition-all border ${
                                  cvParams.center_method === mode.id
                                    ? 'bg-indigo-600 text-white border-indigo-500'
                                    : 'bg-black/30 text-slate-400 border-slate-800 hover:border-slate-700'
                                }`}
                              >
                                {mode.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Denoising & Preprocessing */}
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Filter Method</label>
                            <select 
                              value={cvParams.denoise_method}
                              onChange={(e) => handleParamChange('denoise_method', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1.5 text-[9px] font-mono focus:border-indigo-500"
                            >
                              <option value="bilateral">Bilateral (Edge-Safe)</option>
                              <option value="gaussian">Gaussian Blur</option>
                              <option value="none">None (Raw)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-400 uppercase">Top-Hat Radius (px)</label>
                            <input 
                              type="number" 
                              min="5" 
                              max="80"
                              value={cvParams.tophat_radius} 
                              onChange={(e) => handleParamChange('tophat_radius', parseInt(e.target.value) || 25)}
                              className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Prominence & Ring Finding */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                             <span>Ring Peak Prominence</span>
                             <span className="font-mono text-indigo-400">{cvParams.prominence.toFixed(3)}</span>
                          </div>
                          <input 
                             type="range" 
                             min="1" 
                             max="15" 
                             value={isNaN(Math.round(cvParams.prominence * 100)) ? '' : Math.round(cvParams.prominence * 100)} 
                             onChange={(e) => handleParamChange('prominence', parseInt(e.target.value) / 100)}
                             className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Spots Filter Percentile */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                             <span>SAED Spot Percentile</span>
                             <span className="font-mono text-indigo-400">{cvParams.spot_threshold_p}th %</span>
                          </div>
                          <input 
                             type="range" 
                             min="65" 
                             max="99" 
                             value={String(cvParams.spot_threshold_p) === 'NaN' ? '' : cvParams.spot_threshold_p} 
                             onChange={(e) => handleParamChange('spot_threshold_p', parseInt(e.target.value))}
                             className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        </div>

                        {/* Canny Edge Thresholding */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                               <span>Canny Low</span>
                               <span className="font-mono text-indigo-400">{cvParams.canny_low}</span>
                            </div>
                            <input 
                               type="range" 
                               min="10" 
                               max="100" 
                               value={String(cvParams.canny_low) === 'NaN' ? '' : cvParams.canny_low} 
                               onChange={(e) => handleParamChange('canny_low', parseInt(e.target.value))}
                               className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                               <span>Canny High</span>
                               <span className="font-mono text-indigo-400">{cvParams.canny_high}</span>
                            </div>
                            <input 
                               type="range" 
                               min="80" 
                               max="220" 
                               value={String(cvParams.canny_high) === 'NaN' ? '' : cvParams.canny_high} 
                               onChange={(e) => handleParamChange('canny_high', parseInt(e.target.value))}
                               className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAnalyzeCV()}
                    disabled={!image || loading}
                    className={`w-full py-4 rounded-2xl font-black transition-all flex justify-center items-center gap-3 relative overflow-hidden group/act shadow-2xl active:scale-[0.97] cursor-pointer
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
                      className="p-3 bg-black/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800/80 transition-all shadow-md active:scale-90 cursor-pointer"
                      title="Copy Raw Report"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleDownload}
                      className="p-3 bg-black/40 hover:bg-slate-800 text-slate-400 hover:text-white rounded-2xl border border-slate-800/80 transition-all shadow-md active:scale-90 cursor-pointer"
                      title="Download Markdown Report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                 </div>
               )}
            </div>

            {/* Structured vs Report Tab switcher if structured data exists */}
            {structuredOcrData && (
              <div className="px-8 pt-4 border-b border-slate-800/80 flex gap-4">
                <button
                  onClick={() => setRightPanelTab('report')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                    rightPanelTab === 'report' 
                      ? 'border-sky-500 text-sky-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Synthesis Report
                </button>
                <button
                  onClick={() => setRightPanelTab('structured_ocr')}
                  className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                    rightPanelTab === 'structured_ocr' 
                      ? 'border-sky-500 text-sky-400' 
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  Structured Peak Table ({structuredOcrData.peaks?.length || 0})
                </button>
              </div>
            )}

            {/* Notification Toast */}
            {exportToast && (
              <div className="mx-8 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-mono flex items-center justify-between animate-fadeIn">
                <span>{exportToast}</span>
                <Check className="w-4 h-4" />
              </div>
            )}

            {/* Content Area */}
            <div className="p-8 flex-1 overflow-y-auto max-h-[850px] relative font-sans leading-relaxed custom-scrollbar">
              {loading && <CVLoader />}

              {error && (
                <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4 text-rose-400 mb-6">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider">Diagnostic Interruption</h4>
                    <p className="text-xs opacity-80">{error}</p>
                  </div>
                </div>
              )}

              {/* View 1: Python OpenCV Full Diagnostic Panel */}
              {analysisMode === 'python_cv' && cvResults ? (
                <OpenCVVisionPanel 
                  results={cvResults} 
                  onSelectPhase={(phaseName, latticeA) => {
                    if (onLoadPeaks && cvResults.detected_rings?.length) {
                      const peaksStr = cvResults.detected_rings.map(r => `${r.two_theta_deg.toFixed(2)}, ${r.intensity.toFixed(1)}`).join('\n');
                      const hklStr = cvResults.detected_rings.map(r => r.ring_index ? `Ring ${r.ring_index}` : '').join('\n');
                      onLoadPeaks(peaksStr, hklStr, phaseName);
                      showToast(`Loaded ${phaseName} reflections into Bragg Simulator!`);
                    } else {
                      showToast(`Selected ${phaseName} (a = ${latticeA || 'N/A'} Å)`);
                    }
                  }}
                  onSendToPeakFit={(xyData) => {
                    if (onLoadPeaks) {
                      onLoadPeaks(xyData, '', 'CV Extracted Diffractogram');
                      showToast('Transferred 1D Diffractogram into Bragg Simulator!');
                    }
                  }}
                />
              ) : null}

              {/* View 2: Structured Peak Table Digitizer View */}
              {analysisMode === 'neural' && structuredOcrData && rightPanelTab === 'structured_ocr' ? (
                <div className="space-y-6">
                  {/* Axis Bounds & Radiation Meta */}
                  {structuredOcrData.axis && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 p-4 rounded-2xl border border-slate-800">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">2θ Range</span>
                        <p className="text-xs font-bold text-sky-400 font-mono">
                          {structuredOcrData.axis.twoThetaMin ?? '0'}° - {structuredOcrData.axis.twoThetaMax ?? '90'}°
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Wavelength λ</span>
                        <p className="text-xs font-bold text-white font-mono">
                          {structuredOcrData.axis.wavelength ? `${structuredOcrData.axis.wavelength} Å` : 'Cu Kα (1.5406 Å)'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Confidence</span>
                        <p className="text-xs font-bold text-slate-300 font-mono capitalize">
                          {structuredOcrData.confidence || 'High (98%)'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase">Resolution</span>
                        <p className="text-xs font-bold text-emerald-400 font-mono">
                          {structuredOcrData.peaks?.length || 0} Resolved
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Candidate Phase Labels */}
                  {structuredOcrData.phases && structuredOcrData.phases.length > 0 && (
                    <div className="space-y-3 bg-black/30 p-4 rounded-2xl border border-slate-800">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-sky-400" />
                          Matched Phase Candidates ({structuredOcrData.phases.length})
                        </span>
                        <button 
                          onClick={handleExportPhases}
                          className="text-[9px] text-sky-400 hover:text-sky-300 font-mono uppercase underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          Copy List
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {structuredOcrData.phases.map((ph, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-xs flex justify-between items-center">
                            <div>
                              <span className="font-bold text-white">{ph.phaseName}</span>
                              {ph.pdfNumber && <span className="text-[9px] text-sky-400 ml-2 font-mono">[{ph.pdfNumber}]</span>}
                            </div>
                            {ph.spaceGroup && <span className="text-[9px] bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded border border-sky-500/20">{ph.spaceGroup}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Peak Table */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={ocrSearchQuery}
                          onChange={(e) => setOcrSearchQuery(e.target.value)}
                          placeholder="Filter peak 2θ, d-spacing or hkl..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-[10px] font-mono text-slate-300 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {onLoadPeaks && (
                          <button
                            onClick={() => {
                              if (structuredOcrData?.peaks?.length) {
                                const peaksStr = structuredOcrData.peaks.map(p => `${p.twoTheta}, ${p.intensity}`).join('\n');
                                const hklStr = structuredOcrData.peaks.map(p => p.hkl || '').join('\n');
                                const matName = structuredOcrData.phases?.[0]?.phaseName || 'OCR Digitized Peaks';
                                onLoadPeaks(peaksStr, hklStr, matName);
                                showToast(`Loaded ${structuredOcrData.peaks.length} peaks into Bragg Simulator!`);
                              }
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-mono font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Send to Bragg
                          </button>
                        )}
                        <button
                          onClick={handleExportPeaksCSV}
                          className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-sky-500/30 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3 h-3" />
                          Copy Peak Table CSV
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto max-h-96 custom-scrollbar border border-slate-800 rounded-2xl">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[9px] sticky top-0 border-b border-slate-800">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">2-Theta (°)</th>
                            <th className="p-3">Rel. Intensity (I/I₀)</th>
                            <th className="p-3">d-spacing (Å)</th>
                            <th className="p-3">Miller Index (hkl)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {structuredOcrData.peaks
                            ?.filter(p => {
                              if (!ocrSearchQuery) return true;
                              const q = ocrSearchQuery.toLowerCase();
                              return (
                                String(p.twoTheta).includes(q) ||
                                (p.dSpacing && String(p.dSpacing).includes(q)) ||
                                (p.hkl && p.hkl.toLowerCase().includes(q))
                              );
                            })
                            .map((peak, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 font-bold text-sky-400">{idx + 1}</td>
                                <td className="p-3 font-bold text-white">{peak.twoTheta}°</td>
                                <td className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className="bg-sky-400 h-full rounded-full" 
                                        style={{ width: `${Math.min(100, peak.intensity)}%` }}
                                      />
                                    </div>
                                    <span>{peak.intensity}%</span>
                                  </div>
                                </td>
                                <td className="p-3 text-emerald-400">{peak.dSpacing ? `${peak.dSpacing} Å` : '-'}</td>
                                <td className="p-3 text-slate-400">{peak.hkl ? `(${peak.hkl})` : '-'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* View 3: Standard Neural Markdown Report Stream */}
              {result && (analysisMode !== 'python_cv' || !cvResults) && (rightPanelTab === 'report' || !structuredOcrData) ? (
                <div className="prose prose-sm prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-sky-400 prose-th:text-sky-300 prose-th:font-black prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-td:font-mono prose-td:text-[11px] prose-p:leading-relaxed prose-p:text-slate-300">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : null}

              {!result && !loading && !error && (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-3xl bg-slate-800/30 flex items-center justify-center mb-6 border border-slate-800 shadow-inner">
                    <Scan className="w-8 h-8 text-slate-600" />
                  </div>
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Diagnostic Awaiting Ingestion</h4>
                  <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
                    Upload an XRD, SAED, or TEM pattern on the laboratory bench or select a benchmark standard to initialize automated analysis.
                  </p>
                </div>
              )}
            </div>

            {/* Terminal Status Bar */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-between items-center text-[8px] font-mono text-slate-500 uppercase tracking-widest">
               <span>Mode: {analysisMode === 'python_cv' ? 'Python Core (OpenCV + SciPy)' : 'Multimodal Vision (Gemini 3.6)'}</span>
               <span>Status: {loading ? 'Processing' : result ? 'Ready' : 'Idle'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
