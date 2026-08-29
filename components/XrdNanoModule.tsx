import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Maximize2, 
  Sliders, 
  Layers, 
  Eye, 
  Split, 
  Cpu, 
  Zap, 
  Atom, 
  Grid, 
  Compass, 
  Microscope, 
  FileCode2, 
  History, 
  Trash2, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Pencil,
  Move,
  Ruler,
  SlidersHorizontal,
  ChevronRight,
  Share2,
  BookOpen
} from 'lucide-react';
import { 
  generateScientificImage, 
  editScientificImage, 
  enhanceScientificPrompt, 
  generateMatplotlibCode 
} from '../services/geminiService';
import { useI18n } from './I18nProvider';

interface GenerationRecord {
  id: string;
  timestamp: string;
  type: 'generate' | 'edit';
  prompt: string;
  sourceImage?: string;
  imageUrl: string;
  aspectRatio: string;
  size: string;
  styleLabel: string;
  modelUsed: string;
  explanation?: string;
}

interface PresetPrompt {
  id: string;
  category: 'lattice' | 'micrograph' | 'diffraction' | 'instrument' | 'in_situ';
  title: string;
  formula: string;
  description: string;
  prompt: string;
  styleId: string;
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
}

const XRD_NANO_PRESETS: PresetPrompt[] = [
  {
    id: 'perovskite_octahedra',
    category: 'lattice',
    title: 'Perovskite ABO3 Octahedral Tilt',
    formula: 'SrTiO3 / BaTiO3',
    description: '3D cubic perovskite showing corner-sharing TiO6 octahedra, cation sites, and atomic bonds',
    prompt: 'Ultra-high-fidelity 3D atomic ball-and-stick crystal unit cell of cubic perovskite SrTiO3, highlighting corner-sharing translucent TiO6 octahedra with golden titanium atoms, blue strontium corner cations, and red oxygen atoms. Crisp metallic bonding cylinders, ambient occlusion, studio scientific lighting, dark slate background.',
    styleId: '3d_lattice',
    aspectRatio: '1:1'
  },
  {
    id: 'core_shell_hrtem',
    category: 'micrograph',
    title: 'Au@TiO2 Core-Shell HR-TEM',
    formula: 'Au Core / TiO2 Shell',
    description: 'Atomic lattice fringes with Fourier power spectrum FFT inset showing epitaxy',
    prompt: 'High-Resolution Transmission Electron Micrograph (HRTEM) of a single 15 nm spherical Au@TiO2 core-shell nanoparticle. Atomic column lattice fringes clearly visible with 0.235 nm d-spacing for Au(111) core and 0.352 nm for anatase TiO2(101) shell. Inset showing Fast Fourier Transform (FFT) electron diffraction spot pattern in top right corner. Clean electron microscope scale bar 5 nm in bottom right.',
    styleId: 'hrtem',
    aspectRatio: '1:1'
  },
  {
    id: 'debye_scherrer_rings',
    category: 'diffraction',
    title: '2D Debye-Scherrer Rings (Area Detector)',
    formula: 'XRD 2D Area Detector',
    description: 'Concentric Debye-Scherrer powder diffraction rings with photon intensity colormap',
    prompt: 'Two-dimensional Debye-Scherrer X-ray powder diffraction rings on a flat synchrotron area detector with beam stop shadow at center. Concentric high-intensity diffraction circles labeled with sharp cyan Miller indices (111), (200), (220), (311), (222). False-color plasma heatmap indicating photon count distribution, isotropic polycrystalline grain texture.',
    styleId: 'diffraction_rings',
    aspectRatio: '1:1'
  },
  {
    id: 'synchrotron_beamline',
    category: 'instrument',
    title: 'Synchrotron Bragg-Brentano Beamline',
    formula: 'Diffractometer Optics',
    description: 'X-ray beam trajectory from synchrotron undulator, Si(111) monochromator to sample goniometer',
    prompt: 'Photorealistic technical 3D schematic diagram of a high-resolution synchrotron X-ray diffraction beamline. Showing focused monochromatic X-ray beam entering double-crystal Si(111) monochromator, passing through collimating slits, incident upon a rotating sample on a 4-circle Eulerian cradle goniometer, diffracted into a fast pixel detector. High-contrast academic journal aesthetic.',
    styleId: 'instrument_schematic',
    aspectRatio: '16:9'
  },
  {
    id: 'graphene_mos2_hetero',
    category: 'lattice',
    title: 'Graphene / MoS2 2D Heterostructure',
    formula: 'C / MoS2 van der Waals',
    description: 'Layered van der Waals interface with Moiré superlattice interference pattern',
    prompt: 'Layered 2D atomic van der Waals heterostructure comprising single-layer hexagonal graphene stacked upon monolayer MoS2 with a 5-degree twist angle, forming an intricate Moiré superlattice interference pattern. Translucent electron orbital density cloud between sheets, isometric cutaway angle, scientific Nature Materials cover quality.',
    styleId: 'journal_cover',
    aspectRatio: '4:3'
  },
  {
    id: 'in_situ_heating',
    category: 'in_situ',
    title: 'In-Situ High-Temp Phase Transition',
    formula: 'Phase Evolution 25°C - 1000°C',
    description: 'Dynamic crystalline phase transition showing lattice expansion and symmetry change',
    prompt: 'Scientific multi-stage visualization of an in-situ high-temperature XRD phase transformation from room temperature monoclinic phase to high-temperature tetragonal and cubic phases at 1000°C. Showing stacked diffractograms evolving alongside 3D atomic unit cell expansion and thermal vibration ellipsoids. Clean color gradient from cool blue to incandescent orange.',
    styleId: '3d_lattice',
    aspectRatio: '16:9'
  }
];

