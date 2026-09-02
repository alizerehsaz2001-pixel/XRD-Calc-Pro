import React, { useState, useRef, useMemo } from 'react';
import { LatticeParameters } from '../../types';
import { 
  NeutronAtomExtended, 
  calculateReciprocalScatterPlane, 
  calculateReciprocalLineCut,
  ReciprocalPoint, 
  ScatterPlaneType,
  ReciprocalLineCutPoint
} from '../../utils/neutronDiffractionPhysics';
import { 
  ZoomIn, ZoomOut, RotateCcw, Info, Crosshair, 
  Download, FileSpreadsheet, Activity, Table, 
  Sliders, Layers, Sparkles, CheckCircle2, Copy, Search
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

interface ReciprocalScatterPlaneViewProps {
  lattice: LatticeParameters;
  atoms: NeutronAtomExtended[];
  wavelength: number;
  lengthUnit: string;
}

export const ReciprocalScatterPlaneView: React.FC<ReciprocalScatterPlaneViewProps> = ({
  lattice,
  atoms,
  wavelength,
  lengthUnit
}) => {
  const [viewTab, setViewTab] = useState<'map' | 'line_cut' | 'table'>('map');
  const [planeType, setPlaneType] = useState<ScatterPlaneType>('HK0');
  const [layerOffset, setLayerOffset] = useState<number>(0);
  const [colorMode, setColorMode] = useState<'intensity' | 'phase' | 'xray_compare' | 'real_imag'>('intensity');
  const [scaleMode, setScaleMode] = useState<'linear' | 'sqrt' | 'log'>('sqrt');
  const [maxIndex, setMaxIndex] = useState<number>(5);
  const [zoom, setZoom] = useState<number>(1.0);
  const [showEwaldSphere, setShowEwaldSphere] = useState<boolean>(true);
  const [showQRings, setShowQRings] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<ReciprocalPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ReciprocalPoint | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Line Cut State
  const [lineCutPreset, setLineCutPreset] = useState<'H00' | 'HH0' | '00L' | 'H-H0' | 'custom'>('H00');
  const [customStartHkl, setCustomStartHkl] = useState<[number, number, number]>([0, 0, 0]);
  const [customEndHkl, setCustomEndHkl] = useState<[number, number, number]>([4, 0, 0]);
  const [lineCutSteps, setLineCutSteps] = useState<number>(120);

  // Table Search / Filter
  const [tableSearch, setTableSearch] = useState<string>('');
  const [tableFilterOnlyEwald, setTableFilterOnlyEwald] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate 2D Reciprocal Plane Points
  const { points, qMax } = useMemo(() => {
    return calculateReciprocalScatterPlane(planeType, maxIndex, lattice, atoms, wavelength, layerOffset);
  }, [planeType, maxIndex, lattice, atoms, wavelength, layerOffset]);

  const k_incident = (2 * Math.PI) / wavelength; // Ewald sphere radius (Å^-1)
  
  const maxIntensity = useMemo(() => {
    return Math.max(...points.map(p => p.F_nuc_sq), 1);
  }, [points]);

  const maxXrayIntensity = useMemo(() => {
    return Math.max(...points.map(p => p.F_xray_sq), 1);
  }, [points]);

  // Line Cut Trajectory Definition
  const [activeStartHkl, activeEndHkl] = useMemo((): [[number, number, number], [number, number, number]] => {
    switch (lineCutPreset) {
      case 'H00': return [[0, 0, layerOffset], [maxIndex, 0, layerOffset]];
      case 'HH0': return [[0, 0, layerOffset], [maxIndex, maxIndex, layerOffset]];
      case '00L': return [[0, 0, 0], [0, 0, maxIndex]];
      case 'H-H0': return [[-maxIndex, maxIndex, layerOffset], [maxIndex, -maxIndex, layerOffset]];
      case 'custom': return [customStartHkl, customEndHkl];
    }
  }, [lineCutPreset, maxIndex, layerOffset, customStartHkl, customEndHkl]);

  const lineCutData = useMemo(() => {
    return calculateReciprocalLineCut(activeStartHkl, activeEndHkl, lineCutSteps, lattice, atoms, wavelength, 0.08);
  }, [activeStartHkl, activeEndHkl, lineCutSteps, lattice, atoms, wavelength]);

  // SVG coordinate transformation
  const svgSize = 520;
  const center = svgSize / 2;
  const scale = (center * 0.85 * zoom) / Math.max(qMax, 1);

  const toSvgX = (qx: number) => center + qx * scale;
  const toSvgY = (qy: number) => center - qy * scale;

  // Plane axis labels
  const axisLabels = useMemo(() => {
    switch (planeType) {
      case 'HK0': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: `[001] Zone (L=${layerOffset})` };
      case 'H0L': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: `[010] Zone (K=${layerOffset})` };
      case '0KL': return { x: 'K [0 1 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: `[100] Zone (H=${layerOffset})` };
      case 'HHL': return { x: 'HH [1 1 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: '[1-10] Zone' };
      case 'H-HL': return { x: 'H-H [1 -1 0]* (Å⁻¹)', y: 'L [0 0 1]* (Å⁻¹)', zone: '[110] Zone' };
      case 'HK1': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: 'L = 1 Layer' };
      case 'HK2': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: 'L = 2 Layer' };
      case 'custom': return { x: 'H [1 0 0]* (Å⁻¹)', y: 'K [0 1 0]* (Å⁻¹)', zone: `Custom Plane (L=${layerOffset})` };
    }
  }, [planeType, layerOffset]);

  // Intensity scaler helper
  const getScaledIntensityRatio = (val: number, maxVal: number) => {
    if (val <= 0 || maxVal <= 0) return 0;
    const ratio = Math.min(1, val / maxVal);
    if (scaleMode === 'linear') return ratio;
    if (scaleMode === 'sqrt') return Math.sqrt(ratio);
    if (scaleMode === 'log') return Math.log10(1 + ratio * 9) / Math.log10(10);
    return ratio;
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['H,K,L,hkl,dSpacing_A,TwoTheta_deg,Q_mag_invA,Qx_invA,Qy_invA,Qz_invA,F_nuc_real,F_nuc_imag,F_nuc_sq,Phase_nuc_deg,F_xray_sq,IsAllowed,IsInEwaldSphere'];
    const rows = points.map(p => 
      `${p.h},${p.k},${p.l},"${p.hklKey}",${p.dSpacing.toFixed(4)},${p.twoTheta.toFixed(3)},${p.qMag.toFixed(4)},${p.qx.toFixed(4)},${p.qy.toFixed(4)},${p.qz.toFixed(4)},${p.F_nuc_real.toFixed(4)},${p.F_nuc_imag.toFixed(4)},${p.F_nuc_sq.toFixed(4)},${((p.phase_nuc * 180)/Math.PI).toFixed(2)},${p.F_xray_sq.toFixed(4)},${p.isAllowed},${p.isInEwaldSphere}`
    );
    const blob = new Blob([[headers.join('\n'), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reciprocal_scatter_plane_${planeType}_L${layerOffset}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLineCutCSV = () => {
    const headers = ['Step,H,K,L,hkl,Q_mag_invA,dSpacing_A,Intensity_Neutron,Intensity_Xray,Peak_F_nuc_sq,Peak_F_xray_sq'];
    const rows = lineCutData.map(p => 
      `${p.index},${p.h},${p.k},${p.l},"${p.hklStr}",${p.qMag.toFixed(4)},${p.dSpacing.toFixed(4)},${p.intensity_nuc.toFixed(4)},${p.intensity_xray.toFixed(4)},${p.F_nuc_sq.toFixed(4)},${p.F_xray_sq.toFixed(4)}`
    );
    const blob = new Blob([[headers.join('\n'), ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reciprocal_line_cut_${lineCutPreset}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neutron_scatter_plane_${planeType}_${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Filtered table points
  const filteredTablePoints = useMemo(() => {
    return points.filter(p => {
      if (tableFilterOnlyEwald && !p.isInEwaldSphere) return false;
      if (!tableSearch) return true;
      const s = tableSearch.toLowerCase();
      return (
        p.hklKey.includes(s) ||
        p.h.toString().includes(s) ||
        p.k.toString().includes(s) ||
        p.l.toString().includes(s) ||
        p.dSpacing.toFixed(2).includes(s)
      );
    });
  }, [points, tableSearch, tableFilterOnlyEwald]);

  return (
    <div className="flex flex-col gap-5 text-left w-full">
      {/* Top Telemetry & Control Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-black/40 p-4 rounded-2xl border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              2D Reciprocal Scatter Plane & Zone Axis
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              Zone: <strong className="text-white">{axisLabels.zone}</strong>
            </span>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              λ = {wavelength.toFixed(3)} Å | 2kᵢ = {(2 * k_incident).toFixed(2)} Å⁻¹
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kinematic nuclear structure factor amplitudes |F_nuc|², phase-angle distribution, and Ewald sphere boundary slices for single-crystal and texture neutron scattering.
          </p>
        </div>

        {/* View Mode Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-[#070D18] p-1.5 rounded-xl border border-white/10 shrink-0">
          {[
            { id: 'map', label: '2D Reciprocal Map', icon: Layers },
            { id: 'line_cut', label: '1D Line Cut (Q)', icon: Activity },
            { id: 'table', label: 'Reflection Table', icon: Table },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = viewTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plane Slicing & Parameters Bar */}
      <div className="bg-[#070D19] p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
        {/* Plane Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mr-1">Slice Plane:</span>
          {(['HK0', 'H0L', '0KL', 'HHL', 'H-HL', 'HK1', 'HK2', 'custom'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPlaneType(p)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black font-mono transition-all ${
                planeType === p
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-black/30 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              ({p})
            </button>
          ))}
        </div>

        {/* Layer Offset Slider for HK0/Custom */}
        {(planeType === 'HK0' || planeType === 'H0L' || planeType === '0KL' || planeType === 'custom') && (
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[8px] font-black text-slate-400 uppercase">Layer Offset:</span>
            <span className="text-xs font-mono font-bold text-emerald-400 w-4">{layerOffset}</span>
            <input 
              type="range"
              min="-4"
              max="4"
              step="1"
              value={layerOffset}
              onChange={(e) => setLayerOffset(parseInt(e.target.value))}
              className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        )}

        {/* Max Miller Index Bound */}
        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          <span className="text-[8px] font-black text-slate-400 uppercase">Max Index:</span>
          <span className="text-xs font-mono font-bold text-cyan-400">±{maxIndex}</span>
          <input 
            type="range"
            min="3"
            max="10"
            step="1"
            value={maxIndex}
            onChange={(e) => setMaxIndex(parseInt(e.target.value))}
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1.5 transition-all"
            title="Export Reciprocal Nodes CSV"
          >
            <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={handleDownloadSVG}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-slate-700 flex items-center gap-1.5 transition-all"
            title="Download Vector SVG"
          >
            <Download className="w-3 h-3 text-sky-400" />
            SVG
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewTab === 'map' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Reciprocal Plane SVG Map */}
          <div className="xl:col-span-8 bg-[#070D19] p-4 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center min-h-[490px] shadow-2xl group">
            {/* Subtle background glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04)_0%,transparent_70%)] pointer-events-none" />

            {/* Quick HUD controls overlay */}
            <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-[9px] font-bold">
              <button
                onClick={() => setZoom(z => Math.min(2.5, z + 0.2))}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.6, z - 0.2))}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(1.0)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="w-px h-3 bg-white/20 mx-0.5" />
              <button
                onClick={() => setShowEwaldSphere(!showEwaldSphere)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  showEwaldSphere ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Ewald Limit
              </button>
              <button
                onClick={() => setShowQRings(!showQRings)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  showQRings ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                |Q| Rings
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`px-2 py-1 rounded-lg transition-all ${
                  showGrid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Grid
              </button>
            </div>

            {/* Color & Scale Switcher Bar */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
              {/* Color Mode */}
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[9px] font-bold">
                <button
                  onClick={() => setColorMode('intensity')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    colorMode === 'intensity' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  |F_nuc|²
                </button>
                <button
                  onClick={() => setColorMode('phase')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    colorMode === 'phase' ? 'bg-purple-500/20 text-purple-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Phase (±π)
                </button>
                <button
                  onClick={() => setColorMode('xray_compare')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    colorMode === 'xray_compare' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Neutron vs X-ray
                </button>
                <button
                  onClick={() => setColorMode('real_imag')}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    colorMode === 'real_imag' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  F_real/imag
                </button>
              </div>

              {/* Scale Mode */}
              <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[8px] font-mono font-bold">
                <span className="text-slate-500 px-1">Scale:</span>
                {(['linear', 'sqrt', 'log'] as const).map(sc => (
                  <button
                    key={sc}
                    onClick={() => setScaleMode(sc)}
                    className={`px-2 py-0.5 rounded uppercase transition-all ${
                      scaleMode === sc ? 'bg-slate-700 text-white font-black' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sc === 'sqrt' ? '√I' : sc}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Reciprocal Plane */}
            <div ref={containerRef} className="w-full max-w-[520px] aspect-square flex items-center justify-center relative">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgSize} ${svgSize}`}
                className="w-full h-full select-none cursor-crosshair drop-shadow-md"
              >
                <defs>
                  {/* Radial Glows */}
                  <radialGradient id="ewaldGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.05" />
                    <stop offset="90%" stopColor="#06b6d4" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
                  </radialGradient>
                  <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Background Circular Field */}
                <circle cx={center} cy={center} r={center - 10} fill="#050914" stroke="#1e293b" strokeWidth="1" />

                {/* Concentric |Q| Rings (1, 2, 3, 4, 5, 6 Å^-1) */}
                {showQRings && [1, 2, 3, 4, 5, 6].map(q => {
                  const r = q * scale;
                  if (r > center - 10) return null;
                  return (
                    <g key={`q-ring-${q}`}>
                      <circle
                        cx={center}
                        cy={center}
                        r={r}
                        fill="none"
                        stroke="#334155"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.5"
                      />
                      <text
                        x={center + r - 4}
                        y={center - 4}
                        fill="#64748b"
                        fontSize="8"
                        fontFamily="monospace"
                        textAnchor="end"
                      >
                        {q} Å⁻¹
                      </text>
                    </g>
                  );
                })}

                {/* Ewald Sphere Kinematic Boundary Circle (Q = 4π/λ) */}
                {showEwaldSphere && (
                  <g>
                    {/* Maximum Bragg reachable boundary Q_max = 2 * k_i = 4π/λ */}
                    <circle
                      cx={center}
                      cy={center}
                      r={2 * k_incident * scale}
                      fill="url(#ewaldGlow)"
                      stroke="#06b6d4"
                      strokeWidth="1.5"
                      strokeDasharray="5 3"
                      opacity="0.8"
                    />
                    <text
                      x={center}
                      y={Math.max(16, center - 2 * k_incident * scale + 12)}
                      fill="#06b6d4"
                      fontSize="9"
                      fontWeight="bold"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      Ewald Limit (2kᵢ = {(2 * k_incident).toFixed(2)} Å⁻¹)
                    </text>
                  </g>
                )}

                {/* Reciprocal Space Coordinate Axes */}
                {showGrid && (
                  <g opacity="0.6">
                    <line x1="20" y1={center} x2={svgSize - 20} y2={center} stroke="#475569" strokeWidth="1.5" />
                    <line x1={center} y1="20" x2={center} y2={svgSize - 20} stroke="#475569" strokeWidth="1.5" />

                    <text x={svgSize - 25} y={center - 8} fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {axisLabels.x.split(' ')[0]}*
                    </text>
                    <text x={center + 8} y="32" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">
                      {axisLabels.y.split(' ')[0]}*
                    </text>
                  </g>
                )}

                {/* Origin (0 0 0) marker */}
                <circle cx={center} cy={center} r="6" fill="#10b981" />
                <circle cx={center} cy={center} r="14" fill="url(#centerGlow)" />
                <text x={center + 8} y={center + 14} fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                  (0 0 {layerOffset})
                </text>

                {/* Reciprocal Lattice Points */}
                {points.map((pt, idx) => {
                  const cx = toSvgX(pt.qx);
                  const cy = toSvgY(pt.qy);

                  if (cx < 10 || cx > svgSize - 10 || cy < 10 || cy > svgSize - 10) return null;

                  const isHovered = hoveredPoint?.hklKey === pt.hklKey;
                  const isSelected = selectedPoint?.hklKey === pt.hklKey;

                  // Radius mapped with scaleMode
                  const scaledRatio = getScaledIntensityRatio(pt.F_nuc_sq, maxIntensity);
                  const radius = Math.max(3.5, Math.min(18, 4 + scaledRatio * 14));

                  // Color calculation based on colorMode
                  let nodeColor = '#10b981';
                  let strokeColor = '#059669';

                  if (colorMode === 'intensity') {
                    if (pt.F_nuc_sq < 0.001) {
                      nodeColor = '#334155'; // Extinct / Systematic absence
                      strokeColor = '#1e293b';
                    } else {
                      if (scaledRatio > 0.6) {
                        nodeColor = '#34d399';
                        strokeColor = '#6ee7b7';
                      } else if (scaledRatio > 0.2) {
                        nodeColor = '#059669';
                        strokeColor = '#10b981';
                      } else {
                        nodeColor = '#047857';
                        strokeColor = '#059669';
                      }
                    }
                  } else if (colorMode === 'phase') {
                    const deg = (pt.phase_nuc * 180) / Math.PI;
                    if (Math.abs(deg) < 15) {
                      nodeColor = '#10b981'; // 0 phase
                    } else if (Math.abs(Math.abs(deg) - 180) < 15) {
                      nodeColor = '#f43f5e'; // π (180° inverted) phase
                    } else if (deg > 0) {
                      nodeColor = '#8b5cf6'; // + imaginary phase
                    } else {
                      nodeColor = '#06b6d4'; // - imaginary phase
                    }
                    strokeColor = '#ffffff';
                  } else if (colorMode === 'xray_compare') {
                    const normNuc = pt.F_nuc_sq / maxIntensity;
                    const normXray = pt.F_xray_sq / maxXrayIntensity;
                    if (normNuc > normXray * 1.5) {
                      nodeColor = '#3b82f6'; // Neutron dominant
                      strokeColor = '#60a5fa';
                    } else if (normXray > normNuc * 1.5) {
                      nodeColor = '#ec4899'; // X-ray dominant
                      strokeColor = '#f472b6';
                    } else {
                      nodeColor = '#a855f7'; // Balanced
                      strokeColor = '#c084fc';
                    }
                  } else if (colorMode === 'real_imag') {
                    if (Math.abs(pt.F_nuc_imag) > Math.abs(pt.F_nuc_real) * 0.5) {
                      nodeColor = '#ec4899'; // Imaginary dominant (Non-centrosymmetric)
                      strokeColor = '#f472b6';
                    } else if (pt.F_nuc_real < 0) {
                      nodeColor = '#f59e0b'; // Negative Real (Negative b contrast)
                      strokeColor = '#fbbf24';
                    } else {
                      nodeColor = '#10b981'; // Positive Real (Standard Centrosymmetric)
                      strokeColor = '#34d399';
                    }
                  }

                  return (
                    <g
                      key={`${pt.hklKey}-${idx}`}
                      className="cursor-pointer transition-transform duration-200"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setSelectedPoint(pt)}
                    >
                      {(isHovered || isSelected) && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 6}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          className="animate-spin"
                        />
                      )}

                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={nodeColor}
                        stroke={isSelected ? '#ffffff' : strokeColor}
                        strokeWidth={isSelected ? 2.5 : 1.2}
                        opacity={pt.isInEwaldSphere ? (pt.isAllowed ? 0.95 : 0.4) : 0.25}
                      />

                      {(isHovered || isSelected || scaledRatio > 0.35) && (
                        <text
                          x={cx}
                          y={cy - radius - 3}
                          fill="#f8fafc"
                          fontSize="8"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                          className="pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                        >
                          {pt.h} {pt.k} {pt.l}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom quick caption */}
            <div className="flex items-center justify-between w-full mt-2 px-2 text-[10px] text-slate-400">
              <span className="font-mono">
                Points: <strong>{points.length}</strong> | Accessible: <strong>{points.filter(p => p.isInEwaldSphere && p.isAllowed).length}</strong>
              </span>
              <span className="text-slate-500 font-mono">
                Click or hover node for nuclear structure factor breakdown.
              </span>
            </div>
          </div>

          {/* Node Inspector Card */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-[#0B1528] p-5 rounded-3xl border border-blue-500/20 shadow-xl text-left relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">
                    {hoveredPoint || selectedPoint ? 'Reflection Node Inspector' : 'Select a Reflection'}
                  </h4>
                </div>
                {(hoveredPoint || selectedPoint) && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {(hoveredPoint || selectedPoint)?.hklKey}
                  </span>
                )}
              </div>

              {hoveredPoint || selectedPoint ? (
                (() => {
                  const p = hoveredPoint || selectedPoint!;
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">d-Spacing</span>
                          <span className="text-xs font-mono font-black text-blue-400">
                            {p.dSpacing.toFixed(4)} <span className="text-[9px] font-sans text-slate-500">Å</span>
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">2θ (Neutron)</span>
                          <span className="text-xs font-mono font-black text-cyan-400">
                            {p.twoTheta < 180 ? `${p.twoTheta.toFixed(2)}°` : 'Beyond Limit'}
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">|Q| Magnitude</span>
                          <span className="text-xs font-mono font-black text-emerald-400">
                            {p.qMag.toFixed(3)} <span className="text-[9px] font-sans text-slate-500">Å⁻¹</span>
                          </span>
                        </div>
                        <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[8px] font-black text-slate-500 uppercase block">Kinematic |F_nuc|²</span>
                          <span className="text-xs font-mono font-black text-amber-400">
                            {p.F_nuc_sq.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">Nuclear Phase Angle:</span>
                          <span className={`font-mono font-black ${p.phase_nuc < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {((p.phase_nuc * 180) / Math.PI).toFixed(1)}° ({(p.phase_nuc / Math.PI).toFixed(2)}π)
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">Complex Form F_nuc:</span>
                          <span className="font-mono text-xs text-slate-200">
                            {p.F_nuc_real.toFixed(2)} {p.F_nuc_imag >= 0 ? '+' : '-'} {Math.abs(p.F_nuc_imag).toFixed(2)}i
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">X-ray Structure Factor |F_x|²:</span>
                          <span className="font-mono font-black text-purple-400">{p.F_xray_sq.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">Ewald Condition:</span>
                          <span className={`font-mono font-black ${p.isInEwaldSphere ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {p.isInEwaldSphere ? 'Accessible in 4π/λ' : 'Evanescent / Cutoff'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs font-medium">
                  Move your cursor over any circular node in the reciprocal plane to inspect its exact structure factor components and diffraction geometry.
                </div>
              )}
            </div>

            {/* Plane Physics Guide */}
            <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Reciprocal Space Physics</span>
              </div>
              <p className="leading-relaxed">
                Neutron scattering is governed by point-like nuclear potentials, meaning atomic scattering lengths <strong className="text-emerald-400 font-mono">b</strong> do not decay with angle (no form factor drop-off). High-Q Bragg reflections remain sharp and intense out to large scattering vectors.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 1D Reciprocal Line Cut */}
      {viewTab === 'line_cut' && (
        <div className="space-y-6">
          {/* Line Cut Controls */}
          <div className="bg-[#070D19] p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Direction Trajectory:</span>
              {[
                { id: 'H00', label: '[H 0 0]*' },
                { id: 'HH0', label: '[H H 0]*' },
                { id: '00L', label: '[0 0 L]*' },
                { id: 'H-H0', label: '[H -H 0]*' },
                { id: 'custom', label: 'Custom Path' },
              ].map(dir => (
                <button
                  key={dir.id}
                  onClick={() => setLineCutPreset(dir.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    lineCutPreset === dir.id 
                      ? 'bg-emerald-600 text-white shadow' 
                      : 'bg-black/30 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {dir.label}
                </button>
              ))}
            </div>

            {/* Custom trajectory inputs */}
            {lineCutPreset === 'custom' && (
              <div className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 text-[9px] font-mono">
                <span className="text-slate-500">From (H K L):</span>
                <input 
                  type="number" 
                  value={customStartHkl[0]} 
                  onChange={(e) => setCustomStartHkl([parseFloat(e.target.value) || 0, customStartHkl[1], customStartHkl[2]])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
                <input 
                  type="number" 
                  value={customStartHkl[1]} 
                  onChange={(e) => setCustomStartHkl([customStartHkl[0], parseFloat(e.target.value) || 0, customStartHkl[2]])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
                <input 
                  type="number" 
                  value={customStartHkl[2]} 
                  onChange={(e) => setCustomStartHkl([customStartHkl[0], customStartHkl[1], parseFloat(e.target.value) || 0])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
                <span className="text-slate-500">→ To (H K L):</span>
                <input 
                  type="number" 
                  value={customEndHkl[0]} 
                  onChange={(e) => setCustomEndHkl([parseFloat(e.target.value) || 0, customEndHkl[1], customEndHkl[2]])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
                <input 
                  type="number" 
                  value={customEndHkl[1]} 
                  onChange={(e) => setCustomEndHkl([customEndHkl[0], parseFloat(e.target.value) || 0, customEndHkl[2]])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
                <input 
                  type="number" 
                  value={customEndHkl[2]} 
                  onChange={(e) => setCustomEndHkl([customEndHkl[0], customEndHkl[1], parseFloat(e.target.value) || 0])} 
                  className="w-10 bg-slate-900 border border-slate-800 rounded px-1 text-center text-white" 
                />
              </div>
            )}

            <button
              onClick={handleExportLineCutCSV}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl text-[9px] font-mono font-extrabold uppercase border border-emerald-500/30 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3 h-3" />
              Export Line Cut CSV
            </button>
          </div>

          {/* Line Cut Recharts Plot */}
          <div className="h-80 w-full bg-slate-950/90 p-4 rounded-3xl border border-slate-800 relative">
            <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Reciprocal Intensity Profile I(Q) along ({activeStartHkl.join(' ')}) → ({activeEndHkl.join(' ')})
              </span>
              <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Continuous Bragg & Diffuse Gaussian Simulation
              </span>
            </div>

            <ResponsiveContainer width="100%" height="88%">
              <LineChart data={lineCutData} margin={{ top: 10, right: 20, left: -10, bottom: 15 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hklStr" 
                  stroke="#64748b" 
                  fontSize={8} 
                  tickLine={false}
                  interval={Math.floor(lineCutData.length / 8)}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={9} 
                  tickLine={false}
                  label={{ value: 'Intensity (a.u.)', angle: -90, position: 'insideLeft', offset: 15, fill: '#64748b', fontSize: 9, fontWeight: 'bold' }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '14px' }} 
                  labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                  formatter={(val: any, name: string) => [
                    `${Number(val).toFixed(2)} a.u.`, 
                    name === 'intensity_nuc' ? 'Neutron Intensity' : 'X-ray Intensity'
                  ]}
                  labelFormatter={(label: any) => `Position (H K L): ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="intensity_nuc" 
                  name="Neutron Coherent Nuclear" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 5, fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="intensity_xray" 
                  name="X-ray Electronic" 
                  stroke="#ec4899" 
                  strokeWidth={1.5} 
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#ec4899' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: Complete Reflection Table */}
      {viewTab === 'table' && (
        <div className="bg-[#070D19] p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Calculated Reciprocal Reflection Nodes ({filteredTablePoints.length} / {points.length})
              </span>
              <label className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={tableFilterOnlyEwald}
                  onChange={(e) => setTableFilterOnlyEwald(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                />
                <span>Only Ewald Accessible (Q ≤ 4π/λ)</span>
              </label>
            </div>

            <div className="relative w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input 
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Filter by (h k l) or d..."
                className="w-full bg-black/40 border border-slate-800 text-white rounded-xl pl-8 pr-3 py-1.5 text-[10px] font-mono outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 custom-scrollbar border border-slate-800/80 rounded-2xl">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-950 text-emerald-400 font-black uppercase text-[9px] sticky top-0">
                <tr>
                  <th className="p-2.5">Node (h k l)</th>
                  <th className="p-2.5">d-Spacing (Å)</th>
                  <th className="p-2.5">2θ (deg)</th>
                  <th className="p-2.5">|Q| (Å⁻¹)</th>
                  <th className="p-2.5">|F_nuc|²</th>
                  <th className="p-2.5">Nuclear Phase</th>
                  <th className="p-2.5">|F_xray|²</th>
                  <th className="p-2.5">Ewald State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {filteredTablePoints.map((pt, idx) => (
                  <tr key={`tbl-${idx}`} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-2.5 font-bold text-white">{pt.hklKey}</td>
                    <td className="p-2.5 text-blue-400">{pt.dSpacing.toFixed(4)} Å</td>
                    <td className="p-2.5">{pt.twoTheta < 180 ? `${pt.twoTheta.toFixed(2)}°` : 'Beyond'}</td>
                    <td className="p-2.5 text-emerald-400 font-bold">{pt.qMag.toFixed(3)}</td>
                    <td className="p-2.5 font-bold text-amber-400">{pt.F_nuc_sq.toFixed(2)}</td>
                    <td className="p-2.5 text-purple-400">{((pt.phase_nuc * 180)/Math.PI).toFixed(1)}°</td>
                    <td className="p-2.5 text-slate-400">{pt.F_xray_sq.toFixed(2)}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        pt.isInEwaldSphere ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {pt.isInEwaldSphere ? 'Accessible' : 'Evanescent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
