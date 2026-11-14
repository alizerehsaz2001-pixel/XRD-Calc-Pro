import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Target,
  Box,
  Grid,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download
} from 'lucide-react';
import { CrystalSystem, fmt } from './metricTensorTypes';
import { quadraticForm, bilinearForm } from './metricTensorEngine';

interface MetricTensorReciprocalNetTabProps {
  system: CrystalSystem;
  metricGStar: number[][];
  aStar: number;
  bStar: number;
  cStar: number;
  alphaStar: number;
  betaStar: number;
  gammaStar: number;
  h1: number; setH1: (v: number) => void;
  k1: number; setK1: (v: number) => void;
  l1: number; setL1: (v: number) => void;
  h2: number; setH2: (v: number) => void;
  k2: number; setK2: (v: number) => void;
  l2: number; setL2: (v: number) => void;
}

const RADIATION_PRESETS = [
  { label: 'Cu Kα₁ (1.5406 Å)', val: 1.5406 },
  { label: 'Mo Kα₁ (0.7107 Å)', val: 0.7107 },
  { label: 'Co Kα₁ (1.7890 Å)', val: 1.7890 },
  { label: 'Synchrotron (0.6199 Å)', val: 0.6199 },
  { label: 'TEM 200kV (0.0251 Å)', val: 0.0251 }
];

