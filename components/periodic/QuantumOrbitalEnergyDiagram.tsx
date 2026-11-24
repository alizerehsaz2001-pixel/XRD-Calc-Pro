import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Atom,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Download,
  RotateCw,
  Layers,
  Crosshair,
  SlidersHorizontal,
} from 'lucide-react';
import { CrystalElement } from './types';
import {
  BOHR_RADIUS_A,
  REAL_ORBITAL_VARIANTS,
  SlicePlane,
  computeElectronConfiguration,
  computeExactRadialNodes,
  computeRadialMetrics,
  computeSlaterScreening,
  evaluateOrbitalSlice2D,
  evaluateRadialPdf,
  evaluateRadialWavefunction,
  sampleOrbitalCloud3D,
} from './quantumOrbitalPhysics';

interface QuantumOrbitalEnergyDiagramProps {
  element: CrystalElement;
}

type StageMode = '3d' | 'slice';
type SliceMetric = 'psi' | 'prob';
type RadialPlotMode = 'pdf' | 'wave' | 'cdf' | 'total';

interface OrbitalStageCanvasProps {
  stageMode: StageMode;
  n: number;
  l: number;
  orbitalIndex: number;
  zEff: number;
  subshellColor: string;
  colorByPhase: boolean;
  showAxes: boolean;
  showNodes: boolean;
  autoOrbit: boolean;
  rotX: number;
  rotY: number;
  onRotate: (nextX: number, nextY: number) => void;
  slicePlane: SlicePlane;
  sliceMetric: SliceMetric;
  pointCount: number;
  heightClass: string;
}

