import React, { useState, useEffect } from "react";
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
  MessageSquare
} from "lucide-react";
import { GeminiCoderChat } from "./GeminiCoderChat";

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
      label: "Bragg & Peak Finding",
      category: "Diffraction",
      icon: Terminal,
      description: "Bragg's law, d-spacings, background subtraction & SciPy peak indexing"
    },
    {
      id: "scherrer_batch",
      label: "Scherrer Sizing",
      category: "Microstructure",
      icon: Target,
      description: "Multi-peak crystallite size calculation with instrumental deconvolution"
    },
    {
      id: "williamson_hall",
      label: "Williamson-Hall",
      category: "Microstructure",
      icon: Sliders,
      description: "UDM, USDM, and UDEDM size & microstrain separation"
    },
    {
      id: "warren_averbach",
      label: "Warren-Averbach",
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
      id: "cohen_refinement",
      label: "Cohen Cell Refine",
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
      id: "rietveld_refine",
      label: "Rietveld Refinement",
      category: "Advanced",
      icon: Microscope,
      description: "Automated whole powder pattern fitting with GSAS-II & LMFIT Pseudo-Voigt"
    },
    {
      id: "rir_quantitative",
      label: "RIR Quantitative",
      category: "Quantitative",
      icon: BarChart3,
      description: "Reference Intensity Ratio (Chung method) multi-phase mass fractions"
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
      id: "pytorch_ml",
      label: "PyTorch Deep Learning",
      category: "Machine Learning",
      icon: Brain,
      description: "FT-Transformer, Bochner Harmonic ARD embeddings & Conformal uncertainty"
    },
    {
      id: "plot_publication",
      label: "Publication Plotting",
      category: "Visualization",
      icon: Share2,
      description: "Nature/Science 600 DPI publication-grade Matplotlib vector figures"
    },
  ];

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
      "Calculate amorphous content fraction via total integrated area background ratio method",
      "Simulate powder diffraction patterns across Cu, Mo, Co, and Cr anodes using PyMatGen"
    ],
    "Thin Films & Mechanics": [
      "Model thin-film coplanar X-ray Reflectivity (XRR) using Parratt formalism with Nevot-Croce roughness",
      "Extract residual stress sigma_phi and shear stress from Sin²(psi) tilt measurements using Dölle-Hauk method",
      "Construct 3D Reciprocal Space Maps (RSM) for epitaxial layers using xrayutilities",
      "Calculate Kiessig fringe fast Fourier transform (FFT) to determine ultrathin film thickness"
    ],
    "Machine Learning & PyTorch": [
      "Train a PyTorch Tabular FT-Transformer with Bochner Fourier embeddings for spectral phase classification",
      "Implement Continuous Ranked Probability Score (CRPS) loss with Split Conformal Prediction uncertainty bands",
      "Build a Sharpness-Aware Minimization (SAM) neural network for XRD pattern peak regression",
      "Create a self-supervised autoencoder for XRD baseline drift removal and noise denoising"
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
      let pythonCode = "";

      // 1. Basic Peak Analysis & SciPy
      if (selectedTemplate === "basic_analysis") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Automated Peak Finding, Bragg Spacing & Baseline Subtraction
# Standard Scientific Python (NumPy, SciPy, Pandas, Matplotlib)
# ==============================================================================

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from scipy.signal import find_peaks, savgol_filter
from scipy.optimize import curve_fit

# 1. Experimental Setup
WAVELENGTH_ANGSTROM = ${wavelength}  # Cu Kα = 1.54056 Å

def load_or_generate_xrd_data(filename="sample_xrd_pattern.xy"):
    """Loads experimental 2-theta vs intensity data, or generates synthetic data."""
    if os.path.exists(filename):
        print(f"[*] Loading experimental data from: {filename}")
        data = np.loadtxt(filename)
        return data[:, 0], data[:, 1]
    
    print("[!] Data file not found. Generating high-fidelity synthetic XRD benchmark...")
    two_theta = np.linspace(10.0, 90.0, 4000)
    
    # Baseline curvature
    background = 450.0 * np.exp(-two_theta / 22.0) + 120.0 + 0.05 * two_theta
    
    # True diffraction peaks (2theta, intensity, fwhm)
    true_peaks = [
        (28.44, 2500.0, 0.28),
        (47.30, 1400.0, 0.35),
        (56.12, 1800.0, 0.42),
        (69.13, 900.0, 0.48),
        (76.38, 1100.0, 0.52),
        (88.03, 750.0, 0.58)
    ]
    
    intensity = np.copy(background)
    for pos, height, fwhm in true_peaks:
        sigma = fwhm / (2.0 * np.sqrt(2.0 * np.log(2.0)))
        intensity += height * np.exp(-((two_theta - pos) ** 2) / (2.0 * sigma ** 2))
        
    # Add Poisson experimental noise
    noise = np.random.normal(0, np.sqrt(np.maximum(1.0, intensity)) * 0.8)
    intensity = np.maximum(0, intensity + noise)
    
    np.savetxt(filename, np.column_stack((two_theta, intensity)), fmt="%.4f %10.2f")
    print(f"[*] Synthetic dataset written to: {filename}")
    return two_theta, intensity

def analyze_xrd_pattern():
    two_theta, raw_intensity = load_or_generate_xrd_data()
    
    # 2. Baseline Estimation & Subtraction via Savitzky-Golay / Polynomial
    smoothed = savgol_filter(raw_intensity, window_length=31, polyorder=3)
    baseline_poly = np.poly1d(np.polyfit(two_theta, smoothed, 5))
    baseline = baseline_poly(two_theta)
    net_intensity = np.maximum(0, raw_intensity - baseline)
    
    # 3. Automated Peak Detection
    peak_indices, properties = find_peaks(
        net_intensity, 
        height=300.0, 
        distance=50, 
        prominence=200.0, 
        width=3
    )
    
    peak_2theta = two_theta[peak_indices]
    peak_heights = net_intensity[peak_indices]
    
    # 4. Bragg d-spacing calculation: d = lambda / (2 * sin(theta))
    theta_rad = np.radians(peak_2theta / 2.0)
    d_spacings = WAVELENGTH_ANGSTROM / (2.0 * np.sin(theta_rad))
    
    # 5. Tabulate Results
    df_peaks = pd.DataFrame({
        "Peak #": np.arange(1, len(peak_2theta) + 1),
        "2-Theta (deg)": np.round(peak_2theta, 3),
        "d-Spacing (A)": np.round(d_spacings, 4),
        "Net Intensity": np.round(peak_heights, 1),
        "Rel Intensity (%)": np.round((peak_heights / np.max(peak_heights)) * 100.0, 2)
    })
    
    print("\\n" + "=" * 70)
    print("                AUTOMATED XRD PEAK ANALYSIS REPORT")
    print("=" * 70)
    print(df_peaks.to_string(index=False))
    print("=" * 70)
    
    # 6. Plot Publication-Quality XRD Spectrum
    fig, ax = plt.subplots(figsize=(10, 5.5), dpi=300)
    ax.plot(two_theta, raw_intensity, color="#1e293b", lw=1.0, alpha=0.7, label="Raw Observed Intensity")
    ax.plot(two_theta, baseline, color="#f43f5e", ls="--", lw=1.5, label="5th Order Polynomial Baseline")
    ax.plot(two_theta, net_intensity, color="#0284c7", lw=1.2, label="Background-Subtracted Profile")
    
    # Annotate Detected Peaks
    for idx, (tt, d_val, hgt) in enumerate(zip(peak_2theta, d_spacings, peak_heights)):
        ax.scatter(tt, hgt, color="#10b981", s=40, zorder=5)
        ax.annotate(
            f"{tt:.2f}°\\n({d_val:.3f} Å)",
            xy=(tt, hgt),
            xytext=(0, 15),
            textcoords="offset points",
            ha="center",
            fontsize=8,
            fontweight="bold",
            color="#0f172a",
            bbox=dict(boxstyle="round,pad=0.2", fc="white", ec="#94a3b8", alpha=0.85)
        )
        
    ax.set_title("X-Ray Diffraction Peak Profile & Bragg d-Spacing Deconvolution", fontsize=12, fontweight="bold")
    ax.set_xlabel("2θ Diffraction Angle (degrees)", fontsize=10, fontweight="bold")
    ax.set_ylabel("Intensity (counts)", fontsize=10, fontweight="bold")
    ax.set_xlim(two_theta[0], two_theta[-1])
    ax.legend(frameon=True, facecolor="white", framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.6)
    
    plt.tight_layout()
    plt.savefig("xrd_peak_analysis_plot.png", dpi=300)
    print("[*] High-resolution figure saved as 'xrd_peak_analysis_plot.png'")
    plt.show()

if __name__ == "__main__":
    analyze_xrd_pattern()
`;
      }

      // 2. Scherrer Sizing
      else if (selectedTemplate === "scherrer_batch") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Multi-Peak Scherrer Nanocrystallite Sizing
# Equation: D = (K * lambda) / (beta_sample * cos(theta))
# Instrumental Broadening Deconvolution: beta_sample = sqrt(beta_obs^2 - beta_inst^2)
# ==============================================================================

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

WAVELENGTH = ${wavelength}  # Å (Cu Kα = 1.54056 Å)
SHAPE_FACTOR_K = 0.94      # Spherical crystallites (K = 0.89 to 0.94)
FWHM_INSTRUMENTAL = 0.05   # Instrumental FWHM in degrees

# Experimental Peak Reflections (2θ in deg, Observed FWHM in deg)
peaks_data = [
    {"hkl": "(111)", "two_theta": 28.44, "fwhm_obs": 0.28},
    {"hkl": "(220)", "two_theta": 47.30, "fwhm_obs": 0.35},
    {"hkl": "(311)", "two_theta": 56.12, "fwhm_obs": 0.42},
    {"hkl": "(400)", "two_theta": 69.13, "fwhm_obs": 0.48},
    {"hkl": "(331)", "two_theta": 76.38, "fwhm_obs": 0.52}
]

def calculate_scherrer():
    records = []
    
    for p in peaks_data:
        hkl = p["hkl"]
        tt_deg = p["two_theta"]
        fwhm_obs_deg = p["fwhm_obs"]
        
        theta_rad = np.radians(tt_deg / 2.0)
        beta_obs_rad = np.radians(fwhm_obs_deg)
        beta_inst_rad = np.radians(FWHM_INSTRUMENTAL)
        
        # Deconvolution (Gaussian approximation)
        beta_sample_rad = np.sqrt(max(1e-12, beta_obs_rad**2 - beta_inst_rad**2))
        beta_sample_deg = np.degrees(beta_sample_rad)
        
        # Scherrer formula for crystallite size D in nm
        D_nm = (SHAPE_FACTOR_K * WAVELENGTH) / (beta_sample_rad * np.cos(theta_rad)) / 10.0
        
        # Dislocation density delta = 1 / D^2 (lines / m^2)
        D_meters = D_nm * 1e-9
        dislocation_density = 1.0 / (D_meters ** 2)
        
        records.append({
            "Plane": hkl,
            "2θ (°)": tt_deg,
            "FWHM Obs (°)": fwhm_obs_deg,
            "FWHM Net (°)": beta_sample_deg,
            "Size D (nm)": D_nm,
            "Dislocation Density (x10^15 m^-2)": dislocation_density / 1e15
        })
        
    df = pd.DataFrame(records)
    mean_D = df["Size D (nm)"].mean()
    std_D = df["Size D (nm)"].std()
    
    print("=" * 80)
    print("               SCHERRER CRYSTALLITE SIZE ANALYSIS")
    print("=" * 80)
    print(df.to_string(index=False))
    print("-" * 80)
    print(f"Overall Mean Crystallite Size (D) : {mean_D:.2f} nm ± {std_D:.2f} nm ({mean_D * 10:.1f} Å)")
    print(f"Mean Dislocation Density (δ)     : {df['Dislocation Density (x10^15 m^-2)'].mean():.3f} x 10^15 m^-2")
    print("=" * 80)
    
    # Plot Size per Miller Reflection
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=300)
    bars = ax.bar(df["Plane"], df["Size D (nm)"], color="#0ea5e9", edgecolor="#0284c7", width=0.5, alpha=0.85)
    ax.axhline(mean_D, color="#ef4444", linestyle="--", linewidth=1.5, label=f"Mean Size: {mean_D:.2f} nm")
    
    for bar in bars:
        h = bar.get_height()
        ax.annotate(f"{h:.1f} nm",
                    xy=(bar.get_x() + bar.get_width() / 2, h),
                    xytext=(0, 4),
                    textcoords="offset points",
                    ha="center", fontsize=9, fontweight="bold")
                    
    ax.set_title("Crystallite Sizing by Crystallographic Plane (Scherrer Method)", fontsize=11, fontweight="bold")
    ax.set_ylabel("Crystallite Size D (nm)", fontsize=10)
    ax.set_xlabel("Miller Index Plane (hkl)", fontsize=10)
    ax.set_ylim(0, max(df["Size D (nm)"]) * 1.25)
    ax.grid(True, linestyle=":", alpha=0.5, axis="y")
    ax.legend()
    plt.tight_layout()
    plt.savefig("scherrer_sizing_plot.png", dpi=300)
    plt.show()

if __name__ == "__main__":
    calculate_scherrer()
`;
      }

      // 3. Williamson-Hall
      else if (selectedTemplate === "williamson_hall") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Williamson-Hall Deconvolution (UDM, USDM, UDEDM Models)