export const MetricTensorReciprocalNetTab: React.FC<MetricTensorReciprocalNetTabProps> = ({
  system,
  metricGStar,
  aStar,
  bStar,
  cStar,
  alphaStar,
  betaStar,
  gammaStar,
  h1, setH1,
  k1, setK1,
  l1, setL1,
  h2, setH2,
  k2, setK2,
  l2, setL2
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [reciprocalPlane, setReciprocalPlane] = useState<'hk0' | 'h0l' | '0kl'>('hk0');
  const [laueLayer, setLaueLayer] = useState<number>(0); // ZOLZ=0, FOLZ=1, SOLZ=2
  const [reciprocalGridRange, setReciprocalGridRange] = useState<number>(4);
  const [reciprocalZoom, setReciprocalZoom] = useState<number>(1.0);
  const [reciprocalPan, setReciprocalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showEwaldOverlay, setShowEwaldOverlay] = useState<boolean>(true);
  const [ewaldWavelength, setEwaldWavelength] = useState<number>(1.5406);
  const [ewaldAngle, setEwaldAngle] = useState<number>(25);
  const [showBrillouinZone, setShowBrillouinZone] = useState<boolean>(false);
  const [showSecondVector, setShowSecondVector] = useState<boolean>(true);
  const [showMeshParallelogram, setShowMeshParallelogram] = useState<boolean>(true);

  const [hoveredNode, setHoveredNode] = useState<{ u: number; v: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<{ u: number; v: number } | null>(null);

  // Map 2D plane coordinates (u, v) + laueLayer to true 3D Miller triplet (h, k, l)
  const toMiller3D = (u: number, v: number): [number, number, number] => {
    if (reciprocalPlane === 'hk0') return [u, v, laueLayer];
    if (reciprocalPlane === 'h0l') return [u, laueLayer, v];
    return [laueLayer, u, v];
  };

  // True 3D metric evaluation for any Miller triplet using full 3x3 G* and live λ
  const getRecip3DProps = (hkl: [number, number, number]) => {
    const invDSq = quadraticForm(metricGStar, hkl);
    const gMag = Math.sqrt(Math.max(0, invDSq));
    const dSpacing = gMag > 1e-12 ? 1 / gMag : 0;
    const sinTheta = (ewaldWavelength * gMag) / 2;
    const isValidBragg = sinTheta > 0 && sinTheta <= 1;
    const thetaDeg = isValidBragg ? (Math.asin(sinTheta) * 180) / Math.PI : null;
    return { gMag, dSpacing, thetaDeg, isValidBragg };
  };

  // Determine 2D indices of the primary & secondary vectors inside the chosen slice
  const sliceVec1 = useMemo(() => {
    if (reciprocalPlane === 'hk0') return { u: h1, v: k1 };
    if (reciprocalPlane === 'h0l') return { u: h1, v: l1 };
    return { u: k1, v: l1 };
  }, [reciprocalPlane, h1, k1, l1]);

  const sliceVec2 = useMemo(() => {
    if (reciprocalPlane === 'hk0') return { u: h2, v: k2 };
    if (reciprocalPlane === 'h0l') return { u: h2, v: l2 };
    return { u: k2, v: l2 };
  }, [reciprocalPlane, h2, k2, l2]);

  const vec1Props = useMemo(() => getRecip3DProps([h1, k1, l1]), [h1, k1, l1, metricGStar, ewaldWavelength]);
  const vec2Props = useMemo(() => getRecip3DProps([h2, k2, l2]), [h2, k2, l2, metricGStar, ewaldWavelength]);

  const interVectorAngle3D = useMemo(() => {
    const dot = bilinearForm(metricGStar, [h1, k1, l1], [h2, k2, l2]);
    const denom = vec1Props.gMag * vec2Props.gMag;
    if (denom <= 1e-12) return 0;
    return (Math.acos(Math.max(-1, Math.min(1, dot / denom))) * 180) / Math.PI;
  }, [h1, k1, l1, h2, k2, l2, metricGStar, vec1Props.gMag, vec2Props.gMag]);

  const vectorParallelogramArea3D = useMemo(() => {
    return vec1Props.gMag * vec2Props.gMag * Math.sin((interVectorAngle3D * Math.PI) / 180);
  }, [vec1Props.gMag, vec2Props.gMag, interVectorAngle3D]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2 + reciprocalPan.x;
    const centerY = height / 2 + reciprocalPan.y;

    let v1Star = aStar,
      v2Star = bStar,
      angleStarRad = (gammaStar * Math.PI) / 180;
    let lbl1 = 'a*',
      lbl2 = 'b*';
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar;
      v2Star = cStar;
      angleStarRad = (betaStar * Math.PI) / 180;
      lbl1 = 'a*';
      lbl2 = 'c*';
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar;
      v2Star = cStar;
      angleStarRad = (alphaStar * Math.PI) / 180;
      lbl1 = 'b*';
      lbl2 = 'c*';
    }

    const scale =
      (Math.min(width, height) / (2 * (reciprocalGridRange + 0.8) * Math.max(v1Star, v2Star, 0.1))) *
      reciprocalZoom;

    const ax = v1Star * scale;
    const ay = 0;
    const bx = v2Star * Math.cos(angleStarRad) * scale;
    const by = -v2Star * Math.sin(angleStarRad) * scale;

    // 1. Draw 1st Brillouin Zone (Wigner-Seitz Voronoi cell)
    if (showBrillouinZone) {
      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      const neighbors = [
        { u: 1, v: 0 },
        { u: -1, v: 0 },
        { u: 0, v: 1 },
        { u: 0, v: -1 },
        { u: 1, v: 1 },
        { u: -1, v: -1 },
        { u: 1, v: -1 },
        { u: -1, v: 1 }
      ];

      const pts: { x: number; y: number }[] = [];
      const numSteps = 48;
      for (let i = 0; i < numSteps; i++) {
        const angle = (i * 2 * Math.PI) / numSteps;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        let maxR = 1000;
        neighbors.forEach((n) => {
          const kx = n.u * ax + n.v * bx;
          const ky = n.u * ay + n.v * by;
          const kSq = kx * kx + ky * ky;
          if (kSq > 1e-5) {
            const proj = dx * kx + dy * ky;
            if (proj > 1e-5) {
              const rVal = kSq / 2 / proj;
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

    // 2. Mesh Parallelogram in current plane
    if (showMeshParallelogram) {
      const g1x = sliceVec1.u * ax + sliceVec1.v * bx;
      const g1y = sliceVec1.u * ay + sliceVec1.v * by;
      const g2x = sliceVec2.u * ax + sliceVec2.v * bx;
      const g2y = sliceVec2.u * ay + sliceVec2.v * by;

      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
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

    // 3. Ewald Sphere & Limiting Sphere (r = 2/lambda)
    let ewaldCenterX = 0,
      ewaldCenterY = 0,
      ewaldRadiusPx = 0;
    if (showEwaldOverlay && ewaldWavelength > 0) {
      const rStar = 1 / ewaldWavelength;
      ewaldRadiusPx = rStar * scale;

      // Limiting sphere (2 / lambda)
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2 * ewaldRadiusPx, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();

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

      ctx.strokeStyle = '#fbbf24';
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ewaldCenterX, ewaldCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`k₀ (1/λ=${fmt(rStar, 2)} Å⁻¹)`, (centerX + ewaldCenterX) / 2, (centerY + ewaldCenterY) / 2 - 6);
      ctx.restore();
    }

    // 4. Grid Lines
    const range = reciprocalGridRange;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let u = -range; u <= range; u++) {
      for (let v = -range; v <= range; v++) {
        const px = centerX + u * ax + v * bx;
        const py = centerY + u * ay + v * by;

        if (u < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + ax, py + ay);
          ctx.stroke();
        }
        if (v < range) {
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px + bx, py + by);
          ctx.stroke();
        }
      }
    }

    // Origin axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // 5. Reciprocal Nodes
    for (let u = -range; u <= range; u++) {
      for (let v = -range; v <= range; v++) {
        const px = centerX + u * ax + v * bx;
        const py = centerY + u * ay + v * by;
        if (px < -20 || px > width + 20 || py < -20 || py > height + 20) continue;

        const [mh, mk, ml] = toMiller3D(u, v);
        const isOrigin = mh === 0 && mk === 0 && ml === 0;
        const isVector1 = u === sliceVec1.u && v === sliceVec1.v;
        const isVector2 = showSecondVector && u === sliceVec2.u && v === sliceVec2.v;
        const isHovered = hoveredNode?.u === u && hoveredNode?.v === v;
        const isSelected = selectedNode?.u === u && selectedNode?.v === v;

        let isEwaldIntersect = false;
        if (showEwaldOverlay && ewaldRadiusPx > 0 && !isOrigin) {
          const dist = Math.sqrt((px - ewaldCenterX) ** 2 + (py - ewaldCenterY) ** 2);
          if (Math.abs(dist - ewaldRadiusPx) <= 10) isEwaldIntersect = true;
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
          ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
          ctx.beginPath();
          ctx.arc(px, py, 8.5, 0, 2 * Math.PI);
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
          ctx.fillText(`(${mh} ${mk} ${ml})`, px + 7, py - 6);
        }
      }
    }

    const drawArrow = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      strokeColor: string,
      lineWidth: number = 2.5
    ) => {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      const headlen = 8.5;
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

    // 6. Basis arrows
    drawArrow(centerX, centerY, centerX + ax, centerY + ay, '#06b6d4', 2.5);
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl1, centerX + ax + 6, centerY + ay + 14);

    drawArrow(centerX, centerY, centerX + bx, centerY + by, '#a855f7', 2.5);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(lbl2, centerX + bx + 6, centerY + by - 6);

    const g1x = sliceVec1.u * ax + sliceVec1.v * bx;
    const g1y = sliceVec1.u * ay + sliceVec1.v * by;
    if (sliceVec1.u !== 0 || sliceVec1.v !== 0) {
      drawArrow(centerX, centerY, centerX + g1x, centerY + g1y, '#10b981', 3);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`g1*`, centerX + g1x + 8, centerY + g1y - 4);
    }

    if (showSecondVector && (sliceVec2.u !== 0 || sliceVec2.v !== 0)) {
      const g2x = sliceVec2.u * ax + sliceVec2.v * bx;
      const g2y = sliceVec2.u * ay + sliceVec2.v * by;
      drawArrow(centerX, centerY, centerX + g2x, centerY + g2y, '#d946ef', 2.5);
      ctx.fillStyle = '#f472b6';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(`g2*`, centerX + g2x + 8, centerY + g2y - 4);
    }
  }, [
    system,
    aStar,
    bStar,
    cStar,
    alphaStar,
    betaStar,
    gammaStar,
    sliceVec1,
    sliceVec2,
    reciprocalPlane,
    laueLayer,
    reciprocalGridRange,
    reciprocalZoom,
    reciprocalPan,
    showEwaldOverlay,
    ewaldWavelength,
    ewaldAngle,
    showBrillouinZone,
    showSecondVector,
    showMeshParallelogram,
    hoveredNode,
    selectedNode
  ]);

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

    const centerX = canvas.width / 2 + reciprocalPan.x;
    const centerY = canvas.height / 2 + reciprocalPan.y;

    let v1Star = aStar,
      v2Star = bStar,
      angleStarRad = (gammaStar * Math.PI) / 180;
    if (reciprocalPlane === 'h0l') {
      v1Star = aStar;
      v2Star = cStar;
      angleStarRad = (betaStar * Math.PI) / 180;
    } else if (reciprocalPlane === '0kl') {
      v1Star = bStar;
      v2Star = cStar;
      angleStarRad = (alphaStar * Math.PI) / 180;
    }

    const scale =
      (Math.min(canvas.width, canvas.height) / (2 * (reciprocalGridRange + 0.8) * Math.max(v1Star, v2Star, 0.1))) *
      reciprocalZoom;
    const ax = v1Star * scale;
    const ay = 0;
    const bx = v2Star * Math.cos(angleStarRad) * scale;
    const by = -v2Star * Math.sin(angleStarRad) * scale;

    let found: { u: number; v: number } | null = null;
    const range = reciprocalGridRange;
    for (let u = -range; u <= range; u++) {
      for (let v = -range; v <= range; v++) {
        const px = centerX + u * ax + v * bx;
        const py = centerY + u * ay + v * by;
        const dist = Math.sqrt((mouseX - px) ** 2 + (mouseY - py) ** 2);
        if (dist <= 12) {
          found = { u, v };
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

  const activeInspectNode = hoveredNode || selectedNode;
  const activeMiller = activeInspectNode ? toMiller3D(activeInspectNode.u, activeInspectNode.v) : null;
  const inspectProps = activeMiller ? getRecip3DProps(activeMiller) : null;

  const setVectorFromNode = (which: 1 | 2, hkl: [number, number, number]) => {
    if (which === 1) {
      setH1(hkl[0]);
      setK1(hkl[1]);
      setL1(hkl[2]);
    } else {
      setH2(hkl[0]);
      setK2(hkl[1]);
      setL2(hkl[2]);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `reciprocal-net-${reciprocalPlane}-n${laueLayer}-${system.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const sliceBadge =
    reciprocalPlane === 'hk0'
      ? `hk${laueLayer}`
      : reciprocalPlane === 'h0l'
      ? `h${laueLayer}l`
      : `${laueLayer}kl`;

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-5">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Reciprocal Lattice Net & Laue Zone Visualizer
                <span className="text-[11px] px-2 py-0.5 rounded-md font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                  ({sliceBadge}) {laueLayer === 0 ? 'ZOLZ' : `HOLZ L=${laueLayer}`}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Inspect 3D Miller nodes (hkl), true 3D G* d-spacings, Brillouin zones, and Ewald / Limiting spheres
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPNG}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-lg border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export PNG
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
              {(['hk0', 'h0l', '0kl'] as const).map((plane) => (
                <button
                  key={plane}
                  onClick={() => setReciprocalPlane(plane)}
                  className={`px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    reciprocalPlane === plane
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  ({plane})
                </button>
              ))}
            </div>

            {/* Laue Zone Layer Selector */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono">
              <span className="text-[10px] text-slate-400 px-1.5 font-bold">Laue n:</span>
              {[-1, 0, 1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setLaueLayer(n)}
                  className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                    laueLayer === n ? 'bg-violet-500 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px] px-1 font-bold">Range:</span>
            {[3, 4, 6, 8].map((range) => (
              <button
                key={range}
                onClick={() => setReciprocalGridRange(range)}
                className={`px-2 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  reciprocalGridRange === range ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ±{range}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setShowEwaldOverlay(!showEwaldOverlay)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
                showEwaldOverlay
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Ewald Sphere
            </button>

            <button
              onClick={() => setShowBrillouinZone(!showBrillouinZone)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
                showBrillouinZone
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              1st BZ
            </button>

            <button
              onClick={() => setShowMeshParallelogram(!showMeshParallelogram)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
                showMeshParallelogram
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Mesh Cell
            </button>

            <button
              onClick={() => setShowSecondVector(!showSecondVector)}
              className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border whitespace-nowrap ${
                showSecondVector
                  ? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              g₂*
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setReciprocalZoom((z) => Math.min(2.5, z + 0.2))}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-300 px-1 font-bold tabular-nums">
              {Math.round(reciprocalZoom * 100)}%
            </span>
            <button
              onClick={() => setReciprocalZoom((z) => Math.max(0.5, z - 0.2))}
              className="p-1 text-slate-400 hover:text-cyan-300 rounded hover:bg-slate-800 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setReciprocalZoom(1.0);
                setReciprocalPan({ x: 0, y: 0 });
              }}
              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ewald Wavelength Bar */}
        {showEwaldOverlay && (
          <div className="flex flex-wrap items-center justify-between p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs gap-3 font-mono tabular-nums">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-400" />
                Beam λ:
              </span>
              {RADIATION_PRESETS.map((preset) => (
                <button
                  key={preset.val}
                  onClick={() => setEwaldWavelength(preset.val)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    ewaldWavelength === preset.val
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-900 text-amber-300/80 hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] text-amber-300 font-bold">Beam Angle φ: {ewaldAngle}°</span>
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

        {/* Canvas Element */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
          <canvas
            ref={canvasRef}
            width={760}
            height={380}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={() => setIsPanning(false)}
            onMouseLeave={() => {
              setHoveredNode(null);
              setIsPanning(false);
            }}
            className="w-full h-auto max-h-[380px] object-contain cursor-crosshair"
          />

          <div className="absolute top-3 left-3 bg-slate-900/90 px-3 py-1 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-mono pointer-events-none">
            Hover node to inspect 3D (hkl) | Click to pin | Drag empty space to pan
          </div>

          {activeMiller && inspectProps && (
            <div className="absolute bottom-3 right-3 bg-slate-900/95 p-3.5 rounded-xl border border-cyan-500/40 text-xs font-mono space-y-2 max-w-xs tabular-nums">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-3">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  Reflection ({activeMiller[0]} {activeMiller[1]} {activeMiller[2]})
                </span>
                <span className="text-[10px] text-slate-500 font-sans">
                  {hoveredNode ? 'HOVER' : 'PINNED'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                <span className="text-slate-400">3D |g*|:</span>
                <span className="text-emerald-400 font-bold">{fmt(inspectProps.gMag, 4)} Å⁻¹</span>

                <span className="text-slate-400">d-Spacing:</span>
                <span className="text-cyan-300 font-bold">{fmt(inspectProps.dSpacing, 4)} Å</span>

                <span className="text-slate-400">Bragg 2θ:</span>
                <span className={inspectProps.isValidBragg ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                  {inspectProps.isValidBragg ? `${fmt(inspectProps.thetaDeg! * 2, 2)}°` : 'Beyond Limit'}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => setVectorFromNode(1, activeMiller)}
                  className="flex-1 py-1 px-2 bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold cursor-pointer"
                >
                  Set g₁*
                </button>
                {showSecondVector && (
                  <button
                    onClick={() => setVectorFromNode(2, activeMiller)}
                    className="flex-1 py-1 px-2 bg-fuchsia-600/25 hover:bg-fuchsia-600/40 text-fuchsia-300 border border-fuchsia-500/40 rounded text-[10px] font-bold cursor-pointer"
                  >
                    Set g₂*
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live 3D Vector Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
          <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1">
            <span className="text-emerald-400 font-bold flex items-center justify-between">
              <span>g₁* ({h1} {k1} {l1})</span>
              <span className="text-[10px] text-emerald-500/80 font-sans">PRIMARY</span>
            </span>
            <div className="text-slate-300">|g₁*| = <span className="text-emerald-300 font-bold">{fmt(vec1Props.gMag, 4)} Å⁻¹</span></div>
            <div className="text-slate-400">
              d₁ = <span className="text-cyan-300 font-bold">{fmt(vec1Props.dSpacing, 4)} Å</span>{' '}
              {vec1Props.isValidBragg && `| 2θ = ${fmt(vec1Props.thetaDeg! * 2, 2)}°`}
            </div>
          </div>

          <div className="p-3 bg-fuchsia-950/20 border border-fuchsia-500/30 rounded-xl space-y-1">
            <span className="text-fuchsia-400 font-bold flex items-center justify-between">
              <span>g₂* ({h2} {k2} {l2})</span>
              <span className="text-[10px] text-fuchsia-500/80 font-sans">SECONDARY</span>
            </span>
            <div className="text-slate-300">|g₂*| = <span className="text-fuchsia-300 font-bold">{fmt(vec2Props.gMag, 4)} Å⁻¹</span></div>
            <div className="text-slate-400">
              d₂ = <span className="text-cyan-300 font-bold">{fmt(vec2Props.dSpacing, 4)} Å</span>{' '}
              {vec2Props.isValidBragg && `| 2θ = ${fmt(vec2Props.thetaDeg! * 2, 2)}°`}
            </div>
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-1">
            <span className="text-indigo-400 font-bold flex items-center justify-between">
              <span>3D Vector Geometry</span>
              <span className="text-[10px] text-indigo-400/80 font-sans">FULL G*</span>
            </span>
            <div className="text-slate-300">Angle φ* = <span className="text-amber-300 font-bold">{fmt(interVectorAngle3D, 2)}°</span></div>
            <div className="text-slate-400">|g₁* × g₂*| = <span className="text-cyan-300 font-bold">{fmt(vectorParallelogramArea3D, 4)} Å⁻²</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