const OrbitalStageCanvas: React.FC<OrbitalStageCanvasProps> = ({
  stageMode,
  n,
  l,
  orbitalIndex,
  zEff,
  subshellColor,
  colorByPhase,
  showAxes,
  showNodes,
  autoOrbit,
  rotX,
  rotY,
  onRotate,
  slicePlane,
  sliceMetric,
  pointCount,
  heightClass,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ active: boolean; x: number; y: number; rx: number; ry: number }>({
    active: false,
    x: 0,
    y: 0,
    rx: rotX,
    ry: rotY,
  });
  const animAngleRef = useRef<number>(0);

  const [sliceProbe, setSliceProbe] = useState<{
    uA: number;
    vA: number;
    rA: number;
    psi: number;
    prob: number;
    px: number;
    py: number;
  } | null>(null);

  const cloudData = useMemo(
    () => sampleOrbitalCloud3D(n, l, orbitalIndex, zEff, pointCount),
    [n, l, orbitalIndex, zEff, pointCount]
  );

  const radialNodes = useMemo(() => computeExactRadialNodes(n, l, zEff), [n, l, zEff]);

  const sliceData = useMemo(() => {
    if (stageMode !== 'slice') return null;
    return evaluateOrbitalSlice2D(n, l, orbitalIndex, zEff, slicePlane, 112);
  }, [stageMode, n, l, orbitalIndex, zEff, slicePlane]);

  // 3D Cloud Render Loop
  useEffect(() => {
    if (stageMode !== '3d') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      scalePx: number,
      rx: number,
      ry: number
    ) => {
      // Standard physics orientation: z vertical up
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY - y * sinY;
      const y1 = x * sinY + y * cosY;
      const z1 = z;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;

      const fov = 4.6;
      const persp = fov / (fov - y2 * 0.45);
      return {
        px: cx + x1 * scalePx * persp,
        py: cy - z2 * scalePx * persp,
        depth: y2,
        persp,
      };
    };

    const drawFrame = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const cx = width * 0.5;
      const cy = height * 0.5;
      const unitScale = Math.min(width, height) * 0.42;
      const invExtent = 1 / Math.max(0.25, cloudData.rMaxA);

      if (autoOrbit && !dragRef.current.active) {
        animAngleRef.current += 0.0085;
      }
      const curRy = rotY + animAngleRef.current;
      const curRx = rotX;

      ctx.clearRect(0, 0, width, height);

      // Subtle laboratory radial coordinate reticle
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
      ctx.lineWidth = 1;
      for (const frac of [0.35, 0.7, 1.0]) {
        ctx.beginPath();
        ctx.arc(cx, cy, unitScale * frac, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // Optional nodal shell / equatorial reference guides
      if (showNodes) {
        ctx.save();
        // Draw exact radial node spheres as faint equatorial + meridional ellipses
        radialNodes.forEach((node) => {
          const rNorm = node.r * invExtent;
          if (rNorm > 1.15) return;
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.38)';
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const ang = (i / 48) * Math.PI * 2;
            const p = project(
              rNorm * Math.cos(ang),
              rNorm * Math.sin(ang),
              0,
              cx,
              cy,
              unitScale,
              curRx,
              curRy
            );
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          }
          ctx.stroke();
        });

        // Draw primary angular nodal plane guide when l >= 1
        if (l >= 1) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          for (let i = 0; i <= 48; i++) {
            const ang = (i / 48) * Math.PI * 2;
            const p = project(0.95 * Math.cos(ang), 0.95 * Math.sin(ang), 0, cx, cy, unitScale, curRx, curRy);
            if (i === 0) ctx.moveTo(p.px, p.py);
            else ctx.lineTo(p.px, p.py);
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Project & depth-sort sampled Monte Carlo points
      const projected = cloudData.points.map((pt) => {
        const p = project(
          pt.x * invExtent,
          pt.y * invExtent,
          pt.z * invExtent,
          cx,
          cy,
          unitScale,
          curRx,
          curRy
        );
        return {
          px: p.px,
          py: p.py,
          depth: p.depth,
          persp: p.persp,
          psiSign: pt.psiSign,
          weight: pt.densityWeight,
        };
      });
      projected.sort((a, b) => a.depth - b.depth);

      // Draw back half -> nucleus -> front half
      let nucleusDrawn = false;
      const drawNucleus = () => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 11);
        g.addColorStop(0, '#ffffff');
        g.addColorStop(0.35, 'rgba(226, 232, 240, 0.75)');
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 2.3, 0, Math.PI * 2);
        ctx.fill();
      };

      for (let i = 0; i < projected.length; i++) {
        const pt = projected[i];
        if (!nucleusDrawn && pt.depth >= 0) {
          drawNucleus();
          nucleusDrawn = true;
        }
        const depthAlpha = Math.max(0.16, Math.min(0.92, 0.52 + pt.depth * 0.34));
        const radius = (1.05 + pt.weight * 1.15) * Math.max(0.75, Math.min(1.35, pt.persp));
        const fill = colorByPhase
          ? pt.psiSign > 0
            ? `rgba(56, 189, 248, ${depthAlpha.toFixed(3)})`
            : `rgba(245, 158, 11, ${depthAlpha.toFixed(3)})`
          : subshellColor;

        if (!colorByPhase) ctx.globalAlpha = depthAlpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(pt.px, pt.py, radius, 0, Math.PI * 2);
        ctx.fill();
        if (!colorByPhase) ctx.globalAlpha = 1;
      }
      if (!nucleusDrawn) drawNucleus();

      // Crisp 3D XYZ Coordinate Triad
      if (showAxes) {
        const gCx = 36;
        const gCy = height - 32;
        const axisScale = 22;
        const axes: Array<{ v: [number, number, number]; color: string; label: string }> = [
          { v: [1, 0, 0], color: '#f87171', label: 'x' },
          { v: [0, 1, 0], color: '#34d399', label: 'y' },
          { v: [0, 0, 1], color: '#60a5fa', label: 'z' },
        ];
        ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
        axes.forEach((ax) => {
          const end = project(ax.v[0], ax.v[1], ax.v[2], gCx, gCy, axisScale, curRx, curRy);
          ctx.beginPath();
          ctx.moveTo(gCx, gCy);
          ctx.lineTo(end.px, end.py);
          ctx.strokeStyle = ax.color;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.fillStyle = ax.color;
          ctx.fillText(ax.label, end.px + 3, end.py + 3);
        });
      }

      // Scale bar (bottom-right)
      const oneAngPx = unitScale * invExtent;
      const barAng = cloudData.rMaxA > 4 ? 2 : cloudData.rMaxA > 1.6 ? 1 : 0.5;
      const barPx = Math.min(width * 0.28, Math.max(24, oneAngPx * barAng));
      const bx = width - 16;
      const by = height - 16;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(bx - barPx, by);
      ctx.lineTo(bx, by);
      ctx.moveTo(bx - barPx, by - 3);
      ctx.lineTo(bx - barPx, by + 3);
      ctx.moveTo(bx, by - 3);
      ctx.lineTo(bx, by + 3);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9.5px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${barAng} Å`, bx, by - 6);
      ctx.textAlign = 'left';

      if (autoOrbit) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    drawFrame();
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [
    stageMode,
    cloudData,
    radialNodes,
    l,
    subshellColor,
    colorByPhase,
    showAxes,
    showNodes,
    autoOrbit,
    rotX,
    rotY,
  ]);

  // 2D Planar Cross-Section Render
  useEffect(() => {
    if (stageMode !== 'slice' || !sliceData) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderSlice = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = parent.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = '#04070F';
      ctx.fillRect(0, 0, width, height);

      const { gridSize, halfExtentA, psiGrid, maxAbsPsi } = sliceData;
      const side = Math.min(width, height) - 24;
      const ox = (width - side) * 0.5;
      const oy = (height - side) * 0.5;

      // Offscreen ImageData for smooth bilinear upscaling
      const off = document.createElement('canvas');
      off.width = gridSize;
      off.height = gridSize;
      const offCtx = off.getContext('2d');
      if (offCtx) {
        const img = offCtx.createImageData(gridSize, gridSize);
        const data = img.data;
        const invMax = 1 / Math.max(1e-9, maxAbsPsi);

        for (let i = 0; i < gridSize * gridSize; i++) {
          const psi = psiGrid[i];
          const norm = Math.abs(psi) * invMax;
          // Perceptual gamma compression so outer radial shells & lobes are clearly visible
          const mag =
            sliceMetric === 'psi'
              ? Math.pow(norm, 0.52)
              : Math.pow(norm * norm, 0.42);

          let r = 4;
          let g = 7;
          let b = 15;
          if (sliceMetric === 'psi') {
            if (psi >= 0) {
              // Deep obsidian -> laser cyan -> crisp ice white core
              r = Math.round(4 + mag * 105 + Math.pow(mag, 3) * 140);
              g = Math.round(7 + mag * 212 + Math.pow(mag, 3) * 35);
              b = Math.round(15 + mag * 240);
            } else {
              // Deep obsidian -> telemetry amber -> warm ivory core
              r = Math.round(4 + mag * 245);
              g = Math.round(7 + mag * 158 + Math.pow(mag, 3) * 80);
              b = Math.round(15 + mag * 32 + Math.pow(mag, 3) * 160);
            }
          } else {
            // |psi|^2 probability heatmap (obsidian -> indigo -> cyan -> white)
            r = Math.round(4 + Math.pow(mag, 2.1) * 235);
            g = Math.round(7 + Math.pow(mag, 1.15) * 215);
            b = Math.round(15 + Math.pow(mag, 0.72) * 238);
          }

          const idx = i * 4;
          data[idx] = Math.min(255, r);
          data[idx + 1] = Math.min(255, g);
          data[idx + 2] = Math.min(255, b);
          data[idx + 3] = 255;
        }
        offCtx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(off, ox, oy, side, side);
      }

      // Square viewport frame
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(ox, oy, side, side);

      const cx = ox + side * 0.5;
      const cy = oy + side * 0.5;

      // Axes crosshairs
      if (showAxes) {
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(ox, cy);
        ctx.lineTo(ox + side, cy);
        ctx.moveTo(cx, oy);
        ctx.lineTo(cx, oy + side);
        ctx.stroke();
        ctx.setLineDash([]);

        const uAxis = slicePlane === 'yz' ? 'y' : 'x';
        const vAxis = slicePlane === 'xy' ? 'y' : 'z';
        ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`+${uAxis}`, ox + side - 16, cy - 5);
        ctx.fillText(`+${vAxis}`, cx + 5, oy + 12);
      }

      // Exact radial node circles overlaid on slice
      if (showNodes) {
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        radialNodes.forEach((node) => {
          const rPx = (node.r / halfExtentA) * (side * 0.5);
          if (rPx > 2 && rPx < side * 0.49) {
            ctx.beginPath();
            ctx.arc(cx, cy, rPx, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
        ctx.setLineDash([]);
      }

      // Nucleus dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Active hover crosshair
      if (sliceProbe) {
        ctx.strokeStyle = 'rgba(248, 250, 252, 0.55)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(sliceProbe.px, oy);
        ctx.lineTo(sliceProbe.px, oy + side);
        ctx.moveTo(ox, sliceProbe.py);
        ctx.lineTo(ox + side, sliceProbe.py);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Extent label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9.5px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`±${halfExtentA.toFixed(2)} Å`, ox + side - 4, oy + side - 5);
      ctx.textAlign = 'left';
    };

    renderSlice();
    const ro = new ResizeObserver(renderSlice);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => ro.disconnect();
  }, [stageMode, sliceData, sliceMetric, slicePlane, showAxes, showNodes, radialNodes, sliceProbe]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stageMode !== '3d') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      x: e.clientX,
      y: e.clientY,
      rx: rotX,
      ry: rotY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stageMode === '3d') {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.x;
      const dy = e.clientY - dragRef.current.y;
      onRotate(
        Math.max(-Math.PI * 0.49, Math.min(Math.PI * 0.49, dragRef.current.rx + dy * 0.01)),
        dragRef.current.ry + dx * 0.01
      );
      return;
    }

    if (stageMode === 'slice' && sliceData && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const side = Math.min(rect.width, rect.height) - 24;
      const ox = (rect.width - side) * 0.5;
      const oy = (rect.height - side) * 0.5;

      if (px >= ox && px <= ox + side && py >= oy && py <= oy + side) {
        const nx = (px - ox) / side; // 0..1
        const ny = (py - oy) / side; // 0..1
        const col = Math.min(sliceData.gridSize - 1, Math.max(0, Math.round(nx * (sliceData.gridSize - 1))));
        const row = Math.min(sliceData.gridSize - 1, Math.max(0, Math.round(ny * (sliceData.gridSize - 1))));
        const uA = sliceData.halfExtentA * (2 * nx - 1);
        const vA = sliceData.halfExtentA * (1 - 2 * ny);
        const psi = sliceData.psiGrid[row * sliceData.gridSize + col];
        setSliceProbe({
          uA,
          vA,
          rA: Math.hypot(uA, vA),
          psi,
          prob: psi * psi,
          px,
          py,
        });
      } else {
        setSliceProbe(null);
      }
    }
  };

  const handlePointerUp = () => {
    dragRef.current.active = false;
  };

  return (
    <div
      className={`relative w-full ${heightClass} rounded-lg bg-[#04070F] border border-slate-800 overflow-hidden select-none ${
        stageMode === '3d' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        dragRef.current.active = false;
        setSliceProbe(null);
      }}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Minimal top-left phase legend */}
      <div className="absolute top-2.5 left-2.5 pointer-events-none flex items-center gap-3 text-[10px] font-mono text-slate-400">
        {stageMode === '3d' ? (
          colorByPhase ? (
            <>
              <span className="text-sky-300 font-semibold">+ψ phase</span>
              <span className="text-slate-600">·</span>
              <span className="text-amber-300 font-semibold">−ψ phase</span>
            </>
          ) : (
            <span className="text-slate-300">Subshell density</span>
          )
        ) : (
          <>
            <span className="text-slate-200 font-semibold uppercase">{slicePlane} slice</span>
            <span className="text-slate-600">·</span>
            <span className={sliceMetric === 'psi' ? 'text-sky-300' : 'text-cyan-300'}>
              {sliceMetric === 'psi' ? '+ψ / −ψ signed' : '|ψ|² probability'}
            </span>
          </>
        )}
      </div>

      {/* Live 2D Slice Crosshair Readout */}
      {stageMode === 'slice' && sliceProbe && (
        <div className="absolute top-2.5 right-2.5 pointer-events-none bg-[#070A12]/95 border border-slate-700 rounded-md px-2.5 py-1.5 text-[10px] font-mono tabular-nums text-slate-200 space-y-0.5">
          <div className="text-slate-400">
            r = <span className="text-white font-semibold">{sliceProbe.rA.toFixed(2)} Å</span>{' '}
            ({(sliceProbe.rA / BOHR_RADIUS_A).toFixed(2)} a₀)
          </div>
          <div>
            ψ ={' '}
            <span className={sliceProbe.psi >= 0 ? 'text-sky-300 font-semibold' : 'text-amber-300 font-semibold'}>
              {sliceProbe.psi >= 0 ? '+' : ''}
              {sliceProbe.psi.toFixed(3)}
            </span>{' '}
            <span className="text-slate-500">·</span> |ψ|² ={' '}
            <span className="text-cyan-300 font-semibold">{sliceProbe.prob.toFixed(3)}</span>
          </div>
        </div>
      )}

      {stageMode === '3d' && (
        <div className="absolute top-2.5 right-2.5 pointer-events-none text-[10px] font-mono text-slate-500">
          Drag to orbit
        </div>
      )}
    </div>
  );
};

