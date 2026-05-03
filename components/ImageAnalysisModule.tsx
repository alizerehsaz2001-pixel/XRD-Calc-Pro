import React, { useState, useRef, useEffect } from 'react';
import { analyzeDiffractionImage } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { 
  Camera, Upload, Search, FileText, Zap, 
  RotateCcw, Info, CheckCircle2, AlertCircle, 
  Cpu, Activity, Layers, Share2, Download,
  Sparkles, MousePointer2, Scan, Filter, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ANALYSIS_PRESETS = [
  { id: 'phase', label: 'Phase Identification', icon: Search, prompt: 'Identify all likely crystalline phases in this pattern. Check for TiO2 polymorphic mixtures, impurity peaks, and calculate matching confidence.' },
  { id: 'peaks', label: 'Quantitative Peak List', icon: Activity, prompt: 'Generate a precise table of all detectable peaks with 2-theta, Intensity (relative), and Estimated FWHM.' },
  { id: 'lattice', label: 'Structural Extraction', icon: Layers, prompt: 'Extract any visible unit cell parameters (a, b, c, alpha, beta, gamma) from software labels or data tables in the image.' },
  { id: 'quality', label: 'Quality Insight', icon: Zap, prompt: 'Assess the background level, signal-to-noise ratio, and potential sample preparation issues like preferred orientation or microstrain broadening.' },
];

export const ImageAnalysisModule: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [activeAnalysisId, setActiveAnalysisId] = useState<string | null>(null);
  const [history, setHistory] = useState<{context: string, result: string, date: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setError(null);
        setActiveAnalysisId(null);
      };
      reader.readAsDataURL(file);
    }
    setIsDragOver(false);
  };

  const handleAnalyze = async (customPrompt?: string, presetId?: string) => {
    if (!image) return;
    
    setLoading(true);
    setScanActive(true);
    setError(null);
    setResult('');
    if (presetId) setActiveAnalysisId(presetId);

    const finalPrompt = customPrompt || context || "Analyze this diffraction pattern image and extract key peaks and phase information.";

    try {
      const analysis = await analyzeDiffractionImage(image, finalPrompt);
      setResult(analysis);
      setHistory(prev => [{ context: finalPrompt, result: analysis, date: new Date().toLocaleTimeString() }, ...prev.slice(0, 4)]);
    } catch (err: any) {
      const errorStr = typeof err === 'string' ? err : JSON.stringify(err);
      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        setError("Quota exhausted (429/RESOURCE_EXHAUSTED). Analysis unavailable.");
      } else {
        setError("Analysis Engine Fault: Check connectivity or image clarity.");
      }
    } finally {
      setLoading(false);
      setTimeout(() => setScanActive(false), 1000);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setImage(null);
    setResult('');
    setError(null);
    setActiveAnalysisId(null);
  };

  return (
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
                    className="relative w-full h-full flex items-center justify-center p-4"
                  >
                    <img src={image} alt="Target" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl z-10" />
                    
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

            {/* Analysis Presets */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2 px-1">
                 <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rapid Diagnostics</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ANALYSIS_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    disabled={!image || loading}
                    onClick={() => handleAnalyze(preset.prompt, preset.id)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left group/btn relative overflow-hidden ${
                      activeAnalysisId === preset.id 
                        ? 'bg-sky-500/10 border-sky-500/40' 
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
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600 active:scale-90">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all border border-slate-700 hover:border-slate-600 active:scale-90">
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
                  className="space-y-8"
                >
                  {[1, 2, 3, 4].map(i => (
                    <div key={`skeleton-${i}`} className="space-y-3">
                      <div className="h-3 w-1/4 bg-slate-800/50 rounded-full animate-pulse" />
                      <div className="h-4 w-full bg-slate-800/30 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      <div className="h-4 w-[90%] bg-slate-800/30 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  key="result"
                  ref={scrollRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="prose prose-sm prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-sky-400 prose-th:text-sky-400 prose-th:font-black prose-th:px-4 prose-td:px-4 prose-td:font-mono prose-td:text-[11px] prose-p:leading-relaxed prose-p:text-slate-300"
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
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
  );
};
