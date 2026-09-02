import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Activity, Download, Copy, CheckCircle2, FileSpreadsheet, 
  Layers, Compass, Grid, Sparkles, Code2, ShieldAlert,
  ChevronRight, ArrowRight, Eye, RefreshCw, Cpu, Gauge,
  Share2, Sliders, ExternalLink, FileCode
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, ReferenceLine, AreaChart, Area 
} from 'recharts';

export interface OpenCVResultsData {
  success: boolean;
  execution_duration: string;
  cx: number;
  cy: number;
  detector_geometry?: {
    wavelength: number;
    detector_distance_mm: number;
    pixel_size_um: number;
    width_px: number;
    height_px: number;
  };
  radial_profile: Array<{
    radius_px: number;
    radius_mm: number;
    two_theta_deg: number;
    q_inv_a: number;
    d_spacing_a: number;
    intensity: number;
    intensity_std: number;
  }>;
  azimuthal_profile?: Array<{
    chi_deg: number;
    intensity: number;
  }>;
  detected_rings: Array<{
    ring_index: number;
    radius_px: number;
    two_theta_deg: number;
    q_inv_a: number;
    d_spacing_a: number;
    intensity: number;
    fwhm_px: number;
    fwhm_2theta_deg: number;
    crystallite_size_nm: number;
  }>;
  ring_ellipses?: Array<{
    ring_index: number;
    center: [number, number];
    semi_major_px: number;
    semi_minor_px: number;
    ellipticity: number;
    tilt_angle_deg: number;
    detector_tilt_deg: number;
  }>;
  detected_spots_count: number;
  detected_spots?: Array<{
    spot_id: number;
    x: number;
    y: number;
    radius_px: number;
    two_theta_deg: number;
    area_px: number;
    peak_intensity: number;
    integrated_intensity: number;
  }>;
  spot_vectors?: Array<{
    vector_1_len_px: number;
    vector_2_len_px: number;
    inter_vector_angle_deg: number;
    v1_d_spacing_a: number;
    v2_d_spacing_a: number;
  }>;
  background_noise: number;
  snr: number;
  contrast_ratio: number;
  anisotropy_index: number;
  hermans_orientation_factor?: number;
  processed_images: Record<string, string>;
  report_md: string;
  opencv_enabled: boolean;
  scipy_enabled: boolean;
  candidate_phases?: Array<{
    name: string;
    formula: string;
    crystalSystem: string;
    spaceGroup: string;
    fom: number;
    matchedPeaksCount: number;
    totalReferencePeaks: number;
    referenceDSpacings: number[];
    meanDeltaD: number;
    latticeA?: number;
  }>;
}

interface OpenCVVisionPanelProps {
  results: OpenCVResultsData;
  onSendToPeakFit?: (xyData: string) => void;
  onSelectPhase?: (phaseName: string, latticeA?: number) => void;
}