// Custom Precision SVG Radial Wavefunction / Probability Plot (with Hover Crosshair, Nodes, r_mp, <r>)
interface RadialWavefunctionPlotProps {
  n: number;
  l: number;
  zEff: number;
  subshellLabel: string;
  subshellColor: string;
  plotMode: RadialPlotMode;
  useLogScale: boolean;
  allSubshells: Array<{ n: number; l: number; label: string; electrons: number; zEff: number; color: string }>;
  heightPx?: number;
}

const RadialWavefunctionPlot: React.FC<RadialWavefunctionPlotProps> = ({
  n,
  l,
  zEff,
  subshellLabel,
  subshellColor,
  plotMode,
  useLogScale,
  allSubshells,
  heightPx = 196,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const computed = useMemo(() => {
    const metrics = computeRadialMetrics(n, l, zEff);
    const nodes = computeExactRadialNodes(n, l, zEff);

    // For total density mode, scale rMax to the outermost occupied subshell's display extent
    let rMax = metrics.rDisplayMaxA;
    if (plotMode === 'total' && allSubshells.length > 0) {
      let maxOuter = 0;
      for (const s of allSubshells) {
        const m = computeRadialMetrics(s.n, s.l, s.zEff);
        if (m.rDisplayMaxA > maxOuter) maxOuter = m.rDisplayMaxA;
      }
      rMax = Math.max(1.2, Math.min(8.5, maxOuter));
    }

    const steps = 160;
    const dr = rMax / steps;
    const rArr: number[] = [];
    const yArr: number[] = [];
    const pdfArr: number[] = [];
    const waveArr: number[] = [];
    const cdfArr: number[] = [];

    let cum = 0;
    let prevPdf = 0;
    for (let i = 0; i <= steps; i++) {
      const r = i * dr;
      rArr.push(r);
      const R = evaluateRadialWavefunction(n, l, zEff, r);
      const P = evaluateRadialPdf(n, l, zEff, r);
      if (i > 0) cum += 0.5 * (prevPdf + P) * dr;
      prevPdf = P;
      waveArr.push(R);
      pdfArr.push(P);
      cdfArr.push(Math.min(1, cum));

      if (plotMode === 'pdf') {
        yArr.push(P);
      } else if (plotMode === 'wave') {
        yArr.push(R);
      } else if (plotMode === 'cdf') {
        yArr.push(Math.min(100, cum * 100));
      } else {
        let total = 0;
        for (const s of allSubshells) {
          total += evaluateRadialPdf(s.n, s.l, s.zEff, r) * s.electrons;
        }
        yArr.push(total);
      }
    }

    // Individual subshell curves for total mode overlay
    const subCurves =
      plotMode === 'total'
        ? allSubshells.slice(-6).map((s) => ({
            label: s.label,
            color: s.color,
            vals: rArr.map((r) => evaluateRadialPdf(s.n, s.l, s.zEff, r) * s.electrons),
          }))
        : [];

    let yMin = 0;
    let yMax = 1;
    if (plotMode === 'wave') {
      const absMax = Math.max(1e-4, ...yArr.map((v) => Math.abs(v)));
      yMin = -absMax * 1.12;
      yMax = absMax * 1.12;
    } else if (plotMode === 'cdf') {
      yMin = 0;
      yMax = 104;
    } else if (useLogScale) {
      yMin = -3; // 10^-3
      yMax = Math.max(0.5, Math.log10(Math.max(1e-3, ...yArr) * 1.3));
    } else {
      yMin = 0;
      yMax = Math.max(1e-4, ...yArr) * 1.14;
    }

    return { rMax, rArr, yArr, pdfArr, waveArr, cdfArr, yMin, yMax, metrics, nodes, subCurves };
  }, [n, l, zEff, plotMode, useLogScale, allSubshells]);

  const W = 520;
  const H = heightPx;
  const padL = 44;
  const padR = 14;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const mapX = (r: number) => padL + (r / computed.rMax) * plotW;
  const mapY = (val: number) => {
    let v = val;
    if ((plotMode === 'pdf' || plotMode === 'total') && useLogScale) {
      v = Math.log10(Math.max(1e-3, val));
    }
    const norm = (v - computed.yMin) / Math.max(1e-9, computed.yMax - computed.yMin);
    return padT + plotH - Math.max(0, Math.min(1, norm)) * plotH;
  };

  const zeroY = mapY(0);

  const mainPath = useMemo(() => {
    return computed.rArr
      .map((r, i) => `${i === 0 ? 'M' : 'L'}${mapX(r).toFixed(1)},${mapY(computed.yArr[i]).toFixed(1)}`)
      .join(' ');
  }, [computed, useLogScale, plotMode]);

  const areaPath = useMemo(() => {
    if (plotMode === 'wave') return '';
    return `${mainPath} L${mapX(computed.rMax).toFixed(1)},${(padT + plotH).toFixed(1)} L${padL},${(padT + plotH).toFixed(1)} Z`;
  }, [mainPath, computed.rMax, plotMode, plotH]);

  const strokeColor =
    plotMode === 'total'
      ? '#34d399'
      : plotMode === 'cdf'
      ? '#a78bfa'
      : plotMode === 'wave'
      ? '#38bdf8'
      : subshellColor;

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * computed.rMax);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const xSvg = ((e.clientX - rect.left) / rect.width) * W;
    if (xSvg < padL || xSvg > W - padR) {
      setHoverIdx(null);
      return;
    }
    const frac = (xSvg - padL) / plotW;
    const idx = Math.min(computed.rArr.length - 1, Math.max(0, Math.round(frac * (computed.rArr.length - 1))));
    setHoverIdx(idx);
  };

  const hovered = hoverIdx !== null
    ? {
        r: computed.rArr[hoverIdx],
        y: computed.yArr[hoverIdx],
        pdf: computed.pdfArr[hoverIdx],
        wave: computed.waveArr[hoverIdx],
        cdf: computed.cdfArr[hoverIdx] * 100,
        px: mapX(computed.rArr[hoverIdx]),
        py: mapY(computed.yArr[hoverIdx]),
      }
    : null;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={`rad-fill-${subshellLabel}-${plotMode}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const gy = padT + f * plotH;
          const val = computed.yMax - f * (computed.yMax - computed.yMin);
          const label =
            plotMode === 'cdf'
              ? `${Math.round(val)}%`
              : (plotMode === 'pdf' || plotMode === 'total') && useLogScale
              ? `1e${val.toFixed(0)}`
              : val.toFixed(val >= 10 ? 0 : 1);
          return (
            <g key={i}>
              <line x1={padL} y1={gy} x2={W - padR} y2={gy} stroke="#1e293b" strokeWidth="1" />
              <text
                x={padL - 6}
                y={gy + 3}
                textAnchor="end"
                fill="#64748b"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Vertical ticks */}
        {xTicks.map((rTick, i) => {
          const gx = mapX(rTick);
          return (
            <g key={i}>
              <line x1={gx} y1={padT} x2={gx} y2={padT + plotH} stroke="#1e293b" strokeWidth="1" />
              <text
                x={gx}
                y={H - 8}
                textAnchor="middle"
                fill="#64748b"
                fontSize="9"
                fontFamily="ui-monospace, monospace"
              >
                {rTick.toFixed(2)} Å
              </text>
            </g>
          );
        })}

        {/* Zero axis for signed R(r) */}
        {plotMode === 'wave' && (
          <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {/* Subshell overlays in Total Density mode */}
        {plotMode === 'total' &&
          computed.subCurves.map((sc) => {
            const d = computed.rArr
              .map((r, i) => `${i === 0 ? 'M' : 'L'}${mapX(r).toFixed(1)},${mapY(sc.vals[i]).toFixed(1)}`)
              .join(' ');
            return (
              <path
                key={sc.label}
                d={d}
                fill="none"
                stroke={sc.color}
                strokeWidth="1.25"
                strokeOpacity="0.55"
              />
            );
          })}

        {/* Shaded area under single curve */}
        {areaPath && <path d={areaPath} fill={`url(#rad-fill-${subshellLabel}-${plotMode})`} />}

        {/* Main curve */}
        <path d={mainPath} fill="none" stroke={strokeColor} strokeWidth="2.2" strokeLinejoin="round" />

        {/* Exact Radial Node Vertical Markers (in pdf, wave, cdf modes) */}
        {plotMode !== 'total' &&
          computed.nodes.map((node, idx) => {
            if (node.r <= 0 || node.r >= computed.rMax) return null;
            const nx = mapX(node.r);
            return (
              <g key={idx}>
                <line
                  x1={nx}
                  y1={padT}
                  x2={nx}
                  y2={padT + plotH}
                  stroke="#f43f5e"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle cx={nx} cy={plotMode === 'wave' ? zeroY : padT + plotH} r="2.8" fill="#f43f5e" />
                <text
                  x={nx}
                  y={padT - 5}
                  textAnchor="middle"
                  fill="#fb7185"
                  fontSize="8.5"
                  fontFamily="ui-monospace, monospace"
                >
                  N{idx + 1}
                </text>
              </g>
            );
          })}

        {/* Expectation radius <r> marker (single-orbital modes) */}
        {plotMode !== 'total' && computed.metrics.rExpectationA < computed.rMax && (
          <g>
            <line
              x1={mapX(computed.metrics.rExpectationA)}
              y1={padT}
              x2={mapX(computed.metrics.rExpectationA)}
              y2={padT + plotH}
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <text
              x={mapX(computed.metrics.rExpectationA)}
              y={padT + 10}
              textAnchor="middle"
              fill="#fbbf24"
              fontSize="8.5"
              fontFamily="ui-monospace, monospace"
            >
              ⟨r⟩
            </text>
          </g>
        )}

        {/* Interactive Hover Crosshair */}
        {hovered && (
          <g>
            <line
              x1={hovered.px}
              y1={padT}
              x2={hovered.px}
              y2={padT + plotH}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <circle cx={hovered.px} cy={hovered.py} r="4" fill={strokeColor} stroke="#ffffff" strokeWidth="1.5" />
          </g>
        )}

        {/* Crisp Axes Border */}
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#475569" strokeWidth="1.2" />
        <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#475569" strokeWidth="1.2" />
      </svg>

      {/* Compact Hover Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 text-[10px] font-mono tabular-nums text-slate-400">
        {hovered ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-slate-200">
            <span>
              r = <strong className="text-white">{hovered.r.toFixed(3)} Å</strong> ({(hovered.r / BOHR_RADIUS_A).toFixed(2)} a₀)
            </span>
            <span className="text-slate-600">·</span>
            <span>
              P(r) = <strong className="text-sky-300">{hovered.pdf.toFixed(3)} Å⁻¹</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              R(r) = <strong className={hovered.wave >= 0 ? 'text-cyan-300' : 'text-amber-300'}>{hovered.wave >= 0 ? '+' : ''}{hovered.wave.toFixed(3)}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Q(r) = <strong className="text-violet-300">{hovered.cdf.toFixed(1)}%</strong>
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span>
              r_mp = <strong className="text-sky-300">{computed.metrics.rMostProbableA.toFixed(3)} Å</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              ⟨r⟩ = <strong className="text-amber-300">{computed.metrics.rExpectationA.toFixed(3)} Å</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span>
              Radial nodes: <strong className="text-rose-300">{computed.nodes.length}</strong>
              {computed.nodes.length > 0 && ` (${computed.nodes.map((nd) => `${nd.r.toFixed(2)}Å`).join(', ')})`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const QuantumOrbitalEnergyDiagram: React.FC<QuantumOrbitalEnergyDiagramProps> = ({ element }) => {
  const [charge, setCharge] = useState<number>(0);
  const [stageMode, setStageMode] = useState<StageMode>('3d');
  const [slicePlane, setSlicePlane] = useState<SlicePlane>('xz');
  const [sliceMetric, setSliceMetric] = useState<SliceMetric>('psi');
  const [colorByPhase, setColorByPhase] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [showNodes, setShowNodes] = useState<boolean>(true);
  const [autoOrbit, setAutoOrbit] = useState<boolean>(true);
  const [rotX, setRotX] = useState<number>(0.42);
  const [rotY, setRotY] = useState<number>(0.65);
  const [plotMode, setPlotMode] = useState<RadialPlotMode>('pdf');
  const [useLogScale, setUseLogScale] = useState<boolean>(false);
  const [isExpandedLab, setIsExpandedLab] = useState<boolean>(false);

  const config = useMemo(
    () => computeElectronConfiguration(element.number, charge),
    [element.number, charge]
  );

  // Selected orbital (n, l, orbitalIndex in 0..2l)
  const [selectedState, setSelectedState] = useState<{ n: number; l: number; orbitalIndex: number; label: string }>(() => ({
    n: config.valenceSubshell.n,
    l: config.valenceSubshell.l,
    orbitalIndex: Math.min(config.valenceSubshell.l, REAL_ORBITAL_VARIANTS[config.valenceSubshell.l].length - 1),
    label: config.valenceSubshell.label,
  }));

  // Reset charge and auto-focus highest valence orbital whenever active element changes
  useEffect(() => {
    setCharge(0);
    const neutral = computeElectronConfiguration(element.number, 0);
    const v = neutral.valenceSubshell;
    // Default magnetic index to m_l = 0 (s, p_z, d_z², f_z³) which sits at index = l
    setSelectedState({
      n: v.n,
      l: v.l,
      orbitalIndex: v.l,
      label: v.label,
    });
  }, [element.number]);

  // Keep selected subshell valid when ionization removes the previously selected outer subshell
  useEffect(() => {
    const stillExists = config.subshells.some((s) => s.label === selectedState.label);
    if (!stillExists && config.valenceSubshell) {
      const v = config.valenceSubshell;
      setSelectedState({
        n: v.n,
        l: v.l,
        orbitalIndex: v.l,
        label: v.label,
      });
    }
  }, [config, selectedState.label]);

  const activeSubshell = useMemo(() => {
    return (
      config.subshells.find((s) => s.label === selectedState.label) ||
      config.valenceSubshell
    );
  }, [config, selectedState.label]);

  const activeVariants = REAL_ORBITAL_VARIANTS[activeSubshell.l] || REAL_ORBITAL_VARIANTS[0];
  const activeVariant =
    activeVariants[Math.max(0, Math.min(activeVariants.length - 1, selectedState.orbitalIndex))];

  const slater = useMemo(
    () => computeSlaterScreening(element.number, activeSubshell.n, activeSubshell.l, undefined, charge),
    [element.number, activeSubshell.n, activeSubshell.l, charge]
  );

  const radialMetrics = useMemo(
    () => computeRadialMetrics(activeSubshell.n, activeSubshell.l, slater.zEff),
    [activeSubshell.n, activeSubshell.l, slater.zEff]
  );

  const chargeOptions = useMemo(() => {
    const maxPlus = Math.min(4, Math.max(0, element.number - 1));
    const opts: number[] = [];
    if (element.number <= 117) opts.push(-1);
    for (let q = 0; q <= maxPlus; q++) opts.push(q);
    return opts;
  }, [element.number]);

  const formatIonSymbol = () => {
    if (charge === 0) return element.symbol;
    if (charge === 1) return `${element.symbol}⁺`;
    if (charge === -1) return `${element.symbol}⁻`;
    return `${element.symbol}${Math.abs(charge)}${charge > 0 ? '⁺' : '⁻'}`;
  };

  const handleCameraPreset = (preset: 'iso' | 'xy' | 'xz' | 'yz') => {
    setAutoOrbit(false);
    if (preset === 'iso') {
      setRotX(0.45);
      setRotY(0.68);
    } else if (preset === 'xy') {
      setRotX(Math.PI * 0.485);
      setRotY(0);
    } else if (preset === 'xz') {
      setRotX(0.02);
      setRotY(0);
    } else {
      setRotX(0.02);
      setRotY(Math.PI * 0.5);
    }
  };

  const handleExportCsv = () => {
    const rMax = radialMetrics.rDisplayMaxA;
    const steps = 150;
    const rows = [
      `# Element: ${element.name} (${formatIonSymbol()}), Z=${element.number}, Charge=${charge}, Config="${config.configString}", Term="${config.termSymbol.formatted}"`,
      `# Orbital: ${activeVariant.fullLabel(activeSubshell.n)} (n=${activeSubshell.n}, l=${activeSubshell.l}, ml=${activeVariant.ml}), Z_eff=${slater.zEff.toFixed(3)}, sigma=${slater.sigma.toFixed(3)}, E_nl=${slater.energyEv.toFixed(2)} eV`,
      'r_Angstrom,r_Bohr,R_nl_Angstrom_m3_2,P_nl_r_Angstrom_m1,Cumulative_Q_r',
    ];
    let qCum = 0;
    let prevP = 0;
    const dr = rMax / steps;
    for (let i = 0; i <= steps; i++) {
      const r = i * dr;
      const R = evaluateRadialWavefunction(activeSubshell.n, activeSubshell.l, slater.zEff, r);
      const P = evaluateRadialPdf(activeSubshell.n, activeSubshell.l, slater.zEff, r);
      if (i > 0) qCum += 0.5 * (prevP + P) * dr;
      prevP = P;
      rows.push(
        `${r.toFixed(5)},${(r / BOHR_RADIUS_A).toFixed(5)},${R.toFixed(6)},${P.toFixed(6)},${Math.min(1, qCum).toFixed(6)}`
      );
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${element.symbol}_Z${element.number}_${activeSubshell.label}_wavefunction.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderWorkbenchContent = (expanded: boolean) => (
    <div className={`space-y-3.5 text-xs ${expanded ? 'grid grid-cols-1 lg:grid-cols-12 gap-5 space-y-0 items-start' : ''}`}>
      {/* LEFT / PRIMARY VISUAL STAGE */}
      <div className={expanded ? 'lg:col-span-7 space-y-3' : 'space-y-3'}>
        {/* Top Calibration Bar: Stage Mode + Ionization State + Expand */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-1 p-0.5 bg-[#050811] border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setStageMode('3d')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageMode === '3d'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              3D Cloud |ψ|²
            </button>
            <button
              type="button"
              onClick={() => setStageMode('slice')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                stageMode === 'slice'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              2D Slice ψ(r)
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Ionization Charge Segmented Selector */}
            <div className="flex items-center gap-0.5 p-0.5 bg-[#050811] border border-slate-800 rounded-lg font-mono text-[10px]">
              <span className="px-1.5 text-slate-500 select-none">q:</span>
              {chargeOptions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setCharge(q)}
                  className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                    charge === q
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {q > 0 ? `+${q}` : q}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleExportCsv}
              className="p-1.5 rounded-lg bg-[#050811] border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
              title="Export radial wavefunction CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsExpandedLab((prev) => !prev)}
              className="p-1.5 rounded-lg bg-[#050811] border border-slate-800 text-slate-400 hover:text-sky-300 hover:border-sky-500/40 transition-colors cursor-pointer"
              title={expanded ? 'Exit Fullscreen Lab' : 'Expand Quantum Orbital Lab'}
            >
              {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Clean Unboxed Quantum Identity Strip */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-bold text-white">{activeVariant.fullLabel(activeSubshell.n)}</span>
            <span className="text-[11px] text-slate-400">{activeVariant.cartesianFormula}</span>
          </div>
          <div className="text-[10.5px] text-slate-400 tabular-nums">
            (n={activeSubshell.n}, l={activeSubshell.l}, mₗ={activeVariant.ml > 0 ? `+${activeVariant.ml}` : activeVariant.ml})
          </div>
        </div>

        {/* Interactive Canvas Viewport */}
        <OrbitalStageCanvas
          stageMode={stageMode}
          n={activeSubshell.n}
          l={activeSubshell.l}
          orbitalIndex={activeVariant.index}
          zEff={slater.zEff}
          subshellColor={activeSubshell.color}
          colorByPhase={colorByPhase}
          showAxes={showAxes}
          showNodes={showNodes}
          autoOrbit={autoOrbit}
          rotX={rotX}
          rotY={rotY}
          onRotate={(nx, ny) => {
            setRotX(nx);
            setRotY(ny);
          }}
          slicePlane={slicePlane}
          sliceMetric={sliceMetric}
          pointCount={expanded ? 2400 : 1450}
          heightClass={expanded ? 'h-[380px]' : 'h-[248px]'}
        />

        {/* Viewport Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
          {stageMode === '3d' ? (
            <>
              <div className="flex items-center gap-1">
                {(['iso', 'xy', 'xz', 'yz'] as const).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleCameraPreset(preset)}
                    className="px-2 py-1 rounded bg-[#050811] border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors uppercase whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAutoOrbit((p) => !p)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    autoOrbit
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {autoOrbit ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>Orbit</span>
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setColorByPhase((p) => !p)}
                  className={`px-2 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    colorByPhase
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {colorByPhase ? 'Phase ±ψ' : 'Subshell'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNodes((p) => !p)}
                  className={`px-2 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showNodes
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nodes
                </button>
                <button
                  type="button"
                  onClick={() => setShowAxes((p) => !p)}
                  className={`px-2 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showAxes
                      ? 'bg-slate-800 border-slate-700 text-slate-200'
                      : 'bg-[#050811] border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  Axes
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-slate-500 mr-0.5">Plane:</span>
                {(['xz', 'xy', 'yz'] as SlicePlane[]).map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => setSlicePlane(pl)}
                    className={`px-2 py-1 rounded border uppercase transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      slicePlane === pl
                        ? 'bg-sky-500/20 border-sky-500/50 text-sky-300 font-bold'
                        : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {pl}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSliceMetric(sliceMetric === 'psi' ? 'prob' : 'psi')}
                  className="px-2 py-1 rounded bg-[#050811] border border-slate-800 text-sky-300 hover:border-sky-500/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {sliceMetric === 'psi' ? 'Signed ψ(r)' : 'Density |ψ|²'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNodes((p) => !p)}
                  className={`px-2 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showNodes
                      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Nodes
                </button>
              </div>
            </>
          )}
        </div>

        {/* Magnetic Orbital Orientation (m_l) Selector */}
        {activeVariants.length > 1 && (
          <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Magnetic Orientation (mₗ = −{activeSubshell.l} … +{activeSubshell.l})</span>
              <span className="text-slate-500 truncate max-w-[55%]">{activeVariant.angularNodes}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeVariants.map((variant) => {
                const isAct = variant.index === activeVariant.index;
                return (
                  <button
                    key={variant.shortLabel}
                    type="button"
                    onClick={() =>
                      setSelectedState((prev) => ({
                        ...prev,
                        orbitalIndex: variant.index,
                      }))
                    }
                    className={`px-2 py-1 rounded text-[10px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                      isAct
                        ? 'bg-sky-500/20 border-sky-500/60 text-white font-semibold'
                        : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {variant.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Radial Wavefunction & Probability Density Plot */}
        <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 font-mono">
              <Crosshair className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-100">
                {plotMode === 'pdf'
                  ? `Radial PDF P_${activeSubshell.label}(r) = r²|R|²`
                  : plotMode === 'wave'
                  ? `Radial Wavefunction R_${activeSubshell.label}(r)`
                  : plotMode === 'cdf'
                  ? `Enclosed Charge Q_${activeSubshell.label}(r)`
                  : `Total Atomic Density Σ Nₖ Pₖ(r)`}
              </span>
            </div>

            <div className="flex items-center gap-1 font-mono text-[10px]">
              {(
                [
                  { id: 'pdf', label: 'P(r)' },
                  { id: 'wave', label: 'R(r)' },
                  { id: 'cdf', label: 'Q(r)' },
                  { id: 'total', label: 'ΣP(r)' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPlotMode(m.id)}
                  className={`px-2 py-0.5 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    plotMode === m.id
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-200 font-semibold'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
              {(plotMode === 'pdf' || plotMode === 'total') && (
                <button
                  type="button"
                  onClick={() => setUseLogScale((p) => !p)}
                  className={`px-2 py-0.5 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    useLogScale
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                      : 'bg-[#050811] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  log₁₀
                </button>
              )}
            </div>
          </div>

          <RadialWavefunctionPlot
            n={activeSubshell.n}
            l={activeSubshell.l}
            zEff={slater.zEff}
            subshellLabel={activeSubshell.label}
            subshellColor={activeSubshell.color}
            plotMode={plotMode}
            useLogScale={useLogScale}
            allSubshells={config.subshells}
            heightPx={expanded ? 210 : 178}
          />
        </div>
      </div>

      {/* RIGHT / QUANTUM METROLOGY, SLATER SCREENING & AUFBAU SPIN WORKBENCH */}
      <div className={expanded ? 'lg:col-span-5 space-y-3' : 'space-y-3'}>
        {/* Unboxed Spectroscopic & Magnetic Telemetry Summary */}
        <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-2.5 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="min-w-0">
              <div className="text-[10px] text-slate-400">
                {formatIonSymbol()} · {config.totalElectrons} e⁻ · Shells [{config.shellPopulations.join(', ')}]
              </div>
              <div className="text-xs font-semibold text-emerald-300 truncate mt-0.5" title={config.configString}>
                {config.configString}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] text-slate-500">Ground Term</div>
              <div className="text-sm font-bold text-white tabular-nums">{config.termSymbol.formatted}</div>
            </div>
          </div>

          {config.isAnomalous && config.anomalyNote && (
            <div className="text-[10px] text-amber-300/90 leading-snug">
              ▲ IUPAC anomaly: {config.anomalyNote}
            </div>
          )}

          {/* 4-Metric Clean Tabular Readout Strip (No nested cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-x-4 gap-y-2 pt-0.5 tabular-nums">
            <div>
              <div className="text-[10px] text-slate-500">Magnetism</div>
              <div className={`text-xs font-semibold ${config.isParamagnetic ? 'text-amber-300' : 'text-slate-300'}`}>
                {config.isParamagnetic ? '● Paramagnetic' : '○ Diamagnetic'}{' '}
                <span className="text-[10px] text-slate-400 font-normal">({config.totalUnpaired}e⁻)</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">Moments (μ_so / μ_eff)</div>
              <div className="text-xs font-semibold text-sky-300">
                {config.termSymbol.muSpinOnly.toFixed(2)} / {config.termSymbol.muEffJ.toFixed(2)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">μ_B</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">Slater Z_eff ({activeSubshell.label})</div>
              <div className="text-xs font-semibold text-indigo-300">
                {slater.zEff.toFixed(2)}{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  (σ={slater.sigma.toFixed(2)})
                </span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500">Slater E({activeSubshell.label}) · Nodes</div>
              <div className="text-xs font-semibold text-slate-200">
                {Math.abs(slater.energyEv) >= 1000
                  ? `${(slater.energyEv / 1000).toFixed(2)} keV`
                  : `${slater.energyEv.toFixed(1)} eV`}{' '}
                <span className="text-[10px] text-slate-500 font-normal">
                  · {radialMetrics.radialNodeCount}R+{radialMetrics.angularNodeCount}A
                </span>
              </div>
            </div>
          </div>

          {/* Slater Screening Decomposition Line */}
          <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 tabular-nums">
            <span>Slater {slater.groupLabel}:</span>
            <span>
              same <strong className="text-slate-200">{slater.sameGroupShield.toFixed(2)}</strong> · (n−1){' '}
              <strong className="text-slate-200">{slater.nMinus1Shield.toFixed(2)}</strong> · core{' '}
              <strong className="text-slate-200">{slater.deepCoreShield.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Interactive Aufbau & Hund's Rule Spin Box Diagram */}
        <div className="bg-[#070A12] border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 font-mono">
            <div className="flex items-center gap-1.5">
              <Atom className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[11px] font-semibold text-slate-100">
                Aufbau Subshells &amp; Hund Spin Boxes
              </span>
            </div>
            <span className="text-[10px] text-slate-500 tabular-nums">
              Click any orbital
            </span>
          </div>

          <div className={`space-y-1.5 ${expanded ? 'max-h-[340px]' : 'max-h-[245px]'} overflow-y-auto pr-1`}>
            {[...config.subshells].reverse().map((sub) => {
              const isSubSelected = sub.label === activeSubshell.label;
              return (
                <div
                  key={sub.label}
                  className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg border transition-colors font-mono ${
                    isSubSelected
                      ? 'bg-sky-500/10 border-sky-500/50'
                      : 'bg-[#050811] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedState({
                        n: sub.n,
                        l: sub.l,
                        orbitalIndex: Math.min(sub.l, REAL_ORBITAL_VARIANTS[sub.l].length - 1),
                        label: sub.label,
                      })
                    }
                    className="flex items-center gap-2 text-left cursor-pointer shrink-0"
                  >
                    <span
                      className="text-[11px] font-bold w-8 tabular-nums"
                      style={{ color: sub.color }}
                    >
                      {sub.label}
                      <sup>{sub.electrons}</sup>
                    </span>
                    <span className="text-[9.5px] text-slate-500 tabular-nums w-12">
                      Z*={sub.zEff.toFixed(1)}
                    </span>
                  </button>

                  {/* Clickable individual m_l Hund Spin Boxes */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {sub.boxes.map((box, bIdx) => {
                      const isBoxFocused = isSubSelected && activeVariant.index === bIdx;
                      return (
                        <button
                          key={bIdx}
                          type="button"
                          onClick={() =>
                            setSelectedState({
                              n: sub.n,
                              l: sub.l,
                              orbitalIndex: bIdx,
                              label: sub.label,
                            })
                          }
                          title={`${sub.n}${box.orbitalShortLabel} (mₗ = ${box.ml > 0 ? `+${box.ml}` : box.ml})`}
                          className={`w-6 h-7 rounded border flex flex-col items-center justify-center transition-colors cursor-pointer ${
                            isBoxFocused
                              ? 'bg-sky-500/20 border-sky-400 text-white'
                              : 'bg-[#080D1A] border-slate-700/80 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-center justify-center leading-none text-[11px] font-bold">
                            {box.up && <span className="text-sky-300">↑</span>}
                            {box.down && <span className="text-amber-300">↓</span>}
                            {!box.up && !box.down && <span className="text-slate-700 text-[9px]">·</span>}
                          </div>
                          <span className="text-[7.5px] text-slate-500 leading-none mt-0.5 tabular-nums">
                            {box.ml > 0 ? `+${box.ml}` : box.ml}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {!isExpandedLab && renderWorkbenchContent(false)}

      {/* Dedicated Fullscreen Quantum Laboratory Modal (Independent Canvas Mount) */}
      {isExpandedLab && (
        <div className="fixed inset-0 z-50 bg-[#04070F]/95 backdrop-blur-md p-4 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Atomic Orbital Laboratory — {element.name} ({formatIonSymbol()}, Z = {element.number})
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    Exact Slater-screened Laguerre wavefunctions · Real spherical harmonics · Hund term {config.termSymbol.formatted}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExpandedLab(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono font-semibold text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Close Laboratory
              </button>
            </div>

            {renderWorkbenchContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
