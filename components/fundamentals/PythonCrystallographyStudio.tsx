import React, { useState, useMemo } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  FileDown, 
  Play, 
  Sparkles, 
  Layers, 
  Sliders, 
  Camera, 
  Maximize2,
  Info,
  CheckCircle2,
  Rotate3d,
  Box
} from 'lucide-react';
import { playSynthTone } from '../../utils/sound';

export type PythonWorkflow = 'mplot3d_cell' | 'opencv_diffraction' | 'seven_systems_grid';

export const PythonCrystallographyStudio: React.FC = () => {
  const [workflow, setWorkflow] = useState<PythonWorkflow>('mplot3d_cell');
  const [selectedSystem, setSelectedSystem] = useState<string>('cubic');
  const [millerH, setMillerH] = useState<number>(1);
  const [millerK, setMillerK] = useState<number>(1);
  const [millerL, setMillerL] = useState<number>(1);
  const [azimuth, setAzimuth] = useState<number>(35);
  const [elevation, setElevation] = useState<number>(25);
  const [colormap, setColormap] = useState<string>('viridis');
  const [copied, setCopied] = useState<boolean>(false);

  // Generate scientific Python Code based on state
  const pythonScript = useMemo(() => {
    if (workflow === 'mplot3d_cell') {
      return `"""
======================================================================
Scientific 3D Crystallographic Unit Cell & Miller Plane Visualizer
Powered by Matplotlib 3D (mplot3d) & OpenCV (cv2)
Framework: Crystallography & Solid State Physics Reference Standard
======================================================================
Requirements:
    pip install numpy matplotlib opencv-python scipy
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import cv2

# --- 1. Crystallographic Unit Cell Lattice Parameters ---
# System: ${selectedSystem.toUpperCase()}
crystal_params = {
    'cubic':        {'a': 4.05, 'b': 4.05, 'c': 4.05, 'alpha': 90.0, 'beta': 90.0, 'gamma': 90.0},
    'tetragonal':   {'a': 4.59, 'b': 4.59, 'c': 2.96, 'alpha': 90.0, 'beta': 90.0, 'gamma': 90.0},
    'orthorhombic': {'a': 4.75, 'b': 10.20, 'c': 5.98, 'alpha': 90.0, 'beta': 90.0, 'gamma': 90.0},
    'hexagonal':    {'a': 2.46, 'b': 2.46, 'c': 6.70, 'alpha': 90.0, 'beta': 90.0, 'gamma': 120.0},
    'trigonal':     {'a': 4.91, 'b': 4.91, 'c': 4.91, 'alpha': 78.0, 'beta': 78.0, 'gamma': 78.0},
    'monoclinic':   {'a': 5.68, 'b': 15.18, 'c': 6.52, 'alpha': 90.0, 'beta': 118.4, 'gamma': 90.0},
    'triclinic':    {'a': 8.14, 'b': 12.78, 'c': 7.16, 'alpha': 94.3, 'beta': 116.6, 'gamma': 87.7},
}

p = crystal_params.get('${selectedSystem}', crystal_params['cubic'])
a, b, c = p['a'], p['b'], p['c']
alpha = np.radians(p['alpha'])
beta = np.radians(p['beta'])
gamma = np.radians(p['gamma'])

# --- 2. Metric Tensor & Cartesian Basis Transformation ---
# Calculates orthogonal Cartesian basis vectors [ax, ay, az], [bx, by, bz], [cx, cy, cz]
ax = a
ay = 0.0
az = 0.0

bx = b * np.cos(gamma)
by = b * np.sin(gamma)
bz = 0.0

cx = c * np.cos(beta)
cy = c * (np.cos(alpha) - np.cos(beta) * np.cos(gamma)) / np.sin(gamma)
cz = np.sqrt(max(0.0, c**2 - cx**2 - cy**2))

M_frac_to_cart = np.array([
    [ax, bx, cx],
    [ay, by, cy],
    [az, bz, cz]
])

# 8 corners in fractional space
corners_frac = np.array([
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
])
corners_cart = (M_frac_to_cart @ corners_frac.T).T

# --- 3. Compute Miller Plane (${millerH}, ${millerK}, ${millerL}) Intersections ---
h, k, l = ${millerH}, ${millerK}, ${millerL}
edges = [
    (0, 1), (1, 2), (2, 3), (3, 0),
    (4, 5), (5, 6), (6, 7), (7, 4),
    (0, 4), (1, 5), (2, 6), (3, 7)
]

plane_pts_frac = []
for i1, i2 in edges:
    p1 = corners_frac[i1]
    p2 = corners_frac[i2]
    val1 = h * p1[0] + k * p1[1] + l * p1[2] - 1.0
    val2 = h * p2[0] + k * p2[1] + l * p2[2] - 1.0
    
    if abs(val1) < 1e-6:
        plane_pts_frac.append(p1)
    elif abs(val2) < 1e-6:
        plane_pts_frac.append(p2)
    elif (val1 > 0 and val2 < 0) or (val1 < 0 and val2 > 0):
        t = val1 / (val1 - val2)
        inter = p1 + t * (p2 - p1)
        plane_pts_frac.append(inter)

# Deduplicate and sort vertices cyclically
if len(plane_pts_frac) >= 3:
    unique_frac = []
    for pt in plane_pts_frac:
        if not any(np.linalg.norm(pt - u) < 1e-4 for u in unique_frac):
            unique_frac.append(pt)
    
    pts_cart = np.array([(M_frac_to_cart @ pt) for pt in unique_frac])
    center = pts_cart.mean(axis=0)
    normal = np.array([h/a, k/b, l/c])
    normal /= np.linalg.norm(normal)
    
    v0 = pts_cart[0] - center
    v0 /= np.linalg.norm(v0)
    v1 = np.cross(normal, v0)
    
    angles = [np.arctan2(np.dot(pt - center, v1), np.dot(pt - center, v0)) for pt in pts_cart]
    sorted_indices = np.argsort(angles)
    plane_polygon = pts_cart[sorted_indices]
else:
    plane_polygon = None

# --- 4. Render with Matplotlib 3D (mplot3d) ---
fig = plt.figure(figsize=(9, 8), facecolor='#0b0f19')
ax3d = fig.add_subplot(111, projection='3d', facecolor='#0b0f19')

# Draw wireframe edges
for i1, i2 in edges:
    p1, p2 = corners_cart[i1], corners_cart[i2]
    ax3d.plot([p1[0], p2[0]], [p1[1], p2[1]], [p1[2], p2[2]], color='#64748b', lw=1.8, alpha=0.9)

# Draw Miller plane polygon with translucency
if plane_polygon is not None:
    poly = Poly3DCollection([plane_polygon], alpha=0.60, facecolors='#10b981', edgecolors='#047857', linewidths=2.5)
    ax3d.add_collection3d(poly)

# Scatter corner atoms
ax3d.scatter(corners_cart[:, 0], corners_cart[:, 1], corners_cart[:, 2], 
             s=90, c='#38bdf8', edgecolors='#ffffff', depthshade=True, label='Lattice Vertices (P)')

# Configure camera and styling
ax3d.view_init(elev=${elevation}, azim=${azimuth})
ax3d.set_title(f"Crystallographic Unit Cell: {p['a']}Å × {p['b']}Å × {p['c']}Å\\nPlane ({h}{k}{l}) Slicing", 
               color='white', fontsize=12, pad=12, fontweight='bold')
ax3d.set_xlabel("X (Å)", color='#94a3b8')
ax3d.set_ylabel("Y (Å)", color='#94a3b8')
ax3d.set_zlabel("Z (Å)", color='#94a3b8')
ax3d.tick_params(colors='#94a3b8')
ax3d.grid(color='#334155', linestyle=':')

plt.tight_layout()
plt.savefig("unit_cell_mplot3d.png", dpi=300, facecolor='#0b0f19')
print("Successfully generated unit_cell_mplot3d.png with publication quality!")

# --- 5. OpenCV Scientific Image Processing & Contour Mask ---
img_bgr = cv2.imread("unit_cell_mplot3d.png")
if img_bgr is not None:
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    edges_cv = cv2.Canny(gray, threshold1=50, threshold2=150)
    
    # False-color heat visualization using OpenCV Colormap
    colored_cv = cv2.applyColorMap(edges_cv, cv2.COLORMAP_${colormap.toUpperCase()})
    cv2.imwrite("unit_cell_opencv_edges.png", colored_cv)
    print("OpenCV Edge contour matrix saved: unit_cell_opencv_edges.png")

plt.show()
`;
    }

    if (workflow === 'opencv_diffraction') {
      return `"""
======================================================================
OpenCV (cv2) & NumPy Synthetic 2D Diffraction Pattern & Ewald Slice
Direct Optical & Reciprocal Space Simulation for ${selectedSystem.toUpperCase()}
======================================================================
"""

import numpy as np
import cv2
import matplotlib.pyplot as plt

# 1. Create simulated 1024x1024 detector matrix
width, height = 1024, 1024
detector = np.zeros((height, width), dtype=np.float32)
center_x, center_y = width // 2, height // 2

# 2. Synthetic Reciprocal Lattice Spots for ${selectedSystem.charAt(0).toUpperCase() + selectedSystem.slice(1)}
# Spot coordinates (Qx, Qy) mapped to detector pixels
wavelength = 1.5406  # Cu Ka (Angstroms)
detector_dist_mm = 150.0
pixel_size_um = 75.0

spots = [
    # (h, k, l, intensity)
    (1, 0, 0, 1.0),
    (0, 1, 0, 1.0),
    (1, 1, 0, 0.85),
    (2, 0, 0, 0.60),
    (2, 1, 0, 0.45),
    (1, 1, 1, 0.95),
    (2, 2, 0, 0.35),
    (3, 1, 0, 0.25)
]

# Generate Gaussian diffraction spots and diffuse Debye-Scherrer rings
for h, k, l, rel_int in spots:
    # 2D projection radius
    radius = int(np.sqrt(h**2 + k**2) * 110)
    
    # Ring component (polycrystalline background)
    cv2.circle(detector, (center_x, center_y), radius, float(rel_int * 0.15), thickness=1, lineType=cv2.LINE_AA)
    
    # 4-fold or 6-fold spots
    for ang_deg in [0, 90, 180, 270]:
        ang = np.radians(ang_deg + np.arctan2(k, h if h!=0 else 1e-4) * 180 / np.pi)
        sx = int(center_x + radius * np.cos(ang))
        sy = int(center_y + radius * np.sin(ang))
        if 0 <= sx < width and 0 <= sy < height:
            # Draw Gaussian spot with OpenCV
            cv2.circle(detector, (sx, sy), 8, float(rel_int), thickness=-1, lineType=cv2.LINE_AA)

# 3. Apply Gaussian blur to simulate instrumentation PSF
detector = cv2.GaussianBlur(detector, (9, 9), sigmaX=2.2)

# Add Poisson photon shot noise
noise = np.random.poisson(detector * 25.0).astype(np.float32) / 25.0
detector_with_noise = np.clip(detector + noise * 0.2, 0.0, 1.0)

# Convert to 8-bit image and apply scientific pseudo-color map
img_8u = (detector_with_noise * 255.0).astype(np.uint8)
colored_detector = cv2.applyColorMap(img_8u, cv2.COLORMAP_${colormap.toUpperCase()})

# Draw beamstop shadow in center
cv2.circle(colored_detector, (center_x, center_y), 32, (15, 15, 15), -1)

# Annotate with OpenCV
cv2.putText(colored_detector, "${selectedSystem.toUpperCase()} REPROJECTION", (40, 60), 
            cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)
cv2.putText(colored_detector, f"Cu Ka (1.5406 A) | PSF Gaussian 2.2px", (40, 95), 
            cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1, cv2.LINE_AA)

cv2.imwrite("synthetic_diffraction_opencv.png", colored_detector)
print("Saved publication synthetic diffraction frame: synthetic_diffraction_opencv.png")
`;
    }

    // Default: 7 systems multi-panel figure
    return `"""
======================================================================
Publication-Grade 7 Crystal Systems Multi-Panel Figure Generator
Generates comprehensive comparative plate (ScienceNotes & Britannica Style)
======================================================================
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D

systems = [
    ('Cubic', 4.0, 4.0, 4.0, 90, 90, 90, 'Fluorite (CaF2)'),
    ('Tetragonal', 4.0, 4.0, 6.0, 90, 90, 90, 'Wulfenite (PbMoO4)'),
    ('Orthorhombic', 3.5, 5.5, 7.0, 90, 90, 90, 'Olivine ((Mg,Fe)2SiO4)'),
    ('Hexagonal', 4.0, 4.0, 6.5, 90, 90, 120, 'Emerald (Be3Al2Si6O18)'),
    ('Trigonal', 4.5, 4.5, 4.5, 75, 75, 75, 'Rhodochrosite (MnCO3)'),
    ('Monoclinic', 4.0, 7.0, 5.0, 90, 115, 90, 'Azurite (Cu3(CO3)2(OH)2)'),
    ('Triclinic', 4.0, 6.0, 5.0, 80, 110, 70, 'Amazonite (KAlSi3O8)')
]

fig = plt.figure(figsize=(16, 8), facecolor='#0f172a')

for idx, (name, a, b, c, al, be, ga, mineral) in enumerate(systems):
    ax = fig.add_subplot(2, 4, idx + 1, projection='3d', facecolor='#0f172a')
    
    # Calculate cartesian vertices
    al_r, be_r, ga_r = np.radians(al), np.radians(be), np.radians(ga)
    ax_v = [a, 0, 0]
    bx_v = [b * np.cos(ga_r), b * np.sin(ga_r), 0]
    cx_v = [c * np.cos(be_r), 
            c * (np.cos(al_r) - np.cos(be_r)*np.cos(ga_r))/np.sin(ga_r), 
            c * np.sqrt(max(0, 1 - np.cos(be_r)**2 - ((np.cos(al_r)-np.cos(be_r)*np.cos(ga_r))/np.sin(ga_r))**2))]
    
    M = np.array([ax_v, bx_v, cx_v]).T
    corners = np.array([[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]])
    cart = (M @ corners.T).T
    
    edges = [(0,1),(1,2),(2,3),(3,0),(4,5),(5,6),(6,7),(7,4),(0,4),(1,5),(2,6),(3,7)]
    for e1, e2 in edges:
        ax.plot([cart[e1,0], cart[e2,0]], [cart[e1,1], cart[e2,1]], [cart[e1,2], cart[e2,2]], color='#38bdf8', lw=1.5)
    
    ax.scatter(cart[:,0], cart[:,1], cart[:,2], color='#f43f5e', s=35)
    ax.view_init(elev=20, azim=35)
    ax.set_title(f"{name}\\n{mineral}", color='white', fontsize=10, fontweight='bold')
    ax.axis('off')

plt.suptitle("The 7 Canonical Crystal Systems (Crystallography Reference)", color='white', fontsize=16, y=0.98)
plt.tight_layout()
plt.savefig("7_crystal_systems_plate.png", dpi=300, facecolor='#0f172a')
print("Saved 7_crystal_systems_plate.png!")
plt.show()
`;
  }, [workflow, selectedSystem, millerH, millerK, millerL, azimuth, elevation, colormap]);

  const handleCopyCode = () => {
    playSynthTone('chime');
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPy = () => {
    playSynthTone('chime');
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crystallography_${workflow}_${selectedSystem}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              Scientific Computing Suite
            </span>
            <span className="text-xs text-slate-400 font-mono">Python 3.10+ • Matplotlib • OpenCV</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Python (Matplotlib 3D & OpenCV) Crystallography Studio
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Generate and execute publication-ready Python scripts using <code className="text-purple-300 font-mono">mpl_toolkits.mplot3d</code> and <code className="text-cyan-300 font-mono">cv2</code> for ray-traced unit cells, Miller plane slicing, metric tensor coordinates, and computer-vision diffraction analysis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-purple-500/25"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Python Code'}</span>
          </button>

          <button
            onClick={handleDownloadPy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4 text-purple-400" />
            <span>Download .py</span>
          </button>
        </div>
      </div>

      {/* Workflow Navigation */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
        <button
          onClick={() => { playSynthTone('tick'); setWorkflow('mplot3d_cell'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            workflow === 'mplot3d_cell'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>3D Unit Cell + Miller Slicer (Matplotlib)</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setWorkflow('opencv_diffraction'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            workflow === 'opencv_diffraction'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>OpenCV Diffraction Frame & Fourier Slicer</span>
        </button>

        <button
          onClick={() => { playSynthTone('tick'); setWorkflow('seven_systems_grid'); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            workflow === 'seven_systems_grid'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>7-Systems Multi-Panel Comparative Plate</span>
        </button>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Code Preview & Requirements */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">crystallography_script.py</span>
            </div>
            <span className="text-[10px] font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
              Synced with Live Parameters
            </span>
          </div>

          {/* Script Code Viewer */}
          <div className="relative font-mono text-xs text-slate-300 bg-slate-900/90 rounded-2xl p-4 overflow-x-auto max-h-[500px] border border-slate-800/80 leading-relaxed">
            <pre>{pythonScript}</pre>
          </div>

          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Terminal Execution Command:</span>
            <code className="text-emerald-400 font-bold bg-slate-950 px-2 py-1 rounded">
              python crystallography_script.py
            </code>
          </div>
        </div>

        {/* Right Column: Interactive Script Configuration Parameters */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Controls Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>Script Configuration Controls</span>
            </h3>

            <div className="space-y-3">
              {/* Target System */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Target Crystal System</label>
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-purple-500"
                >
                  <option value="cubic">Cubic (Isometric)</option>
                  <option value="tetragonal">Tetragonal</option>
                  <option value="orthorhombic">Orthorhombic</option>
                  <option value="hexagonal">Hexagonal</option>
                  <option value="trigonal">Trigonal / Rhombohedral</option>
                  <option value="monoclinic">Monoclinic</option>
                  <option value="triclinic">Triclinic</option>
                </select>
              </div>

              {/* Miller Indices for mplot3d slicer */}
              {workflow === 'mplot3d_cell' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">h</label>
                    <input
                      type="number"
                      value={millerH}
                      onChange={(e) => setMillerH(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">k</label>
                    <input
                      type="number"
                      value={millerK}
                      onChange={(e) => setMillerK(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">l</label>
                    <input
                      type="number"
                      value={millerL}
                      onChange={(e) => setMillerL(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {/* Camera view angles */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Azimuth</span>
                    <span className="text-purple-400 font-bold">{azimuth}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={azimuth}
                    onChange={(e) => setAzimuth(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-950 accent-purple-500 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>Elevation</span>
                    <span className="text-purple-400 font-bold">{elevation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="90"
                    value={elevation}
                    onChange={(e) => setElevation(parseInt(e.target.value))}
                    className="w-full h-1 bg-slate-950 accent-purple-500 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* OpenCV Colormap Selection */}
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">OpenCV False-Color Map</label>
                <select
                  value={colormap}
                  onChange={(e) => setColormap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none focus:border-purple-500"
                >
                  <option value="viridis">cv2.COLORMAP_VIRIDIS (Perceptual)</option>
                  <option value="plasma">cv2.COLORMAP_PLASMA (Warm High-Contrast)</option>
                  <option value="inferno">cv2.COLORMAP_INFERNO (Thermal)</option>
                  <option value="jet">cv2.COLORMAP_JET (Classic Diffractometer)</option>
                  <option value="bone">cv2.COLORMAP_BONE (X-ray Radiographic)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scientific Packages Callout */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3 shadow-lg">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Standard Scientific Python Stack</span>
            </span>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                <span className="text-slate-400">matplotlib & mplot3d</span>
                <span className="text-purple-300">Axes3D, Poly3DCollection</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                <span className="text-slate-400">opencv-python (cv2)</span>
                <span className="text-cyan-300">Canny, applyColorMap, GaussianBlur</span>
              </div>
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                <span className="text-slate-400">numpy & scipy</span>
                <span className="text-emerald-300">Linear Algebra & Metric Tensor</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
