import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileCode2, 
  Copy, 
  Check, 
  Download, 
  Play, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Cpu
} from 'lucide-react';

interface PythonCodeExporterProps {
  methodName: string;
  parameters?: Record<string, any>;
  customScript?: string;
}

export const PythonCodeExporter: React.FC<PythonCodeExporterProps> = ({
  methodName,
  parameters = {},
  customScript
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<{ stdout: string; stderr: string; exitCode: number } | null>(null);

  // Precise executable Python generator covering all crystallography and diffraction methods
  const generateScript = (): string => {
    if (customScript) return customScript.trim();

    const wavelength = parameters.wavelength || 1.54056;
    const twoTheta = Array.isArray(parameters.twoTheta) ? parameters.twoTheta : [28.44, 47.30, 56.12, 69.13, 76.38];
    const beta = Array.isArray(parameters.beta) ? parameters.beta : [0.25, 0.32, 0.38, 0.45, 0.52];
    const fwhmInst = parameters.fwhmInst !== undefined ? parameters.fwhmInst : 0.05;
    const shapeFactor = parameters.shapeFactor || 0.89;
    const xArray = Array.isArray(parameters.x) ? parameters.x : null;
    const yArray = Array.isArray(parameters.y) ? parameters.y : null;

    const lowerMethod = methodName.toLowerCase();

    // 1. Monshi-Scherrer Logarithmic Analysis
    if (lowerMethod.includes('monshi') || lowerMethod.includes('logarithmic')) {
      const hasPrecomputed = xArray && yArray;

      return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: Monshi-Scherrer Logarithmic Transformation
# Linearized Size Derivation: ln(β) = ln(K·λ / D) + ln(1 / cos θ)
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Parameters
wavelength = ${wavelength}  # X-ray wavelength in Å (Cu Kα = 1.54056 Å)
shape_factor_K = ${shapeFactor}  # Scherrer shape factor K

${hasPrecomputed ? `# Precomputed Logarithmic Transform Values from Engine
x = np.array(${JSON.stringify(xArray)})  # x = ln(1 / cos θ)
y = np.array(${JSON.stringify(yArray)})  # y = ln(β_sample [rad])
` : `# Peak positions 2θ (deg) and observed FWHM β_obs (deg)
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# Convert angles to radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# Subtract instrumental broadening (Gaussian: β_sample² = β_obs² - β_inst²)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# Monshi-Scherrer Coordinates: x = ln(1/cos θ), y = ln(β_sample)
x = np.log(1.0 / np.cos(theta_rad))
y = np.log(beta_sample_rad)
`}

# 2. Linear Least-Squares Regression (y = m·x + C)
slope, intercept = np.polyfit(x, y, 1)
r_matrix = np.corrcoef(x, y)
r_squared = r_matrix[0, 1] ** 2

# 3. Extract Crystallite Size D (nm)
# Intercept C = ln(K·λ / D_Å) => D_nm = exp(-C) · (K · λ) / 10.0
D_nm = np.exp(-intercept) * (shape_factor_K * wavelength) / 10.0

print("=" * 60)
print("       MONSHI-SCHERRER LOGARITHMIC ANALYSIS RESULTS")
print("=" * 60)
print(f"Regression Slope (m)           : {slope:.6f} (Ideal theoretical slope = 1.000)")
print(f"Intercept C = ln(K·λ/D)        : {intercept:.6f}")
print(f"Goodness-of-Fit (R²)           : {r_squared:.6f}")
print(f"Mean Crystallite Size (D)      : {D_nm:.2f} nm ({D_nm * 10.0:.2f} Å)")
print("=" * 60)

# 4. Plot Monshi-Scherrer Regression
plt.figure(figsize=(8, 5))
plt.scatter(x, y, color='#00f2fe', edgecolor='#0083b0', s=80, label='Diffraction Peaks', zorder=5)
x_fit = np.linspace(min(x) - 0.02, max(x) + 0.02, 100)
plt.plot(x_fit, slope * x_fit + intercept, color='#ff007f', linestyle='--', linewidth=2, 
         label=f'Fit: y = {slope:.4f}x + ({intercept:.4f}) | R² = {r_squared:.4f}')

plt.title('Monshi-Scherrer Plot: ln(β) vs ln(1/cos θ)', fontsize=12, fontweight='bold')
plt.xlabel('ln(1 / cos θ)', fontsize=11)
plt.ylabel('ln(β_sample [radians])', fontsize=11)
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()
plt.show()
`;
    }

    // 2. Williamson-Hall Size-Strain Deconvolution (UDM, USDM, UDEDM)
    if (lowerMethod.includes('williamson') || lowerMethod.includes('wh') || lowerMethod.includes('size-strain')) {
      const hasPrecomputed = xArray && yArray;

      return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: Williamson-Hall Uniform Deformation Models
# Size & Microstrain Deconvolution: β·cos(θ) = (K·λ / D) + 4·ε·sin(θ)
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Parameters
wavelength = ${wavelength}  # X-ray wavelength in Å
shape_factor_K = ${shapeFactor}

${hasPrecomputed ? `# Precomputed Williamson-Hall coordinates from App Engine
x = np.array(${JSON.stringify(xArray)})  # x = 4 · sin θ
y = np.array(${JSON.stringify(yArray)})  # y = β_sample · cos θ [rad]
` : `# Peak positions 2θ (deg) and observed FWHM β_obs (deg)
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# Convert to radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# Subtract instrumental broadening (Gaussian)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# UDM Standard: x = 4 · sin θ, y = β_sample · cos θ
x = 4.0 * np.sin(theta_rad)
y = beta_sample_rad * np.cos(theta_rad)
`}

# 2. Linear Least-Squares Fit (y = m·x + C)
slope, intercept = np.polyfit(x, y, 1)
r_matrix = np.corrcoef(x, y)
r_squared = r_matrix[0, 1] ** 2

# 3. Microstrain & Crystallite Size Extraction
microstrain = slope
strain_percent = slope * 100.0
D_nm = (shape_factor_K * wavelength) / max(1e-9, intercept) / 10.0 if intercept > 0 else float('nan')

print("=" * 60)
print("         WILLIAMSON-HALL (UDM) ANALYSIS RESULTS")
print("=" * 60)
print(f"Lattice Microstrain (ε)        : {microstrain:.6e} ({strain_percent:.4f}%)")
print(f"Crystallite Size (D)           : {D_nm:.2f} nm ({D_nm * 10.0:.2f} Å)")
print(f"Linear Intercept (K·λ/D)       : {intercept:.6f}")
print(f"Goodness of Fit (R²)           : {r_squared:.6f}")
print("=" * 60)

# 4. Plot Williamson-Hall Deconvolution
plt.figure(figsize=(8, 5))
plt.scatter(x, y, color='#10b981', edgecolor='#047857', s=80, label='Peak Reflections', zorder=5)
x_fit = np.linspace(min(x) * 0.95, max(x) * 1.05, 100)
plt.plot(x_fit, slope * x_fit + intercept, color='#ef4444', linestyle='--', linewidth=2,
         label=f'UDM Fit: ε = {microstrain:.2e}, R² = {r_squared:.4f}')

plt.xlabel('4 · sin(θ)', fontsize=11)
plt.ylabel('β_sample · cos(θ) [radians]', fontsize=11)
plt.title('Williamson-Hall Plot: Size & Strain Separation', fontsize=12, fontweight='bold')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()
plt.show()
`;
    }

    // 3. Warren-Averbach Fourier Analysis
    if (lowerMethod.includes('warren') || lowerMethod.includes('averbach') || lowerMethod.includes('fourier')) {
      return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: Warren-Averbach Fourier Nanocrystal Size & Microstrain
# Decoupling Size A_S(L) and Distortion A_D(L): ln A(L) = ln A_S(L) - 2π²·<ε²>·L²·s²
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Setup & Harmonic Multi-Order Peaks (e.g., (111) & (222))
wavelength = ${wavelength}
orders = [1, 2]
s_values = [0.28, 0.56] # Scattering vectors s = 2*sin(theta)/lambda
L_lengths = np.linspace(1.0, 50.0, 50) # Column lengths L in nm

# Theoretical Fourier Harmonic Coefficients
true_D_eff = 24.5 # nm
true_rms_strain = 0.0018

# Synthesize Fourier coefficients A(L, s)
A_size = np.maximum(0.0, 1.0 - L_lengths / true_D_eff)
A_matrix = np.zeros((len(orders), len(L_lengths)))

for i, s in enumerate(s_values):
    A_distortion = np.exp(-2.0 * np.pi**2 * (true_rms_strain**2) * (L_lengths**2) * (s**2))
    A_matrix[i, :] = A_size * A_distortion + np.random.normal(0, 0.005, len(L_lengths))

# 2. Linear Extrapolation across orders: ln A(L) vs s²
A_S_extracted = []
rms_strain_extracted = []

for idx_L, L in enumerate(L_lengths):
    y_lnA = np.log(np.maximum(1e-6, A_matrix[:, idx_L]))
    x_s_sq = np.array(s_values)**2
    
    p_fit = np.polyfit(x_s_sq, y_lnA, 1)
    ln_A_S = p_fit[1]
    slope = p_fit[0]
    
    A_S_extracted.append(np.exp(ln_A_S))
    # slope = -2*pi^2 * <e^2> * L^2
    rms_e = np.sqrt(max(0.0, -slope / (2.0 * np.pi**2 * (L**2)))) if L > 0 else 0.0
    rms_strain_extracted.append(rms_e)

A_S_extracted = np.array(A_S_extracted)
# Area-weighted size <D_A> = -1 / (d A_S / dL)_{L->0}
dA_dL_0 = (A_S_extracted[1] - A_S_extracted[0]) / (L_lengths[1] - L_lengths[0])
D_A_nm = -1.0 / dA_dL_0 if dA_dL_0 < 0 else float('nan')

print("=" * 60)
print("         WARREN-AVERBACH FOURIER DECONVOLUTION")
print("=" * 60)
print(f"Area-Weighted Crystallite Size <D_A> : {D_A_nm:.2f} nm")
print(f"RMS Lattice Strain <ε²>^(1/2) at 10nm : {rms_strain_extracted[9]:.6e}")
print("=" * 60)

# 3. Plot Size Distribution & Distortion Curve
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
ax1.plot(L_lengths, A_S_extracted, 'b-o', lw=2, label='Size Fourier Coeff. $A_S(L)$')
ax1.set_xlabel('Column Length $L$ (nm)')
ax1.set_ylabel('Fourier Coefficient $A_S(L)$')
ax1.set_title('Warren-Averbach Size Function')
ax1.grid(True, alpha=0.3)
ax1.legend()

ax2.plot(L_lengths, rms_strain_extracted, 'r-s', lw=2, label='RMS Strain $\\langle \\epsilon^2 \\rangle^{1/2}$')
ax2.set_xlabel('Column Length $L$ (nm)')
ax2.set_ylabel('RMS Microstrain')
ax2.set_title('Microstrain vs Column Length $L$')
ax2.grid(True, alpha=0.3)
ax2.legend()

plt.tight_layout()
plt.show()
`;
    }

    // 4. Method of Moments / Variance Method
    if (lowerMethod.includes('moments') || lowerMethod.includes('variance')) {
      const ranges = Array.isArray(parameters.ranges) ? parameters.ranges : [0.5, 1.0, 1.5, 2.0, 2.5];
      const variances = Array.isArray(parameters.variances) ? parameters.variances : [0.0012, 0.0028, 0.0045, 0.0061, 0.0078];
      
      return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: Method of Moments (Profile Variance vs Range)
# Wilson / Tournarie Variance Scheme for Volume Size & Microstrain
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

# Parameters
wavelength = ${wavelength}  # Ångströms

# Integration range Δ(2θ) [deg] and profile variance W [deg²]
ranges_deg = np.array(${JSON.stringify(ranges)})
variances_deg2 = np.array(${JSON.stringify(variances)})

# Linear fit: W(deg²) = slope_deg · Δ(2θ_deg) + intercept_deg²
slope_deg, intercept_deg2 = np.polyfit(ranges_deg, variances_deg2, 1)

# Convert to radians for physical size derivation
slope_rad = slope_deg * (np.pi / 180.0)
intercept_rad2 = intercept_deg2 * (np.pi / 180.0)**2

# Volume-Weighted Crystallite Size D_V (nm) = (K · λ) / (2 · π² · slope_rad) / 10.0
D_nm = (0.94 * wavelength) / (2.0 * np.pi**2 * max(1e-12, slope_rad)) / 10.0

# RMS Microstrain <e²>^(1/2) = sqrt(intercept_rad²)
rms_strain = np.sqrt(max(0.0, intercept_rad2))

print("=" * 60)
print("       METHOD OF MOMENTS VARIANCE ANALYSIS RESULTS")
print("=" * 60)
print(f"Variance Slope K1 (deg²/deg)   : {slope_deg:.6e}")
print(f"Variance Intercept W0 (deg²)   : {intercept_deg2:.6e}")
print(f"Volume-Weighted Size (D_V)     : {D_nm:.2f} nm")
print(f"RMS Microstrain <e²>^(1/2)     : {rms_strain:.6e}")
print("=" * 60)

plt.figure(figsize=(8, 5))
plt.scatter(ranges_deg, variances_deg2, color='#3b82f6', edgecolor='#1d4ed8', s=80, label='Measured Moments', zorder=5)
plt.plot(ranges_deg, slope_deg * ranges_deg + intercept_deg2, 'r--', lw=2, label=f'Fit: W = {slope_deg:.4e}·Δ2θ + ({intercept_deg2:.4e})')
plt.xlabel('Integration Range Δ(2θ) [deg]', fontsize=11)
plt.ylabel('Profile Variance W [deg²]', fontsize=11)
plt.title('Method of Moments: Profile Variance vs Integration Range', fontsize=12, fontweight='bold')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend(frameon=True, facecolor='white', framealpha=0.9)
plt.tight_layout()
plt.show()
`;
    }

    // 5. Cohen Least-Squares Unit Cell Parameter Refinement
    if (lowerMethod.includes('cohen') || lowerMethod.includes('lattice') || lowerMethod.includes('refine')) {
      return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: Cohen's Least-Squares Unit Cell Parameter Refinement
# System: Cubic/Tetragonal with Nelson-Riley Extrapolation Function cos²θ/sinθ
# ==============================================================================

import numpy as np

wavelength = ${wavelength}  # Cu Kα = 1.54056 Å

# Experimental reflections: (h, k, l) and 2θ (degrees)
reflections = [
    (1, 1, 1, 28.44),
    (2, 2, 0, 47.30),
    (3, 1, 1, 56.12),
    (4, 0, 0, 69.13),
    (3, 3, 1, 76.38),
    (4, 2, 2, 88.03)
]

# Set up Normal Equations Matrix: [A] · {x} = {B}
# For Cubic: sin²θ = (λ² / 4a²) · (h² + k² + l²) + D · δ
# Let α = (h² + k² + l²), δ = 10 · cos²θ / sinθ, A0 = λ² / (4a²)
N = len(reflections)
sum_a2 = 0.0
sum_ad = 0.0
sum_d2 = 0.0
sum_as = 0.0
sum_ds = 0.0

print("=" * 65)
print("     COHEN'S LEAST-SQUARES UNIT CELL REFINEMENT MATRIX")
print("=" * 65)
print(f"{'hkl':<8} {'2θ (°)':<10} {'sin²θ':<12} {'h²+k²+l²':<12} {'Nelson-Riley δ':<15}")
print("-" * 65)

for h, k, l, tt in reflections:
    theta_rad = np.radians(tt / 2.0)
    sin2_th = np.sin(theta_rad) ** 2
    alpha = h**2 + k**2 + l**2
    delta = 10.0 * (np.cos(theta_rad)**2 / np.sin(theta_rad))
    
    sum_a2 += alpha**2
    sum_ad += alpha * delta
    sum_d2 += delta**2
    sum_as += alpha * sin2_th
    sum_ds += delta * sin2_th
    
    print(f"({h} {k} {l})   {tt:<10.2f} {sin2_th:<12.6f} {alpha:<12} {delta:<15.6f}")

# Construct 2x2 Matrix
A_mat = np.array([[sum_a2, sum_ad], [sum_ad, sum_d2]])
B_vec = np.array([sum_as, sum_ds])

solution = np.linalg.solve(A_mat, B_vec)
A0 = solution[0]
D_drift = solution[1]

# Extract Lattice Parameter a (Å)
# A0 = λ² / (4a²) => a = λ / (2 · sqrt(A0))
a_refined = wavelength / (2.0 * np.sqrt(A0))

print("=" * 65)
print(f"Refined Parameter A0          : {A0:.8f}")
print(f"Instrumental Drift Factor (D) : {D_drift:.8f}")
print(f"Refined Lattice Parameter 'a' : {a_refined:.5f} Å ({a_refined * 0.1:.5f} nm)")
print(f"Refined Unit Cell Volume 'V'  : {a_refined**3:.4f} Å³")
print("=" * 65)
`;
    }

    // Default Fallback Generator for Scherrer & General XRD Methods
    return `#!/usr/bin/env python3
# ==============================================================================
# XRD Analysis: ${methodName}
# High-Precision Standalone Computational Python Script
# ==============================================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Input Parameters
wavelength = ${wavelength}  # X-ray source wavelength in Å (Cu Kα = 1.54056 Å)
shape_factor_K = ${shapeFactor}
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# 2. Conversion to Physical Radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# 3. Instrumental Broadening Deconvolution (Gaussian model)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# 4. Scherrer Formula: D = (K · λ) / (β_sample · cos θ) / 10.0 [nm]
D_nm = (shape_factor_K * wavelength) / (beta_sample_rad * np.cos(theta_rad)) / 10.0
d_spacing_A = wavelength / (2.0 * np.sin(theta_rad))

print("=" * 70)
print("           ${methodName.toUpperCase()} DIFFRACTION RESULTS")
print("=" * 70)
print(f"{'Peak #':<8} {'2θ (°)':<10} {'d-spacing (Å)':<15} {'FWHM Obs (°)':<15} {'Size D (nm)':<12}")
print("-" * 70)

for i, (tt, d, b_obs, size) in enumerate(zip(two_theta_deg, d_spacing_A, fwhm_obs_deg, D_nm)):
    print(f"#{i+1:<7} {tt:<10.2f} {d:<15.4f} {b_obs:<15.4f} {size:<12.2f}")

print("=" * 70)
print(f"Mean Crystallite Size : {np.mean(D_nm):.2f} nm ± {np.std(D_nm):.2f} nm")
print("=" * 70)
`;
  };

  const codeString = generateScript();

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([codeString], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${methodName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_analysis.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunPython = async () => {
    setIsRunning(true);
    setOutput(null);

    try {
      const response = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeString })
      });

      const data = await response.json();
      setOutput(data);
    } catch (err: any) {
      setOutput({ stdout: '', stderr: `Failed to execute Python: ${err.message}`, exitCode: 1 });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#080F1E]/95 rounded-2xl border border-emerald-500/25 overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-500/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform border border-emerald-500/20">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Executable Python Script</h4>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <Cpu className="w-3 h-3" /> Standalone .py
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production-grade Python 3 script with NumPy, SciPy & Matplotlib for {methodName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-300 transition-colors">
          <span className="text-xs font-mono hidden sm:inline font-medium">{isOpen ? 'Collapse Code' : 'Inspect Code'}</span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#040812]"
          >
            {/* Toolbar */}
            <div className="p-3 bg-slate-900/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold text-emerald-300">Python 3.x (NumPy / SciPy / Matplotlib)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunPython}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Executing...' : 'Run on Server'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition-colors border border-slate-700 active:scale-95"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition-colors border border-slate-700 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .py</span>
                </button>
              </div>
            </div>

            {/* Code Editor / Display */}
            <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 bg-[#020610] max-h-96 leading-relaxed select-all border-b border-white/5">
              <pre className="text-emerald-300 whitespace-pre">{codeString}</pre>
            </div>

            {/* Server Execution Output */}
            {output && (
              <div className="p-4 bg-black/80 font-mono text-xs">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Terminal className="w-3.5 h-3.5" /> Server Execution Output
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    output.exitCode === 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    Exit Code: {output.exitCode}
                  </span>
                </div>

                {output.stdout && (
                  <pre className="text-slate-200 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-white/10 overflow-x-auto">
                    {output.stdout}
                  </pre>
                )}

                {output.stderr && (
                  <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/40 p-3 rounded-lg border border-rose-500/30 mt-2 overflow-x-auto">
                    {output.stderr}
                  </pre>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
