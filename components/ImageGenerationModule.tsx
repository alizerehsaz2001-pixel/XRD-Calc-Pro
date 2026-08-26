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
  Compass,
  Check,
  Cpu,
  Code,
  Terminal,
  Play,
  Copy,
  CheckCircle2,
  Ruler,
  Crosshair,
  Atom,
  Activity,
  FileJson,
  Star,
  Share2,
  BookOpen,
  Zap,
  RotateCcw,
  FileText,
  FileCode
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
  aspectRatio?: string;
  isPinned?: boolean;
}

const SCIENTIFIC_STYLES = [
  { id: '3d_schematic', label: '3D Schematic', icon: Box, description: 'Clean 3D models with professional studio lighting' },
  { id: 'sem', label: 'SEM Micrograph', icon: Microscope, description: 'Scanning Electron Microscope style with realistic micro-texturing' },
  { id: 'crystal', label: 'Crystal Lattice', icon: Atom, description: 'Highly accurate atomic ball-and-stick & polyhedra models' },
  { id: 'journal_cover', label: 'Journal Cover', icon: Sparkles, description: 'Nature/Science aesthetic with rich depth & glowing accents' },
  { id: 'watercolor', label: 'Technical Watercolor', icon: Palette, description: 'Artistic textbook illustration with soft watercolor washes' },
  { id: 'diagram', label: 'Minimalist Vector', icon: Layout, description: 'High-contrast, flat publication diagram with clean typography' },
  { id: 'diffraction', label: 'Simulated Pattern', icon: RefreshCw, description: 'Visual representation of SAED rings & Laue spots' },
  { id: 'molecular', label: 'Molecular Orbitals', icon: Activity, description: 'HOMO-LUMO probability clouds and bonding orientations' },
  { id: 'wireframe', label: 'Cyber Wireframe', icon: Grid, description: 'High-tech blueprint with glowing structural vector paths' },
];

const LIGHTING_OPTIONS = [
  { id: 'Daylight Studio Accent', label: 'Daylight Studio Accent' },
  { id: 'Ring Light Shadowless illumination', label: 'Shadowless Ring Light' },
  { id: 'Darkfield High contrast back-glow', label: 'Darkfield Back-Glow' },
  { id: 'Volumetric Transmission Light rays', label: 'Volumetric Ray Transmission' },
  { id: 'X-Ray Spectral fluorescence glow', label: 'X-Ray Fluorescence Glow' },
];

const PERSPECTIVE_OPTIONS = [
  { id: '3-Quarter Isometric Perspective angle', label: '3D Isometric (3/4 View)' },
  { id: 'Orthographic Top-Down crystal plane face', label: 'Orthographic Top-Down (001)' },
  { id: 'Cross-section split structural layer diagram', label: 'Cross-Section Layer Split' },
  { id: 'Extreme macro zoom scientific magnifying lens', label: 'Atomic Resolution Macro' },
  { id: 'High angle schematic wide-view core view', label: 'Wide Structural Overview' },
];

const COLOR_SCHEME_OPTIONS = [
  { id: 'Teal-Indigo academic journal style', label: 'Teal & Indigo Academic' },
  { id: 'Monochrome high-resolution electron micrograph textured', label: 'SEM Grayscale Monochrome' },
  { id: 'Thermal spectral heat mapping potential energy scale', label: 'Thermal Potential Energy Scale' },
  { id: 'Classic textbook color palette clean off-white canvas', label: 'Classic Textbook Canvas' },
  { id: 'Neon cybernetic blueprint tech matrix highlight', label: 'Cyber Matrix Blueprint' },
];

const ASPECT_RATIO_OPTIONS: { id: '1:1' | '16:9' | '4:3' | '3:4'; label: string; desc: string }[] = [
  { id: '1:1', label: '1:1 Square', desc: 'Paper Figure Panel' },
  { id: '16:9', label: '16:9 Landscape', desc: 'Slide Presentation / Hero' },
  { id: '4:3', label: '4:3 Standard', desc: 'Journal Article Card' },
  { id: '3:4', label: '3:4 Portrait', desc: 'Poster / Cover Page' },
];

const MATERIAL_PRESETS = [
  { 
    name: "SrTiO3 (Perovskite)", 
    formula: "SrTiO3", 
    prompt: "A realistic 3D representation of the cubic SrTiO3 perovskite crystal unit cell, showcasing titanium atoms inside corner-sharing TiO6 octahedra with strontium cations situated at the corners, professional academic studio lighting.",
    style: "crystal"
  },
  { 
    name: "CsPbI3 (Lead Halide)", 
    formula: "CsPbI3", 
    prompt: "Atomic 3D structural model of inorganic perovskite CsPbI3 showing octahedral tilting of PbI6 corner-sharing cages surrounding central Cs cations, high resolution scientific illustration.",
    style: "crystal"
  },
  { 
    name: "MoS2 (TMD Monolayer)", 
    formula: "MoS2", 
    prompt: "Atomically thin 2D monolayer of molybdenum disulfide MoS2 with a trigonal prismatic coordination geometry, sulfur atoms sandwiched around central molybdenum atoms with van der Waals gap highlighted.",
    style: "3d_schematic"
  },
  { 
    name: "Graphene Honeycomb", 
    formula: "C (sp2)", 
    prompt: "Single-atom-thick hexagonal honeycomb lattice of graphene showing delocalized pi electron density clouds above and below the carbon ring plane, high-tech cybernetic visualization.",
    style: "molecular"
  },
  { 
    name: "YBCO Superconductor", 
    formula: "YBa2Cu3O7", 
    prompt: "Layered crystal structure of YBCO high-temperature superconductor highlighting conducting CuO2 planes, oxygen vacancy sites, and copper-oxygen chains, labeled crystallographic axes.",
    style: "journal_cover"
  },
  { 
    name: "TiO2 (Rutile)", 
    formula: "TiO2", 
    prompt: "Tetragonal unit cell of Rutile TiO2 featuring edge-sharing TiO6 octahedral chains extending along the c-axis with titanium cations in red and oxygen anions in blue.",
    style: "diagram"
  },
  { 
    name: "Bragg Diffraction Ray", 
    formula: "nλ = 2d sinθ", 
    prompt: "Incident and reflected monochromatic X-ray wave vectors reflecting off crystalline lattice planes, illustrating Bragg's Law with constructive phase interference and path length difference 2d sin(theta).",
    style: "3d_schematic"
  },
  { 
    name: "TiO2 Nanotube SEM", 
    formula: "SEM Topography", 
    prompt: "High-magnification Scanning Electron Micrograph (SEM) of self-assembled vertical TiO2 nanotube array with porous tubular wall microstructures, realistic grayscale electron beam contrast.",
    style: "sem"
  }
];