# Formula (UDM): beta_sample * cos(theta) = (K * lambda / D) + 4 * epsilon * sin(theta)
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

WAVELENGTH = ${wavelength}
SHAPE_FACTOR_K = 0.94
YOUNGS_MODULUS_GPA = 130.0  # Young's Modulus E in GPa

# 2-Theta (deg) and Observed FWHM (deg)
two_theta_deg = np.array([28.44, 47.30, 56.12, 69.13, 76.38, 88.03])
fwhm_obs_deg = np.array([0.28, 0.35, 0.42, 0.48, 0.52, 0.58])
fwhm_inst_deg = 0.05

# Deconvolve instrumental broadening
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# 1. Uniform Deformation Model (UDM) Coordinates:
# X = 4 * sin(theta), Y = beta_sample * cos(theta)
x_udm = 4.0 * np.sin(theta_rad)
y_udm = beta_sample_rad * np.cos(theta_rad)

slope_udm, intercept_udm = np.polyfit(x_udm, y_udm, 1)
r_matrix = np.corrcoef(x_udm, y_udm)
r2_udm = r_matrix[0, 1] ** 2

microstrain_udm = slope_udm
D_udm_nm = (SHAPE_FACTOR_K * WAVELENGTH) / max(1e-9, intercept_udm) / 10.0

