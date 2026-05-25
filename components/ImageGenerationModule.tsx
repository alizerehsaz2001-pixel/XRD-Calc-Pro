
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Image as ImageIcon, 
  Sparkles, 
  Download, 
  History, 
  Trash2, 
  Layers, 
  Settings2, 
  Info,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Box,
  Microscope,
  Palette,
  Layout,
  ExternalLink,
  Sun,
  Grid,
  SlidersHorizontal,
  Eye,
  Compass,
  HelpCircle,
  Check,
  BookOpen
} from 'lucide-react';
import { generateScientificImage, isQuotaError, isPermissionError, enhanceScientificPrompt } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';

interface GenerationRecord {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  url: string;
  timestamp: number;
  style: string;
}

const SCIENTIFIC_STYLES = [
  { id: '3d_schematic', label: '3D Schematic', icon: Box, description: 'Clean 3D models with professional lighting' },
  { id: 'sem', label: 'SEM Micrograph', icon: Microscope, description: 'Scanning Electron Microscope style (textured b/w)' },
  { id: 'crystal', label: 'Crystal Lattice', icon: Layers, description: 'Highly accurate atomic arrangements' },
  { id: 'watercolor', label: 'Technical Watercolor', icon: Palette, description: 'Artistic but descriptive textbook style' },
  { id: 'diagram', label: 'Minimalist Diagram', icon: Layout, description: 'Flat design, high-contrast structural data' },
  { id: 'diffraction', label: 'Simulated Pattern', icon: RefreshCw, description: 'Visual representation of diffraction peaks' },
  { id: 'molecular', label: 'Molecular Orbitals', icon: Sparkles, description: 'Probability clouds and bonding orientations' },
];

const LIGHTING_OPTIONS = [
  { id: 'Daylight Studio Accent', label: 'Daylight Accent' },
  { id: 'Ring Light Shadowless illumination', label: 'Shadowless Ring' },
  { id: 'Darkfield High contrast back-glow', label: 'Darkfield Gloss' },
  { id: 'Volumetric Transmission Light rays', label: 'Translucent Ray' },
  { id: 'X-Ray Spectral fluorescence glow', label: 'X-Ray Spectral' },
];

const PERSPECTIVE_OPTIONS = [
  { id: '3-Quarter Isometric Perspective angle', label: '3D Isometric' },
  { id: 'Orthographic Top-Down crystal plane face', label: 'Orthographic Flat' },
  { id: 'Cross-section split structural layer diagram', label: 'Cross-Section' },
  { id: 'Extreme macro zoom scientific magnifying lens', label: 'Atomic Macro' },
  { id: 'High angle schematic wide-view core view', label: 'Wide Schematic' },
];

const COLOR_SCHEME_OPTIONS = [
  { id: 'Teal-Indigo academic journal style', label: 'Teal & Indigo' },
  { id: 'Monochrome high-resolution electron micrograph textured', label: 'SEM Monochrome' },
  { id: 'Thermal spectral heat mapping potential energy scale', label: 'Thermal Gradient' },
  { id: 'Classic textbook color palette clean off-white canvas', label: 'Classic Textbook' },
  { id: 'Neon cybernetic blueprint tech matrix highlight', label: 'Cyber Blueprints' },
];

const CATEGORIZED_CONCEPTS = {
  lattices: [
    { label: "Perovskite ABO3 unit cell showcasing corner-sharing TiO6 octahedra with clear metallic bonds", desc: "Perovskite Unit Cell" },
    { label: "Face-Centered Cubic (FCC) copper unit cell highlighting interstitial spaces", desc: "FCC Unit Cell" },
    { label: "Hexagonal Close-Packed (HCP) unit cell showing planar layer stacking", desc: "HCP Stacking" },
    { label: "Misfit grain boundary dislocation loop crystal plane misalignment schematic", desc: "Grain Boundary" },
  ],
  experimental: [
    { label: "Symmetric Bragg-Brentano XRD diffractometer configuration visual pathway", desc: "diffractometer setup" },
    { label: "Incident x-ray beam reflecting on atomic lattice planes confirming Bragg's Law", desc: "Bragg geometry" },
    { label: "Atomic force microscopy (AFM) cantilever scanning over molecular surface", desc: "AFM Scan Line" },
    { label: "Transmission electron microscope (TEM) column showing focal ray pathways", desc: "TEM Ray Trace" },
  ],
  micrographs: [
    { label: "HRTEM view showing high-resolution atomic columns in silicon crystal structure", desc: "Atomic HRTEM" },
    { label: "Scanning Electron Micrograph (SEM) of vertically self-assembled TiO2 hollow nanotubes", desc: "TiO2 Nanotubes" },
    { label: "Selected Area Electron Diffraction (SAED) concentric ring spot diffraction pattern", desc: "SAED Rings" },
    { label: "Topographical height profiling image showcasing layered graphite micro-flakes", desc: "Graphite Flakes" },
  ]
};

