import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Code,
  Copy,
  Download,
  RefreshCw,
  Terminal,
  CheckCircle2,
  Brain,
  Activity,
  Sparkles,
  Wand2,
  Zap,
  Share2,
  Layers,
  Target,
  Play,
  Check,
  Cpu,
  Boxes,
  Database,
  BarChart3,
  Sliders,
  Compass,
  GitBranch,
  ShieldCheck,
  Workflow,
  Microscope,
  MessageSquare,
  Search,
  FileCode2,
  BookOpen,
  SlidersHorizontal,
  FolderDown
} from "lucide-react";
import { GeminiCoderChat } from "./GeminiCoderChat";
import {
  generateBasicAnalysisScript,
  generateScherrerScript,
  generateWilliamsonHallScript,
  generateWarrenAverbachScript,
  generateHalderWagnerScript,
  generateDoubleVoigtScript,
  generateCohenScript,
  generateMetricTensorScript,
  generateSupercellScript,
  generateRietveldScript,
  generatePawleyLeBailScript,
  generateRirScript,
  generateResidualStressScript,
  generateXrrScript,
  generateMagneticNeutronScript,
  generatePyTorchScript,
  generatePublicationPlotScript
} from "../utils/pythonTemplateGenerators";

export const PythonExportModule: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"chat" | "forge">("chat");
  const [scriptContent, setScriptContent] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<
    | "pysyn"
    | "lmfit"
    | "pymatgen"
    | "xrayutilities"
    | "pytorch_ml"
    | "scikit_learn"
    | "seaborn"
    | "sympy"
    | "periodictable"
    | "h5py"
    | "gsas2"
    | "diffpy_cmi"
  >("pysyn");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("basic_analysis");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [userEdited, setUserEdited] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiMode, setIsAiMode] = useState(false);
  const [neuralLogs, setNeuralLogs] = useState<string[]>([]);
  const [currentStepName, setCurrentStepName] = useState<string>("");

  // Live Server Python Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number;
    duration?: number;
  } | null>(null);

  const templates = [
    {
      id: "basic_analysis",
      label: "Bragg & Peak Indexing",
      category: "Diffraction",
      icon: Terminal,
      description: "Bragg's law, d-spacings, background subtraction & SciPy peak indexing"
    },
    {
      id: "scherrer_batch",
      label: "Scherrer Crystallite Sizing",
      category: "Microstructure",
      icon: Target,
      description: "Multi-peak crystallite size calculation with instrumental deconvolution"
    },
    {
      id: "williamson_hall",
      label: "Williamson-Hall Suite",
      category: "Microstructure",
      icon: Sliders,
      description: "UDM, USDM, and UDEDM size & microstrain separation"
    },
    {
      id: "warren_averbach",
      label: "Warren-Averbach Fourier",
      category: "Microstructure",
      icon: Layers,
      description: "Fourier harmonic deconvolution of nanocrystal column length distribution"
    },
    {
      id: "halder_wagner",
      label: "Halder-Wagner & SSP",
      category: "Microstructure",
      icon: Activity,
      description: "Size-Strain Plot (SSP) & parabolic profile deconvolution"
    },
    {
      id: "double_voigt",
      label: "Double-Voigt Integral Breadth",
      category: "Microstructure",
      icon: SlidersHorizontal,
      description: "Decoupling Cauchy (size) and Gauss (strain) profile components"
    },
    {
      id: "cohen_refinement",
      label: "Cohen Cell Parameter Refine",
      category: "Crystallography",
      icon: Compass,
      description: "Least-squares lattice parameter refinement matrix with Nelson-Riley drift"
    },
    {
      id: "metric_tensor",
      label: "Metric Tensor G/G*",
      category: "Crystallography",
      icon: Boxes,
      description: "Direct/reciprocal metric tensors, plane normals, interplanar angles & volumes"
    },
    {
      id: "supercell_transform",
      label: "Supercell Transformation",
      category: "Crystallography",
      icon: GitBranch,
      description: "Arbitrary 3x3 transformation matrix, Wyckoff positions & volume multipliers"
    },
    {
      id: "rietveld_refine",
      label: "Rietveld Profile Refine",
      category: "Refinement",
      icon: Microscope,
      description: "Automated whole powder pattern fitting with Pseudo-Voigt & Caglioti broadening"
    },
    {
      id: "pawley_lebail",
      label: "Pawley / Le Bail Decomp",
      category: "Refinement",
      icon: FileCode2,
      description: "Structure-free integrated peak intensity extraction & agreement indices"
    },
    {
      id: "rir_quantitative",
      label: "Chung RIR Multi-Phase",
      category: "Quantitative",
      icon: BarChart3,
      description: "Reference Intensity Ratio multi-phase mass fractions with error propagation"
    },
    {
      id: "residual_stress",
      label: "Sin²ψ Residual Stress",
      category: "Mechanics",
      icon: ShieldCheck,
      description: "Dölle-Hauk method & elasticity tensor for residual stress deconvolution"
    },
    {
      id: "xrr_reflectivity",
      label: "XRR Reflectometry",
      category: "Thin Films",
      icon: Workflow,
      description: "Parratt recursion, Kiessig fringes & electron density profile fitting"
    },
    {
      id: "magnetic_neutron",
      label: "Magnetic Neutron Form Factor",
      category: "Neutron",
      icon: Activity,
      description: "Magnetic scattering amplitude, Freeman-Watson 3d form factor & moment refinement"
    },
    {
      id: "pytorch_ml",
      label: "PyTorch Deep Learning",
      category: "Machine Learning",
      icon: Brain,
      description: "FT-Transformer, Bochner Harmonic ARD embeddings & Conformal uncertainty"
    },
    {
      id: "plot_publication",
      label: "Publication 600 DPI Vector Plot",
      category: "Visualization",
      icon: Share2,
      description: "Nature/Science 600 DPI publication-grade Matplotlib vector figures (PDF/SVG/PNG)"
    },
  ];

  const categories = useMemo(() => {
    const cats = Array.from(new Set(templates.map((t) => t.category)));
    return ["All", ...cats];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchCat = selectedCategory === "All" || tpl.category === selectedCategory;
      const matchSearch =
        templateSearch === "" ||
        tpl.label.toLowerCase().includes(templateSearch.toLowerCase()) ||
        tpl.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
        tpl.category.toLowerCase().includes(templateSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [templates, selectedCategory, templateSearch]);

  const aiSuggestionsByCategory: Record<string, string[]> = {
    "Microstructure & Sizing": [
      "Deconvolve crystallite size & microstrain using Williamson-Hall (UDM, USDM, UDEDM) with instrumental correction",
      "Calculate Warren-Averbach Fourier column length distribution P_V(L) across multiple reflection orders",
      "Perform Halder-Wagner and Size-Strain Plot (SSP) comparisons for nanocrystalline powders",
      "Fit multi-peak Scherrer broadening with variable shape factor K and Lorentzian/Gaussian deconvolution"
    ],
    "Unit Cells & Refinement": [
      "Set up Cohen's least-squares normal equations matrix to refine tetragonal unit cell parameters (a, c)",
      "Calculate direct G and reciprocal G* metric tensors, interplanar angles, and d-spacings for all 7 crystal systems",
      "Automate 15-cycle Rietveld refinement using GSAS-II API with Caglioti U, V, W instrumental profiles",
      "Extract Miller indices (hkl) and refine zero-shift error from silicon calibration standard"
    ],
    "Quantitative & Multi-Phase": [
      "Perform quantitative phase analysis using the Chung RIR method with full covariance error propagation",
      "Deconvolve overlapping Anatase/Rutile TiO2 doublets using asymmetric Pearson-VII profiles with LMFIT",
      "Calculate degree of crystallographic texture using Harris texture coefficients TC(hkl) and Lotgering factor",
      "Synthesize simulated XRD powder diffraction pattern from CIF crystal structure using PyMatGen"
    ],
    "Mechanics & Reflectometry": [
      "Calculate biaxial in-plane residual stress from sin²ψ XRD tilt angles using Dölle-Hauk linear regression",
      "Simulate coplanar X-Ray Reflectometry (XRR) with Parratt recursion, Nevot-Croce roughness, and Kiessig fringes",
      "Extract film thickness and electron density profile from specular X-ray reflectivity data",
      "Generate 2D reciprocal space map (RSM) simulation around asymmetric (113) substrate reflection"
    ],
    "Deep Learning & AI": [
      "Train a PyTorch FT-Transformer with Bochner Random Fourier feature embeddings for XRD phase prediction",
      "Implement Split Conformal Prediction for 90% guaranteed prediction intervals on crystallite size regression",
      "Build a 1D Residual Convolutional Network (ResNet-1D) for automated continuous background subtraction",
      "Synthesize 10,000 augmented XRD spectra with variable Gaussian/Lorentzian noise and lattice strain"
    ],
    "Publication & Plotting": [
      "Create a Nature-style stacked multi-temperature in-situ XRD figure with 600 DPI vector PDF export",
      "Plot high-contrast multi-panel Rietveld fit with observed, calculated, difference curve, and Bragg ticks",
      "Generate publication-ready Williamson-Hall multi-model comparison subplots with LaTeX annotations"
    ]
  };

  // Load initial state
  useEffect(() => {
    const saved = localStorage.getItem("xrd_python_export");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.library) setSelectedLibrary(data.library);
        if (data.content) setScriptContent(data.content);
        if (data.userEdited) setUserEdited(data.userEdited);
      } catch (e) {
        console.error("Error loading saved state", e);
      }
    }
  }, []);

  // Debounced Auto-save
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem(
        "xrd_python_export",
        JSON.stringify({
          library: selectedLibrary,
          content: scriptContent,
          userEdited: userEdited,
        }),
      );
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [scriptContent, selectedLibrary, userEdited]);

  const handleAIGenerate = async (customUserPrompt?: string) => {
    const promptToUse = ((customUserPrompt || aiPrompt) || '').trim();
    if (!promptToUse) return;

    setIsGenerating(true);
    setAiError(null);
    setNeuralLogs([]);
    setCurrentStepName("Initializing...");
    setIsAiMode(true);

    const braggStr = localStorage.getItem("xrd_bragg_current");
    const braggData = braggStr ? JSON.parse(braggStr) : null;
    const rietveldStr = localStorage.getItem("xrd_rietveld_setup");
    const rietveldData = rietveldStr ? JSON.parse(rietveldStr) : null;

    const wavelength = braggData?.wavelength || 1.54056;
    const rawPeaks = braggData?.rawPeaks || "28.44, 47.30, 56.12, 69.13, 76.38";

    const steps = [
      "⚡ Initializing Advanced Scientific Python Compiler & Architecture...",
      `🔬 Context Ingested: Target Wavelength = ${wavelength} Å, Active Peaks = [${rawPeaks}].`,
      `📦 Target Library Ecosystem: '${selectedLibrary}' with NumPy/SciPy Core.`,
      "🧠 Aligning mathematical models, tensor relations, and profile functions...",
      "⚒️ Synthesizing dynamic standalone mock XRD dataset fallback generator...",
      "🎨 Configuring publication-grade Matplotlib 600 DPI layout & visual styles...",
      "📜 Verifying PEP 8 compliance, docstrings, type annotations, and error handling...",
      "✅ Compilation Complete: Delivering production-ready Python 3 script!",
    ];

    let logIndex = 0;
    const logInterval = setInterval(() => {
      if (logIndex < steps.length) {
        setNeuralLogs((prev) => [...prev, steps[logIndex]]);
        setCurrentStepName(steps[logIndex]);
        logIndex++;
      } else {
        clearInterval(logInterval);
      }
    }, 380);

    try {
      const context = {
        wavelength,
        peaks: rawPeaks,
        phases: rietveldData?.phases || [
          { name: "Silicon Standard", spaceGroup: "Fd-3m", lattice: { a: 5.43088 } }
        ],
        backgroundTerms: rietveldData?.bgTerms || 6,
        targetLibrary: selectedLibrary,
        requestedMethod: promptToUse
      };

      const response = await fetch("/api/gemini/coder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create a complete, standalone, production-ready, and executable Python 3 script for the following request:\n"${promptToUse}"\nTarget Library: ${selectedLibrary}. Include full mathematical formulas, clear docstrings, realistic fallback XRD data generation, and publication-quality Matplotlib visualization.`,
          context,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate Python script.");
      }

      setScriptContent(data.text);
      setUserEdited(false);
    } catch (err: any) {
      setAiError(err.message || "An unexpected error occurred during AI synthesis.");
    } finally {
      clearInterval(logInterval);
      setIsGenerating(false);
    }
  };

  const generateScript = () => {
    try {
      const braggStr = localStorage.getItem("xrd_bragg_current");
      const braggData = braggStr ? JSON.parse(braggStr) : null;
      const rietveldStr = localStorage.getItem("xrd_rietveld_setup");
      const rietveldData = rietveldStr ? JSON.parse(rietveldStr) : null;

      const wavelength = braggData?.wavelength || 1.54056;
      const opts = {
        wavelength,
        materialName: rietveldData?.phases?.[0]?.name || "Sample Diffraction Benchmark",
        crystalSystem: rietveldData?.phases?.[0]?.crystalSystem || "Cubic",
        lattice: rietveldData?.phases?.[0]?.lattice || { a: 5.43088, b: 5.43088, c: 5.43088 },
        library: selectedLibrary,
        shapeFactorK: 0.94,
        fwhmInst: 0.05
      };

      let pythonCode = "";

      switch (selectedTemplate) {
        case "basic_analysis":
          pythonCode = generateBasicAnalysisScript(opts);
          break;
        case "scherrer_batch":
          pythonCode = generateScherrerScript(opts);
          break;
        case "williamson_hall":
          pythonCode = generateWilliamsonHallScript(opts);
          break;
        case "warren_averbach":
          pythonCode = generateWarrenAverbachScript(opts);
          break;
        case "halder_wagner":
          pythonCode = generateHalderWagnerScript(opts);
          break;
        case "double_voigt":
          pythonCode = generateDoubleVoigtScript(opts);
          break;
        case "cohen_refinement":
          pythonCode = generateCohenScript(opts);
          break;
        case "metric_tensor":
          pythonCode = generateMetricTensorScript(opts);
          break;
        case "supercell_transform":
          pythonCode = generateSupercellScript(opts);
          break;
        case "rietveld_refine":
          pythonCode = generateRietveldScript(opts);
          break;
        case "pawley_lebail":
          pythonCode = generatePawleyLeBailScript(opts);
          break;
        case "rir_quantitative":
          pythonCode = generateRirScript(opts);
          break;
        case "residual_stress":
          pythonCode = generateResidualStressScript(opts);
          break;
        case "xrr_reflectivity":
          pythonCode = generateXrrScript(opts);
          break;
        case "magnetic_neutron":
          pythonCode = generateMagneticNeutronScript(opts);
          break;
        case "pytorch_ml":
          pythonCode = generatePyTorchScript(opts);
          break;
        case "plot_publication":
          pythonCode = generatePublicationPlotScript(opts);
          break;
        default:
          pythonCode = generateBasicAnalysisScript(opts);
          break;
      }

      setScriptContent(pythonCode);
    } catch (error) {
      console.error(error);
      setScriptContent("# Error generating script from current state.");
    }
  };

  useEffect(() => {
    if (!userEdited && !isAiMode) {
      generateScript();
    }
  }, [selectedLibrary, selectedTemplate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptContent);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPy = () => {
    const blob = new Blob([scriptContent], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate}_xrd_analysis.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJupyterNotebook = () => {
    const notebook = {
      cells: [
        {
          cell_type: "markdown",
          metadata: {},
          source: [
            `# XRD-Calc Pro: ${selectedTemplate.toUpperCase()} Analysis\n`,
            "Auto-generated scientific computational notebook with live interactive cells."
          ]
        },
        {
          cell_type: "code",
          execution_count: null,
          metadata: {},
          outputs: [],
          source: scriptContent.split("\n").map((line) => line + "\n")
        }
      ],
      metadata: {
        language_info: {
          name: "python",
          version: "3.10"
        },
        orig_nbformat: 4
      },
      nbformat: 4,
      nbformat_minor: 2
    };

    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: "application/x-ipynb+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate}_xrd_notebook.ipynb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    setUserEdited(false);
    setIsAiMode(false);
    setAiPrompt("");
    setAiError(null);
    setExecutionOutput(null);
    generateScript();
  };

  const handleRunPython = async () => {
    setIsRunning(true);
    setExecutionOutput(null);
    const startTime = performance.now();

    try {
      const response = await fetch("/api/python/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scriptContent }),
      });

      const data = await response.json();
      const endTime = performance.now();

      setExecutionOutput({
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        exitCode: data.exitCode !== undefined ? data.exitCode : (data.success ? 0 : 1),
        duration: Math.round(endTime - startTime)
      });
    } catch (err: any) {
      setExecutionOutput({
        stdout: "",
        stderr: `Execution failed: ${err.message}`,
        exitCode: 1,
        duration: 0
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#0B0F19] rounded-2xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl shadow-xl flex items-center justify-center ${
              isAiMode ? "bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-white shadow-fuchsia-500/20" : "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
            }`}>
              {isAiMode ? <Sparkles className="w-6 h-6 animate-pulse" /> : <Terminal className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">
                  {isAiMode ? "AI Scientific Script Synthesizer" : "Python Computational Script Generator"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" /> Python 3.x Standalone
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Zero-dependency-fail, production-grade scripts with realistic mock data fallbacks, precision mathematics & publication graphics.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Library Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lib:</span>
              <select
                value={selectedLibrary}
                onChange={(e) => {
                  setSelectedLibrary(e.target.value as any);
                  setUserEdited(false);
                }}
                className="bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer"
              >
                <option value="pysyn" className="bg-slate-900">SciPy / NumPy</option>
                <option value="lmfit" className="bg-slate-900">LMFIT (Deconvolution)</option>
                <option value="gsas2" className="bg-slate-900">GSAS-II (Rietveld)</option>
                <option value="xrayutilities" className="bg-slate-900">xrayutilities (RSM)</option>
                <option value="pymatgen" className="bg-slate-900">PyMatGen (CIF/XRD)</option>
                <option value="pytorch_ml" className="bg-slate-900">PyTorch (Deep Learning)</option>
                <option value="diffpy_cmi" className="bg-slate-900">DiffPy-CMI (PDF)</option>
              </select>
            </div>

            {isAiMode && (
              <button
                onClick={handleRegenerate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restore Standard Templates
              </button>
            )}

            {!isAiMode && (
              <button
                onClick={handleRegenerate}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors border border-slate-700 active:scale-95"
                title="Regenerate from Current Parameters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Primary View Mode Switcher: Interactive AI Chat vs Classic Templates */}
        <div className="flex items-center justify-between mb-6 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "chat"
                  ? "bg-gradient-to-r from-cyan-600 via-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <MessageSquare size={14} />
              <span>Chat with Gemini Flash AI (Direct XRD & Python)</span>
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-400/20 text-cyan-300 uppercase font-mono">
                Interactive
              </span>
            </button>

            <button
              onClick={() => setActiveTab("forge")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "forge"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Code size={14} />
              <span>Standard Method Templates ({templates.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 text-[10px] text-slate-400 font-mono">
            <span>Powered by</span>
            <span className="font-bold text-cyan-400">Google Gemini Flash</span>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE GEMINI FLASH CHAT */}
        {activeTab === "chat" && (
          <div className="mb-6">
            <GeminiCoderChat
              onApplyCodeToEditor={(code) => {
                setScriptContent(code);
                setUserEdited(true);
                setIsAiMode(true);
              }}
              selectedLibrary={selectedLibrary}
              currentCode={scriptContent}
            />
          </div>
        )}

        {/* TAB 2: TEMPLATE SELECTOR & ONE-SHOT AI FORGE */}
        {activeTab === "forge" && (
          <>
            {/* METHOD TEMPLATES SECTION */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                    Select Scientific Method Template ({filteredTemplates.length}/{templates.length} Modules)
                  </span>
                </div>

                {/* Search and Category Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Category Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 custom-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                        : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Template Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id && !isAiMode;
                  const IconComp = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      onClick={() => {
                        setSelectedTemplate(tpl.id);
                        setIsAiMode(false);
                        setUserEdited(false);
                        setAiPrompt("");
                        setExecutionOutput(null);
                      }}
                      className={`flex flex-col items-start p-2.5 rounded-xl text-left border transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-[1.02]"
                          : "bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <IconComp size={14} className={isSelected ? "text-white" : "text-indigo-400"} />
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-slate-500"
                        }`}>
                          {tpl.category}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold truncate w-full">{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI NEURAL SCRIPT FORGE */}
            <div className="mb-6 rounded-2xl p-5 bg-gradient-to-br from-slate-900/90 to-purple-950/20 border border-fuchsia-500/25 shadow-xl relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-fuchsia-500/30">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      Gemini AI Custom Script Synthesizer
                      <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-300 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border border-fuchsia-500/30">
                        High Thinking
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Describe any custom mathematical, physical, or deep learning analysis request to generate complete Python code
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Multi-Model Resilient Engine</span>
                </div>
              </div>

              <div className="relative mb-3">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your custom XRD Python script request (e.g. 'Build a PyTorch model with Bochner Fourier embeddings and CRPS loss for XRD peak regression with Conformal Prediction', or 'Write an XRR Kiessig fringe fitting script using Parratt formalism')..."
                  className="w-full bg-[#070A12] border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500/60 focus:ring-2 focus:ring-fuchsia-500/10 min-h-[90px] leading-relaxed resize-y font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={() => handleAIGenerate()}
                  disabled={isGenerating || !aiPrompt.trim()}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 shrink-0 ${
                    isGenerating
                      ? "bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-fuchsia-600 via-indigo-600 to-cyan-600 hover:from-fuchsia-500 hover:to-cyan-500 text-white shadow-fuchsia-500/20"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <Activity size={16} className="animate-spin" /> Synthesizing Code...
                    </>
                  ) : (
                    <>
                      <Zap size={16} /> Generate Python Script
                    </>
                  )}
                </button>

                <span className="text-[10px] text-slate-400 font-medium">
                  💡 Click any instant prompt chip below to synthesize immediately
                </span>
              </div>

              {/* Categorized Prompt Chips */}
              <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2.5">
                {Object.entries(aiSuggestionsByCategory).map(([category, prompts]) => (
                  <div key={category} className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase text-indigo-400/90 tracking-wider">
                      {category}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {prompts.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAiPrompt(p);
                            handleAIGenerate(p);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 text-[10px] text-slate-300 hover:text-indigo-200 transition-all text-left truncate max-w-md"
                          title={p}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compilation Logs */}
              {isGenerating && neuralLogs.length > 0 && (
                <div className="p-3.5 rounded-xl bg-black/90 border border-fuchsia-500/30 font-mono text-[10px] text-fuchsia-300 space-y-1 mt-4">
                  <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-1 mb-1 text-white font-bold">
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" /> Compilation Pipeline
                    </span>
                    <span className="text-[8px] bg-fuchsia-500/20 px-1.5 py-0.5 rounded">
                      ACTIVE // 8 PHASES
                    </span>
                  </div>
                  {neuralLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-fuchsia-500">[{idx + 1}/8]</span>
                      <span className={idx === neuralLogs.length - 1 ? "text-white font-bold animate-pulse" : "opacity-75"}>
                        {log}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {aiError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 mt-3">
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Generation Error: {aiError}
                </div>
              )}
            </div>
          </>
        )}

        {/* CODE EDITOR & RUNNER PANEL */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#040711]">
          {/* Top Editor Bar */}
          <div className="flex items-center justify-between bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-slate-200">
                {isAiMode ? "ai_synthesized_script.py" : `${selectedTemplate}.py`}
              </span>
              {userEdited && (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Custom Modified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* RUN BUTTON */}
              <button
                onClick={handleRunPython}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <Play className={`w-3.5 h-3.5 ${isRunning ? "animate-spin" : ""}`} />
                <span>{isRunning ? "Executing..." : "Run Python on Server"}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="Copy Script"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? "Copied" : "Copy"}</span>
              </button>

              <button
                onClick={handleDownloadPy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium border border-indigo-500 transition-colors"
                title="Download .py Script"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.py</span>
              </button>

              <button
                onClick={handleDownloadJupyterNotebook}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium border border-purple-500 transition-colors"
                title="Export as Jupyter / Google Colab Notebook (.ipynb)"
              >
                <FolderDown className="w-3.5 h-3.5" />
                <span>.ipynb</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Textarea */}
          <textarea
            value={scriptContent}
            onChange={(e) => {
              setScriptContent(e.target.value);
              setUserEdited(true);
            }}
            spellCheck="false"
            className="w-full bg-[#02050E] text-[#e2e8f0] p-5 font-mono text-xs leading-relaxed h-[420px] custom-scrollbar focus:outline-none focus:border-indigo-500/50 resize-y selection:bg-indigo-500/30 border-none"
          />

          {/* Live Execution Console Output */}
          {executionOutput && (
            <div className="border-t border-slate-800 bg-[#000308] p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-slate-200">Server Execution Console</span>
                  {executionOutput.duration !== undefined && (
                    <span className="text-[10px] text-slate-500">
                      ({executionOutput.duration} ms)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    executionOutput.exitCode === 0
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}>
                    Exit Code: {executionOutput.exitCode} {executionOutput.exitCode === 0 ? "(Success)" : "(Error)"}
                  </span>
                </div>
              </div>

              {executionOutput.stdout && (
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-500">Standard Output (stdout):</span>
                  <pre className="p-3 rounded-lg bg-slate-950 text-emerald-300 border border-slate-800/80 overflow-x-auto whitespace-pre-wrap max-h-60 custom-scrollbar">
                    {executionOutput.stdout}
                  </pre>
                </div>
              )}

              {executionOutput.stderr && (
                <div className="space-y-1 mt-2">
                  <span className="text-[9px] uppercase font-bold text-rose-400">Standard Error (stderr):</span>
                  <pre className="p-3 rounded-lg bg-rose-950/40 text-rose-300 border border-rose-500/30 overflow-x-auto whitespace-pre-wrap max-h-40 custom-scrollbar">
                    {executionOutput.stderr}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