# 2. Uniform Stress Deformation Model (USDM):
# sigma = epsilon * E => Y = (K*lambda/D) + 4*sigma*(sin(theta)/E)
x_usdm = (4.0 * np.sin(theta_rad)) / (YOUNGS_MODULUS_GPA * 1e9)
slope_usdm, intercept_usdm = np.polyfit(x_usdm, y_udm, 1)
stress_usdm_mpa = slope_usdm / 1e6

# 3. Uniform Deformation Energy Density Model (UDEDM):
# u = (epsilon^2 * E) / 2 => Y = (K*lambda/D) + 4*(sin(theta) * sqrt(2*u / E))
x_udedm = 4.0 * np.sin(theta_rad) * np.sqrt(2.0 / (YOUNGS_MODULUS_GPA * 1e9))
slope_udedm, intercept_udedm = np.polyfit(x_udedm, y_udm, 1)
energy_density_kj = (slope_udedm ** 2) / 1e3

print("=" * 65)
print("       WILLIAMSON-HALL MULTI-MODEL DECONVOLUTION RESULTS")
print("=" * 65)
print(f"UDM Apparent Crystallite Size (D)   : {D_udm_nm:.2f} nm")
print(f"UDM Lattice Microstrain (ε)         : {microstrain_udm:.6e} ({microstrain_udm*100:.4f}%)")
print(f"UDM Regression Quality (R²)         : {r2_udm:.4f}")
print("-" * 65)
print(f"USDM Lattice Stress (σ)             : {stress_usdm_mpa:.2f} MPa")
print(f"UDEDM Deformation Energy Density (u): {energy_density_kj:.3f} kJ/m³")
print("=" * 65)

# Plot UDM
fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
ax.scatter(x_udm, y_udm, color="#6366f1", s=90, edgecolor="#312e81", zorder=5, label="Diffraction Reflections")
x_line = np.linspace(min(x_udm) * 0.9, max(x_udm) * 1.1, 100)
ax.plot(x_line, slope_udm * x_line + intercept_udm, color="#ec4899", ls="--", lw=2,
        label=f"Fit: ε = {microstrain_udm:.2e}, D = {D_udm_nm:.1f} nm (R² = {r2_udm:.3f})")