const RenderingConsole: React.FC<{ styleName: string, size: string }> = ({ styleName, size }) => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    const messages = [
      "Constructing latent space matrices...",
      "Validating academic journal style alignment...",
      `Applying structural prompt constraints [${styleName}]...`,
      "Integrating optical reflection characteristics...",
      `Scaling canvas resolution target to ${size}...`,
      "Iterating latent diffusion steps (Euler Ancestral dco)...",
      "Correcting grain boundary aberration artifacts...",
      "Synthesizing high-fidelity annotations & labels...",
      "Polishing texture luminance and finalized contrast..."
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
    }, 1100);
    
    return () => clearInterval(interval);
  }, [styleName, size]);

  return (
    <div className="space-y-4 bg-slate-950 p-6 rounded-2xl border border-fuchsia-500/20 shadow-[inset_0_0_30px_rgba(217,70,239,0.05)] w-full max-w-sm text-left my-4 font-sans">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-fuchsia-500 animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-350">GPU Synchrotron Core Live</span>
      </div>

      <div className="space-y-2 font-mono text-[9px] text-fuchsia-350 max-h-[140px] overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-fuchsia-500 select-none">&gt;</span>
            <span className={i === logs.length - 1 ? 'text-fuchsia-300 font-extrabold animate-pulse' : 'text-slate-500 font-medium'}>
              {log}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-slate-900 flex justify-between items-center text-[8px] font-bold text-slate-550 uppercase tracking-widest">
         <span>Diffusion: ACTIVE</span>
         <span className="animate-pulse text-fuchsia-500 font-mono font-black">RENDERING</span>
      </div>
    </div>
  );
};

