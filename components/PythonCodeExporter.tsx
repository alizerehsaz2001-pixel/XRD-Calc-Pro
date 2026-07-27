import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Code, Copy, Check, Download, Play, Terminal, ChevronDown, ChevronUp, Sparkles, FileCode2 } from 'lucide-react';

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

  // Helper to generate precise executable Python code based on method & parameters
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

    if (lowerMethod.includes('monshi') || lowerMethod.includes('logarithmic')) {
      const hasPrecomputed = xArray && yArray;

      return `# =========================================================
# XRD Calculation: Monshi-Scherrer Logarithmic Analysis
# High-precision Python Script matching XRD Calc Pro physics engine
# =========================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Parameters
wavelength = ${wavelength}  # X-ray wavelength in Ångströms (Cu Kα = 1.54056 Å)
shape_factor_K = ${shapeFactor}  # Scherrer shape factor K

${hasPrecomputed ? `# Precomputed Logarithmic Transform Values from App Engine
x = np.array(${JSON.stringify(xArray)})  # x = ln(1 / cos θ)
y = np.array(${JSON.stringify(yArray)})  # y = ln(β_sample [radians])
` : `# Peak positions 2θ (deg) and observed FWHM β_obs (deg)
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# Convert angles to radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# Subtract instrumental broadening (Gaussian model: β_sample² = β_obs² - β_inst²)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# Monshi-Scherrer Transformations: ln(β) = ln(K*λ / D) + ln(1 / cos θ)
x = np.log(1.0 / np.cos(theta_rad))
y = np.log(beta_sample_rad)
`}

# 2. Linear Least-Squares Regression (y = m*x + C)
slope, intercept = np.polyfit(x, y, 1)
r_matrix = np.corrcoef(x, y)
r_squared = r_matrix[0, 1] ** 2

# 3. Extract Mean Crystallite Size D (nm)
# C = ln(K * λ / D_Å) => D_nm = exp(-C) * (K * λ) / 10.0
D_nm = np.exp(-intercept) * (shape_factor_K * wavelength) / 10.0

print("--- MONSHI-SCHERRER ANALYSIS RESULTS ---")
print(f"Regression Slope (m)          : {slope:.6f}")
print(f"Intercept C = ln(K*λ/D)       : {intercept:.6f}")
print(f"Coefficient of Determination R²: {r_squared:.6f}")
print(f"Mean Crystallite Size (D)     : {D_nm:.2f} nm ({D_nm * 10.0:.2f} Å)")

# 4. Plot Monshi-Scherrer Regression Line
plt.figure(figsize=(8, 5))
plt.scatter(x, y, color='#00f2fe', label='Data Points', s=60, zorder=5)
x_fit = np.linspace(min(x) - 0.02, max(x) + 0.02, 100)
plt.plot(x_fit, slope * x_fit + intercept, color='#ff007f', linestyle='--', linewidth=2, label=f'Fit: y = {slope:.4f}x + ({intercept:.4f})')

plt.title('Monshi-Scherrer Plot: ln(β) vs ln(1/cos θ)', fontsize=12, fontweight='bold')
plt.xlabel('ln(1 / cos θ)')
plt.ylabel('ln(β_sample [radians])')
plt.grid(True, linestyle=':', alpha=0.6)
plt.legend()
plt.tight_layout()
plt.show()
`;
    }

    if (lowerMethod.includes('moments') || lowerMethod.includes('variance')) {
      const ranges = Array.isArray(parameters.ranges) ? parameters.ranges : [0.5, 1.0, 1.5, 2.0, 2.5];
      const variances = Array.isArray(parameters.variances) ? parameters.variances : [0.0012, 0.0028, 0.0045, 0.0061, 0.0078];
      return `# =========================================================
# XRD Calculation: Method of Moments (Variance vs Range)
# Wilson / Tournarie Variance Method for Size & Microstrain
# =========================================================

import numpy as np
import matplotlib.pyplot as plt

# Parameters
wavelength = ${wavelength}  # Ångströms

# Integration range Δ(2θ) [deg] and profile variance W [deg²]
ranges_deg = np.array(${JSON.stringify(ranges)})
variances_deg2 = np.array(${JSON.stringify(variances)})

# Convert variance & range to radians
ranges_rad = np.radians(ranges_deg)
variances_rad2 = (np.pi / 180.0)**2 * variances_deg2

# Linear fit: W(rad²) = slope_rad * Δ(2θ_rad) + intercept_rad²
slope_deg, intercept_deg2 = np.polyfit(ranges_deg, variances_deg2, 1)

# Convert slope to radians: rad²/rad = rad
slope_rad = slope_deg * (np.pi / 180.0)
intercept_rad2 = intercept_deg2 * (np.pi / 180.0)**2

# Volume-Weighted Crystallite Size D_V (nm) = (K * λ) / (2 * π² * slope_rad) / 10.0
D_nm = (0.9 * wavelength) / (2.0 * np.pi**2 * max(1e-12, slope_rad)) / 10.0

# RMS Microstrain <e²>^(1/2) = sqrt(intercept_rad²)
rms_strain = np.sqrt(max(0.0, intercept_rad2))

print("--- METHOD OF MOMENTS ANALYSIS RESULTS ---")
print(f"Variance Slope K1 (deg²/deg): {slope_deg:.6e}")
print(f"Variance Intercept W0 (deg²): {intercept_deg2:.6e}")
print(f"Volume-Weighted Size (D_V)  : {D_nm:.2f} nm")
print(f"RMS Microstrain <e²>^(1/2)  : {rms_strain:.6e}")

plt.figure(figsize=(8, 5))
plt.scatter(ranges_deg, variances_deg2, color='#4facfe', label='Measured Moments', s=60)
plt.plot(ranges_deg, slope_deg * ranges_deg + intercept_deg2, 'r--', label='Linear Regression')
plt.xlabel('Range Δ(2θ) [deg]')
plt.ylabel('Variance W [deg²]')
plt.title('Method of Moments: Profile Variance vs Integration Range')
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.show()
`;
    }

    if (lowerMethod.includes('double-voigt') || lowerMethod.includes('voigt')) {
      const hasPrecomputed = xArray && parameters.yCauchy;
      const betaL = parameters.betaL || 0.18;
      const betaG = parameters.betaG || 0.12;

      return `# =========================================================
# XRD Calculation: Double-Voigt Peak Profile Deconvolution
# Langford Size-Strain Deconvolution Scheme
# =========================================================

import numpy as np
import matplotlib.pyplot as plt

wavelength = ${wavelength}  # Ångströms

${hasPrecomputed ? `# Precomputed s vectors and reduced breadths
s = np.array(${JSON.stringify(xArray)})  # s = 2*sin(θ)/λ
beta_C_star = np.array(${JSON.stringify(parameters.yCauchy)})  # β_C* = β_C * cos(θ) / λ
beta_G_star_sq = np.array(${JSON.stringify(parameters.yGaussian)})  # (β_G*)^2

# Cauchy fit: β_C* = 1/D_V + 2*e_C * s
slope_C, intercept_C = np.polyfit(s, beta_C_star, 1)
D_V_nm = (1.0 / max(1e-12, intercept_C)) / 10.0 if intercept_C > 0 else float('nan')
e_C = slope_C / 2.0

# Gaussian fit: (β_G*)^2 = (1 / π D_G)^2 + 8π e_G^2 * s^2
slope_G, intercept_G = np.polyfit(s**2, beta_G_star_sq, 1)
e_G = np.sqrt(max(0.0, slope_G / (8.0 * np.pi)))

print("--- DOUBLE-VOIGT DECONVOLUTION RESULTS ---")
print(f"Cauchy Size D_V             : {D_V_nm:.2f} nm")
print(f"Cauchy Strain e_C           : {e_C:.6e} ({e_C * 100:.4f}%)")
print(f"Gaussian Strain e_G         : {e_G:.6e} ({e_G * 100:.4f}%)")
` : `# Single Peak Deconvolution Approximation
two_theta = ${twoTheta[0] || 38.2}
beta_L_deg = ${betaL}
beta_G_deg = ${betaG}

theta_rad = np.radians(two_theta / 2.0)
beta_L_rad = np.radians(beta_L_deg)
beta_G_rad = np.radians(beta_G_deg)

D_nm = (0.9 * wavelength) / (beta_L_rad * np.cos(theta_rad)) / 10.0
strain = beta_G_rad / (4.0 * np.sin(theta_rad))

print("--- DOUBLE-VOIGT DECONVOLUTION RESULTS ---")
print(f"Lorentzian Breadth β_L      : {beta_L_deg:.4f}° ({beta_L_rad:.6f} rad)")
print(f"Gaussian Breadth β_G        : {beta_G_deg:.4f}° ({beta_G_rad:.6f} rad)")
print(f"Voigt Crystallite Size (D)  : {D_nm:.2f} nm")
print(f"Voigt Microstrain (e)       : {strain:.6e}")
`}
`;
    }

    if (lowerMethod.includes('williamson') || lowerMethod.includes('wh')) {
      const hasPrecomputed = xArray && yArray;

      return `# =========================================================
# XRD Calculation: Williamson-Hall Analysis
# Size & Microstrain Deconvolution Scheme
# =========================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Input Parameters
wavelength = ${wavelength}  # Ångströms
shape_factor_K = ${shapeFactor}

${hasPrecomputed ? `# Precomputed Williamson-Hall coordinates from App Engine
x = np.array(${JSON.stringify(xArray)})  # x = 4 * sin θ
y = np.array(${JSON.stringify(yArray)})  # y = β_sample * cos θ [radians]
` : `# Peak positions 2θ (deg) and observed FWHM β_obs (deg)
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# Convert angles to radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# Subtract instrumental broadening (Gaussian model)
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# Standard Williamson-Hall: β_sample * cos(θ) = K*λ / D + 4 * e * sin(θ)
x = 4.0 * np.sin(theta_rad)
y = beta_sample_rad * np.cos(theta_rad)
`}

# 2. Linear Regression (y = m*x + C)
slope, intercept = np.polyfit(x, y, 1)
r_matrix = np.corrcoef(x, y)
r_squared = r_matrix[0, 1] ** 2

# 3. Microstrain & Size Extraction
microstrain = slope
strain_percent = slope * 100.0
D_nm = (shape_factor_K * wavelength) / intercept / 10.0 if intercept > 0 else float('nan')

print("--- WILLIAMSON-HALL ANALYSIS RESULTS ---")
print(f"Slope (Microstrain e)         : {microstrain:.6e} ({strain_percent:.4f}%)")
print(f"Intercept C = K*λ/D          : {intercept:.6f}")
print(f"Crystallite Size (D)          : {D_nm:.2f} nm")
print(f"Fit Quality (R²)              : {r_squared:.6f}")

# 4. Plot Williamson-Hall Line
plt.figure(figsize=(8, 5))
plt.scatter(x, y, color='#38ef7d', s=60, label='Peak Data', zorder=5)
x_fit = np.linspace(min(x) * 0.9, max(x) * 1.1, 100)
plt.plot(x_fit, slope * x_fit + intercept, 'r--', linewidth=2, label=f'Fit: e = {microstrain:.2e}, R² = {r_squared:.4f}')
plt.xlabel('4 sin(θ)')
plt.ylabel('β_sample cos(θ) [radians]')
plt.title('Williamson-Hall Plot: Size & Strain Separation', fontsize=12, fontweight='bold')
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.show()
`;
    }

    // Default Fallback Generator for Scherrer & General XRD Methods
    return `# =========================================================
# XRD Calculation: ${methodName}
# Standalone Python Analysis Script
# =========================================================

import numpy as np
import matplotlib.pyplot as plt

# 1. Experimental Parameters
wavelength = ${wavelength}  # Ångströms
shape_factor_K = ${shapeFactor}
two_theta_deg = np.array(${JSON.stringify(twoTheta)})
fwhm_obs_deg = np.array(${JSON.stringify(beta)})
fwhm_inst_deg = ${Array.isArray(fwhmInst) ? `np.array(${JSON.stringify(fwhmInst)})` : fwhmInst}

# 2. Conversion to Radians
theta_rad = np.radians(two_theta_deg / 2.0)
beta_obs_rad = np.radians(fwhm_obs_deg)
beta_inst_rad = np.radians(fwhm_inst_deg)

# 3. Instrumental Broadening Subtraction
beta_sample_rad = np.sqrt(np.maximum(1e-12, beta_obs_rad**2 - beta_inst_rad**2))

# 4. Scherrer Crystallite Size D = (K * λ) / (β_sample * cos θ) / 10.0 [nm]
D_nm = (shape_factor_K * wavelength) / (beta_sample_rad * np.cos(theta_rad)) / 10.0

print("--- ${methodName.toUpperCase()} ANALYSIS RESULTS ---")
for i, (tt, b_obs, b_sample, d) in enumerate(zip(two_theta_deg, fwhm_obs_deg, np.degrees(beta_sample_rad), D_nm)):
    print(f"Peak #{i+1}: 2θ = {tt:.2f}°, β_obs = {b_obs:.4f}°, β_sample = {b_sample:.4f}°, Size D = {d:.2f} nm")

print("-" * 55)
print(f"Mean Crystallite Size: {np.mean(D_nm):.2f} nm ± {np.std(D_nm):.2f} nm")
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
    <div className="bg-[#080F1E]/90 rounded-2xl border border-emerald-500/20 overflow-hidden shadow-xl backdrop-blur-md transition-all duration-300">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-500/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-105 transition-transform">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-white">Executable Python Script</h4>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                Executable .py
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              View, run, copy, or download the Python analysis script for {methodName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 group-hover:text-emerald-300 transition-colors">
          <span className="text-xs font-mono hidden sm:inline">{isOpen ? 'Hide Code' : 'View Code'}</span>
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
            <div className="p-3 bg-slate-900/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300 font-mono">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Python 3.x (NumPy / SciPy / Matplotlib)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunPython}
                  disabled={isRunning}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-medium transition-all shadow-md shadow-emerald-500/20"
                >
                  <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                  <span>{isRunning ? 'Running...' : 'Run on Server'}</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .py</span>
                </button>
              </div>
            </div>

            {/* Code Display */}
            <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 bg-[#030712] max-h-96 leading-relaxed select-all">
              <pre className="text-emerald-300 whitespace-pre">{codeString}</pre>
            </div>

            {/* Execution Terminal Output (if ran) */}
            {output && (
              <div className="p-4 border-t border-white/10 bg-black/60 font-mono text-xs">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/10 text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Terminal className="w-3.5 h-3.5" /> Python Console Output (Stdout)
                  </span>
                  <span className={output.exitCode === 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    Exit Code: {output.exitCode}
                  </span>
                </div>

                {output.stdout && (
                  <pre className="text-slate-200 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-white/5">
                    {output.stdout}
                  </pre>
                )}

                {output.stderr && (
                  <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/30 p-3 rounded-lg border border-rose-500/20 mt-2">
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