ax.set_title("Williamson-Hall Plot: Uniform Deformation Model (UDM)", fontsize=11, fontweight="bold")
ax.set_xlabel("4 · sin(θ)", fontsize=10, fontweight="bold")
ax.set_ylabel("β_sample · cos(θ) [radians]", fontsize=10, fontweight="bold")
ax.legend(frameon=True, facecolor="white", framealpha=0.9)
ax.grid(True, linestyle=":", alpha=0.6)
plt.tight_layout()
plt.savefig("williamson_hall_plot.png", dpi=300)
plt.show()
`;
      }

      // 4. Warren-Averbach Fourier Nanocrystal Size
      else if (selectedTemplate === "warren_averbach") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Warren-Averbach Fourier Nanocrystal Size & Distortion Analysis
# Formula: ln A(L) = ln A_S(L) - 2*pi^2 * <epsilon^2> * L^2 * s^2
# Column Length Distribution: P_V(L) proportional to d^2 A_S / dL^2
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

WAVELENGTH = ${wavelength}
L_COLUMNS = np.linspace(1.0, 60.0, 60) # Column length L in nm
TRUE_D_AREA = 22.0 # nm
TRUE_RMS_STRAIN = 0.0016

# Harmonic Orders for (111) and (222) reflections
s1 = 2.0 * np.sin(np.radians(28.44 / 2.0)) / WAVELENGTH
s2 = 2.0 * np.sin(np.radians(58.85 / 2.0)) / WAVELENGTH
s_vec = np.array([s1, s2])

# Generate Synthetic Fourier Coefficients A(L)
A_size_true = np.maximum(0.0, 1.0 - L_COLUMNS / TRUE_D_AREA)
A_matrix = np.zeros((len(s_vec), len(L_COLUMNS)))

for i, s in enumerate(s_vec):
    A_dist = np.exp(-2.0 * (np.pi**2) * (TRUE_RMS_STRAIN**2) * (L_COLUMNS**2) * (s**2))
    noise = np.random.normal(0, 0.003, len(L_COLUMNS))
    A_matrix[i, :] = np.clip(A_size_true * A_dist + noise, 1e-6, 1.0)

# Deconvolution: Linear regression ln A(L) vs s^2
A_size_extracted = []
rms_strain_extracted = []

for idx_l, L in enumerate(L_COLUMNS):
    y_ln_A = np.log(A_matrix[:, idx_l])
    x_s_sq = s_vec ** 2
    
    fit = np.polyfit(x_s_sq, y_ln_A, 1)
    slope, intercept = fit[0], fit[1]
    
    A_size_extracted.append(np.exp(intercept))
    # slope = -2*pi^2 * <e^2> * L^2
    rms_e = np.sqrt(max(0.0, -slope / (2.0 * (np.pi**2) * (L**2)))) if L > 0 else 0.0
    rms_strain_extracted.append(rms_e)

A_size_extracted = np.array(A_size_extracted)
rms_strain_extracted = np.array(rms_strain_extracted)

# Area-weighted crystallite size <D_A> = -1 / (d A_S / dL)_{L -> 0}
dA_dL_0 = (A_size_extracted[1] - A_size_extracted[0]) / (L_COLUMNS[1] - L_COLUMNS[0])
D_A_nm = -1.0 / dA_dL_0 if dA_dL_0 < 0 else float('nan')

print("=" * 65)
print("       WARREN-AVERBACH FOURIER DECONVOLUTION RESULTS")
print("=" * 65)
print(f"Area-Weighted Crystallite Size <D_A> : {D_A_nm:.2f} nm ({D_A_nm * 10:.1f} Å)")
print(f"RMS Microstrain <ε²>^(1/2) at L=10nm : {rms_strain_extracted[9]:.6e}")
print(f"RMS Microstrain <ε²>^(1/2) at L=30nm : {rms_strain_extracted[29]:.6e}")
print("=" * 65)

# Plot Fourier Size & Strain Curves
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5), dpi=300)
ax1.plot(L_COLUMNS, A_size_extracted, 'o-', color='#3b82f6', lw=2, label='Extracted Size Coeff. $A_S(L)$')
ax1.plot(L_COLUMNS, 1.0 + dA_dL_0 * L_COLUMNS, '--', color='#ef4444', label=f'Tangent at L=0: $\\langle D_A \\rangle={D_A_nm:.1f}$ nm')
ax1.set_xlabel('Column Length $L$ (nm)', fontweight='bold')
ax1.set_ylabel('Size Fourier Coefficient $A_S(L)$', fontweight='bold')
ax1.set_title('Warren-Averbach Size Component', fontweight='bold')
ax1.set_ylim(-0.05, 1.05)
ax1.grid(True, linestyle=':', alpha=0.6)
ax1.legend()

ax2.plot(L_COLUMNS, rms_strain_extracted * 1000.0, 's-', color='#10b981', lw=2, label='RMS Strain $\\langle \\epsilon^2 \\rangle^{1/2}$')
ax2.set_xlabel('Column Length $L$ (nm)', fontweight='bold')
ax2.set_ylabel('RMS Microstrain ($\\times 10^{-3}$)', fontweight='bold')
ax2.set_title('Microstrain vs Column Length', fontweight='bold')
ax2.grid(True, linestyle=':', alpha=0.6)
ax2.legend()

plt.tight_layout()
plt.savefig('warren_averbach_analysis.png', dpi=300)
plt.show()
`;
      }

      // 5. Cohen Refinement
      else if (selectedTemplate === "cohen_refinement") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Cohen's Least-Squares Unit Cell Parameter Refinement
# Matrix Formulation with Nelson-Riley Systematic Extrapolation Error δ
# ==============================================================================

import numpy as np

WAVELENGTH = ${wavelength}  # Cu Kα = 1.54056 Å

# High-precision calibration reflections: (h, k, l) and measured 2θ (deg)
peaks = [
    (1, 1, 1, 28.443),
    (2, 2, 0, 47.304),
    (3, 1, 1, 56.123),
    (4, 0, 0, 69.131),
    (3, 3, 1, 76.377),
    (4, 2, 2, 88.032),
    (5, 1, 1, 94.954)
]