const CATEGORIZED_CONCEPTS = {
  lattices: [
    { label: "Perovskite ABO3 unit cell showcasing corner-sharing TiO6 octahedra with clear metallic bonds", desc: "Perovskite Unit Cell" },
    { label: "Face-Centered Cubic (FCC) copper unit cell highlighting interstitial octahedral spaces", desc: "FCC Unit Cell" },
    { label: "Hexagonal Close-Packed (HCP) unit cell showing planar layer stacking ABAB sequence", desc: "HCP Stacking" },
    { label: "Misfit grain boundary dislocation loop crystal plane misalignment schematic with burger vector", desc: "Grain Boundary Dislocation" },
  ],
  experimental: [
    { label: "Symmetric Bragg-Brentano XRD diffractometer configuration showing X-ray tube, sample goniometer, and detector pathway", desc: "Diffractometer Geometry" },
    { label: "Incident x-ray beam reflecting on atomic lattice planes confirming Bragg's Law with phase constructive interference", desc: "Bragg Diffraction Geometry" },
    { label: "Atomic force microscopy (AFM) cantilever tip scanning over molecular surface topography", desc: "AFM Scan Probe" },
    { label: "Transmission electron microscope (TEM) optics column showing magnetic objective lens ray pathways", desc: "TEM Ray Trace Optics" },
  ],
  micrographs: [
    { label: "HRTEM view showing high-resolution atomic columns in silicon crystal lattice plane", desc: "Atomic HRTEM Silicon" },
    { label: "Scanning Electron Micrograph (SEM) of vertically self-assembled TiO2 hollow nanotubes", desc: "TiO2 Nanotubes SEM" },
    { label: "Selected Area Electron Diffraction (SAED) concentric ring spot diffraction pattern with zone axis", desc: "SAED Ring Pattern" },
    { label: "Topographical height profiling image showcasing layered graphite micro-flakes with atomic step edges", desc: "Graphite Micro-Flakes" },
  ]
};