export const OpenCVVisionPanel: React.FC<OpenCVVisionPanelProps> = ({ results, onSendToPeakFit, onSelectPhase }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'radial_profile' | 'phase_id' | 'texture_azimuth' | 'spot_matrix' | 'tilt_ellipse' | 'python_script'>('report');
  const [xUnit, setXUnit] = useState<'two_theta' | 'radius_px' | 'q_inv' | 'd_spacing'>('two_theta');
  const [scherrerK, setScherrerK] = useState<number>(0.94);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Recalculate crystallite sizes dynamically based on user-selected Scherrer shape factor K
  const adjustedRings = useMemo(() => {
    const wl = results.detector_geometry?.wavelength || 1.5406;
    return results.detected_rings.map(r => {
      const thetaRad = (r.two_theta_deg / 2) * (Math.PI / 180);
      const fwhmRad = (r.fwhm_2theta_deg * Math.PI) / 180;
      const sizeNm = fwhmRad > 0 && Math.cos(thetaRad) > 0 
        ? (scherrerK * (wl * 0.1)) / (fwhmRad * Math.cos(thetaRad))
        : r.crystallite_size_nm;
      return {
        ...r,
        crystallite_size_nm: sizeNm
      };
    });
  }, [results.detected_rings, results.detector_geometry, scherrerK]);

  const handleDownloadXY = () => {
    if (!results.radial_profile?.length) return;
    const lines = results.radial_profile.map(p => `${p.two_theta_deg.toFixed(4)} ${p.intensity.toFixed(2)}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diffractogram_1D_${Date.now()}.xy`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadDAT = () => {
    if (!results.radial_profile?.length) return;
    const header = `# 1D Powder Pattern Extracted from Area Detector\n# Wavelength: ${results.detector_geometry?.wavelength || 1.5406} Angstrom\n# 2Theta(deg) Intensity Intensity_Error\n`;
    const lines = results.radial_profile.map(p => `${p.two_theta_deg.toFixed(4)} ${p.intensity.toFixed(2)} ${p.intensity_std.toFixed(2)}`);
    const blob = new Blob([header + lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diffractogram_powder_${Date.now()}.dat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `cv_vision_analysis_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportCSV = () => {
    if (!results.radial_profile?.length) return;
    const headers = ['Radius_px,Radius_mm,TwoTheta_deg,Q_inv_A,dSpacing_A,Intensity,Intensity_Std'];
    const rows = results.radial_profile.map(p => 
      `${p.radius_px},${p.radius_mm},${p.two_theta_deg},${p.q_inv_a},${p.d_spacing_a},${p.intensity},${p.intensity_std}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `radial_profile_data_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPeakTableCSV = () => {
    if (!adjustedRings?.length) return;
    const headers = ['Ring_Index,Radius_px,TwoTheta_deg,Q_inv_A,dSpacing_A,Intensity,FWHM_2Theta_deg,Scherrer_Size_nm'];
    const rows = adjustedRings.map(r => 
      `${r.ring_index},${r.radius_px.toFixed(2)},${r.two_theta_deg.toFixed(4)},${r.q_inv_a.toFixed(4)},${r.d_spacing_a.toFixed(4)},${r.intensity.toFixed(2)},${r.fwhm_2theta_deg.toFixed(4)},${r.crystallite_size_nm.toFixed(2)}`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detected_bragg_rings_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTransferToPeakFit = () => {
    if (!onSendToPeakFit || !results.radial_profile?.length) return;
    const xyText = results.radial_profile.map(p => `${p.two_theta_deg.toFixed(4)} ${p.intensity.toFixed(2)}`).join('\n');
    onSendToPeakFit(xyText);
  };

  const generatePythonScript = () => {
    const wl = results.detector_geometry?.wavelength || 1.5406;
    const dist = results.detector_geometry?.detector_distance_mm || 150.0;
    const px = results.detector_geometry?.pixel_size_um || 75.0;
    const cx = results.cx;
    const cy = results.cy;

    return `"""
=============================================================================
XRD-AI & Computer Vision Automated 2D Diffraction Image Analysis Script
Powered by OpenCV (cv2), NumPy, SciPy & Matplotlib
=============================================================================
"""
import cv2
import numpy as np
import scipy.ndimage as ndimage
from scipy.signal import find_peaks, peak_widths
import matplotlib.pyplot as plt

# 1. Instrument Calibration Parameters
WAVELENGTH_A = ${wl}       # Radiation wavelength (Angstroms)
DETECTOR_DIST_MM = ${dist}   # Sample-to-detector distance (mm)
PIXEL_SIZE_UM = ${px}        # Detector pixel pitch (microns)
PIXEL_SIZE_MM = PIXEL_SIZE_UM * 1e-3
CALIBRATED_CX = ${cx}        # Calibrated Beam Center X (pixels)
CALIBRATED_CY = ${cy}        # Calibrated Beam Center Y (pixels)

def process_diffractogram(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise FileNotFoundError(f"Image not found at {image_path}")
        
    H, W = img.shape
    
    # 2. Polar Azimuthal Integration
    max_radius = int(min(CALIBRATED_CX, CALIBRATED_CY, W - CALIBRATED_CX, H - CALIBRATED_CY))
    radii_px = []
    two_theta_list = []
    intensities = []
    
    for r_px in range(5, max_radius, 1):
        radius_mm = r_px * PIXEL_SIZE_MM
        two_theta_rad = np.arctan(radius_mm / DETECTOR_DIST_MM)
        two_theta_deg = np.degrees(two_theta_rad)
        
        # Circular mask ring
        mask = np.zeros((H, W), dtype=np.uint8)
        cv2.circle(mask, (int(CALIBRATED_CX), int(CALIBRATED_CY)), r_px, 255, 1)
        pixels = img[mask == 255]
        mean_int = float(np.mean(pixels)) if len(pixels) > 0 else 0.0
        
        radii_px.append(r_px)
        two_theta_list.append(two_theta_deg)
        intensities.append(mean_int)
        
    two_theta_arr = np.array(two_theta_list)
    intensities_arr = np.array(intensities)
    
    # 3. Peak Finding & Scherrer Sizing
    peaks, _ = find_peaks(intensities_arr, prominence=np.max(intensities_arr)*0.06, distance=6)
    widths_res = peak_widths(intensities_arr, peaks, rel_height=0.5)
    fwhm_bins = widths_res[0]
    
    print(f"\\n{'Ring #':<8} {'2-Theta (deg)':<15} {'d-spacing (A)':<15} {'FWHM (deg)':<12} {'Size (nm)':<10}")
    print("-" * 65)
    
    deg_per_bin = (two_theta_arr[-1] - two_theta_arr[0]) / len(two_theta_arr)
    for p_idx, peak in enumerate(peaks):
        tt_val = two_theta_arr[peak]
        theta_rad = np.radians(tt_val / 2.0)
        d_val = WAVELENGTH_A / (2.0 * np.sin(theta_rad)) if np.sin(theta_rad) > 0 else 0
        fwhm_deg = fwhm_bins[p_idx] * deg_per_bin
        fwhm_rad = np.radians(fwhm_deg)
        crystallite_nm = (${scherrerK} * (WAVELENGTH_A * 0.1)) / (fwhm_rad * np.cos(theta_rad))
        print(f"#{p_idx+1:<7} {tt_val:<15.3f} {d_val:<15.3f} {fwhm_deg:<12.3f} {crystallite_nm:<10.1f}")
        
    # 4. Publication Visualization
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))
    ax1.imshow(img, cmap='inferno')
    ax1.plot(CALIBRATED_CX, CALIBRATED_CY, 'c+', markersize=15, markeredgewidth=2)
    for p in peaks:
        r_circle = radii_px[p]
        circ = plt.Circle((CALIBRATED_CX, CALIBRATED_CY), r_circle, color='cyan', fill=False, linestyle='--', alpha=0.7)
        ax1.add_patch(circ)
    ax1.set_title("2D Diffractogram with Calibrated Bragg Rings")
    ax1.axis('off')
    
    ax2.plot(two_theta_arr, intensities_arr, color='#0284c7', lw=1.5, label='1D Radial Integration')
    ax2.plot(two_theta_arr[peaks], intensities_arr[peaks], 'rx', markersize=8, label='Bragg Peaks')
    ax2.set_xlabel(r"$2\\theta$ (degrees)", fontsize=12)
    ax2.set_ylabel("Diffracted Intensity (a.u.)", fontsize=12)
    ax2.set_title("Extracted 1D Powder Pattern", fontsize=12)
    ax2.grid(True, linestyle=':', alpha=0.6)
    ax2.legend()
    plt.tight_layout()
    plt.show()

if __name__ == "__main__":
    process_diffractogram("diffraction_pattern.png")
`;
  };

  const getXAxisDataKey = () => {
    switch (xUnit) {
      case 'two_theta': return 'two_theta_deg';
      case 'radius_px': return 'radius_px';
      case 'q_inv': return 'q_inv_a';
      case 'd_spacing': return 'd_spacing_a';
    }
  };

  const getXAxisLabel = () => {
    switch (xUnit) {
      case 'two_theta': return '2θ (degrees)';
      case 'radius_px': return 'Pixel Radius r (px)';
      case 'q_inv': return 'Scattering Vector q (Å⁻¹)';
      case 'd_spacing': return 'Interplanar Spacing d (Å)';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Top Metric Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Origin (cx, cy)</span>
          <span className="text-xs font-black text-white font-mono">{results.cx?.toFixed(1)}, {results.cy?.toFixed(1)} <span className="text-[8px] text-slate-500 font-normal">px</span></span>
          <span className="text-[7px] font-mono text-emerald-400">Sub-pixel locked</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Debye Rings</span>
          <span className="text-xs font-black text-amber-400 font-mono">{results.detected_rings?.length || 0} <span className="text-[8px] text-slate-500 font-normal">shells</span></span>
          <span className="text-[7px] font-mono text-slate-400">Concentric fits</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Discrete Spots</span>
          <span className="text-xs font-black text-sky-400 font-mono">{results.detected_spots_count || 0} <span className="text-[8px] text-slate-500 font-normal">peaks</span></span>
          <span className="text-[7px] font-mono text-slate-400">SAED / Laue</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Detector SNR</span>
          <span className={`text-xs font-black font-mono ${results.snr > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {results.snr?.toFixed(1)} <span className="text-[8px] text-slate-500 font-normal">dB</span>
          </span>
          <span className="text-[7px] font-mono text-slate-400">σ = {results.background_noise?.toFixed(1)} ADC</span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Orientation f</span>
          <span className="text-xs font-black text-purple-400 font-mono">
            {results.hermans_orientation_factor !== undefined ? results.hermans_orientation_factor.toFixed(3) : '0.000'}
          </span>
          <span className="text-[7px] font-mono text-slate-400">
            {Math.abs(results.hermans_orientation_factor || 0) < 0.15 ? 'Isotropic' : 'Textured'}
          </span>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <span className="text-[8px] font-black font-mono text-slate-500 uppercase tracking-widest leading-none mb-1">Compute Time</span>
          <span className="text-xs font-black text-emerald-400 font-mono">{results.execution_duration}</span>
          <span className="text-[7px] font-mono text-slate-400">OpenCV 5 Core</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 gap-1 sm:gap-4 pb-1">
        {[
          { id: 'report', label: 'Diagnostic Report', icon: FileSpreadsheet },
          { id: 'radial_profile', label: '1D Diffractogram', icon: Activity },
          { id: 'phase_id', label: 'Phase ID & Matcher', icon: Layers },
          { id: 'texture_azimuth', label: 'Azimuthal Texture', icon: Compass },
          { id: 'spot_matrix', label: 'Spot Matrix (SAED)', icon: Grid },
          { id: 'tilt_ellipse', label: 'Ring Ellipticity & Tilt', icon: Gauge },
          { id: 'python_script', label: 'Python Script', icon: Code2 },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${
                isActive 
                  ? 'border-indigo-500 text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Markdown Report */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          <div className="prose prose-sm prose-invert max-w-none prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-indigo-400 prose-th:text-indigo-300 prose-th:font-black prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-1.5 prose-td:font-mono prose-td:text-[11px] prose-p:leading-relaxed prose-p:text-slate-300">
            <ReactMarkdown>{results.report_md}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Tab 2: 1D Radial Diffractogram & Bragg Shells */}
      {activeTab === 'radial_profile' && (
        <div className="space-y-6">
          {/* Controls Bar for Plot */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">X-Axis Scale:</span>
                <div className="flex bg-black/50 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'two_theta', label: '2θ (°)' },
                    { id: 'q_inv', label: 'q (Å⁻¹)' },
                    { id: 'd_spacing', label: 'd (Å)' },
                    { id: 'radius_px', label: 'Radius (px)' },
                  ].map(unit => (
                    <button
                      key={unit.id}
                      onClick={() => setXUnit(unit.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${
                        xUnit === unit.id 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {unit.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Scherrer Shape Factor K Tuning */}
              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-slate-800">
                <span className="text-[8px] font-black text-slate-400 uppercase">Scherrer K:</span>
                <span className="text-xs font-mono font-bold text-purple-400">{scherrerK.toFixed(2)}</span>
                <input 
                  type="range"
                  min="0.85"
                  max="1.15"
                  step="0.01"
                  value={scherrerK}
                  onChange={(e) => setScherrerK(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title="Scherrer crystallite shape factor K (0.89 spherical, 0.94 cubic, 1.00 uniform)"
                />
              </div>
            </div>

            {/* Export & Integration Suite */}
            <div className="flex flex-wrap items-center gap-2">
              {onSendToPeakFit && (
                <button
                  onClick={handleTransferToPeakFit}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-mono font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  title="Transfer 1D pattern to Bragg Crystallography Analysis"
                >
                  <Share2 className="w-3 h-3" />
                  Send to Peak Fit
                </button>
              )}
              <button
                onClick={handleDownloadXY}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
                title="Export standard 2-column .XY diffractogram"
              >
                <Download className="w-3 h-3 text-sky-400" />
                .XY
              </button>
              <button
                onClick={handleDownloadDAT}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-slate-700 flex items-center gap-1.5 transition-all active:scale-95"
                title="Export 3-column FullProf / GSAS .DAT diffractogram"
              >
                <FileCode className="w-3 h-3 text-emerald-400" />
                .DAT
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-indigo-500/30 flex items-center gap-1.5 transition-all active:scale-95"
                title="Export full CSV spectrum dataset"
              >
                <FileSpreadsheet className="w-3 h-3 text-indigo-400" />
                CSV
              </button>
            </div>
          </div>

          {/* Interactive Recharts 1D Diffractogram */}
          <div className="h-80 w-full bg-slate-950/90 p-4 rounded-3xl border border-slate-800 relative">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Azimuthally Integrated 1D Powder Pattern | {getXAxisLabel()}
              </span>
              <span className="text-[8px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                λ = {results.detector_geometry?.wavelength || 1.5406} Å
              </span>
            </div>
            
            <ResponsiveContainer width="100%" height="88%">
              <LineChart 
                data={results.radial_profile} 
                margin={{ top: 10, right: 20, left: -10, bottom: 15 }}
              >
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis 
                  dataKey={getXAxisDataKey()} 
                  stroke="#64748b" 
                  fontSize={9} 
                  tickLine={false}
                  label={{ value: getXAxisLabel(), position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={9} 
                  tickLine={false}
                  label={{ value: 'Intensity (a.u.)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '14px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }} 
                  labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  itemStyle={{ color: '#60a5fa', fontSize: 10, fontFamily: 'monospace' }}
                  formatter={(val: any) => [`${Number(val).toFixed(2)} a.u.`, 'Intensity']}
                  labelFormatter={(val: any) => `${getXAxisLabel()}: ${Number(val).toFixed(3)}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensity" 
                  stroke="#38bdf8" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 2 }}
                />
                
                {/* Detected Bragg Ring Peaks Reference Lines */}
                {results.detected_rings?.map((rg, rIdx) => {
                  let refX = rg.two_theta_deg;
                  if (xUnit === 'radius_px') refX = rg.radius_px;
                  else if (xUnit === 'q_inv') refX = rg.q_inv_a;
                  else if (xUnit === 'd_spacing') refX = rg.d_spacing_a;

                  return (
                    <ReferenceLine 
                      key={`rad-ring-${rIdx}`} 
                      x={refX} 
                      stroke="#f59e0b" 
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ 
                        value: `#${rg.ring_index}`, 
                        position: 'top', 
                        style: { fill: '#f59e0b', fontSize: 8, fontWeight: '900', opacity: 0.9 } 
                      }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Extracted Bragg Rings Table */}
          {adjustedRings?.length > 0 && (
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">
                    Resolved Debye-Scherrer Concentric Shells ({adjustedRings.length})
                  </span>
                </div>
                <button
                  onClick={handleExportPeakTableCSV}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[9px] font-mono border border-slate-800 flex items-center gap-1.5 transition-all"
                >
                  <FileSpreadsheet className="w-3 h-3 text-amber-400" />
                  Export Rings CSV
                </button>
              </div>

              <div className="overflow-x-auto max-h-64 custom-scrollbar border border-slate-800/80 rounded-xl">
                <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-slate-900 text-indigo-400 font-black uppercase text-[9px] sticky top-0">
                    <tr>
                      <th className="p-2.5">Ring #</th>
                      <th className="p-2.5">Radius (px)</th>
                      <th className="p-2.5">2θ (deg)</th>
                      <th className="p-2.5">q (Å⁻¹)</th>
                      <th className="p-2.5">d-spacing (Å)</th>
                      <th className="p-2.5">Intensity</th>
                      <th className="p-2.5">FWHM (2θ)</th>
                      <th className="p-2.5">Scherrer D (K={scherrerK.toFixed(2)})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-300">
                    {adjustedRings.map((ring, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 font-bold text-amber-400">#{ring.ring_index}</td>
                        <td className="p-2.5">{ring.radius_px.toFixed(1)} px</td>
                        <td className="p-2.5 text-white font-bold">{ring.two_theta_deg.toFixed(3)}°</td>
                        <td className="p-2.5 text-sky-400">{ring.q_inv_a.toFixed(3)}</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{ring.d_spacing_a.toFixed(3)} Å</td>
                        <td className="p-2.5">{ring.intensity.toFixed(1)}</td>
                        <td className="p-2.5 text-slate-400">{ring.fwhm_2theta_deg.toFixed(3)}°</td>
                        <td className="p-2.5 text-purple-400 font-bold">{ring.crystallite_size_nm.toFixed(1)} nm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Phase Identification & Reference Library Matcher */}
      {activeTab === 'phase_id' && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Automated Phase Identification & Reference Fingerprinting
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Matches detected Debye-Scherrer interplanar d-spacings against crystallographic reference standards.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-slate-400">
                λ = {results.detector_geometry?.wavelength || 1.5406} Å
              </span>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 rounded-lg">
                {results.candidate_phases?.length || 0} Phase Candidates
              </span>
            </div>
          </div>

          {results.candidate_phases && results.candidate_phases.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.candidate_phases.map((phase, pIdx) => {
                  const isTopMatch = pIdx === 0;
                  return (
                    <div 
                      key={`phase-${pIdx}`}
                      className={`p-5 rounded-2xl border transition-all ${
                        isTopMatch 
                          ? 'bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-tight">{phase.name}</span>
                            {isTopMatch && (
                              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded-full border border-emerald-500/30">
                                Best Match
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-mono">
                            <span className="text-sky-300 font-bold">{phase.formula}</span>
                            <span>•</span>
                            <span>{phase.crystalSystem}</span>
                            <span>•</span>
                            <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{phase.spaceGroup}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[8px] font-black uppercase text-slate-500 block">Figure of Merit</span>
                          <span className={`text-lg font-black font-mono ${phase.fom >= 85 ? 'text-emerald-400' : phase.fom >= 65 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {phase.fom.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar for FOM */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                        <div 
                          className={`h-full transition-all duration-500 ${phase.fom >= 85 ? 'bg-emerald-500' : phase.fom >= 65 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(100, phase.fom)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border border-slate-800/50 text-center font-mono text-[9px] mb-4">
                        <div>
                          <span className="text-slate-500 block text-[7px] uppercase">Matched Peaks</span>
                          <span className="text-white font-bold">{phase.matchedPeaksCount} / {phase.totalReferencePeaks}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[7px] uppercase">Mean |Δd|/d</span>
                          <span className="text-amber-300 font-bold">{(phase.meanDeltaD * 100).toFixed(2)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[7px] uppercase">Lattice (a)</span>
                          <span className="text-sky-300 font-bold">{phase.latticeA ? `${phase.latticeA} Å` : 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectPhase && (
                          <button
                            onClick={() => onSelectPhase(phase.name, phase.latticeA)}
                            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Send to Bragg Simulator
                          </button>
                        )}
                        <button
                          onClick={() => copyToClipboard(
                            `${phase.name} (${phase.formula})\nSpace Group: ${phase.spaceGroup} (${phase.crystalSystem})\nFOM: ${phase.fom}%\nLattice a: ${phase.latticeA || 'N/A'} Å\nMatched Peaks: ${phase.matchedPeaksCount}/${phase.totalReferencePeaks}`,
                            `phase-${pIdx}`
                          )}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-bold border border-slate-700 flex items-center justify-center gap-1 transition-all cursor-pointer"
                          title="Copy Phase Card"
                        >
                          {copiedKey === `phase-${pIdx}` ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Matching d-spacing reflection detail table */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-black text-white uppercase tracking-wider">
                    Reference Phase Standard Reflection Catalog
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64 custom-scrollbar border border-slate-800/80 rounded-xl">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-slate-900 text-indigo-400 font-black uppercase text-[9px] sticky top-0">
                      <tr>
                        <th className="p-2.5">Candidate Phase</th>
                        <th className="p-2.5">Ref d-spacings (Å)</th>
                        <th className="p-2.5">Measured d-spacings (Å)</th>
                        <th className="p-2.5">Match FOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-slate-300">
                      {results.candidate_phases.map((cp, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                          <td className="p-2.5 font-bold text-white">{cp.name} ({cp.formula})</td>
                          <td className="p-2.5 text-slate-400">{cp.referenceDSpacings.slice(0, 5).join(', ')}{cp.referenceDSpacings.length > 5 ? '...' : ''}</td>
                          <td className="p-2.5 text-sky-400">{results.detected_rings.slice(0, 5).map(r => r.d_spacing_a.toFixed(3)).join(', ')}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">{cp.fom.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800/80 text-center space-y-3">
              <Layers className="w-8 h-8 text-slate-600 mx-auto" />
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                No High-Confidence Phase Fingerprint Found
              </h5>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                No standard database phase matched with {'>'}50% Figure of Merit. Try calibrating the direct beam center (cx, cy), adjusting the sample-to-detector distance (D = {results.detector_geometry?.detector_distance_mm || 150} mm), or lowering the ring prominence threshold.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Azimuthal Texture & Pole Profile */}
      {activeTab === 'texture_azimuth' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Herman's Orientation Factor (f)</span>
              <div className="text-2xl font-black text-purple-400 font-mono my-2">
                {results.hermans_orientation_factor !== undefined ? results.hermans_orientation_factor.toFixed(4) : '0.0000'}
              </div>
              <span className="text-[8px] text-slate-400">
                f = 0: Random Powder | f = 1: Perfect Parallel | f = -0.5: Perpendicular
              </span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Anisotropy Score</span>
              <div className="text-2xl font-black text-sky-400 font-mono my-2">
                {results.anisotropy_index?.toFixed(4) || '0.0000'}
              </div>
              <span className="text-[8px] text-slate-400">
                Standard deviation of intensity over azimuthal angles χ [0°-360°]
              </span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Crystallographic Texture State</span>
              <div className="text-base font-black text-emerald-400 my-2 uppercase tracking-wide">
                {Math.abs(results.hermans_orientation_factor || 0) < 0.15 
                  ? 'Isotropic Powder' 
                  : (results.hermans_orientation_factor || 0) > 0.15 
                    ? 'Preferred Fiber Texture' 
                    : 'Transverse Orientation'}
              </div>
              <span className="text-[8px] text-slate-400">
                Debye ring azimuthal homogeneity assessment
              </span>
            </div>
          </div>

          {/* Azimuthal Intensity Curve Plot */}
          {results.azimuthal_profile && results.azimuthal_profile.length > 0 && (
            <div className="h-72 w-full bg-slate-950/90 p-4 rounded-3xl border border-slate-800 relative">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">
                Azimuthal Pole Profile I(χ) along Primary Bragg Ring [0° to 360°]
              </div>
              <ResponsiveContainer width="100%" height="88%">
                <AreaChart data={results.azimuthal_profile} margin={{ top: 10, right: 20, left: -10, bottom: 15 }}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="chi_deg" 
                    stroke="#64748b" 
                    fontSize={9} 
                    tickLine={false}
                    label={{ value: 'Azimuthal Angle χ (degrees)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={9} 
                    tickLine={false}
                    label={{ value: 'Intensity I(χ)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '14px' }} 
                    labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                    itemStyle={{ color: '#c084fc', fontSize: 10, fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="intensity" stroke="#c084fc" fill="#c084fc" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Spot Matrix (Single Crystal / SAED) */}
      {activeTab === 'spot_matrix' && (
        <div className="space-y-6">
          {/* Reciprocal Lattice Basis Vectors */}
          {results.spot_vectors && results.spot_vectors.length > 0 && (
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-sky-400" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider">
                  2D Reciprocal Unit Cell Basis Vectors (Zone Axis Indexing)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800 font-mono">
                  <div className="text-[8px] text-slate-500 uppercase">Primitive Vector |a*|</div>
                  <div className="text-sm font-bold text-sky-300">{results.spot_vectors[0].vector_1_len_px.toFixed(1)} px</div>
                  <div className="text-[9px] text-slate-400">d = {results.spot_vectors[0].v1_d_spacing_a.toFixed(3)}° 2θ</div>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800 font-mono">
                  <div className="text-[8px] text-slate-500 uppercase">Primitive Vector |b*|</div>
                  <div className="text-sm font-bold text-sky-300">{results.spot_vectors[0].vector_2_len_px.toFixed(1)} px</div>
                  <div className="text-[9px] text-slate-400">d = {results.spot_vectors[0].v2_d_spacing_a.toFixed(3)}° 2θ</div>
                </div>
                <div className="bg-black/40 p-3 rounded-xl border border-slate-800 font-mono">
                  <div className="text-[8px] text-slate-500 uppercase">Inter-vector Angle γ*</div>
                  <div className="text-sm font-bold text-emerald-400">{results.spot_vectors[0].inter_vector_angle_deg.toFixed(2)}°</div>
                  <div className="text-[9px] text-slate-400">Reciprocal angle</div>
                </div>
              </div>
            </div>
          )}

          {/* Spots Table */}
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Segmented Discrete Reflections ({results.detected_spots?.length || 0} spots)
              </span>
              <span className="text-[8px] font-mono text-slate-500">Connected Components Stats</span>
            </div>

            <div className="overflow-x-auto max-h-72 custom-scrollbar border border-slate-800 rounded-xl">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 text-sky-400 font-black uppercase text-[9px] sticky top-0">
                  <tr>
                    <th className="p-2.5">Spot ID</th>
                    <th className="p-2.5">Centroid (x, y)</th>
                    <th className="p-2.5">Radius (px)</th>
                    <th className="p-2.5">2θ Angle (deg)</th>
                    <th className="p-2.5">Area (px)</th>
                    <th className="p-2.5">Peak Intensity</th>
                    <th className="p-2.5">Integrated Counts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {results.detected_spots?.map((sp, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-2.5 text-sky-400 font-bold">#{sp.spot_id}</td>
                      <td className="p-2.5">({sp.x.toFixed(1)}, {sp.y.toFixed(1)})</td>
                      <td className="p-2.5">{sp.radius_px.toFixed(1)} px</td>
                      <td className="p-2.5 text-white font-bold">{sp.two_theta_deg.toFixed(3)}°</td>
                      <td className="p-2.5 text-slate-400">{sp.area_px}</td>
                      <td className="p-2.5 text-amber-400 font-bold">{sp.peak_intensity}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{sp.integrated_intensity.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Ring Ellipticity & Detector Tilt */}
      {activeTab === 'tilt_ellipse' && (
        <div className="space-y-6">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Sub-Pixel Ring Ellipse Fits & Detector Geometric Distortion
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              When a flat area detector is tilted relative to the incident beam, concentric Debye-Scherrer circles distort into ellipses.
              The eccentricity $e = 1 - b/a$ allows optical measurement of camera tilt angle $\alpha = \arccos(b/a)$.
            </p>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-slate-900 text-indigo-400 font-black uppercase text-[9px]">
                  <tr>
                    <th className="p-2.5">Ring #</th>
                    <th className="p-2.5">Semi-Major (a)</th>
                    <th className="p-2.5">Semi-Minor (b)</th>
                    <th className="p-2.5">Ellipticity (1-b/a)</th>
                    <th className="p-2.5">Tilt Axis Angle (φ)</th>
                    <th className="p-2.5">Detector Tilt (α)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {results.ring_ellipses && results.ring_ellipses.length > 0 ? (
                    results.ring_ellipses.map((e, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 text-amber-400 font-bold">#{e.ring_index}</td>
                        <td className="p-2.5">{e.semi_major_px.toFixed(2)} px</td>
                        <td className="p-2.5">{e.semi_minor_px.toFixed(2)} px</td>
                        <td className="p-2.5 text-sky-400 font-bold">{e.ellipticity.toFixed(4)}</td>
                        <td className="p-2.5">{e.tilt_angle_deg.toFixed(1)}°</td>
                        <td className="p-2.5 text-emerald-400 font-bold">{e.detector_tilt_deg.toFixed(2)}°</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-slate-500 font-sans text-xs">
                        No continuous Debye rings detected for ellipse fitting.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Python Reproducible Script */}
      {activeTab === 'python_script' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="text-[11px] font-black text-white uppercase tracking-wider">
                Reproducible Python Standalone Script
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(generatePythonScript(), 'py-script')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-mono font-extrabold uppercase flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              {copiedKey === 'py-script' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Copied Script!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Python Script</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-[10px] text-slate-300 max-h-96 overflow-y-auto custom-scrollbar">
            <pre className="whitespace-pre">{generatePythonScript()}</pre>
          </div>
        </div>
      )}
    </div>
  );
};
