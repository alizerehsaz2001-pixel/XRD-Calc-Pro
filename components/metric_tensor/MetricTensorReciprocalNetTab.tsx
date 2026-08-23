import React, { useRef, useState, useEffect } from 'react';
import { 
  Compass, 
  Target, 
  Box, 
  Grid, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Info,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { CrystalSystem, fmt } from './metricTensorTypes';

interface MetricTensorReciprocalNetTabProps {
  system: CrystalSystem;
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
  h1: number; setH1: (v: number) => void;
  k1: number; setK1: (v: number) => void;
  h2: number; setH2: (v: number) => void;
  k2: number; setK2: (v: number) => void;
  vec1Props: { gMag: number; dSpacing: number; thetaDeg: number | null; isValidBragg: boolean };
  vec2Props: { gMag: number; dSpacing: number; thetaDeg: number | null; isValidBragg: boolean };
  interVectorAngle: number;
  vectorParallelogramArea: number;
  getReciprocalVectorProps: (h: number, k: number) => { gMag: number; dSpacing: number; thetaDeg: number | null; isValidBragg: boolean };
}

export const MetricTensorReciprocalNetTab: React.FC<MetricTensorReciprocalNetTabProps> = ({
  system,
  aStar,
  bStar,
  cStar,
  alphaStar,
  betaStar,
  gammaStar,
  h1, setH1,
  k1, setK1,
  h2, setH2,
  k2, setK2,
  vec1Props,
  vec2Props,
  interVectorAngle,
  vectorParallelogramArea,
  getReciprocalVectorProps
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Visualizer interactive state
  const [reciprocalPlane, setReciprocalPlane] = useState<'hk0' | 'h0l' | '0kl'>('hk0');
  const [reciprocalGridRange, setReciprocalGridRange] = useState<number>(4);
  const [reciprocalZoom, setReciprocalZoom] = useState<number>(1.0);
  const [reciprocalPan, setReciprocalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showEwaldOverlay, setShowEwaldOverlay] = useState<boolean>(false);
  const [ewaldWavelength, setEwaldWavelength] = useState<number>(1.5406); // Cu Ka in Å
  const [ewaldAngle, setEwaldAngle] = useState<number>(0);
  const [showBrillouinZone, setShowBrillouinZone] = useState<boolean>(false);
  const [showSecondVector, setShowSecondVector] = useState<boolean>(true);
  const [showMeshParallelogram, setShowMeshParallelogram] = useState<boolean>(true);

  const [hoveredNode, setHoveredNode] = useState<{ h: number; k: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ h: number; k: number } | null>(null);

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Dark Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + reciprocalPan.x;
    const centerY = height / 2 + reciprocalPan.y;

    let v1Star = aStar, v2Star = bStar, angleStarRad = (gammaStar * Math.PI) / 180;
    let lbl1 = 'a*', lbl2 = 'b*';
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar; v2Star = cStar; angleStarRad = (betaStar * Math.PI) / 180;
      lbl1 = 'a*'; lbl2 = 'c*';
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar; v2Star = cStar; angleStarRad = (alphaStar * Math.PI) / 180;
      lbl1 = 'b*'; lbl2 = 'c*';
    }

    const scale = (Math.min(width, height) / (2 * (reciprocalGridRange + 0.8) * Math.max(v1Star, v2Star, 0.1))) * reciprocalZoom;

    const ax = v1Star * scale;
    const ay = 0;
    const bx = v2Star * Math.cos(angleStarRad) * scale;
    const by = -v2Star * Math.sin(angleStarRad) * scale;

    // 1. Draw 1st Brillouin Zone
    if (showBrillouinZone) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const neighbors = [
        { h: 1, k: 0 }, { h: -1, k: 0 },
        { h: 0, k: 1 }, { h: 0, k: -1 },
        { h: 1, k: 1 }, { h: -1, k: -1 },
        { h: 1, k: -1 }, { h: -1, k: 1 }
      ];

      const pts: { x: number; y: number }[] = [];
      const numSteps = 36;
      for (let i = 0; i < numSteps; i++) {
        const angle = (i * 2 * Math.PI) / numSteps;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let maxR = 1000;
        neighbors.forEach((n) => {
          const kx = n.h * ax + n.k * bx;
          const ky = n.h * ay + n.k * by;
          const kSq = kx * kx + ky * ky;
          if (kSq > 1e-5) {
            const proj = dx * kx + dy * ky;
            if (proj > 1e-5) {
              const rVal = (kSq / 2) / proj;
              if (rVal < maxR) maxR = rVal;
            }
          }
        });
        pts.push({ x: centerX + dx * maxR, y: centerY + dy * maxR });
      }

      ctx.beginPath();
      pts.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw Mesh Parallelogram
    if (showMeshParallelogram) {
      const g1x = h1 * ax + k1 * bx;
      const g1y = h1 * ay + k1 * by;
      const g2x = h2 * ax + k2 * bx;
      const g2y = h2 * ay + k2 * by;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.07)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + g1x, centerY + g1y);
      ctx.lineTo(centerX + g1x + g2x, centerY + g1y + g2y);
      ctx.lineTo(centerX + g2x, centerY + g2y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // 3. Draw Ewald Circle Overlay
    let ewaldCenterX = 0, ewaldCenterY = 0, ewaldRadiusPx = 0;
    if (showEwaldOverlay && ewaldWavelength > 0) {
      const rStar = 1 / ewaldWavelength;
      ewaldRadiusPx = rStar * scale;

      const angleRad = (ewaldAngle * Math.PI) / 180;
      const k0x = rStar * Math.cos(angleRad);
      const k0y = rStar * Math.sin(angleRad);

      ewaldCenterX = centerX - k0x * scale;
      ewaldCenterY = centerY + k0y * scale;

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 4]);

      ctx.beginPath();
      ctx.arc(ewaldCenterX, ewaldCenterY, ewaldRadiusPx, 0, 2 * Math.PI);
      ctx.stroke();

      // Incident beam vector k0
      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ewaldCenterX, ewaldCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`k₀ (${ewaldAngle}°)`, (centerX + ewaldCenterX) / 2, (centerY + ewaldCenterY) / 2 - 6);
      ctx.restore();
    }

    // 4. Draw Grid Lines
    const range = reciprocalGridRange;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    for (let h = -range; h <= range; h++) {
      for (let k = -range; k <= range; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;

        if (h < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + ax, py + ay);
          ctx.stroke();
        }
        if (k < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + bx, py + by);
          ctx.stroke();
        }
      }
    }

    // Coordinate Axes at Origin
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0); ctx.lineTo(centerX, height);
    ctx.stroke();

    // 5. Draw Reciprocal Nodes
    for (let h = -range; h <= range; h++) {
      for (let k = -range; k <= range; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;

        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        const isOrigin = (h === 0 && k === 0);
        const isVector1 = (h === h1 && k === k1);
        const isVector2 = (showSecondVector && h === h2 && k === k2);
        const isHovered = (hoveredNode?.h === h && hoveredNode?.k === k);
        const isSelected = (selectedNode?.h === h && selectedNode?.k === k);

        let isEwaldIntersect = false;
        if (showEwaldOverlay && ewaldRadiusPx > 0 && !isOrigin) {
          const dist = Math.sqrt((px - ewaldCenterX) ** 2 + (py - ewaldCenterY) ** 2);
          if (Math.abs(dist - ewaldRadiusPx) <= 12) isEwaldIntersect = true;
        }

        let ptColor = '#64748b';
        let ptRadius = 2.8;

        if (isOrigin) {
          ptColor = '#f43f5e';
          ptRadius = 5.5;
        } else if (isVector1) {
          ptColor = '#10b981';
          ptRadius = 5;
        } else if (isVector2) {
          ptColor = '#d946ef';
          ptRadius = 5;
        } else if (isEwaldIntersect) {
          ptColor = '#f59e0b';
          ptRadius = 4.5;
        }

        if (isEwaldIntersect) {
          ctx.save();
          ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
          ctx.beginPath();
          ctx.arc(px, py, 9, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }

        ctx.fillStyle = ptColor;
        ctx.beginPath();
        ctx.arc(px, py, ptRadius, 0, 2 * Math.PI);
        ctx.fill();

        if (isHovered || isSelected) {
          ctx.strokeStyle = isHovered ? '#38bdf8' : '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, ptRadius + 4, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          const tag = reciprocalPlane === 'h0l' ? `(${h} 0 ${k})` : reciprocalPlane === '0kl' ? `(0 ${h} ${k})` : `(${h} ${k} 0)`;
          ctx.fillText(tag, px + 7, py - 6);
        }
      }
    }

    const drawArrow = (fromX: number, fromY: number, toX: number, toY: number, strokeColor: string, lineWidth: number = 2.5) => {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      const headlen = 9;
      const angle = Math.atan2(toY - fromY, toX - fromX);
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    // 6. Draw Basis Arrows
    drawArrow(centerX, centerY, centerX + ax, centerY + ay, '#06b6d4', 2.8);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl1, centerX + ax + 6, centerY + ay + 14);

    drawArrow(centerX, centerY, centerX + bx, centerY + by, '#a855f7', 2.8);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl2, centerX + bx + 6, centerY + by - 6);

    // Vector 1 (Emerald)
    const g1x = h1 * ax + k1 * bx;
    const g1y = h1 * ay + k1 * by;
    if (h1 !== 0 || k1 !== 0) {
      drawArrow(centerX, centerY, centerX + g1x, centerY + g1y, '#10b981', 3);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`g1*`, centerX + g1x + 8, centerY + g1y - 4);
    }

    // Vector 2 (Fuchsia)
    if (showSecondVector && (h2 !== 0 || k2 !== 0)) {
      const g2x = h2 * ax + k2 * bx;
      const g2y = h2 * ay + k2 * by;
      drawArrow(centerX, centerY, centerX + g2x, centerY + g2y, '#d946ef', 2.5);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`g2*`, centerX + g2x + 8, centerY + g2y - 4);
    }

  }, [
    system, aStar, bStar, cStar, alphaStar, betaStar, gammaStar,
    h1, k1, h2, k2, reciprocalPlane, reciprocalGridRange, reciprocalZoom, reciprocalPan,
    showEwaldOverlay, ewaldWavelength, ewaldAngle, showBrillouinZone, showSecondVector,
    showMeshParallelogram, hoveredNode, selectedNode
  ]);

  // Mouse interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (isPanning) {
      setReciprocalPan({
        x: mouseX - panStart.x,
        y: mouseY - panStart.y
      });
      return;
    }

    // Hit-testing nodes
    const centerX = canvas.width / 2 + reciprocalPan.x;
    const centerY = canvas.height / 2 + reciprocalPan.y;

    let v1Star = aStar, v2Star = bStar, angleStarRad = (gammaStar * Math.PI) / 180;
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar; v2Star = cStar; angleStarRad = (betaStar * Math.PI) / 180;
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar; v2Star = cStar; angleStarRad = (alphaStar * Math.PI) / 180;
    }

    const scale = (Math.min(canvas.width, canvas.height) / (2 * (reciprocalGridRange + 0.8) * Math.max(v1Star, v2Star, 0.1))) * reciprocalZoom;
    const ax = v1Star * scale;
    const ay = 0;
    const bx = v2Star * Math.cos(angleStarRad) * scale;
    const by = -v2Star * Math.sin(angleStarRad) * scale;

    let found: { h: number; k: number } | null = null;
    const range = reciprocalGridRange;

    for (let h = -range; h <= range; h++) {
      for (let k = -range; k <= range; k++) {
        const px = centerX + h * ax + k * bx;
        const py = centerY + h * ay + k * by;
        const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
        if (dist <= 12) {
          found = { h, k };
          break;
        }
      }
      if (found) break;
    }
    setHoveredNode(found);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    } else {
      setIsPanning(true);
      setPanStart({ x: mouseX - reciprocalPan.x, y: mouseY - reciprocalPan.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `reciprocal-net-${reciprocalPlane}-${system.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const activeInspectNode = hoveredNode || selectedNode;
  const inspectProps = activeInspectNode ? getReciprocalVectorProps(activeInspectNode.h, activeInspectNode.k) : null;

  return (
    <div className="space-y-6">

      {/* Main Reciprocal Visualizer Card */}
      <div className="bg-slate-950 rounded-3xl p-6 lg:p-8 border border-slate-800/80 shadow-xl space-y-5">
        
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Reciprocal Lattice Net 2D Slice Visualizer
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                  {reciprocalPlane} Plane
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Hover or click any node to calculate d-spacing, reciprocal magnitude, and Bragg condition
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPNG}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            title="Export high-resolution PNG image"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export PNG
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs">
          
          {/* Plane Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono">
            {(['hk0', 'h0l', '0kl'] as const).map((plane) => (
              <button
                key={plane}
                onClick={() => setReciprocalPlane(plane)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  reciprocalPlane === plane
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                ({plane})
              </button>
            ))}
          </div>

          {/* Grid Range */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px] px-1 font-bold">Grid:</span>
            {[3, 4, 6, 8].map((range) => (
              <button
                key={range}
                onClick={() => setReciprocalGridRange(range)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                  reciprocalGridRange === range ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ±{range}
              </button>
            ))}
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowEwaldOverlay(!showEwaldOverlay)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showEwaldOverlay
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Ewald Circle
            </button>

            <button
              onClick={() => setShowBrillouinZone(!showBrillouinZone)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showBrillouinZone
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              1st BZ
            </button>

            <button
              onClick={() => setShowMeshParallelogram(!showMeshParallelogram)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showMeshParallelogram
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Mesh Cell
            </button>

            <button
              onClick={() => setShowSecondVector(!showSecondVector)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                showSecondVector
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              g₂* Vector
            </button>
          </div>

          {/* Zoom & Pan Controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setReciprocalZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1 font-bold">
              {Math.round(reciprocalZoom * 100)}%
            </span>
            <button
              onClick={() => setReciprocalZoom((z) => Math.max(0.5, z - 0.2))}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setReciprocalZoom(1.0); setReciprocalPan({ x: 0, y: 0 }); }}
              className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ewald Wavelength Sub-Bar */}
        {showEwaldOverlay && (
          <div className="flex flex-wrap items-center justify-between p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl text-xs gap-3 font-mono">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-amber-200">X-Ray Anode (λ):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'Cu Kα (1.5406 Å)', val: 1.5406 },
                  { label: 'Mo Kα (0.7107 Å)', val: 0.7107 },
                  { label: 'Co Kα (1.7890 Å)', val: 1.7890 },
                  { label: 'Cr Kα (2.2897 Å)', val: 2.2897 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    onClick={() => setEwaldWavelength(preset.val)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      ewaldWavelength === preset.val
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900 text-amber-300/80 hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[11px] text-amber-300 font-bold">Angle (φ): {ewaldAngle}°</span>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={ewaldAngle}
                onChange={(e) => setEwaldAngle(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Canvas Element with Overlay Info */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <canvas
            ref={canvasRef}
            width={720}
            height={360}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => { setHoveredNode(null); setIsPanning(false); }}
            className="w-full h-auto max-h-[360px] object-contain cursor-crosshair"
          />

          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Hover nodes to inspect | Click node to set vectors | Drag to pan
          </div>

          {/* Node Tooltip Card */}
          {activeInspectNode && inspectProps && (
            <div className="absolute bottom-3 right-3 bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-cyan-500/40 shadow-2xl text-xs font-mono space-y-2 max-w-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-3">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  Reflection ({activeInspectNode.h} {activeInspectNode.k} 0)
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {hoveredNode ? 'HOVERED' : 'SELECTED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <span className="text-slate-400">Reciprocal |g*|:</span>
                <span className="text-emerald-400 font-bold">{fmt(inspectProps.gMag, 4)} Å⁻¹</span>

                <span className="text-slate-400">d-Spacing:</span>
                <span className="text-cyan-300 font-bold">{fmt(inspectProps.dSpacing, 4)} Å</span>

                {showEwaldOverlay && (
                  <>
                    <span className="text-slate-400">Bragg 2θ:</span>
                    <span className={inspectProps.isValidBragg ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                      {inspectProps.isValidBragg ? `${fmt(inspectProps.thetaDeg! * 2, 2)}°` : 'Beyond Limit'}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => { setH1(activeInspectNode.h); setK1(activeInspectNode.k); }}
                  className="flex-1 py-1 px-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer"
                >
                  Set as g1*
                </button>
                {showSecondVector && (
                  <button
                    onClick={() => { setH2(activeInspectNode.h); setK2(activeInspectNode.k); }}
                    className="flex-1 py-1 px-2 bg-fuchsia-600/30 hover:bg-fuchsia-600/50 text-fuchsia-300 border border-fuchsia-500/40 rounded-lg text-[10px] font-bold transition-all text-center cursor-pointer"
                  >
                    Set as g2*
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-around text-xs font-mono text-slate-400 pt-1 gap-3">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-cyan-500 rounded" /> {reciprocalPlane === '0kl' ? 'b*' : 'a*'} basis axis</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-violet-500 rounded" /> {reciprocalPlane === 'hk0' ? 'b*' : 'c*'} basis axis</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded" /> Vector g1*</span>
          {showSecondVector && (
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-fuchsia-500 rounded" /> Vector g2*</span>
          )}
          {showEwaldOverlay && (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /> Ewald Sphere</span>
          )}
        </div>

        {/* Live Vector Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-1">
            <span className="text-emerald-400 font-bold block flex items-center justify-between">
              <span>g1* ({h1} {k1} 0)</span>
              <span className="text-[10px] text-emerald-500/80 font-sans">PRIMARY</span>
            </span>
            <div className="text-slate-300">|g1*| = <span className="text-emerald-300 font-bold">{fmt(vec1Props.gMag, 4)} Å⁻¹</span></div>
            <div className="text-slate-400">d1 = <span className="text-cyan-300 font-bold">{fmt(vec1Props.dSpacing, 4)} Å</span></div>
          </div>

          <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-2xl space-y-1">
            <span className="text-fuchsia-400 font-bold block flex items-center justify-between">
              <span>g2* ({h2} {k2} 0)</span>
              <span className="text-[10px] text-fuchsia-500/80 font-sans">SECONDARY</span>
            </span>
            <div className="text-slate-300">|g2*| = <span className="text-fuchsia-300 font-bold">{fmt(vec2Props.gMag, 4)} Å⁻¹</span></div>
            <div className="text-slate-400">d2 = <span className="text-cyan-300 font-bold">{fmt(vec2Props.dSpacing, 4)} Å</span></div>
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-1">
            <span className="text-indigo-400 font-bold block flex items-center justify-between">
              <span>Vector Geometry</span>
              <span className="text-[10px] text-indigo-400/80 font-sans">2D PLANE</span>
            </span>
            <div className="text-slate-300">Angle φ* = <span className="text-amber-300 font-bold">{fmt(interVectorAngle, 2)}°</span></div>
            <div className="text-slate-400">Mesh Area = <span className="text-cyan-300 font-bold">{fmt(vectorParallelogramArea, 4)} Å⁻²</span></div>
          </div>
        </div>

      </div>

    </div>
  );
};