const MATPLOTLIB_PRESETS = [
  {
    id: 'xrd_diffractogram',
    label: 'XRD Scan Sim',
    description: 'Lorentzian powder peak profile with Miller indices & background fit',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Define simulated diffraction peaks (2theta, intensity, FWHM, Miller hkl)
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

# Add exponential background & thermal noise
background = 5 + 10 * np.exp(-two_theta/40)
noise = np.random.normal(0, 1.2, len(two_theta))
total_intensity = intensity + background + np.abs(noise)

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Plot peak scans
ax.plot(two_theta, total_intensity, color='#38bdf8', linewidth=1.6, label='Observed Data (Cu Kα)')
ax.plot(two_theta, background, color='#64748b', linestyle='--', linewidth=1.0, label='Background Fit')

# Annotate crystallographic Miller peaks
for p in peaks:
    ax.annotate(f"({p['hkl']})", 
                xy=(p["2theta"], p["I"] + 10), 
                xytext=(p["2theta"], p["I"] + 25),
                ha='center', fontsize=8.5, color='#f59e0b', fontweight='bold',
                arrowprops=dict(arrowstyle="->", color='#f59e0b', alpha=0.7, lw=1.0))

ax.set_title("Simulated XRD Powder Diffractogram (Lorentzian Fit)", color='#f1f5f9', fontsize=12, fontweight='bold', pad=14)
ax.set_xlabel("Diffraction Angle 2θ (degrees)", color='#94a3b8', fontsize=9.5)
ax.set_ylabel("Intensity (Arbitrary Units)", color='#94a3b8', fontsize=9.5)
ax.tick_params(colors='#94a3b8', labelsize=8.5)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.6)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: '3d_unit_cell',
    label: '3D Ball & Stick Cell',
    description: '3D Matplotlib crystal unit cell representation with atomic radii',
    code: `import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

fig = plt.figure(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax = fig.add_subplot(111, projection='3d')
ax.set_facecolor('#0f172a')

# Perovskite ABO3 cubic corner & center coordinates
corners = np.array([
    [0,0,0], [1,0,0], [1,1,0], [0,1,0],
    [0,0,1], [1,0,1], [1,1,1], [0,1,1]
])

center_ti = np.array([[0.5, 0.5, 0.5]])

faces_o = np.array([
    [0.5, 0.5, 0], [0.5, 0.5, 1],
    [0.5, 0, 0.5], [0.5, 1, 0.5],
    [0, 0.5, 0.5], [1, 0.5, 0.5]
])

# Draw Sr cations (corners)
ax.scatter(corners[:,0], corners[:,1], corners[:,2], color='#38bdf8', s=220, edgecolors='#ffffff', label='Sr (Corners)', depthshade=True)

# Draw Ti cation (center)
ax.scatter(center_ti[:,0], center_ti[:,1], center_ti[:,2], color='#f59e0b', s=260, edgecolors='#ffffff', label='Ti (Center)', depthshade=True)

# Draw O anions (faces)
ax.scatter(faces_o[:,0], faces_o[:,1], faces_o[:,2], color='#f43f5e', s=140, edgecolors='#ffffff', label='O (Faces)', depthshade=True)

# Draw unit cell frame edges
edges = [
    ([0,1],[0,0],[0,0]), ([1,1],[0,1],[0,0]), ([1,0],[1,1],[0,0]), ([0,0],[1,0],[0,0]),
    ([0,1],[0,0],[1,1]), ([1,1],[0,1],[1,1]), ([1,0],[1,1],[1,1]), ([0,0],[1,0],[1,1]),
    ([0,0],[0,0],[0,1]), ([1,1],[0,0],[0,1]), ([1,1],[1,1],[0,1]), ([0,0],[1,1],[0,1])
]
for p1, p2, p3 in edges:
    ax.plot(p1, p2, p3, color='#475569', linestyle='-', linewidth=1.2)

# Draw TiO6 octahedral bonds
for o in faces_o:
    ax.plot([0.5, o[0]], [0.5, o[1]], [0.5, o[2]], color='#f59e0b', linestyle=':', linewidth=1.5, alpha=0.8)

ax.set_title("3D Cubic Perovskite SrTiO3 Unit Cell", color='#f1f5f9', fontsize=12, fontweight='bold', pad=10)
ax.set_xlabel("a (Å)", color='#94a3b8', fontsize=8)
ax.set_ylabel("b (Å)", color='#94a3b8', fontsize=8)
ax.set_zlabel("c (Å)", color='#94a3b8', fontsize=8)
ax.tick_params(colors='#94a3b8', labelsize=7)
ax.xaxis.pane.fill = False
ax.yaxis.pane.fill = False
ax.zaxis.pane.fill = False
ax.xaxis.pane.set_edgecolor('#1e293b')
ax.yaxis.pane.set_edgecolor('#1e293b')
ax.zaxis.pane.set_edgecolor('#1e293b')
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8, loc='upper left')
`
  },
  {
    id: 'rietveld_diff',
    label: 'Rietveld Refinement',
    description: 'Observed vs calculated pattern with difference curve Y_obs - Y_calc',
    code: `import numpy as np
import matplotlib.pyplot as plt

two_theta = np.linspace(20, 80, 800)

# Generate observed data
y_obs = 100 * np.exp(-((two_theta-28.5)/0.4)**2) + 70 * np.exp(-((two_theta-47.3)/0.5)**2) + 40 * np.exp(-((two_theta-56.1)/0.5)**2) + 15
y_obs += np.random.normal(0, 1.5, len(two_theta))

# Generate calculated model (slightly smoothed fit)
y_calc = 98 * np.exp(-((two_theta-28.52)/0.41)**2) + 68 * np.exp(-((two_theta-47.28)/0.49)**2) + 39 * np.exp(-((two_theta-56.12)/0.51)**2) + 15

diff = y_obs - y_calc - 20 # shifted down for visibility

bragg_positions = [28.5, 47.3, 56.1, 69.1, 76.4]

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Plot Observed, Calculated, Difference
ax.plot(two_theta, y_obs, 'o', color='#38bdf8', markersize=2.5, alpha=0.7, label='Y_obs (Experimental)')
ax.plot(two_theta, y_calc, color='#f43f5e', linewidth=1.5, label='Y_calc (Rietveld Fit)')
ax.plot(two_theta, diff, color='#10b981', linewidth=1.2, label='Y_obs - Y_calc (Diff)')

# Bragg peak position tick marks
ax.vlines(bragg_positions, -25, -15, color='#f59e0b', linewidth=1.5, label='Bragg Reflections')

ax.axhline(-20, color='#334155', linestyle=':', linewidth=0.8)

ax.set_title("Rietveld Powder Pattern Whole Profile Fitting", color='#f1f5f9', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel("2θ Angle (°)", color='#94a3b8', fontsize=9)
ax.set_ylabel("Counts / Intensity", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.5)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8, loc='upper right')
for spine in ax.spines.values():
    spine.set_color('#334155')

output_data = {
    "R_wp": "4.82%",
    "R_p": "3.51%",
    "chi_squared": 1.28
}
`
  },
  {
    id: 'williamson_hall',
    label: 'Williamson-Hall & UDM',
    description: 'Linear strain regression with microstrain & crystallite size deconvolution',
    code: `import numpy as np
import matplotlib.pyplot as plt

# Diffraction angle 2theta (degrees) and FWHM beta (radians)
two_theta_deg = np.array([28.44, 47.30, 56.12, 69.13, 76.38, 88.03, 94.95])
fwhm_deg = np.array([0.22, 0.29, 0.35, 0.44, 0.50, 0.61, 0.69])
hkl_labels = ['(111)', '(220)', '(311)', '(400)', '(331)', '(422)', '(511)']

theta_rad = np.radians(two_theta_deg / 2.0)
beta_rad = np.radians(fwhm_deg)
wavelength = 1.54056 # Cu K-alpha in Angstroms
K = 0.94 # Scherrer shape factor

# Williamson-Hall UDM: beta*cos(theta) = K*lambda/D + 4*epsilon*sin(theta)
x_data = 4 * np.sin(theta_rad)
y_data = beta_rad * np.cos(theta_rad)

# Linear regression
slope, intercept = np.polyfit(x_data, y_data, 1)
r_matrix = np.corrcoef(x_data, y_data)
r_squared = r_matrix[0, 1]**2

crystallite_size_ang = (K * wavelength) / max(intercept, 1e-6)
crystallite_size_nm = crystallite_size_ang / 10.0
microstrain_percent = slope * 100

x_fit = np.linspace(min(x_data)*0.9, max(x_data)*1.05, 100)
y_fit = slope * x_fit + intercept

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Plot data points and fit line
ax.scatter(x_data, y_data, color='#38bdf8', s=90, edgecolors='#ffffff', zorder=5, label='Diffraction Reflections')
ax.plot(x_fit, y_fit, color='#f43f5e', linewidth=2.0, linestyle='-', label=f'UDM Fit (R² = {r_squared:.4f})')

# Annotations
for i, hkl in enumerate(hkl_labels):
    ax.annotate(hkl, (x_data[i], y_data[i]), textcoords="offset points", xytext=(0, 10),
                ha='center', fontsize=8, color='#f59e0b', fontweight='bold')

# Metrics card inside plot
stats_text = (f"Crystallite Size (D): {crystallite_size_nm:.2f} nm\\n"
              f"Microstrain (ε): {microstrain_percent:.3f} %\\n"
              f"Intercept: {intercept:.4e} rad\\n"
              f"Slope (ε): {slope:.4e}")
ax.text(0.04, 0.94, stats_text, transform=ax.transAxes, fontsize=8.5,
        verticalalignment='top', bbox=dict(boxstyle='round,pad=0.6', facecolor='#1e293b', edgecolor='#334155', alpha=0.9),
        color='#f1f5f9', fontfamily='monospace')

ax.set_title("Williamson-Hall Uniform Deformation Model (UDM)", color='#f1f5f9', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel("4 sin(θ)", color='#94a3b8', fontsize=9.5)
ax.set_ylabel("β cos(θ) (rad)", color='#94a3b8', fontsize=9.5)
ax.tick_params(colors='#94a3b8', labelsize=8.5)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.6)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5, loc='lower right')
for spine in ax.spines.values():
    spine.set_color('#334155')

output_data = {
    "crystallite_size_nm": round(float(crystallite_size_nm), 2),
    "microstrain_percent": round(float(microstrain_percent), 4),
    "r_squared": round(float(r_squared), 4)
}
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

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

# Contour Plotting
contour = ax.contourf(QX, QZ, Z, levels=16, cmap='turbo')
cbar = fig.colorbar(contour, ax=ax)
cbar.set_label('Log Intensity (I)', color='#94a3b8', fontsize=9)
cbar.ax.tick_params(labelsize=8, colors='#94a3b8')

ax.text(sub_x + 0.002, sub_z, 'Substrate (004)', color='#ffffff', fontsize=8.5, fontweight='bold')
ax.text(layer_x + 0.002, layer_z, 'Epilayer (Strained)', color='#ffffff', fontsize=8.5, fontweight='bold')

ax.set_title("Reciprocal Space Mapping (RSM) Contours", color='#f1f5f9', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel("$Q_x$ (r.l.u.)", color='#94a3b8', fontsize=9)
ax.set_ylabel("$Q_z$ (r.l.u.)", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
ax.grid(True, color='#ffffff', linestyle=':', alpha=0.15)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'debye_rings',
    label: '2D Debye-Scherrer Rings',
    description: '2D Area detector diffraction rings with beamstop and texture',
    code: `import numpy as np
import matplotlib.pyplot as plt

grid_size = 400
y, x = np.ogrid[-grid_size/2:grid_size/2, -grid_size/2:grid_size/2]
r = np.sqrt(x**2 + y**2)
phi = np.arctan2(y, x)

# Ring radii corresponding to 2theta projections
ring_radii = [45, 78, 112, 142, 168, 195]
ring_intensities = [100, 75, 45, 35, 20, 15]
ring_widths = [1.8, 2.2, 2.5, 2.8, 3.2, 3.5]

image = np.zeros((grid_size, grid_size))

# Add rings with slight elliptical texture and azimuthal variation
for r0, amp, w in zip(ring_radii, ring_intensities, ring_widths):
    texture = 1 + 0.15 * np.cos(4 * phi)
    ring_profile = amp * texture * np.exp(-((r - r0) / w)**2)
    image += ring_profile

# Add beamstop shadow and diffuse air scatter
beamstop_mask = (r < 18) | ((np.abs(x) < 4) & (y < 0))
air_scatter = 30 * np.exp(-r / 60)
noise = np.random.poisson(np.clip(image + air_scatter + 5, 0, None))
noise[beamstop_mask] = 0

fig, ax = plt.subplots(figsize=(6.5, 5.5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

im = ax.imshow(noise, cmap='inferno', origin='lower', extent=[-10, 10, -10, 10])
cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
cbar.set_label('Photon Counts', color='#94a3b8', fontsize=9)
cbar.ax.tick_params(labelsize=8, colors='#94a3b8')

# Ring labels
for r0, hkl in zip(ring_radii, ['(111)', '(200)', '(220)', '(311)', '(222)', '(400)']):
    r_mm = r0 * (20.0 / grid_size)
    ax.annotate(hkl, (r_mm*np.cos(np.pi/4), r_mm*np.sin(np.pi/4)),
                color='#38bdf8', fontsize=7.5, fontweight='bold',
                bbox=dict(boxstyle='circle,pad=0.2', facecolor='#0f172a', alpha=0.7, edgecolor='none'))

ax.set_title("2D Debye-Scherrer Diffraction Rings (Area Detector)", color='#f1f5f9', fontsize=11.5, fontweight='bold', pad=12)
ax.set_xlabel("Detector X (cm)", color='#94a3b8', fontsize=9)
ax.set_ylabel("Detector Y (cm)", color='#94a3b8', fontsize=9)
ax.tick_params(colors='#94a3b8', labelsize=8)
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'pair_distribution',
    label: 'Pair Distribution G(r)',
    description: 'Atomic pair correlation function G(r) with radial shell peaks',
    code: `import numpy as np
import matplotlib.pyplot as plt

r = np.linspace(0.5, 12, 1000)

# Atomic shells in FCC lattice (r in Angstroms)
shells = [
    {"r0": 2.86, "amp": 4.8, "w": 0.12, "label": "1st Shell (12 CN)"},
    {"r0": 4.05, "amp": 2.4, "w": 0.16, "label": "2nd Shell (6 CN)"},
    {"r0": 4.96, "amp": 4.2, "w": 0.18, "label": "3rd Shell (24 CN)"},
    {"r0": 5.73, "amp": 1.9, "w": 0.20, "label": "4th Shell (12 CN)"},
    {"r0": 6.40, "amp": 3.6, "w": 0.22, "label": "5th Shell (24 CN)"},
    {"r0": 7.02, "amp": 1.5, "w": 0.24, "label": "6th Shell (8 CN)"}
]

gr = np.zeros_like(r)
for s in shells:
    gr += s["amp"] * np.exp(-((r - s["r0"])/s["w"])**2)

# Add Fourier truncation ripples & baseline
damped_sine = -4 * np.pi * 0.085 * r + 0.15 * np.sin(25 * r) * np.exp(-r/4)
total_gr = gr + damped_sine

fig, ax = plt.subplots(figsize=(7, 5))
fig.patch.set_facecolor('#0f172a')
ax.set_facecolor('#0f172a')

ax.plot(r, total_gr, color='#38bdf8', linewidth=1.8, label='Experimental G(r)')
ax.plot(r, -4 * np.pi * 0.085 * r, color='#64748b', linestyle='--', linewidth=1.0, label='-4πρ₀r Baseline')
ax.axhline(0, color='#334155', linestyle=':', linewidth=0.8)

# Highlight first 3 atomic coordination shells
for i, s in enumerate(shells[:3]):
    ax.annotate(f"{s['r0']} Å\\n{s['label']}", xy=(s['r0'], s['amp'] - 1.5),
                xytext=(s['r0'], s['amp'] + 1.2),
                ha='center', fontsize=7.5, color='#f59e0b', fontweight='bold',
                arrowprops=dict(arrowstyle="->", color='#f59e0b', alpha=0.7, lw=0.9))

ax.set_title("Atomic Pair Distribution Function G(r) Deconvolution", color='#f1f5f9', fontsize=12, fontweight='bold', pad=12)
ax.set_xlabel("Interatomic Distance r (Å)", color='#94a3b8', fontsize=9.5)
ax.set_ylabel("G(r) (Å⁻²)", color='#94a3b8', fontsize=9.5)
ax.tick_params(colors='#94a3b8', labelsize=8.5)
ax.grid(True, color='#1e293b', linestyle='--', alpha=0.6)
ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#e2e8f0', fontsize=8.5, loc='lower left')
for spine in ax.spines.values():
    spine.set_color('#334155')
`
  },
  {
    id: 'waterfall_temp',
    label: 'In-Situ Phase Waterfall',
    description: 'Multi-temperature 3D stacked diffractograms (25°C to 900°C)',
    code: `import numpy as np
import matplotlib.pyplot as plt

two_theta = np.linspace(25, 45, 600)
temperatures = [25, 150, 300, 450, 600, 750, 900] # deg C

fig = plt.figure(figsize=(7.5, 5.5))
fig.patch.set_facecolor('#0f172a')
ax = fig.add_subplot(111, projection='3d')
ax.set_facecolor('#0f172a')

colors = plt.cm.plasma(np.linspace(0.15, 0.95, len(temperatures)))

for idx, (temp, col) in enumerate(zip(temperatures, colors)):
    shift = 0.0015 * (temp - 25)
    peak1 = 80 * np.exp(-((two_theta - (31.5 - shift))/0.3)**2)
    peak2 = 45 * np.exp(-((two_theta - (36.2 - shift*1.2))/0.35)**2)
    
    if temp >= 600:
        peak1 = 110 * np.exp(-((two_theta - (31.4 - shift))/0.4)**2)
        peak2 = 30 * np.exp(-((two_theta - (36.0 - shift*1.2))/0.4)**2)

    bg = 5 + np.random.normal(0, 0.8, len(two_theta))
    intensity = peak1 + peak2 + bg

    ax.plot(two_theta, np.full_like(two_theta, temp), intensity, color=col, linewidth=1.6)

ax.set_title("In-Situ High-Temperature XRD Phase Evolution (25°C - 900°C)", color='#f1f5f9', fontsize=11, fontweight='bold', pad=14)
ax.set_xlabel("2θ (°)", color='#94a3b8', fontsize=8.5)
ax.set_ylabel("Temperature (°C)", color='#94a3b8', fontsize=8.5)
ax.set_zlabel("Intensity (Counts)", color='#94a3b8', fontsize=8.5)
ax.tick_params(colors='#94a3b8', labelsize=7.5)
ax.xaxis.pane.fill = False
ax.yaxis.pane.fill = False
ax.zaxis.pane.fill = False
ax.xaxis.pane.set_edgecolor('#1e293b')
ax.yaxis.pane.set_edgecolor('#1e293b')
ax.zaxis.pane.set_edgecolor('#1e293b')
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
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '4:3' | '3:4'>('1:1');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Advanced Canvas Overlays
  const [canvasBg, setCanvasBg] = useState<'slate' | 'white' | 'black' | 'grid'>('slate');
  const [showScaleBar, setShowScaleBar] = useState<boolean>(false);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(false);
  const [scaleLength, setScaleLength] = useState<string>('5 Å');
  const [fullscreenModal, setFullscreenModal] = useState<boolean>(false);

  // Advanced Tuning States
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
  const [matplotlibDpi, setMatplotlibDpi] = useState<number>(200);
  const [matplotlibTheme, setMatplotlibTheme] = useState<'custom' | 'dark' | 'publication_nature' | 'academic_light' | 'transparent'>('custom');
  const [figuresList, setFiguresList] = useState<Array<{ figureId: number; png: string; svg: string; svgDataUrl: string; pdf?: string; widthInches: number; heightInches: number; dpi: number }>>([]);
  const [activeFigureIdx, setActiveFigureIdx] = useState<number>(0);
  const [activeTabMode, setActiveTabMode] = useState<'raster' | 'svg' | 'metadata'>('raster');
  const [executionMetadata, setExecutionMetadata] = useState<any>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [primarySvg, setPrimarySvg] = useState<string | null>(null);
  const [primaryPdf, setPrimaryPdf] = useState<string | null>(null);
  const [copiedSvg, setCopiedSvg] = useState<boolean>(false);

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

      const styleLabel = SCIENTIFIC_STYLES.find(s => s.id === selectedStyle)?.label;
      const result = await generateScientificImage(prompt, size, styleLabel, aspectRatio);
      
      if (result) {
        setImageUrl(result);
        const newRecord: GenerationRecord = {
          id: Date.now().toString(),
          prompt: prompt,
          url: result,
          timestamp: Date.now(),
          style: selectedStyle,
          aspectRatio: aspectRatio
        };
        setHistory([newRecord, ...history].slice(0, 20));
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

  const handleResetCode = () => {
    const preset = MATPLOTLIB_PRESETS.find(p => p.id === selectedPreset) || MATPLOTLIB_PRESETS[0];
    setPythonCode(preset.code);
    setPythonError(null);
    setPythonLog("# Script reset to baseline template.");
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
      setPythonLog("# AI generated script successfully loaded into Python environment.");
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
        body: JSON.stringify({
          code: pythonCode,
          dpi: matplotlibDpi,
          theme: matplotlibTheme,
          transparent: matplotlibTheme === 'transparent',
          format: 'both'
        })
      });

      const resData = await response.json();
      if (resData.success && (resData.image || (resData.figures && resData.figures.length > 0))) {
        const figs = resData.figures && resData.figures.length > 0 
          ? resData.figures 
          : [{
              figureId: 1,
              png: resData.image,
              svg: resData.svg || '',
              svgDataUrl: resData.svg ? "data:image/svg+xml;utf8," + encodeURIComponent(resData.svg) : '',
              pdf: resData.pdf || null,
              widthInches: 7,
              heightInches: 5,
              dpi: resData.dpi || matplotlibDpi
            }];
        
        setFiguresList(figs);
        setActiveFigureIdx(0);
        setImageUrl(figs[0]?.png || resData.image);
        setPrimarySvg(figs[0]?.svg || resData.svg || null);
        setPrimaryPdf(figs[0]?.pdf || resData.pdf || null);
        setExecutionMetadata(resData.metadata || null);
        setExecutionTimeMs(resData.executionTimeMs || null);
        setPythonLog(resData.stdout || null);

        const newRecord: GenerationRecord = {
          id: Date.now().toString(),
          prompt: `Python Matplotlib: ${MATPLOTLIB_PRESETS.find(p => p.id === selectedPreset)?.label || 'Custom'} (${matplotlibDpi} DPI, ${matplotlibTheme})`,
          url: figs[0]?.png || resData.image,
          timestamp: Date.now(),
          style: 'matplotlib_plot',
          aspectRatio: '4:3'
        };
        setHistory([newRecord, ...history].slice(0, 20));
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

  const handleDownloadSvg = () => {
    const activeFig = figuresList[activeFigureIdx];
    const svgData = activeFig?.svg || primarySvg;
    if (!svgData) return;
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `matplotlib-vector-figure-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = () => {
    const activeFig = figuresList[activeFigureIdx];
    const pdfData = activeFig?.pdf || primaryPdf;
    if (!pdfData) return;
    const link = document.createElement('a');
    link.href = pdfData;
    link.download = `matplotlib-publication-figure-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySvg = () => {
    const activeFig = figuresList[activeFigureIdx];
    const svgData = activeFig?.svg || primarySvg;
    if (!svgData) return;
    navigator.clipboard.writeText(svgData);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleCopyPrompt = () => {
    if (!prompt) return;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCopyCode = () => {
    if (!pythonCode) return;
    navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExportMetadata = () => {
    const metadata = {
      app: "Bragg-Engine Scientific Illustrator",
      engine: illustratorMode === 'neural' ? 'Nano Banana 2 (gemini-3.1-flash-image)' : 'Python Matplotlib',
      prompt: prompt,
      style: selectedStyle,
      aspectRatio: aspectRatio,
      resolution: size,
      timestamp: new Date().toISOString(),
      script: illustratorMode === 'matplotlib' ? pythonCode : undefined
    };
    const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `figure-metadata-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const togglePinHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.map(item => item.id === id ? { ...item, isPinned: !item.isPinned } : item));
  };

  const clearHistory = () => {
    if (confirm("Clear all generation history?")) {
      setHistory([]);
    }
  };

  const applyMaterialPreset = (preset: typeof MATERIAL_PRESETS[0]) => {
    setPrompt(preset.prompt);
    setSelectedStyle(preset.style);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Mode Switcher Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 px-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-indigo-500/20 border border-fuchsia-500/30">
            <Sparkles className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Scientific Illustrator & Plotter Studio
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Publication-grade crystallography schematics, unit cell lattices & 2D/3D Python figures
            </p>
          </div>
        </div>

        {pythonFeaturesEnabled && (
          <div className="bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex max-w-md shadow-inner border border-slate-200 dark:border-slate-850">
            <button
              onClick={() => { setIllustratorMode('neural'); setError(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                illustratorMode === 'neural'
                  ? 'bg-fuchsia-600 text-white shadow-md shadow-fuchsia-500/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Nano Banana 2 (Gemini 3.1)
            </button>
            <button
              onClick={() => { setIllustratorMode('matplotlib'); setError(null); }}
              className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${
                illustratorMode === 'matplotlib'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Python Plotter
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Configuration Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {illustratorMode === 'neural' ? (
                  <>
                    <ImageIcon className="h-5 w-5 text-fuchsia-600" />
                    Neural Illustration Engine
                  </>
                ) : (
                  <>
                    <Cpu className="h-5 w-5 text-indigo-500" />
                    Python Matplotlib Kernel
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {illustratorMode === 'neural' 
                  ? 'Generates high-fidelity structural & experimental diagrams' 
                  : 'Executes analytical Python scripts to plot 2D/3D figures'}
              </p>
            </div>

            <div className="p-5 space-y-5">
              {illustratorMode === 'neural' ? (
                <>
                  {/* Material Structure Shortcuts */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Structure Presets (CIF & Formulas)</span>
                      <BookOpen size={11} className="text-fuchsia-500" />
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {MATERIAL_PRESETS.map((m, idx) => (
                        <button
                          key={idx}
                          onClick={() => applyMaterialPreset(m)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-fuchsia-500/10 hover:border-fuchsia-500/30 border border-slate-200 dark:border-slate-700 rounded-lg text-[9.5px] font-bold text-slate-700 dark:text-slate-300 transition-all"
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

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
                      placeholder="e.g. A realistic 3D representation of the perovskite crystal structure with labeled TiO6 octahedra..."
                      className="w-full h-28 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 outline-none transition-all text-xs leading-relaxed"
                    />
                    
                    <div className="mt-2">
                      <div className="flex gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2">
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
                            className="text-left text-[9px] font-bold bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 p-2 rounded-xl transition-all border border-slate-200 dark:border-slate-800 hover:border-fuchsia-300 dark:hover:border-fuchsia-800 line-clamp-2 h-[38px] leading-snug flex items-center"
                          >
                            {item.desc}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Styles Grid */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Visual Style Preset
                    </label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {SCIENTIFIC_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all text-left ${
                            selectedStyle === style.id
                              ? 'bg-fuchsia-50 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:border-fuchsia-800'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-fuchsia-200 dark:hover:border-fuchsia-800'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            selectedStyle === style.id ? 'bg-fuchsia-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            <style.icon size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-bold ${selectedStyle === style.id ? 'text-fuchsia-900 dark:text-fuchsia-100' : 'text-slate-700 dark:text-slate-200'}`}>
                              {style.label}
                            </p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{style.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio Selector */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Canvas Aspect Ratio
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {ASPECT_RATIO_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setAspectRatio(opt.id)}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            aspectRatio === opt.id
                              ? 'bg-fuchsia-50 border-fuchsia-300 dark:bg-fuchsia-900/20 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <div className="text-[10px] font-black">{opt.id}</div>
                          <div className="text-[8px] opacity-70 truncate">{opt.desc.split(' ')[0]}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Advanced Core Tuning */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-3.5 w-3.5 text-fuchsia-500" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Advanced Core Tuning</span>
                    </div>
                    
                    <div className="space-y-2 pl-1">
                      {/* Lighting dropdown */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Sun size={10} /> Studio Lighting
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
                          <Compass size={10} /> Camera Angle / Axis
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
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => setAddAnnotations(!addAnnotations)}
                          className={`py-1.5 px-2 rounded-xl text-[9px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                            addAnnotations 
                              ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                              : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {addAnnotations && <Check size={10} />} Labels Overlay
                        </button>
                        <button
                          onClick={() => setAddGridLines(!addGridLines)}
                          className={`py-1.5 px-2 rounded-xl text-[9px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                            addGridLines 
                              ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                              : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {addGridLines && <Check size={10} />} Grid Nodes
                        </button>
                        <button
                          onClick={() => setAddForceVectors(!addForceVectors)}
                          className={`col-span-2 py-1.5 px-2 rounded-xl text-[9px] font-bold uppercase transition-all border text-center flex items-center justify-center gap-1 ${
                            addForceVectors 
                              ? 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-600 dark:text-fuchsia-400' 
                              : 'bg-black/10 border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-300'
                          }`}
                        >
                          {addForceVectors && <Check size={10} />} Crystallographic Force Vectors
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Resolution & Settings */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Resolution</span>
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
                      className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group
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
                          Render Scientific Illustration
                        </>
                      )}
                    </button>

                    {error && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 p-3 bg-red-50 dark:bg-red-400/10 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-medium border border-red-100 dark:border-red-900/50 flex gap-2"
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
                      className="w-full h-20 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-xs leading-relaxed"
                    />
                  </div>

                  {/* Presets Selection */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Grid size={11} className="text-indigo-400" />
                      Analytical Python Templates ({MATPLOTLIB_PRESETS.length})
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {MATPLOTLIB_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`text-left p-2 rounded-xl border transition-all ${
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

                  {/* Rendering Parameter Controls: DPI & Theme */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Resolution (DPI)
                      </label>
                      <select
                        value={matplotlibDpi}
                        onChange={(e) => setMatplotlibDpi(Number(e.target.value))}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value={150}>150 DPI (Fast)</option>
                        <option value={200}>200 DPI (Standard)</option>
                        <option value={300}>300 DPI (Journal / Nature)</option>
                        <option value={600}>600 DPI (Ultra Vector)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        Figure Theme
                      </label>
                      <select
                        value={matplotlibTheme}
                        onChange={(e) => setMatplotlibTheme(e.target.value as any)}
                        className="w-full text-xs bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 p-2 rounded-xl border border-slate-200 dark:border-slate-800 outline-none focus:border-indigo-500 font-bold"
                      >
                        <option value="custom">Script-Defined</option>
                        <option value="publication_nature">Nature / White</option>
                        <option value="dark">Dark Lab / Slate</option>
                        <option value="academic_light">Academic Light</option>
                        <option value="transparent">Transparent PNG</option>
                      </select>
                    </div>
                  </div>

                  {/* Raw Python code editor */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Code size={11} className="text-indigo-400" />
                        Kernel Source (.py)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleResetCode}
                          className="text-[9px] font-bold text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                          title="Reset to preset template"
                        >
                          <RotateCcw size={10} />
                          Reset
                        </button>
                        <button
                          onClick={handleCopyCode}
                          className="text-[9px] font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                        >
                          {copiedCode ? <CheckCircle2 size={10} className="text-emerald-500" /> : <Copy size={10} />}
                          {copiedCode ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="relative font-mono rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                      <div className="bg-slate-900 px-3 py-1 flex items-center justify-between text-[8px] text-slate-500 uppercase tracking-widest border-b border-slate-850">
                        <span>Python 3 Subprocess (Ctrl+Enter to Run)</span>
                        <span className="text-emerald-500 font-black animate-pulse">● READY</span>
                      </div>
                      <textarea
                        value={pythonCode}
                        onChange={(e) => setPythonCode(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                            e.preventDefault();
                            handleRenderMatplotlib();
                          }
                        }}
                        spellCheck={false}
                        className="w-full h-56 p-3 bg-slate-950 text-emerald-400 border-none outline-none font-mono text-[10px] leading-relaxed resize-y focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Run code trigger button */}
                  <div className="pt-2">
                    <button
                      onClick={handleRenderMatplotlib}
                      disabled={loading || !pythonCode.trim()}
                      className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 group
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
                          Execute & Plot Figures
                        </>
                      )}
                    </button>

                    {(error || pythonError) && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-3 p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-medium border border-red-150 dark:border-red-900/50 flex gap-2"
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
          <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <History size={14} />
                Recent Artifacts ({history.length})
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-[10px] text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                  title="Clear History"
                >
                  <Trash2 size={12} /> Clear All
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {history.slice(0, 6).map((item) => (
                <div
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
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-fuchsia-400 transition-all cursor-pointer bg-slate-950"
                >
                  <img 
                    src={item.url} 
                    alt="" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
                    <button
                      onClick={(e) => togglePinHistory(item.id, e)}
                      className={`p-1 rounded-md transition-all ${
                        item.isPinned ? 'bg-amber-500 text-white' : 'bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100 hover:bg-black/80'
                      }`}
                    >
                      <Star size={10} fill={item.isPinned ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-2 transition-opacity">
                    <p className="text-[9px] font-bold text-white line-clamp-1">{item.prompt}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[8px] font-mono text-fuchsia-300 uppercase">{item.style}</span>
                      <Maximize2 size={12} className="text-white" />
                    </div>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="col-span-2 py-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
                  <p className="text-[10px] text-slate-400">No figures generated yet</p>
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
            {/* Top Toolbar */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <div className={`h-2.5 w-2.5 rounded-full ${illustratorMode === 'neural' ? 'bg-fuchsia-500' : 'bg-indigo-500'} animate-pulse`} />
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  {illustratorMode === 'neural' ? 'Active Canvas (Imagen-3)' : 'Matplotlib Kernel Visualizer'}
                  {illustratorMode === 'matplotlib' && executionTimeMs !== null && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold rounded-md border border-emerald-500/20">
                      ⚡ {executionTimeMs}ms • {matplotlibDpi} DPI
                    </span>
                  )}
                </h3>
                {aspectRatio && illustratorMode === 'neural' && (
                  <span className="px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 text-[9px] font-bold rounded-md border border-fuchsia-500/20">
                    {aspectRatio}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Mode switcher for Matplotlib (Raster / SVG / Metadata) */}
                {illustratorMode === 'matplotlib' && imageUrl && (
                  <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setActiveTabMode('raster')}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                        activeTabMode === 'raster' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <ImageIcon size={10} />
                      Raster
                    </button>
                    <button
                      onClick={() => setActiveTabMode('svg')}
                      className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                        activeTabMode === 'svg' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'
                      }`}
                    >
                      <Code size={10} />
                      Vector SVG
                    </button>
                    {executionMetadata && (
                      <button
                        onClick={() => setActiveTabMode('metadata')}
                        className={`px-2.5 py-1 text-[9px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                          activeTabMode === 'metadata' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        <FileJson size={10} />
                        Output Data
                      </button>
                    )}
                  </div>
                )}

                {/* Canvas Theme Toggle */}
                <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setCanvasBg('slate')}
                    className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                      canvasBg === 'slate' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setCanvasBg('white')}
                    className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                      canvasBg === 'white' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    White
                  </button>
                  <button
                    onClick={() => setCanvasBg('grid')}
                    className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all ${
                      canvasBg === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Grid
                  </button>
                </div>

                {/* Overlays & Export actions */}
                {imageUrl && (
                  <>
                    <button
                      onClick={() => setShowScaleBar(!showScaleBar)}
                      className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        showScaleBar ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Toggle Scale Bar"
                    >
                      <Ruler size={13} />
                      <span className="hidden sm:inline">Scale</span>
                    </button>

                    <button
                      onClick={() => setShowCrosshairs(!showCrosshairs)}
                      className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 transition-all ${
                        showCrosshairs ? 'bg-sky-500/20 border-sky-500/40 text-sky-300' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                      }`}
                      title="Toggle Axis Crosshair"
                    >
                      <Crosshair size={13} />
                    </button>

                    <button
                      onClick={() => setFullscreenModal(true)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-white transition-all"
                      title="Fullscreen Preview"
                    >
                      <Maximize2 size={13} />
                    </button>

                    <button
                      onClick={handleExportMetadata}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-white transition-all"
                      title="Export Figure Metadata JSON"
                    >
                      <FileJson size={13} />
                    </button>

                    {/* Matplotlib SVG download */}
                    {illustratorMode === 'matplotlib' && (primarySvg || figuresList[activeFigureIdx]?.svg) && (
                      <button
                        onClick={handleDownloadSvg}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                        title="Download Scalable Vector Graphics (.svg)"
                      >
                        <FileCode size={12} />
                        <span className="hidden sm:inline">SVG</span>
                      </button>
                    )}

                    {/* Matplotlib PDF download */}
                    {illustratorMode === 'matplotlib' && (primaryPdf || figuresList[activeFigureIdx]?.pdf) && (
                      <button
                        onClick={handleDownloadPdf}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl border border-slate-200 dark:border-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1"
                        title="Download Publication PDF"
                      >
                        <FileText size={12} />
                        <span className="hidden sm:inline">PDF</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownload(imageUrl)}
                      className={`px-3 py-1.5 ${
                        illustratorMode === 'neural' 
                          ? 'bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20' 
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
                      } text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md`}
                    >
                      <Download size={13} />
                      <span className="hidden sm:inline">PNG</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Multiple Figure Selector Tabs */}
            {illustratorMode === 'matplotlib' && figuresList.length > 1 && (
              <div className="bg-slate-100 dark:bg-slate-950 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1 shrink-0">
                  <Layers size={11} className="text-indigo-400" />
                  Figures ({figuresList.length}):
                </span>
                {figuresList.map((fig, idx) => (
                  <button
                    key={fig.figureId || idx}
                    onClick={() => {
                      setActiveFigureIdx(idx);
                      setImageUrl(fig.png);
                      setPrimarySvg(fig.svg);
                      setPrimaryPdf(fig.pdf || null);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeFigureIdx === idx
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Fig {fig.figureId || idx + 1}</span>
                    <span className="text-[9px] opacity-70">({fig.widthInches}x{fig.heightInches}")</span>
                  </button>
                ))}
              </div>
            )}
            
            {/* Canvas Main View */}
            <div className={`flex-1 relative flex items-center justify-center overflow-hidden transition-colors duration-300 ${
              canvasBg === 'slate' ? 'bg-slate-950' :
              canvasBg === 'white' ? 'bg-white' :
              canvasBg === 'black' ? 'bg-black' :
              'bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]'
            }`}>
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
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {illustratorMode === 'neural' ? `Neural rendering in progress (${size})` : `Executing Matplotlib Subprocess at ${matplotlibDpi} DPI...`}
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
                          <div className="text-slate-500">&gt; import matplotlib.pyplot as plt</div>
                          <div className="text-slate-500">&gt; import numpy as np</div>
                          <div className="animate-pulse text-indigo-300">&gt; executing user script context with Agg backend...</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 w-48 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${illustratorMode === 'neural' ? 'bg-fuchsia-500' : 'bg-indigo-500'}`}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 4, ease: "linear" }}
                      />
                    </div>
                  </motion.div>
                ) : activeTabMode === 'svg' && (primarySvg || figuresList[activeFigureIdx]?.svg) ? (
                  /* Live Scalable Vector SVG View */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="svg-preview"
                    className="relative w-full h-full p-6 flex flex-col items-center justify-center overflow-auto"
                  >
                    <div className="w-full max-w-2xl bg-slate-900/90 rounded-2xl p-4 border border-indigo-500/20 shadow-2xl flex flex-col items-center">
                      <div className="w-full flex justify-between items-center mb-3 pb-2 border-b border-slate-800 text-xs">
                        <span className="font-mono text-indigo-300 text-[11px] font-bold flex items-center gap-1.5">
                          <Code size={13} />
                          Scalable Vector Graphics (SVG Format)
                        </span>
                        <button
                          onClick={handleCopySvg}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          {copiedSvg ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          {copiedSvg ? 'Copied XML' : 'Copy SVG XML'}
                        </button>
                      </div>
                      <div 
                        className="w-full max-h-[500px] flex items-center justify-center overflow-hidden [&>svg]:max-w-full [&>svg]:max-h-[480px] [&>svg]:h-auto"
                        dangerouslySetInnerHTML={{ __html: figuresList[activeFigureIdx]?.svg || primarySvg || '' }}
                      />
                    </div>
                  </motion.div>
                ) : activeTabMode === 'metadata' && executionMetadata ? (
                  /* Computed Results & Metrics Card */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="metadata-preview"
                    className="w-full h-full p-6 flex items-center justify-center overflow-auto"
                  >
                    <div className="w-full max-w-xl bg-slate-900/95 rounded-2xl p-6 border border-indigo-500/30 shadow-2xl space-y-4 text-left">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <FileJson className="text-indigo-400" size={18} />
                          <h4 className="text-sm font-bold text-slate-100">Crystallographic Output Data</h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">JSON Object</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {Object.entries(executionMetadata).map(([key, val]) => (
                          <div key={key} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                            <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">{key}</span>
                            <span className="text-emerald-400 font-bold text-sm">
                              {typeof val === 'number' ? Number(val.toFixed(4)) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2">
                        <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-300 overflow-x-auto max-h-40 font-mono">
                          {JSON.stringify(executionMetadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </motion.div>
                ) : imageUrl ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key="preview"
                    className="relative w-full h-full p-6 flex items-center justify-center text-center"
                  >
                    <div className="relative inline-block max-w-full max-h-full">
                      <img 
                        src={imageUrl} 
                        alt="Generated Scientific Illustration" 
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-[520px] object-contain rounded-2xl shadow-2xl border border-white/10"
                      />

                      {/* Scale Bar Overlay */}
                      {showScaleBar && (
                        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-sky-500/40 text-sky-300 font-mono text-[10px] flex items-center gap-2 shadow-lg">
                          <div className="w-12 h-[2px] bg-sky-400 flex justify-between items-center relative">
                            <div className="w-[1px] h-2 bg-sky-400" />
                            <div className="w-[1px] h-2 bg-sky-400" />
                          </div>
                          <span className="font-bold">{scaleLength}</span>
                        </div>
                      )}

                      {/* Axis Crosshair Overlay */}
                      {showCrosshairs && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-full h-[1px] bg-sky-400/30" />
                          <div className="h-full w-[1px] bg-sky-400/30 absolute" />
                          <div className="w-10 h-10 border border-sky-400/40 rounded-full absolute" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key="empty"
                    className="text-center p-8 max-w-md"
                  >
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/80 rounded-3xl flex items-center justify-center mx-auto mb-5 rotate-3 border border-slate-200 dark:border-slate-700">
                      <ImageIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h4 className="text-slate-300 font-bold mb-2 uppercase tracking-wide text-sm">
                      {illustratorMode === 'neural' ? 'Empty Canvas' : 'Empty Plot Grid'}
                    </h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                      {illustratorMode === 'neural' 
                        ? 'Visualise complex crystal lattices, perovskite ABO3 polyhedra, experimental XRD setups, or electron micrographs.'
                        : 'Render publication-ready 2D diffraction scans, 3D unit cells, reciprocal space maps, or phonon band structures.'}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3 border border-slate-800 rounded-xl bg-slate-900/60">
                        <p className="text-[9px] font-bold text-slate-500 mb-0.5">IMAGE FORMAT</p>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">{aspectRatio} Ratio</p>
                      </div>
                      <div className="p-3 border border-slate-800 rounded-xl bg-slate-900/60">
                        <p className="text-[9px] font-bold text-slate-500 mb-0.5">CORE ENGINE</p>
                        <p className="text-xs font-bold text-slate-200 uppercase tracking-tight">
                          {illustratorMode === 'neural' ? 'Imagen-3.0' : 'Python 3 + Matplotlib'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prompt bar footer if image available */}
            {imageUrl && (
              <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-4 text-xs">
                <p className="text-slate-400 line-clamp-1 italic font-sans text-[11px]">
                  "{prompt || 'Generated figure'}"
                </p>
                <button
                  onClick={handleCopyPrompt}
                  className="shrink-0 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  {copiedPrompt ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
                  {copiedPrompt ? 'Copied' : 'Copy Prompt'}
                </button>
              </div>
            )}

            {/* Collapsible Python Console Log */}
            {illustratorMode === 'matplotlib' && pythonLog && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-950 font-mono text-xs overflow-hidden">
                <div className="bg-slate-900 px-6 py-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
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
                <pre className="p-4 max-h-40 overflow-y-auto text-emerald-400 whitespace-pre-wrap leading-relaxed text-[10.5px]">
                  {pythonLog}
                </pre>
              </div>
            )}
          </motion.div>

          {/* Technical Context / Credits */}
          <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-3xl text-slate-400 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center ${illustratorMode === 'neural' ? 'text-fuchsia-400 animate-pulse' : 'text-indigo-400'} border border-slate-700`}>
                <Settings2 size={16} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest">Active Rendering Engine</p>
                <p className="text-xs font-bold text-slate-200">
                  {illustratorMode === 'neural' ? 'Imagen-3 (High-Fidelity Scientific Core)' : 'Interactive Python-Matplotlib (Sandbox Execution)'}
                </p>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 text-right leading-snug">
              <span>Publication Ready Quality • High DPI Vector Synthesis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {fullscreenModal && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullscreenModal(false)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md p-6 flex flex-col justify-between items-center"
          >
            <div className="w-full flex justify-between items-center text-white z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="text-fuchsia-500" size={18} />
                <span className="font-bold text-sm">Full Resolution Scientific Figure</span>
              </div>
              <button
                onClick={() => setFullscreenModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold"
              >
                Close (ESC)
              </button>
            </div>

            <div className="relative max-w-full max-h-[80vh] flex items-center justify-center my-auto">
              <img
                src={imageUrl}
                alt="Fullscreen"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="w-full max-w-2xl bg-slate-900 p-4 rounded-2xl border border-slate-800 text-center text-xs text-slate-300 flex justify-between items-center">
              <span className="truncate pr-4 italic">"{prompt}"</span>
              <button
                onClick={() => handleDownload(imageUrl)}
                className="px-4 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold rounded-xl flex items-center gap-2 shrink-0"
              >
                <Download size={14} /> Download Image
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