const XRD_STYLES = [
  { 
    id: '3d_lattice', 
    name: '3D Atomic Unit Cell', 
    desc: 'Ray-traced ball-and-stick, coordination polyhedra & bond angles',
    badge: 'Crystallography'
  },
  { 
    id: 'hrtem', 
    name: 'HR-TEM / STEM Micrograph', 
    desc: 'High-resolution electron beam lattice fringes with FFT inset',
    badge: 'Microscopy'
  },
  { 
    id: 'sem_topography', 
    name: 'FE-SEM Nanotopography', 
    desc: 'Scanning electron micrograph showing particle morphology & facets',
    badge: 'Surface Science'
  },
  { 
    id: 'diffraction_rings', 
    name: '2D Debye-Scherrer Detector', 
    desc: 'Area detector concentric rings with azimuthal intensity mapping',
    badge: 'Optics'
  },
  { 
    id: 'instrument_schematic', 
    name: 'Diffractometer & Beamline', 
    desc: 'Synchrotron goniometer geometry, X-ray optics & detector rays',
    badge: 'Hardware'
  },
  { 
    id: 'reciprocal_space', 
    name: 'Ewald Sphere & Reciprocal Space', 
    desc: 'Reciprocal lattice nodes (hkl), Ewald sphere surface & k-vectors',
    badge: 'Theoretical'
  },
  { 
    id: 'journal_cover', 
    name: 'Academic Journal Cover Style', 
    desc: 'Nature / Science magazine quality luxury conceptual artwork',
    badge: 'Publication'
  }
];

const EDIT_SUGGESTIONS = [
  "Add sharp Miller indices (111), (200), (220) text labels to the prominent peaks/rings",
  "Add a high-contrast 10 nm scientific scale bar in the bottom right corner",
  "Convert the background into a clean dark slate academic journal layout (#0f172a)",
  "Highlight the grain boundary dislocation loop in vibrant neon yellow with Burgers vector",
  "Transform into a high-angle annular dark-field (HAADF-STEM) z-contrast micrograph",
  "Add atomic coordination polyhedra around the center cations with translucent facets",
  "Overlay reciprocal space Ewald sphere intersection arcs with labeled wavevectors k_i and k_f",
  "Enhance sharpness, remove noise artifacts, and balance contrast for 300 DPI publication"
];