export const ImageGenerationModule: React.FC = () => {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(SCIENTIFIC_STYLES[0].id);
  const [size, setSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Advanced Crystallography Vector States
  const [lighting, setLighting] = useState<string>('Daylight Studio Accent');
  const [perspective, setPerspective] = useState<string>('3-Quarter Isometric Perspective angle');
  const [colorScheme, setColorScheme] = useState<string>('Teal-Indigo academic journal style');
  const [addAnnotations, setAddAnnotations] = useState<boolean>(false);
  const [addGridLines, setAddGridLines] = useState<boolean>(false);
  const [addForceVectors, setAddForceVectors] = useState<boolean>(false);
  const [activeConceptTab, setActiveConceptTab] = useState<'lattices' | 'experimental' | 'micrographs'>('lattices');

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('xrd_image_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem('xrd_image_history', JSON.stringify(history));
  }, [history]);

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const styleLabel = SCIENTIFIC_STYLES.find(s => s.id === selectedStyle)?.label || 'Scientific';
      const enhanced = await enhanceScientificPrompt(prompt, styleLabel, {
        lighting,
        perspective,
        colorScheme,
        addAnnotations,
        addGridLines,
        addForceVectors
      });
      setPrompt(enhanced);
    } catch (e) {
      setError("Failed to enhance prompt. Using original.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setError(null);
    setLoading(true);

    try {
      // 1. Check for API Key using window.aistudio
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await (window as any).aistudio?.openSelectKey();
        } catch (e) {
          setLoading(false);
          setError("API Key selection was cancelled or failed.");
          return;
        }
      }

      // 2. Generate Image
      const styleLabel = SCIENTIFIC_STYLES.find(s => s.id === selectedStyle)?.label;
      const result = await generateScientificImage(prompt, size, styleLabel);
      
      if (result) {
        setImageUrl(result);
        const newRecord: GenerationRecord = {
          id: Date.now().toString(),
          prompt: prompt,
          url: result,
          timestamp: Date.now(),
          style: selectedStyle
        };
        setHistory([newRecord, ...history].slice(0, 20)); // Keep last 20
      } else {
        setError("Generation completed but no image was returned. Try a different prompt.");
      }
    } catch (e: any) {
      if (!isQuotaError(e) && !isPermissionError(e)) {
        console.error(e);
      }
      if (e.message && e.message.includes("Requested entity was not found")) {
        setError("The selected API Key project was not found. Please select a valid key.");
        try { await (window as any).aistudio?.openSelectKey(); } catch (retryErr) {}
      } else if (isQuotaError(e)) {
         setError("Quota exhausted (429). Please wait and try again.");
      } else if (isPermissionError(e)) {
         setError("Permission denied (403). Ensure 'Imagen' is enabled in your Google Cloud project.");
      } else {
        setError("Failed to generate image. " + (e.message || "Unknown error."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `scientific-illustration-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearHistory = () => {
    if (confirm("Clear all generation history?")) {
      setHistory([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-fuchsia-600" />
              Scientific Illustrator
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">High-fidelity structural & experimental diagrams</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Prompt Section */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Concept Description
                </label>
                <button 
                  onClick={handleEnhancePrompt}
                  disabled={isEnhancing || !prompt.trim()}
                  className="text-[10px] font-bold text-fuchsia-600 hover:text-fuchsia-700 flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  {isEnhancing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  AI ENHANCE
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A realistic 3D representation of the perovskite crystal structure with labeled octahedra..."
                className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all text-sm leading-relaxed"
              />
              <div className="mt-3">
                <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-3">
                  {(['lattices', 'experimental', 'micrographs'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={(e) => { e.preventDefault(); setActiveConceptTab(tab); }}
                      className={`text-[9px] font-black uppercase tracking-wider pb-1 px-1 transition-all border-b-2 ${
                        activeConceptTab === tab 
                          ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400' 
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab === 'lattices' ? 'Crystals' : tab === 'experimental' ? 'Setups' : 'Scans'}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIZED_CONCEPTS[activeConceptTab].map((item, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(item.label)}
                      title={item.label}
                      className="text-left text-[9.5px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 p-2 rounded-xl transition-all border border-slate-150 dark:border-slate-850 hover:border-fuchsia-200 dark:hover:border-fuchsia-800 line-clamp-2 h-[42px] leading-snug flex items-center"
                    >
                      {item.desc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Styles Grid */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Visual Style
              </label>
              <div className="grid grid-cols-1 gap-2">
                {SCIENTIFIC_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                      selectedStyle === style.id
                        ? 'bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:border-fuchsia-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-fuchsia-200 dark:hover:border-fuchsia-800'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      selectedStyle === style.id ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <style.icon size={16} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${selectedStyle === style.id ? 'text-fuchsia-900 dark:text-fuchsia-100' : 'text-slate-700 dark:text-slate-200'}`}>
                        {style.label}
                      </p>
                      <p className="text-[9.5px] text-slate-500 dark:text-slate-400 line-clamp-1">{style.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Design Vector parameters */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-fuchsia-500" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Advanced Core Tuning</span>
              </div>
              
              <div className="space-y-3 pl-1">
                {/* Lighting dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sun size={10} /> Lighting Matrix
                  </label>
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-fuchsia-500"
                  >
                    {LIGHTING_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Perspective dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Compass size={10} /> Camera Axis
                  </label>
                  <select
                    value={perspective}
                    onChange={(e) => setPerspective(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-fuchsia-500"
                  >
                    {PERSPECTIVE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Color Schemes */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Palette size={10} /> Palette Blueprint
                  </label>
                  <select
                    value={colorScheme}
                    onChange={(e) => setColorScheme(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-fuchsia-500"
                  >
                    {COLOR_SCHEME_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle Swatches */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setAddAnnotations(!addAnnotations)}
                    className={`py-2 px-2 rounded-xl text-[9.5px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                      addAnnotations 
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                        : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-355'
                    }`}
                  >
                    {addAnnotations && <Check size={10} />} Labels Overlay
                  </button>
                  <button
                    onClick={() => setAddGridLines(!addGridLines)}
                    className={`py-2 px-2 rounded-xl text-[9.5px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                      addGridLines 
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                        : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-355'
                    }`}
                  >
                    {addGridLines && <Check size={10} />} Grid Nodes
                  </button>
                  <button
                    onClick={() => setAddForceVectors(!addForceVectors)}
                    className={`col-span-2 py-2 px-2 rounded-xl text-[9.5px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                      addForceVectors 
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                        : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-355'
                    }`}
                  >
                    {addForceVectors && <Check size={10} />} Crystallographic Force Vectors
                  </button>
                </div>
              </div>
            </div>

            {/* Resolution & Settings */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolution</span>
                <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {(['1K', '2K', '4K'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        size === s
                          ? 'bg-white dark:bg-slate-700 text-fuchsia-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group
                  ${loading || !prompt.trim() ? 'bg-slate-300 dark:bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-fuchsia-600 hover:bg-fuchsia-700 hover:shadow-fuchsia-500/20 active:scale-[0.98]'}
                `}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    Render Illustration
                  </>
                )}
              </button>

              {error && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-4 p-3 bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-medium border border-red-100 dark:border-red-900/50 flex gap-2"
                >
                  <Info className="h-4 w-4 shrink-0" />
                  <div>
                    {error}
                    {error.includes("API Key") && (
                      <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="block mt-1 underline font-bold uppercase tracking-tighter">
                        View Billing Details <ExternalLink className="inline h-2 w-2" />
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* History Preview (Desktop) */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <History size={14} />
              Recent Artifacts
            </h3>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-[10px] text-slate-400 hover:text-red-500 transition-colors"
                title="Clear History"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {history.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setImageUrl(item.url);
                  setPrompt(item.prompt);
                  setSelectedStyle(item.style);
                }}
                className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-fuchsia-400 transition-colors"
              >
                <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={16} className="text-white" />
                </div>
              </button>
            ))}
            {history.length === 0 && (
              <div className="col-span-2 py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] text-slate-400">No artifacts generated yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Preview Canvas */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        <motion.div 
          layout
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full min-h-[650px] transition-all"
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-fuchsia-500 animate-pulse"></div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">Active Canvas</h3>
            </div>
            
            <div className="flex items-center gap-2">
              {imageUrl && (
                <button
                  onClick={() => handleDownload(imageUrl)}
                  className="px-4 py-1.5 bg-fuchsia-600 text-white rounded-full text-xs font-bold hover:bg-fuchsia-700 transition-colors flex items-center gap-1.5 shadow-md shadow-fuchsia-500/20"
                >
                  <Download size={14} />
                  Download Artifact
                </button>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative flex items-center justify-center bg-slate-50 dark:bg-black/20 overflow-hidden">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  key="loading"
                  className="text-center z-10 p-8 flex flex-col items-center justify-center"
                >
                  <div className="relative mb-4">
                    <div className="w-16 h-16 border-2 border-fuchsia-100 dark:border-fuchsia-900/30 rounded-full mx-auto"></div>
                    <div className="absolute inset-0 w-16 h-16 border-t-2 border-fuchsia-500 rounded-full mx-auto animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layers size={22} className="text-fuchsia-500 animate-pulse" />
                    </div>
                  </div>
                  <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-0.5 tracking-tight">Synthesizing Pixels</h4>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400">Neural rendering in progress ({size})</p>
                  
                  <RenderingConsole 
                    styleName={SCIENTIFIC_STYLES.find(s => s.id === selectedStyle)?.label || 'Scientific'} 
                    size={size} 
                  />

                  <div className="mt-2 w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-fuchsia-500"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 10, ease: "linear" }}
                    />
                  </div>
                </motion.div>
              ) : imageUrl ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key="preview"
                  className="w-full h-full p-8 flex items-center justify-center"
                >
                  <img 
                    src={imageUrl} 
                    alt="Generated Scientific Illustration" 
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/50 dark:border-white/5"
                  />
                  {/* Subtle info overlay */}
                  <div className="absolute bottom-12 left-12 right-12 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium line-clamp-2 italic">"{history[0]?.prompt}"</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key="empty"
                  className="text-center p-12 max-w-sm"
                >
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
                    <ImageIcon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h4 className="text-slate-400 dark:text-slate-500 font-bold mb-2 uppercase tracking-wide">Empty Canvas</h4>
                  <p className="text-slate-400 dark:text-slate-600 text-sm leading-relaxed">
                    Visualise complex crystal lattices, experimental setups, or molecular schemas.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-left bg-white dark:bg-slate-900/50">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">IMAGE TYPE</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Square 1:1</p>
                    </div>
                    <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-left bg-white dark:bg-slate-900/50">
                      <p className="text-[10px] font-bold text-slate-400 mb-1">MODEL</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 uppercase tracking-tighter">Imagen-3</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Technical Context / Credits */}
        <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-fuchsia-400 border border-slate-700">
              <Settings2 size={18} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Generation Engine</p>
              <p className="text-xs text-slate-300">Imagen-3 (High-Fidelity Scientific Core)</p>
            </div>
          </div>
          <p className="text-[10px] max-w-[200px] text-right text-slate-500 italic">
            Advanced GPU acceleration enabled. Resolution scaling via AI Super-Res.
          </p>
        </div>
      </div>
    </div>
  );
};