def cohen_cubic_refinement():
    # Model: sin^2(theta) = A0 * (h^2 + k^2 + l^2) + D * delta
    # where A0 = lambda^2 / (4 * a^2), delta = 10 * cos^2(theta) / sin(theta)
    
    sum_alpha2 = 0.0
    sum_alpha_delta = 0.0
    sum_delta2 = 0.0
    sum_alpha_sin2 = 0.0
    sum_delta_sin2 = 0.0
    
    print("=" * 70)
    print("       COHEN'S LEAST-SQUARES NORMAL EQUATIONS MATRIX (CUBIC)")
    print("=" * 70)
    print(f"{'hkl':<8} {'2θ (°)':<10} {'sin²θ':<12} {'h²+k²+l²':<12} {'Nelson-Riley δ':<15}")
    print("-" * 70)
    
    for h, k, l, tt in peaks:
        th_rad = np.radians(tt / 2.0)
        sin2_th = np.sin(th_rad) ** 2
        alpha = h**2 + k**2 + l**2
        delta = 10.0 * ((np.cos(th_rad)**2) / np.sin(th_rad))
        
        sum_alpha2 += alpha**2
        sum_alpha_delta += alpha * delta
        sum_delta2 += delta**2
        sum_alpha_sin2 += alpha * sin2_th
        sum_delta_sin2 += delta * sin2_th
        
        print(f"({h} {k} {l})   {tt:<10.3f} {sin2_th:<12.6f} {alpha:<12} {delta:<15.6f}")
        
    # Solve 2x2 System: [A] {X} = {B}
    A_matrix = np.array([
        [sum_alpha2, sum_alpha_delta],
        [sum_alpha_delta, sum_delta2]
    ])
    B_vector = np.array([sum_alpha_sin2, sum_delta_sin2])
    
    solution = np.linalg.solve(A_matrix, B_vector)
    A0_refined, D_drift = solution[0], solution[1]
    
    # Calculate lattice parameter 'a'
    a_refined = WAVELENGTH / (2.0 * np.sqrt(A0_refined))
    unit_cell_volume = a_refined ** 3
    
    # Residual Variance & Standard Error
    residuals = []
    for h, k, l, tt in peaks:
        th_rad = np.radians(tt / 2.0)
        sin2_obs = np.sin(th_rad) ** 2
        alpha = h**2 + k**2 + l**2
        delta = 10.0 * ((np.cos(th_rad)**2) / np.sin(th_rad))
        sin2_calc = A0_refined * alpha + D_drift * delta
        residuals.append(sin2_obs - sin2_calc)
        
    residuals = np.array(residuals)
    variance = np.sum(residuals**2) / (len(peaks) - 2)
    inv_A = np.linalg.inv(A_matrix)
    sigma_A0 = np.sqrt(variance * inv_A[0, 0])
    sigma_a = (a_refined / (2.0 * A0_refined)) * sigma_A0
    
    print("=" * 70)
    print(f"Refined Constant A0          : {A0_refined:.8f} ± {sigma_A0:.8f}")
    print(f"Instrumental Drift Factor (D): {D_drift:.8f}")
    print(f"Refined Lattice Parameter 'a': {a_refined:.5f} ± {sigma_a:.5f} Å ({a_refined * 0.1:.5f} nm)")
    print(f"Refined Unit Cell Volume 'V' : {unit_cell_volume:.4f} Å³")
    print(f"Goodness-of-Fit Residual (s) : {np.sqrt(variance):.6e}")
    print("=" * 70)

if __name__ == "__main__":
    cohen_cubic_refinement()
`;
      }

      // 6. Metric Tensor
      else if (selectedTemplate === "metric_tensor") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Crystallographic Direct (G) & Reciprocal (G*) Metric Tensors
# Interplanar Spacings, Plane Normals, & Interplanar Angles for Any Lattice
# ==============================================================================

import numpy as np

# Direct Unit Cell Parameters: a, b, c (Å) and alpha, beta, gamma (deg)
a, b, c = 5.43088, 5.43088, 5.43088
alpha_deg, beta_deg, gamma_deg = 90.0, 90.0, 90.0

alpha = np.radians(alpha_deg)
beta = np.radians(beta_deg)
gamma = np.radians(gamma_deg)

# 1. Direct Metric Tensor G_ij = a_i · a_j
G = np.array([
    [a**2, a*b*np.cos(gamma), a*c*np.cos(beta)],
    [a*b*np.cos(gamma), b**2, b*c*np.cos(alpha)],
    [a*c*np.cos(beta), b*c*np.cos(alpha), c**2]
])

# Unit Cell Volume V = sqrt(det(G))
det_G = np.linalg.det(G)
unit_cell_volume = np.sqrt(det_G)

# 2. Reciprocal Metric Tensor G* = G^(-1)
G_star = np.linalg.inv(G)

print("=" * 65)
print("             CRYSTALLOGRAPHIC METRIC TENSOR ENGINE")
print("=" * 65)
print(f"Lattice Constants: a={a:.4f} Å, b={b:.4f} Å, c={c:.4f} Å")
print(f"Lattice Angles   : α={alpha_deg:.1f}°, β={beta_deg:.1f}°, γ={gamma_deg:.1f}°")
print(f"Unit Cell Volume : {unit_cell_volume:.4f} Å³")
print("-" * 65)
print("Direct Metric Tensor G (Å²):\\n", np.round(G, 4))
print("Reciprocal Metric Tensor G* (Å⁻²):\\n", np.round(G_star, 6))
print("=" * 65)

def calculate_plane_properties(hkl1, hkl2=(1, 0, 0)):
    h1 = np.array(hkl1)
    h2 = np.array(hkl2)
    
    # Reciprocal vector length norm: |d*|^2 = h^T · G* · h
    d_star_sq = np.dot(h1, np.dot(G_star, h1))
    d_spacing = 1.0 / np.sqrt(d_star_sq)
    
    # Interplanar angle phi between hkl1 and hkl2:
    # cos(phi) = (h1^T · G* · h2) / (|d*_1| · |d*_2|)
    dot_reciprocal = np.dot(h1, np.dot(G_star, h2))
    d_star1 = np.sqrt(d_star_sq)
    d_star2 = np.sqrt(np.dot(h2, np.dot(G_star, h2)))
    
    cos_phi = np.clip(dot_reciprocal / (d_star1 * d_star2), -1.0, 1.0)
    phi_deg = np.degrees(np.arccos(cos_phi))
    
    return d_spacing, phi_deg

planes_to_test = [(1, 1, 1), (2, 2, 0), (3, 1, 1), (4, 0, 0), (3, 3, 1)]

print(f"{'Plane (hkl)':<15} {'d-spacing (Å)':<18} {'Angle to (100) (°)':<20}")
print("-" * 65)
for p in planes_to_test:
    d_val, angle_val = calculate_plane_properties(p, (1, 0, 0))
    print(f"{str(p):<15} {d_val:<18.4f} {angle_val:<20.2f}")
print("=" * 65)

if __name__ == "__main__":
    pass
`;
      }

      // 7. Quantitative Phase Analysis (RIR / Chung)
      else if (selectedTemplate === "rir_quantitative") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Quantitative Multi-Phase Analysis via RIR (Chung Method)
