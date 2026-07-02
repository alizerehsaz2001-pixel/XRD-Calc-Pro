
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
  BookOpen,
  Cpu,
  Code,
  Terminal,
  Play
} from 'lucide-react';
import { 
  generateScientificImage, 
  isQuotaError, 
  isPermissionError, 
  enhanceScientificPrompt,
  generateMatplotlibCode
} from '../services/geminiService';
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

const MATPLOTLIB_PRESETS = [
  {
    id: 'xrd_diffractogram',
    label: 'XRD Scan Sim',
    description: 'Lorentzian powder peak profile with background noise',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Define simulated peaks (2theta, intensity, FWHM)
peaks = [
    {"2theta": 27.4, "I": 100, "fwhm": 0.25, "hkl": "111"},
    {"2theta": 31.8, "I": 65, "fwhm": 0.28, "hkl": "200"},
    {"2theta": 45.6, "I": 45, "fwhm": 0.32, "hkl": "220"},
    {"2theta": 54.1, "I": 38, "fwhm": 0.35, "hkl": "311"},
    {"2theta": 56.8, "I": 15, "fwhm": 0.38, "hkl": "222"}
]

two_theta = np.linspace(20, 70, 1000)
intensity = np.zeros_like(two_theta)

for p in peaks:
    x0 = p["2theta"]
    gamma = p["fwhm"] / 2.0
    amp = p["I"]
    lorentz = amp * (gamma**2) / ((two_theta - x0)**2 + gamma**2)
    intensity += lorentz

# Add background & thermal decay
background = 5 + 10 * np.exp(-two_theta/40)
noise = np.random.normal(0, 1.2, len(two_theta))
total_intensity = intensity + background + np.abs(noise)

fig, ax = plt.subplots(figsize=(6.5, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Plot peak scans
ax.plot(two_theta, total_intensity, color='#38bdf8', linewidth=1.5, label='Diffraction Pattern')

# Annotate crystallographic Miller peaks
for p in peaks:
    ax.annotate(f"({p['hkl']})", 
                xy=(p["2theta"], p["I"] + 10), 
                xytext=(p["2theta"], p["I"] + 25),
                ha='center', fontsize=8, color='#f59e0b',
                arrowprops=dict(arrowstyle="->", color='#f59e0b', alpha=0.6, lw=0.8))

ax.set_title("Simulated XRD Powder Diffratogram (Lorentzian Fit)", color='#f1f5f9', fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Diffraction Angle 2θ (degrees)", color='#94a3b8', fontsize=9)
ax.set_ylabel("Intensity (Arbitrary Units)", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.5)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'reciprocal_map',
    label: 'Reciprocal Map RSM',
    description: '2D logarithmic contour of epitaxial peak strain',
    code: `import numpy as np
import matplotlib.pyplot as plt

qx = np.linspace(-0.04, 0.04, 150)
qz = np.linspace(3.14, 3.22, 150)
QX, QZ = np.meshgrid(qx, qz)

# Substrate vs epilayer peak positioning
sub_x, sub_z = 0.0, 3.19
layer_x, layer_z = -0.012, 3.168

dist_sub = np.sqrt(((QX - sub_x)/0.015)**2 + ((QZ - sub_z)/0.008)**2)
dist_layer = np.sqrt(((QX - layer_x)/0.018)**2 + ((QZ - layer_z)/0.012)**2)

I_sub = 1e5 * np.exp(-dist_sub**2)
I_layer = 4e3 * np.exp(-dist_layer**2)
Z = np.log10(I_sub + I_layer + np.random.uniform(1, 10, QX.shape))

fig, ax = plt.subplots(figsize=(6.5, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Contour Plotting
contour = ax.contourf(QX, QZ, Z, levels=14, cmap='turbo')
cbar = fig.colorbar(contour, ax=ax)
cbar.set_label('Log Intensity (I)', color='#94a3b8', fontsize=9)
cbar.ax.tick_params(labelsize=8, colors='#94a3b8')

ax.text(sub_x + 0.002, sub_z, 'Substrate (004)', color='#ffffff', fontsize=8, fontweight='bold')
ax.text(layer_x + 0.002, layer_z, 'Epilayer (Strained)', color='#ffffff', fontsize=8, fontweight='bold')

ax.set_title("Reciprocal Space Mapping (RSM) Contours", color='#f1f5f9', fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("$Q_x$ (r.l.u.)", color='#94a3b8', fontsize=9)
ax.set_ylabel("$Q_z$ (r.l.u.)", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#ffffff', linestyle=':', alpha=0.1)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'fcc_projection',
    label: 'Lattice Projection',
    description: 'FCC copper unit cell projection on the (001) plane',
    code: `import numpy as np
import matplotlib.pyplot as plt

a = 3.615  # Lattice constant in Angstrom
x, y, atomic_class = [], [], []

# Generate crystalline corner & face coords
for i in range(-3, 4):
    for j in range(-3, 4):
        x.append(i * a)
        y.append(j * a)
        atomic_class.append('Corner')
        
        x.append((i + 0.5) * a)
        y.append((j + 0.5) * a)
        atomic_class.append('Face')

x_arr = np.array(x)
y_arr = np.array(y)
class_arr = np.array(atomic_class)

fig, ax = plt.subplots(figsize=(6.5, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

mask_c = class_arr == 'Corner'
mask_f = class_arr == 'Face'

ax.scatter(x_arr[mask_c], y_arr[mask_c], color='#38bdf8', s=150, edgecolors='#ffffff', linewidths=1.2, label='Corner Cu Atoms', zorder=3)
ax.scatter(x_arr[mask_f], y_arr[mask_f], color='#f43f5e', s=90, edgecolors='#ffffff', linewidths=1.0, label='Face-Centered Atoms', zorder=3)

# Draw bonding matrix
for i in range(len(x_arr)):
    for j in range(i+1, len(x_arr)):
        dist = np.hypot(x_arr[i]-x_arr[j], y_arr[i]-y_arr[j])
        if abs(dist - (a * np.sqrt(2)/2)) < 0.05:
            ax.plot([x_arr[i], x_arr[j]], [y_arr[i], y_arr[j]], color='#1e293b', linestyle='-', linewidth=0.8, zorder=1)

ax.set_title("FCC Copper Lattice Projection (001) Grid", color='#f1f5f9', fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("X coordinate (Å)", color='#94a3b8', fontsize=9)
ax.set_ylabel("Y coordinate (Å)", color='#94a3b8', fontsize=9)
ax.set_xlim(-7.5, 7.5)
ax.set_ylim(-7.5, 7.5)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#1e293b', linestyle=':', alpha=0.5)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8, loc='upper right')
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'wave_interference',
    label: 'Wave Interference',
    description: 'Wave phase addition and destructive patterns',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Simulate wave interference for X-rays reflecting off lattice planes
theta_deg = np.linspace(5, 45, 300)
theta_rad = np.radians(theta_deg)
wavelength = 1.5406  # Cu K-alpha
d_spacing = 2.82      # NaCl 200 plane d-spacing (Angstroms)

# Path difference = 2 * d * sin(theta)
path_diff = 2 * d_spacing * np.sin(theta_rad)
# Phase contrast (delta phi)
phase_diff = 2 * np.pi * path_diff / wavelength

# Resultant intensity matching interference theory
intensity = (np.cos(phase_diff) + 1.0) / 2.0

fig, ax = plt.subplots(figsize=(6.5, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

ax.plot(theta_deg, intensity, color='#10b981', linewidth=2.0, label='Interference Ratio $I/I_0$')
ax.plot(theta_deg, np.cos(phase_diff/5), color='#f59e0b', linestyle=':', label='Wave Phase Overlap')

ax.set_title("Wave Interference & Bragg Plane Reflections", color='#f1f5f9', fontsize=11, fontweight='bold', pad=12)
ax.set_xlabel("Angle θ (degrees)", color='#94a3b8', fontsize=9)
ax.set_ylabel("Normalized Amplitude", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.5)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  }
];

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

export const ImageGenerationModule: React.FC<{ pythonFeaturesEnabled?: boolean }> = ({ pythonFeaturesEnabled = false }) => {
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

  // Python + Matplotlib Scientific Plotting States
  const [illustratorMode, setIllustratorMode] = useState<'neural' | 'matplotlib'>('neural');
  const [pythonCode, setPythonCode] = useState<string>(MATPLOTLIB_PRESETS[0].code);
  const [selectedPreset, setSelectedPreset] = useState<string>(MATPLOTLIB_PRESETS[0].id);
  const [pythonLog, setPythonLog] = useState<string | null>(null);
  const [pythonError, setPythonError] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState<boolean>(false);

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

  useEffect(() => {
    if (!pythonFeaturesEnabled && illustratorMode === 'matplotlib') {
      setIllustratorMode('neural');
    }
  }, [pythonFeaturesEnabled, illustratorMode]);

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

  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = MATPLOTLIB_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setPythonCode(preset.code);
      setPythonError(null);
      setPythonLog(null);
    }
  };

  const handleGenerateAIScript = async () => {
    if (!prompt.trim()) {
      setError("Please describe your desired plot or model in 'Concept Description' first!");
      return;
    }
    setGeneratingCode(true);
    setError(null);
    setPythonError(null);
    setPythonLog(null);
    try {
      const generated = await generateMatplotlibCode(prompt, selectedPreset);
      setPythonCode(generated);
      setPythonLog("# AI generated script successfully loaded.");
    } catch (e: any) {
      setPythonError("Failed to generate AI Matplotlib code. " + (e.message || ""));
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleRenderMatplotlib = async () => {
    if (!pythonCode.trim()) return;

    setError(null);
    setPythonError(null);
    setPythonLog(null);
    setLoading(true);

    try {
      const response = await fetch('/api/image/matplotlib', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pythonCode })
      });

      const resData = await response.json();
      if (resData.success && resData.image) {
        setImageUrl(resData.image);
        setPythonLog(resData.stdout);
        const newRecord: GenerationRecord = {
          id: Date.now().toString(),
          prompt: `Python Matplotlib: ${MATPLOTLIB_PRESETS.find(p => p.id === selectedPreset)?.label || 'Custom'}`,
          url: resData.image,
          timestamp: Date.now(),
          style: 'matplotlib_plot'
        };
        setHistory([newRecord, ...history].slice(0, 20)); // Keep last 20
      } else {
        const errMsg = resData.error || "Matplotlib run completed without generating a plot.";
        setPythonError(errMsg);
        if (resData.traceback) {
          setPythonLog(resData.traceback);
        } else if (resData.stdout) {
          setPythonLog(resData.stdout);
        }
      }
    } catch (e: any) {
      console.error("Matplotlib post error:", e);
      setPythonError("Network error: failed to compile script on backend server.");
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
    <div className="space-y-6">
      {/* Mode Switcher Tabs */}
      {pythonFeaturesEnabled && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-1.5 rounded-2xl flex max-w-lg shadow-sm">
          <button
            onClick={() => { setIllustratorMode('neural'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              illustratorMode === 'neural'
                ? 'bg-fuchsia-500 text-white shadow-md shadow-fuchsia-500/20'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Neural Stream (Imagen-3)
          </button>
          <button
            onClick={() => { setIllustratorMode('matplotlib'); setError(null); }}
            className={`flex-1 py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              illustratorMode === 'matplotlib'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Python + Matplotlib Plotter
          </button>
        </div>
      )}

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
                {illustratorMode === 'neural' ? (
                  <>
                    <ImageIcon className="h-5 w-5 text-fuchsia-600" />
                    Scientific Illustrator
                  </>
                ) : (
                  <>
                    <Cpu className="h-5 w-5 text-indigo-500" />
                    Matplotlib Plotter
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {illustratorMode === 'neural' 
                  ? 'High-fidelity structural & experimental diagrams' 
                  : 'Run analytical Python scripts to plot flawless equations & matrices'}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {illustratorMode === 'neural' ? (
                <>
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
                </>
              ) : (
                <>
                  {/* MATPLOTLIB DESIGN SIDEBAR */}
                  {/* AI Plot prompt generator helper */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Crystallography Concept Prompt
                      </label>
                      <button
                        onClick={handleGenerateAIScript}
                        disabled={generatingCode || !prompt.trim()}
                        className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 disabled:opacity-40 flex items-center gap-1 transition-all"
                      >
                        {generatingCode ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                        )}
                        CO-PILOT AI SCRIPT
                      </button>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Plot reciprocal space density for strained hexagonal GaAs film on sapphire..."
                      className="w-full h-22 px-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs leading-relaxed"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal italic">
                      Describe your plot in plain words above, and click "CO-PILOT AI SCRIPT" to let Gemini write precise Matplotlib code.
                    </p>
                  </div>

                  {/* Presets Selection */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Grid size={11} className="text-indigo-400" />
                      Analytical Templates
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {MATPLOTLIB_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`text-left p-2.5 rounded-xl border transition-all ${
                            selectedPreset === preset.id
                              ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-100 dark:hover:border-indigo-900/40'
                          }`}
                        >
                          <div className="text-[10px] leading-tight font-black">{preset.label}</div>
                          <div className="text-[8px] opacity-70 mt-0.5 line-clamp-1">{preset.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Raw Python code editor */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Code size={11} className="text-indigo-400" />
                      Kernel Source Terminal (.py)
                    </label>
                    <div className="relative font-mono rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                      <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between text-[8px] text-slate-500 uppercase tracking-widest border-b border-slate-850">
                        <span>Python workspace</span>
                        <span className="text-emerald-500 font-black animate-pulse">● IDE LIVE</span>
                      </div>
                      <textarea
                        value={pythonCode}
                        onChange={(e) => setPythonCode(e.target.value)}
                        spellCheck={false}
                        className="w-full h-64 p-4 bg-slate-950 text-emerald-400 border-none outline-none font-mono text-[10.5px] leading-relaxed resize-y focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Run code trigger button */}
                  <div className="pt-2">
                    <button
                      onClick={handleRenderMatplotlib}
                      disabled={loading || !pythonCode.trim()}
                      className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group
                        ${loading || !pythonCode.trim() 
                          ? 'bg-slate-300 dark:bg-slate-850 cursor-not-allowed text-slate-500' 
                          : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/20 active:scale-[0.98]'
                        }
                      `}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Running Python Module...
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                          Plot Matrix Figures
                        </>
                      )}
                    </button>

                    {(error || pythonError) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 p-3.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-medium border border-red-150 dark:border-red-900/50 flex gap-2"
                      >
                        <Info className="h-4 w-4 shrink-0" />
                        <div>
                          {error || pythonError}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              )}
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
                    setPrompt(item.prompt.includes("Python Matplotlib: ") ? "" : item.prompt);
                    if (item.style === 'matplotlib_plot' || item.prompt.startsWith("Python Matplotlib: ")) {
                      setIllustratorMode('matplotlib');
                    } else {
                      setIllustratorMode('neural');
                      setSelectedStyle(item.style);
                    }
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
                <div className={`h-2.5 w-2.5 rounded-full ${illustratorMode === 'neural' ? 'bg-fuchsia-500' : 'bg-indigo-500'} animate-pulse`} />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">
                  {illustratorMode === 'neural' ? 'Active Canvas (Imagen)' : 'Plot Visualizer Matrix (Matplotlib)'}
                </h3>
              </div>
              
              <div className="flex items-center gap-2">
                {imageUrl && (
                  <button
                    onClick={() => handleDownload(imageUrl)}
                    className={`px-4 py-1.5 ${illustratorMode === 'neural' ? 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'} text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-md`}
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
                      <div className={`w-16 h-16 border-2 ${illustratorMode === 'neural' ? 'border-fuchsia-100 dark:border-fuchsia-900/30' : 'border-indigo-100 dark:border-indigo-900/30'} rounded-full mx-auto`} />
                      <div className={`absolute inset-0 w-16 h-16 border-t-2 ${illustratorMode === 'neural' ? 'border-fuchsia-500' : 'border-indigo-500'} rounded-full mx-auto animate-spin`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Layers size={22} className={`${illustratorMode === 'neural' ? 'text-fuchsia-500' : 'text-indigo-500'} animate-pulse`} />
                      </div>
                    </div>
                    <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 mb-0.5 tracking-tight">
                      {illustratorMode === 'neural' ? 'Synthesizing Pixels' : 'Interpreting Python Kernels'}
                    </h4>
                    <p className="text-[11px] text-slate-505 dark:text-slate-400">
                      {illustratorMode === 'neural' ? `Neural rendering in progress (${size})` : 'Generating scientific plot figure'}
                    </p>
                    
                    {illustratorMode === 'neural' ? (
                      <RenderingConsole 
                        styleName={SCIENTIFIC_STYLES.find(s => s.id === selectedStyle)?.label || 'Scientific'} 
                        size={size} 
                      />
                    ) : (
                      <div className="bg-slate-950 p-4 border border-indigo-500/10 rounded-2xl w-full max-w-sm text-left my-4 font-mono text-indigo-400 text-[10px]">
                        <div className="flex items-center gap-1.5 mb-2 text-slate-500 uppercase tracking-widest font-black text-[8px]">
                          <Terminal size={10} className="text-indigo-400 animate-pulse" />
                          <span>Kernel Output Stream</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-slate-650">&gt; import matplotlib.pyplot as plt</div>
                          <div className="text-slate-650">&gt; import numpy as np</div>
                          <div className="animate-pulse text-indigo-300">&gt; executing user script context...</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${illustratorMode === 'neural' ? 'bg-fuchsia-500' : 'bg-indigo-505'}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                ) : imageUrl ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key="preview"
                    className="w-full h-full p-8 flex items-center justify-center text-center"
                  >
                    <img 
                      src={imageUrl} 
                      alt="Generated Scientific Illustration" 
                      className="max-w-full max-h-[500px] object-contain rounded-2xl shadow-2xl border border-white/50 dark:border-white/5"
                    />
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
                    <h4 className="text-slate-400 dark:text-slate-500 font-bold mb-2 uppercase tracking-wide">
                      {illustratorMode === 'neural' ? 'Empty Canvas' : 'Empty Plot Grid'}
                    </h4>
                    <p className="text-slate-400 dark:text-slate-650 text-sm leading-relaxed">
                      {illustratorMode === 'neural' 
                        ? 'Visualise complex crystal lattices, experimental setups, or molecular schemas.'
                        : 'Render beautiful, publication-ready mathematical curves, thermal ellipsoids, or reciprocal space maps.'}
                    </p>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                      <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-left bg-white dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">IMAGE TYPE</p>
                        <p className="text-xs text-slate-650 dark:text-slate-300 uppercase tracking-tighter">Square 1:1</p>
                      </div>
                      <div className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl text-left bg-white dark:bg-slate-900/50">
                        <p className="text-[10px] font-bold text-slate-400 mb-1">ENGINE / CORE</p>
                        <p className="text-xs text-slate-650 dark:text-slate-300 uppercase tracking-tighter">
                          {illustratorMode === 'neural' ? 'Imagen-3' : 'Python 3 + Matplotlib'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapsible Python Console Log */}
            {illustratorMode === 'matplotlib' && pythonLog && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden">
                <div className="bg-slate-900 px-6 py-2.5 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={12} className="text-emerald-500" />
                    <span>Standard Output Log & Stack Trace</span>
                  </div>
                  <button 
                    onClick={() => setPythonLog(null)}
                    className="text-slate-500 hover:text-slate-300 text-[9px] font-black uppercase tracking-widest"
                  >
                    Clear Terminal
                  </button>
                </div>
                <pre className="p-4 max-h-48 overflow-y-auto text-emerald-400 whitespace-pre-wrap leading-relaxed text-[11px]">
                  {pythonLog}
                </pre>
              </div>
            )}
          </motion.div>

          {/* Technical Context / Credits */}
          <div className="bg-slate-900 dark:bg-slate-950 p-6 rounded-3xl text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center ${illustratorMode === 'neural' ? 'text-fuchsia-400 animate-pulse' : 'text-indigo-400'} border border-slate-700`}>
                <Settings2 size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Generation Engine</p>
                <p className="text-xs text-slate-300">
                  {illustratorMode === 'neural' ? 'Imagen-3 (High-Fidelity Scientific Core)' : 'Interactive Python-Matplotlib (Sandbox Execution)'}
                </p>
              </div>
            </div>
            <p className="text-[10px] max-w-[200px] text-right text-slate-500 italic leading-snug">
              {illustratorMode === 'neural' 
                ? 'Advanced GPU acceleration enabled. Resolution scaling via AI Super-Res.'
                : 'Interactive matplotlib environment. High density DPI output enabled.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