export const XrdNanoModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ 
  pythonFeaturesEnabled = false 
}) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();

  // Active Tab: 'generate' (Text-to-Image) | 'edit' (Image-to-Image)
  const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');

  // Generation Controls
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(XRD_STYLES[0].id);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4' | '9:16'>('1:1');
  const [imageSize, setImageSize] = useState<'512px' | '1K' | '2K' | '4K'>('1K');
  const [lighting, setLighting] = useState<string>('Studio Scientific Ambient');
  const [perspective, setPerspective] = useState<string>('Isometric 3/4 Perspective');
  const [palette, setPalette] = useState<string>('Academic High-Contrast Slate');

  // Multimodal Edit Controls
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  // Results & History State
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [modelUsedInfo, setModelUsedInfo] = useState<string>('Gemini 3.1 Flash Image');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('xrd_nano_banana2_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Canvas Overlay Tools
  const [showScaleRuler, setShowScaleRuler] = useState<boolean>(false);
  const [scaleUnits, setScaleUnits] = useState<string>('10 nm');
  const [showCrosshair, setShowCrosshair] = useState<boolean>(false);
  const [showGridOverlay, setShowGridOverlay] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [fullscreenLightbox, setFullscreenLightbox] = useState<boolean>(false);

  // Matplotlib Python generator modal / state
  const [pythonCode, setPythonCode] = useState<string | null>(null);
  const [generatingPython, setGeneratingPython] = useState<boolean>(false);
  const [copiedPython, setCopiedPython] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('xrd_nano_banana2_history', JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.warn("Could not save history to localStorage:", e);
    }
  }, [history]);

  // Handle Text-to-Image Generation
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please describe the crystallographic or XRD illustration you wish to generate.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const styleObj = XRD_STYLES.find(s => s.id === selectedStyle);
    const styleLabel = styleObj ? `${styleObj.name} (${styleObj.desc})` : 'Crystallography 3D Diagram';

    const fullPrompt = `${prompt.trim()}. Perspective: ${perspective}. Lighting: ${lighting}. Color Palette: ${palette}. Ultra-high-resolution, publication quality.`;

    try {
      const result = await generateScientificImage(fullPrompt, imageSize, styleLabel, aspectRatio);
      if (result && result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setModelUsedInfo(result.modelUsed || 'gemini-3.1-flash-image (Nano Banana 2)');
        setSuccessMessage("Synthesized with Nano Banana 2 (gemini-3.1-flash-image)!");

        const newRecord: GenerationRecord = {
          id: `nano_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'generate',
          prompt: fullPrompt,
          imageUrl: result.imageUrl,
          aspectRatio,
          size: imageSize,
          styleLabel: styleObj?.name || 'XRD Schematic',
          modelUsed: result.modelUsed || 'gemini-3.1-flash-image'
        };
        setHistory(prev => [newRecord, ...prev]);
      } else {
        throw new Error("No image data returned from model.");
      }
    } catch (err: any) {
      console.error("XRD Nano Generation failed:", err);
      setError(err.message || "Failed to generate image. Please check API quota or connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Multimodal Image Editing
  const handleEdit = async () => {
    if (!sourceImage) {
      setError("Please upload or select a source image to edit.");
      return;
    }
    if (!editPrompt.trim()) {
      setError("Please provide instructions on how you want to modify or annotate the image.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await editScientificImage(sourceImage, editPrompt.trim(), {
        aspectRatio,
        size: imageSize
      });

      if (result && result.imageUrl) {
        setCurrentImage(result.imageUrl);
        setCurrentExplanation(result.explanation || null);
        setModelUsedInfo(result.modelUsed || 'gemini-3.1-flash-image (Nano Banana 2 Editor)');
        setSuccessMessage("Image successfully transformed with Gemini 3.1 Flash Image Editor!");

        const newRecord: GenerationRecord = {
          id: `nano_edit_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'edit',
          prompt: editPrompt.trim(),
          sourceImage,
          imageUrl: result.imageUrl,
          aspectRatio,
          size: imageSize,
          styleLabel: 'Multimodal Image Edit',
          modelUsed: result.modelUsed || 'gemini-3.1-flash-image',
          explanation: result.explanation
        };
        setHistory(prev => [newRecord, ...prev]);
      } else {
        throw new Error("No edited image returned from the model.");
      }
    } catch (err: any) {
      console.error("XRD Nano Edit failed:", err);
      setError(err.message || "Failed to edit image. Please verify input image format and API access.");
    } finally {
      setLoading(false);
    }
  };

  // One-click AI Prompt Enhancer
  const handleEnhancePrompt = async () => {
    const target = activeTab === 'generate' ? prompt : editPrompt;
    if (!target.trim()) {
      setError("Enter an initial concept first before enhancing.");
      return;
    }

    setEnhancing(true);
    setError(null);
    try {
      const enhanced = await enhanceScientificPrompt(target, selectedStyle, {
        lighting,
        perspective,
        colorScheme: palette,
        addAnnotations: true,
        addGridLines: true
      });
      if (activeTab === 'generate') {
        setPrompt(enhanced);
      } else {
        setEditPrompt(enhanced);
      }
      setSuccessMessage("Prompt enhanced with crystallographic and microscopic precision!");
    } catch (err: any) {
      console.error("Enhance prompt error:", err);
    } finally {
      setEnhancing(false);
    }
  };

  // Handle File Upload for Editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file (PNG, JPEG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSourceImage(base64);
      setActiveTab('edit');
      setError(null);
      setSuccessMessage("Source image loaded into Nano Banana 2 Multimodal Editor.");
    };
    reader.readAsDataURL(file);
  };

  // Send current generated image to the editor as source
  const sendToEditor = (imgData: string) => {
    setSourceImage(imgData);
    setActiveTab('edit');
    setEditPrompt('');
    setSuccessMessage("Image transferred to Editor. Specify modifications below.");
  };

  // Apply a preset
  const applyPreset = (preset: PresetPrompt) => {
    setPrompt(preset.prompt);
    setSelectedStyle(preset.styleId);
    setAspectRatio(preset.aspectRatio);
    setActiveTab('generate');
    setSuccessMessage(`Loaded preset: ${preset.title}`);
  };

  // Download image
  const handleDownload = (imgUrl: string, filename = 'xrd_nano_gemini_export.png') => {
    const link = document.createElement('a');
    link.href = imgUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy Image to Clipboard
  const handleCopyImage = async (imgUrl: string) => {
    try {
      const response = await fetch(imgUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setSuccessMessage("Image copied to clipboard!");
    } catch (e) {
      // Fallback: copy base64 data url
      navigator.clipboard.writeText(imgUrl);
      setSuccessMessage("Image data URL copied to clipboard.");
    }
  };

  // Generate Python Matplotlib code for matching theoretical XRD plot
  const handleGeneratePython = async () => {
    const userPrompt = activeTab === 'generate' ? prompt : editPrompt;
    if (!userPrompt.trim()) return;

    setGeneratingPython(true);
    try {
      const code = await generateMatplotlibCode(userPrompt, selectedStyle);
      setPythonCode(code);
    } catch (err: any) {
      console.error("Python generation error:", err);
    } finally {
      setGeneratingPython(false);
    }
  };

  // Handle Before/After Slider Interaction
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = (x / rect.width) * 100;
    setSliderPosition(percentage);
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans pb-24 selection:bg-fuchsia-500 selection:text-white">
      
      {/* Top Banner: Nano Banana 2 (Gemini 3.1 Flash Image) Status Bar */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 px-4 py-3 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400 p-0.5 shadow-lg shadow-fuchsia-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  XRD Nano Banana 2 AI Studio
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                    gemini-3.1-flash-image
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Next-generation text-to-image synthesis & multimodal editing for crystallography, HR-TEM, and XRD
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'generate'
                  ? 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-md shadow-fuchsia-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Text-to-Image (Create)
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'edit'
                  ? 'bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Image-to-Image (Edit & Annotate)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Success / Error Alerts */}
        <AnimatePresence mode="popLayout">
          {error && (
            <motion.div 
              key="xrd-nano-error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-200">
                &times;
              </button>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              key="xrd-nano-success-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">
                &times;
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Controls & Prompt Input (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Active Mode Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${activeTab === 'generate' ? 'bg-fuchsia-500/20 text-fuchsia-400' : 'bg-pink-500/20 text-pink-400'}`}>
                    {activeTab === 'generate' ? <Wand2 className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      {activeTab === 'generate' ? 'XRD Illustration Prompt' : 'Multimodal Image Modification'}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {activeTab === 'generate' 
                        ? 'Powered by Gemini 3.1 Flash Image' 
                        : 'Modify, annotate, or restyle existing micrographs and diagrams'}
                    </p>
                  </div>
                </div>

                {/* AI Prompt Enhancer Button */}
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || loading}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold transition-all disabled:opacity-50"
                  title="Enhance prompt with crystallographic & optical details"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${enhancing ? 'animate-spin text-amber-400' : 'text-fuchsia-400'}`} />
                  {enhancing ? 'Enhancing...' : 'AI Enhance'}
                </button>
              </div>

              {/* In Edit Mode: Source Image Upload Box */}
              {activeTab === 'edit' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Source Image to Edit:</span>
                    {sourceImage && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-pink-400 hover:text-pink-300 underline"
                      >
                        Change Image
                      </button>
                    )}
                  </label>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />

                  {sourceImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-48 group">
                      <img 
                        src={sourceImage} 
                        alt="Source to edit" 
                        className="w-full h-40 object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => setSourceImage(null)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-rose-300 text-xs font-semibold border border-slate-700"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-[10px] font-mono text-slate-300">
                        Source Loaded
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-pink-500/60 rounded-xl p-6 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group"
                    >
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-pink-400 mx-auto mb-2 transition-colors" />
                      <p className="text-xs font-medium text-slate-300">
                        Click or drag & drop to upload an XRD pattern or micrograph
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Supports PNG, JPG, WebP (HRTEM, SEM, SAED rings, or 3D crystal plots)
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{activeTab === 'generate' ? 'Crystallographic Prompt:' : 'Editing Instructions:'}</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {(activeTab === 'generate' ? prompt : editPrompt).length} chars
                  </span>
                </label>
                <textarea
                  value={activeTab === 'generate' ? prompt : editPrompt}
                  onChange={(e) => activeTab === 'generate' ? setPrompt(e.target.value) : setEditPrompt(e.target.value)}
                  placeholder={
                    activeTab === 'generate'
                      ? "E.g. High-magnification HRTEM micrograph of Au@TiO2 core-shell nanocrystals with visible lattice fringes, FFT pattern inset, and dark background..."
                      : "E.g. Add Miller indices (111), (200), (220) to the diffraction rings, add a 10 nm scale bar in bottom right, and improve contrast..."
                  }
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 resize-none transition-all outline-none"
                />
              </div>

              {/* Edit Suggestions Chips (in Edit Mode) */}
              {activeTab === 'edit' && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Edit Commands:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {EDIT_SUGGESTIONS.slice(0, 4).map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => setEditPrompt(prev => prev ? `${prev}. ${sug}` : sug)}
                        className="text-[10px] px-2 py-1 rounded-md bg-slate-800/80 hover:bg-pink-950 hover:text-pink-200 border border-slate-700 hover:border-pink-500/40 text-slate-300 text-left transition-all"
                      >
                        + {sug.slice(0, 42)}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Style Selector (in Generate Mode) */}
              {activeTab === 'generate' && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Scientific Illustration Style:</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {XRD_STYLES.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelectedStyle(st.id)}
                        className={`p-2 rounded-xl text-left border transition-all ${
                          selectedStyle === st.id
                            ? 'bg-fuchsia-950/50 border-fuchsia-500/60 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${selectedStyle === st.id ? 'text-fuchsia-300' : 'text-slate-200'}`}>
                            {st.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{st.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Configuration Grid: Aspect Ratio, Resolution & Tuning */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                {/* Aspect Ratio */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Aspect Ratio:</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-fuchsia-500"
                  >
                    <option value="1:1">1:1 (Square / Micrograph)</option>
                    <option value="16:9">16:9 (Presentation / Wide)</option>
                    <option value="4:3">4:3 (Journal Figure Panel)</option>
                    <option value="3:4">3:4 (Journal Cover / Portrait)</option>
                    <option value="9:16">9:16 (Tall / Poster Strip)</option>
                  </select>
                </div>

                {/* Resolution / Image Size */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Output Resolution:</label>
                  <select
                    value={imageSize}
                    onChange={(e) => setImageSize(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-fuchsia-500"
                  >
                    <option value="512px">512px (Fast Draft)</option>
                    <option value="1K">1K (1024px Standard)</option>
                    <option value="2K">2K (2048px Journal 300 DPI)</option>
                    <option value="4K">4K (4096px Ultra-Res)</option>
                  </select>
                </div>
              </div>

              {/* Advanced Optics Controls Collapsible */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">Lighting:</label>
                    <select
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md p-1 text-[11px] text-slate-300"
                    >
                      <option value="Studio Scientific Ambient">Studio Ambient</option>
                      <option value="Electron Darkfield Illumination">Darkfield</option>
                      <option value="Brightfield Optical Contrast">Brightfield</option>
                      <option value="High-Contrast Volumetric Rim">Volumetric</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Perspective:</label>
                    <select
                      value={perspective}
                      onChange={(e) => setPerspective(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md p-1 text-[11px] text-slate-300"
                    >
                      <option value="Isometric 3/4 Perspective">Isometric 3/4</option>
                      <option value="Top-Down Planar View">Top-Down</option>
                      <option value="Cutaway Cross-Section">Cutaway</option>
                      <option value="Atomic Column Zone Axis">Zone Axis</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Palette:</label>
                    <select
                      value={palette}
                      onChange={(e) => setPalette(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md p-1 text-[11px] text-slate-300"
                    >
                      <option value="Academic High-Contrast Slate">Academic Slate</option>
                      <option value="Electron Grayscale Realism">SEM Grayscale</option>
                      <option value="Plasma Thermal False-Color">Plasma Thermal</option>
                      <option value="Nature Materials Emerald">Nature Emerald</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Submit Button */}
              <button
                onClick={activeTab === 'generate' ? handleGenerate : handleEdit}
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                  loading
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : activeTab === 'generate'
                      ? 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white shadow-fuchsia-600/30'
                      : 'bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-pink-600/30'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing with Nano Banana 2...</span>
                  </>
                ) : activeTab === 'generate' ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Synthesize Crystallographic Image</span>
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4" />
                    <span>Execute Multimodal Image Edit</span>
                  </>
                )}
              </button>
            </div>

            {/* Presets Library Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Atom className="w-3.5 h-3.5 text-fuchsia-400" />
                  Crystallographic XRD Presets
                </span>
                <span className="text-[10px] font-mono text-slate-500">{XRD_NANO_PRESETS.length} templates</span>
              </div>

              <div className="space-y-2">
                {XRD_NANO_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800/60 hover:border-fuchsia-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-200 group-hover:text-fuchsia-300 transition-colors">
                        {preset.title}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {preset.formula}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {preset.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Output Canvas, Interactive Caliper & Overlays (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Primary Display Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              
              {/* Canvas Header & Tools Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-slate-200">
                    Active Canvas Output
                  </span>
                  <span className="text-[10px] font-mono text-fuchsia-400 bg-fuchsia-950/50 px-2 py-0.5 rounded-md border border-fuchsia-500/30">
                    {modelUsedInfo}
                  </span>
                </div>

                {/* Interactive Overlays Toggle Group */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setShowScaleRuler(!showScaleRuler)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      showScaleRuler ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Crystallographic Scale Bar"
                  >
                    <Ruler className="w-3 h-3" />
                    Scale ({scaleUnits})
                  </button>
                  <button
                    onClick={() => setShowGridOverlay(!showGridOverlay)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      showGridOverlay ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Calibration Grid"
                  >
                    <Grid className="w-3 h-3" />
                    Grid
                  </button>
                  <button
                    onClick={() => setShowCrosshair(!showCrosshair)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                      showCrosshair ? 'bg-fuchsia-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle Diffractometer Beam Center Crosshairs"
                  >
                    <Compass className="w-3 h-3" />
                    Beam Center
                  </button>
                </div>
              </div>

              {/* The Visual Canvas / Image Display */}
              <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner group select-none">
                
                {loading ? (
                  <div className="text-center space-y-3 p-6">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-2 border-fuchsia-500/20 border-t-fuchsia-500 animate-spin" />
                      <div className="absolute inset-2 rounded-full border-2 border-purple-500/30 border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse' }} />
                      <Sparkles className="w-6 h-6 text-fuchsia-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200">Synthesizing with Nano Banana 2...</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">gemini-3.1-flash-image diffusion & crystallographic rendering</p>
                    </div>
                  </div>
                ) : currentImage ? (
                  <>
                    {/* If in edit mode with source image and comparison toggled on */}
                    {activeTab === 'edit' && sourceImage && isComparing ? (
                      <div 
                        ref={sliderRef}
                        onMouseMove={(e) => e.buttons === 1 && handleSliderMove(e.clientX)}
                        onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
                        className="relative w-full h-full cursor-ew-resize overflow-hidden"
                      >
                        {/* Modified Image (Full background) */}
                        <img 
                          src={currentImage} 
                          alt="Edited Result" 
                          className="w-full h-full object-contain"
                          style={{ transform: `scale(${zoomLevel})` }}
                          referrerPolicy="no-referrer"
                        />

                        {/* Source Image (Clipped overlay) */}
                        <div 
                          className="absolute inset-0 overflow-hidden"
                          style={{ width: `${sliderPosition}%` }}
                        >
                          <img 
                            src={sourceImage} 
                            alt="Original Source" 
                            className="w-full h-full object-contain"
                            style={{ 
                              width: sliderRef.current?.clientWidth || '100%',
                              maxWidth: 'none',
                              transform: `scale(${zoomLevel})` 
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 px-2 py-1 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-700">
                            Original (Before)
                          </div>
                        </div>

                        {/* Slider Divider Bar */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.8)]"
                          style={{ left: `${sliderPosition}%` }}
                        >
                          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-fuchsia-500 border-2 border-white shadow flex items-center justify-center text-[10px] text-white">
                            <Split className="w-3 h-3" />
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-fuchsia-950/80 text-[10px] font-mono text-fuchsia-300 border border-fuchsia-500/40">
                          Nano Banana 2 (After)
                        </div>
                      </div>
                    ) : (
                      /* Standard Single Image View */
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <img 
                          src={currentImage} 
                          alt="Generated Scientific Diagram" 
                          className="w-full h-full object-contain transition-transform duration-200"
                          style={{ transform: `scale(${zoomLevel})` }}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}

                    {/* Scale Ruler Overlay */}
                    {showScaleRuler && (
                      <div className="absolute bottom-4 right-4 bg-slate-950/90 border border-slate-700 px-3 py-1.5 rounded-lg shadow-lg flex flex-col items-center">
                        <div className="w-20 h-1 bg-white relative">
                          <div className="absolute -left-0.5 -top-1 w-0.5 h-3 bg-white" />
                          <div className="absolute -right-0.5 -top-1 w-0.5 h-3 bg-white" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-200 mt-1">
                          {scaleUnits}
                        </span>
                      </div>
                    )}

                    {/* Grid Overlay */}
                    {showGridOverlay && (
                      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#38bdf815_1px,transparent_1px),linear-gradient(to_bottom,#38bdf815_1px,transparent_1px)] bg-[size:24px_24px]" />
                    )}

                    {/* Beam Center Crosshairs */}
                    {showCrosshair && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="w-full h-[1px] bg-cyan-400/40" />
                        <div className="h-full w-[1px] bg-cyan-400/40 absolute" />
                        <div className="w-8 h-8 rounded-full border border-cyan-400/60 absolute" />
                        <div className="w-16 h-16 rounded-full border border-cyan-400/30 border-dashed absolute" />
                      </div>
                    )}

                    {/* Floating Zoom & Lightbox Controls */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 p-1 rounded-xl shadow-lg opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setZoomLevel(1)}
                        className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-white"
                        title="Reset Zoom"
                      >
                        {Math.round(zoomLevel * 100)}%
                      </button>
                      <button
                        onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFullscreenLightbox(true)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 ml-1 border-l border-slate-800"
                        title="Fullscreen Lightbox"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Empty Canvas Placeholder */
                  <div className="text-center p-8 space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-300">XRD Canvas Ready</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                        Select a crystallographic template on the left or write a custom prompt to synthesize an illustration with Gemini 3.1 Flash Image.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Output Actions Bar */}
              {currentImage && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(currentImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5 text-fuchsia-400" />
                      Download PNG
                    </button>
                    <button
                      onClick={() => handleCopyImage(currentImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition-all"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      Copy
                    </button>
                    <button
                      onClick={() => sendToEditor(currentImage)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 text-xs font-semibold border border-pink-500/40 shadow transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-pink-400" />
                      Send to Editor
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Python Matplotlib generator button */}
                    <button
                      onClick={handleGeneratePython}
                      disabled={generatingPython}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-500/40 transition-all"
                    >
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      {generatingPython ? 'Generating Python...' : 'Get Python Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* Model Explanation Text (if present) */}
              {currentExplanation && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <span className="font-semibold text-fuchsia-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Model Modification Notes:
                  </span>
                  <p className="text-slate-400 leading-relaxed">{currentExplanation}</p>
                </div>
              )}

            </div>

            {/* Python Matplotlib Co-Generator Output Panel (if generated) */}
            {pythonCode && (
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">
                      Matching Python Matplotlib XRD Script
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pythonCode);
                      setCopiedPython(true);
                      setTimeout(() => setCopiedPython(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all"
                  >
                    {copiedPython ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedPython ? 'Copied!' : 'Copy Code'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-60 overflow-y-auto leading-relaxed">
                  {pythonCode}
                </pre>
              </div>
            )}

            {/* Session History Strip */}
            {history.length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    Recent Nano Banana 2 Generations ({history.length})
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Clear XRD Nano generation history?")) {
                        setHistory([]);
                        localStorage.removeItem('xrd_nano_banana2_history');
                      }
                    }}
                    className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {history.slice(0, 12).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCurrentImage(item.imageUrl);
                        setModelUsedInfo(item.modelUsed);
                        setCurrentExplanation(item.explanation || null);
                      }}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-fuchsia-500 cursor-pointer group bg-slate-950 transition-all"
                    >
                      <img 
                        src={item.imageUrl} 
                        alt="History item" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1 rounded bg-slate-900/80 text-[8px] font-mono text-slate-400">
                        {item.type === 'edit' ? 'Edit' : 'Create'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {fullscreenLightbox && currentImage && (
        <div 
          onClick={() => setFullscreenLightbox(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh] flex items-center justify-center">
            <img 
              src={currentImage} 
              alt="Fullscreen XRD Diagram" 
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-800 shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setFullscreenLightbox(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700"
            >
              &times;
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