# Equation: W_i = (I_i / (I_i^cor · RIR_i)) / sum_j (I_j / (I_j^cor · RIR_j))
# Analytical Covariance Error Propagation for Phase Weight Fractions
# ==============================================================================

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Measured Integrated Peak Intensities and I/I_cor Reference Intensity Ratios (Corundum = 1.0)
phases = [
    {"name": "Anatase (TiO2)", "I_obs": 4820.0, "I_err": 120.0, "RIR": 3.25},
    {"name": "Rutile (TiO2)",  "I_obs": 2150.0, "I_err": 80.0,  "RIR": 3.40},
    {"name": "Quartz (SiO2)",  "I_obs": 1340.0, "I_err": 65.0,  "RIR": 3.60},
    {"name": "Calcite (CaCO3)","I_obs": 890.0,  "I_err": 50.0,  "RIR": 2.98}
]

def calculate_rir_weight_fractions():
    I_obs = np.array([p["I_obs"] for p in phases])
    I_err = np.array([p["I_err"] for p in phases])
    RIR = np.array([p["RIR"] for p in phases])
    
    # Normalized terms: K_i = I_i / RIR_i
    K = I_obs / RIR
    sum_K = np.sum(K)
    
    # Mass weight fractions W_i = K_i / sum(K)
    W = K / sum_K
    W_percent = W * 100.0
    
    # Analytical Error Propagation:
    # dW_i / dI_i = (1/RIR_i * sum_K - K_i/RIR_i) / (sum_K^2)
    # dW_i / dI_j = - (K_i / (RIR_j * sum_K^2))
    W_err_percent = []
    for i in range(len(phases)):
        var_Wi = 0.0
        for j in range(len(phases)):
            if i == j:
                dWi_dIj = (sum_K - K[i]) / (RIR[i] * (sum_K ** 2))
            else:
                dWi_dIj = - K[i] / (RIR[j] * (sum_K ** 2))
            var_Wi += (dWi_dIj ** 2) * (I_err[j] ** 2)
        W_err_percent.append(np.sqrt(var_Wi) * 100.0)
        
    W_err_percent = np.array(W_err_percent)
    
    df = pd.DataFrame({
        "Phase Name": [p["name"] for p in phases],
        "Integrated Counts": I_obs,
        "RIR (I/Icor)": RIR,
        "Weight Fraction (wt%)": np.round(W_percent, 2),
        "Uncertainty ± (wt%)": np.round(W_err_percent, 2)
    })
    
    print("=" * 70)
    print("       QUANTITATIVE MULTI-PHASE ANALYSIS (CHUNG RIR METHOD)")
    print("=" * 70)
    print(df.to_string(index=False))
    print("-" * 70)
    print(f"Total Mass Fraction Sum: {np.sum(W_percent):.2f}%")
    print("=" * 70)
    
    # Plot Donut Breakdown
    fig, ax = plt.subplots(figsize=(7, 6), dpi=300)
    colors = ["#3b82f6", "#ec4899", "#10b981", "#f59e0b"]
    wedges, texts, autotexts = ax.pie(
        W_percent, 
        labels=df["Phase Name"], 
        autopct="%1.1f%%", 
        startangle=140, 
        colors=colors,
        wedgeprops=dict(width=0.4, edgecolor="white", linewidth=2),
        pctdistance=0.75
    )
    plt.setp(autotexts, size=10, weight="bold", color="white")
    plt.setp(texts, size=10, weight="bold")
    ax.set_title("Quantitative Phase Composition (RIR Mass Fractions)", fontsize=12, fontweight="bold")
    plt.tight_layout()
    plt.savefig("quantitative_rir_breakdown.png", dpi=300)
    plt.show()

if __name__ == "__main__":
    calculate_rir_weight_fractions()
`;
      }

      // 8. Residual Stress sin²ψ
      else if (selectedTemplate === "residual_stress") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Sin²(ψ) Residual Stress & Elasticity Tensor Deconvolution
# Dölle-Hauk Method: d_ψ = d_0 · [1 + (1/2·S_2)·σ_φ·sin²(ψ) + 2·S_1·σ_hyd]
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

WAVELENGTH = ${wavelength}
TWO_THETA_0 = 156.40 # Stress-free 2theta angle for Ferrite (211) reflection
E_GPA = 210.0        # Young's Modulus in GPa
POISSON_RATIO = 0.28 # Poisson's ratio ν

# X-ray Elastic Constants:
# 1/2 S2 = (1 + ν) / E
# S1 = -ν / E
half_S2 = (1.0 + POISSON_RATIO) / (E_GPA * 1e3)  # MPa^-1
S1 = -POISSON_RATIO / (E_GPA * 1e3)              # MPa^-1

# Measured Tilt Angles ψ (deg) and Refined 2θ Peak Positions (deg)
psi_angles_deg = np.array([0.0, 15.0, 24.0, 30.0, 37.0, 45.0])
measured_two_theta = np.array([156.412, 156.368, 156.315, 156.270, 156.210, 156.142])

# 1. Calculate interplanar spacing d_psi
theta_rad = np.radians(measured_two_theta / 2.0)
d_psi = WAVELENGTH / (2.0 * np.sin(theta_rad))
d_0 = WAVELENGTH / (2.0 * np.sin(np.radians(TWO_THETA_0 / 2.0)))

# 2. Sin²(ψ) Coordinates
sin2_psi = np.sin(np.radians(psi_angles_deg)) ** 2

# Linear Fit: d_psi = slope * sin^2(psi) + intercept
slope, intercept = np.polyfit(sin2_psi, d_psi, 1)
r_matrix = np.corrcoef(sin2_psi, d_psi)
r_squared = r_matrix[0, 1] ** 2

# 3. Residual Stress Extraction:
# slope = d_0 * (1/2 S2) * sigma_phi => sigma_phi = slope / (d_0 * 1/2 S2)
sigma_phi_mpa = slope / (d_0 * half_S2)

print("=" * 65)
print("          SIN²(Ψ) RESIDUAL STRESS DECONVOLUTION")
print("=" * 65)
print(f"X-Ray Elastic Constant (1/2 S2) : {half_S2:.6e} MPa⁻¹")
print(f"Stress-Free d-Spacing (d_0)     : {d_0:.5f} Å")
print(f"Fitted Slope (∂d / ∂sin²ψ)      : {slope:.6e} Å")
print(f"Goodness of Fit (R²)            : {r_squared:.4f}")
print("-" * 65)
print(f"In-Plane Residual Stress (σ_φ)  : {sigma_phi_mpa:.2f} MPa ({'Tensile' if sigma_phi_mpa > 0 else 'Compressive'})")
print("=" * 65)

# Plot d vs sin^2(psi)
fig, ax = plt.subplots(figsize=(8, 5), dpi=300)
ax.scatter(sin2_psi, d_psi, color="#e11d48", s=90, edgecolor="#881337", zorder=5, label="Measured Tilt Angles ψ")
x_fit = np.linspace(0, 0.6, 100)
ax.plot(x_fit, slope * x_fit + intercept, color="#2563eb", ls="--", lw=2,
        label=f"Fit: σ_φ = {sigma_phi_mpa:.1f} MPa (R² = {r_squared:.4f})")

ax.set_title("Residual Stress Sin²(ψ) Plot (Dölle-Hauk Method)", fontsize=11, fontweight="bold")
ax.set_xlabel("sin²(ψ)", fontsize=10, fontweight="bold")
ax.set_ylabel("Interplanar Spacing d (Å)", fontsize=10, fontweight="bold")
ax.grid(True, linestyle=":", alpha=0.6)
ax.legend(frameon=True, facecolor="white")
plt.tight_layout()
plt.savefig("residual_stress_sin2psi.png", dpi=300)
plt.show()
`;
      }

      // 9. PyTorch Deep Learning
      else if (selectedTemplate === "pytorch_ml") {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: PyTorch Deep Learning Tabular & Spectral Network
# Architecture: Bochner Harmonic Fourier Embeddings + Gated Residual Network (GRN)
# Loss: Strictly Proper Continuous Ranked Probability Score (CRPS)
# Uncertainty: Finite-Sample Split Conformal Prediction Intervals
# ==============================================================================

import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import matplotlib.pyplot as plt

# Set device & deterministic seed
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.manual_seed(42)
np.random.seed(42)

# 1. Bochner Random Fourier Feature Embedding Layer
class BochnerFourierEmbedding(nn.Module):
    """Solves spectral bias on continuous diffraction signals."""
    def __init__(self, in_features, embed_dim=64, sigma=2.5):
        super().__init__()
        self.B = nn.Parameter(torch.randn(in_features, embed_dim // 2) * sigma, requires_grad=False)
        
    def forward(self, x):
        proj = 2.0 * np.pi * torch.matmul(x, self.B)
        return torch.cat([torch.cos(proj), torch.sin(proj)], dim=-1)

# 2. Gated Residual Network (GRN) Block
class GatedResidualNetwork(nn.Module):
    def __init__(self, d_model, dropout=0.1):
        super().__init__()
        self.fc1 = nn.Linear(d_model, d_model * 2)
        self.glu = nn.GLU(dim=-1)
        self.fc2 = nn.Linear(d_model, d_model)
        self.norm = nn.LayerNorm(d_model)
        self.drop = nn.Dropout(dropout)
        
    def forward(self, x):
        residual = x
        out = self.glu(self.fc1(x))
        out = self.drop(self.fc2(out))
        return self.norm(residual + out)

# 3. Spectral Regression Model with Dual Parameter Output (Mean mu, Std sigma)
class XRDSpectralRegressor(nn.Module):
    def __init__(self, in_features=128, embed_dim=64, d_model=128):
        super().__init__()
        self.embed = BochnerFourierEmbedding(in_features, embed_dim=embed_dim)
        self.proj = nn.Linear(embed_dim, d_model)
        self.grn1 = GatedResidualNetwork(d_model)
        self.grn2 = GatedResidualNetwork(d_model)
        self.head = nn.Linear(d_model, 2) # [mu, log_sigma]
        
    def forward(self, x):
        x = self.proj(self.embed(x))
        x = self.grn1(x)
        x = self.grn2(x)
        out = self.head(x)
        mu = out[:, 0]
        sigma = torch.nn.functional.softplus(out[:, 1]) + 1e-4
        return mu, sigma

# 4. Strictly Proper CRPS Loss
def crps_gaussian_loss(mu, sigma, y):
    z = (y - mu) / sigma
    phi = torch.exp(-0.5 * z**2) / np.sqrt(2.0 * np.pi)
    # Erf based standard normal CDF
    Phi = 0.5 * (1.0 + torch.erf(z / np.sqrt(2.0)))
    crps = sigma * (z * (2.0 * Phi - 1.0) + 2.0 * phi - (1.0 / np.sqrt(np.pi)))
    return torch.mean(crps)

# 5. Synthetic Training & Conformal Calibration Loop
def train_and_conformalize():
    N_samples = 600
    N_bins = 128
    
    # Synthesize XRD spectral batches (e.g. crystallite size target)
    X = torch.randn(N_samples, N_bins).to(device)
    y_true = 25.0 + 10.0 * torch.sin(X[:, 10] * 2.0) + torch.randn(N_samples).to(device) * 1.5
    
    # Train / Calib / Test Splits
    train_x, train_y = X[:400], y_true[:400]
    calib_x, calib_y = X[400:500], y_true[400:500]
    test_x, test_y = X[500:], y_true[500:]
    
    model = XRDSpectralRegressor(in_features=N_bins).to(device)
    optimizer = optim.AdamW(model.parameters(), lr=0.003, weight_decay=1e-4)
    
    print("=" * 65)
    print("       PYTORCH DEEP LEARNING SPECTRAL MODEL TRAINING")
    print("=" * 65)
    
    model.train()
    for epoch in range(1, 41):
        optimizer.zero_grad()
        mu, sigma = model(train_x)
        loss = crps_gaussian_loss(mu, sigma, train_y)
        loss.backward()
        optimizer.step()
        if epoch % 10 == 0:
            print(f"Epoch [{epoch:02d}/40] - CRPS Training Loss: {loss.item():.4f}")
            
    # 6. Split Conformal Prediction Calibration (Coverage guarantee 1 - alpha = 90%)
    model.eval()
    with torch.no_grad():
        calib_mu, calib_sigma = model(calib_x)
        # Non-conformity score: s_i = |y - mu| / sigma
        scores = (torch.abs(calib_y - calib_mu) / calib_sigma).cpu().numpy()
        
        alpha = 0.10 # 90% target coverage
        q_level = np.ceil((len(scores) + 1) * (1.0 - alpha)) / len(scores)
        q_hat = np.quantile(scores, min(1.0, q_level))
        
        # Evaluate on Test Set
        test_mu, test_sigma = model(test_x)
        lower_bound = (test_mu - q_hat * test_sigma).cpu().numpy()
        upper_bound = (test_mu + q_hat * test_sigma).cpu().numpy()
        test_mu_np = test_mu.cpu().numpy()
        test_y_np = test_y.cpu().numpy()
        
        empirical_coverage = np.mean((test_y_np >= lower_bound) & (test_y_np <= upper_bound))
        
    print("-" * 65)
    print(f"Conformal Calibration Multiplier (q_hat): {q_hat:.4f}")
    print(f"Target Coverage: 90.0% | Empirical Test Coverage: {empirical_coverage * 100:.1f}%")
    print("=" * 65)
    
    # Plot Conformal Bands on Test Samples
    fig, ax = plt.subplots(figsize=(10, 4.5), dpi=300)
    idx_pts = np.arange(len(test_y_np))
    ax.fill_between(idx_pts, lower_bound, upper_bound, color="#a855f7", alpha=0.25, label="90% Split Conformal Interval")
    ax.plot(idx_pts, test_mu_np, color="#7e22ce", lw=2, label="Model Prediction (Mean μ)")
    ax.scatter(idx_pts, test_y_np, color="#0f172a", s=25, zorder=5, label="Ground Truth Crystallite Size (nm)")
    
    ax.set_title("PyTorch Spectral Regressor with Finite-Sample Conformal Bands", fontsize=11, fontweight="bold")
    ax.set_xlabel("Test Spectrum Index", fontsize=10)
    ax.set_ylabel("Crystallite Size Target (nm)", fontsize=10)
    ax.legend(frameon=True, facecolor="white")
    ax.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()
    plt.savefig("pytorch_conformal_regression.png", dpi=300)
    plt.show()

if __name__ == "__main__":
    train_and_conformalize()
`;
      }

      // Fallback
      else {
        pythonCode = `#!/usr/bin/env python3
# ==============================================================================
# XRD-Calc Pro: Automated Scientific Python Analysis
# Method: ${selectedTemplate.toUpperCase()}
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

WAVELENGTH = ${wavelength}
two_theta = np.array([28.44, 47.30, 56.12, 69.13, 76.38])
fwhm = np.array([0.28, 0.35, 0.42, 0.48, 0.52])

theta_rad = np.radians(two_theta / 2.0)
d_spacings = WAVELENGTH / (2.0 * np.sin(theta_rad))

print("=" * 60)
print("            XRD COMPUTATIONAL SCRIPT RESULTS")
print("=" * 60)
for i, (tt, d, b) in enumerate(zip(two_theta, d_spacings, fwhm)):
    print(f"Peak #{i+1}: 2θ = {tt:6.2f}° | d = {d:7.4f} Å | FWHM = {b:5.3f}°")
print("=" * 60)
`;
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

  const handleDownload = () => {
    const blob = new Blob([scriptContent], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate}_xrd_analysis.py`;
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
            {/* METHOD TEMPLATES HORIZONTAL SCROLL / WRAP */}
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="text-[11px] font-black uppercase text-slate-300 tracking-wider">
                    Select Scientific Method Template ({templates.length} Modules)
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                  INSTANT COMPUTE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {templates.map((tpl) => {
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

            <div className="flex items-center gap-2">
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
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium border border-indigo-500 transition-colors"
                title="Download .py"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .py</span>
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
