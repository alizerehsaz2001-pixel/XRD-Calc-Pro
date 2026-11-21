import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RotateCw,
  Layers,
  Eye,
  EyeOff,
  SplitSquareHorizontal,
} from 'lucide-react';
import {
  BRAVAIS_DUAL_SPECS,
  PolyhedronMesh,
  Vec3,
  HighSymmetryKPoint,
  computeWignerSeitzMetrics,
} from './wignerSeitzGeometry';

interface WignerSeitzBrillouinPanelProps {
  pearson: string;
  Z: number;
  coordinationNumber: string;
  maxApf: string;
  latticeParams: {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
}

type SpaceViewMode = 'BZ' | 'WS' | 'DUAL';

function projectPoint(
  p: Vec3,
  rotX: number,
  rotY: number,
  scale: number,
  cx: number,
  cy: number
): { x: number; y: number; z: number } {
  const [px, py, pz] = p;
  // Rotate around Z/Y for intuitive crystallography orbit (z up)
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = px * cosY - py * sinY;
  const y1 = px * sinY + py * cosY;
  const z1 = pz;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  return {
    x: cx + x1 * scale,
    y: cy - z2 * scale,
    z: y2, // depth into/out of screen (+y2 toward viewer)
  };
}

function faceNormalAndDepth(
  verts: Vec3[],
  indices: number[],
  rotX: number,
  rotY: number
): { avgZ: number; light: number; facingFront: boolean } {
  const transformed = indices.map((idx) => {
    const p = projectPoint(verts[idx], rotX, rotY, 1, 0, 0);
    return [p.x, -p.y, p.z] as Vec3;
  });
  let avgZ = 0;
  for (const t of transformed) avgZ += t[2];
  avgZ /= transformed.length;

  const a = transformed[0];
  const b = transformed[1];
  const c = transformed[2];
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nx = u[1] * v[2] - u[2] * v[1];
  const ny = u[2] * v[0] - u[0] * v[2];
  const nz = u[0] * v[1] - u[1] * v[0];
  const nLen = Math.hypot(nx, ny, nz) || 1;
  // Light vector from top-left-front
  const dot = Math.abs((nx * -0.35 + ny * 0.55 + nz * 0.76) / nLen);
  return { avgZ, light: Math.min(1, Math.max(0.18, dot)), facingFront: nz >= -0.05 };
}

interface InteractivePolyhedronCanvasProps {
  mesh: PolyhedronMesh;
  palette: 'cyan' | 'amber';
  rotX: number;
  rotY: number;
  showFaces: boolean;
  showKPoints: boolean;
  showPath: boolean;
  kPoints?: HighSymmetryKPoint[];
  ibzPath?: string[];
  activeKPointSymbol?: string;
  pathProgress?: number; // 0..1 along ibzPath
  onSelectKPoint?: (symbol: string) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  badgeLabel: string;
  compact?: boolean;
}

const InteractivePolyhedronCanvas: React.FC<InteractivePolyhedronCanvasProps> = ({
  mesh,
  palette,
  rotX,
  rotY,
  showFaces,
  showKPoints,
  showPath,
  kPoints = [],
  ibzPath = [],
  activeKPointSymbol,
  pathProgress = 0,
  onSelectKPoint,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  badgeLabel,
  compact = false,
}) => {
  const width = compact ? 230 : 300;
  const height = compact ? 210 : 250;
  const cx = width / 2;
  const cy = height / 2;
  const scale = compact ? 66 : 82;

  const projectedVerts = useMemo(
    () => mesh.vertices.map((v) => projectPoint(v, rotX, rotY, scale, cx, cy)),
    [mesh.vertices, rotX, rotY, scale, cx, cy]
  );

  const sortedFaces = useMemo(() => {
    return mesh.faces
      .map((f, idx) => {
        const { avgZ, light } = faceNormalAndDepth(mesh.vertices, f.indices, rotX, rotY);
        return { f, idx, avgZ, light };
      })
      .sort((a, b) => a.avgZ - b.avgZ);
  }, [mesh.faces, mesh.vertices, rotX, rotY]);

  const sortedEdges = useMemo(() => {
    return mesh.edges
      .map(([i, j]) => {
        const p1 = projectedVerts[i];
        const p2 = projectedVerts[j];
        return { i, j, p1, p2, avgZ: (p1.z + p2.z) * 0.5 };
      })
      .sort((a, b) => a.avgZ - b.avgZ);
  }, [mesh.edges, projectedVerts]);

  const kPointMap = useMemo(() => {
    const map = new Map<string, HighSymmetryKPoint>();
    for (const kp of kPoints) map.set(kp.symbol, kp);
    return map;
  }, [kPoints]);

  // Compute animated probe coordinate along ibzPath
  const probe3D = useMemo<Vec3 | null>(() => {
    if (!showPath || ibzPath.length < 2) return null;
    const segments = ibzPath.length - 1;
    const scaled = Math.max(0, Math.min(0.9999, pathProgress)) * segments;
    const segIdx = Math.floor(scaled);
    const t = scaled - segIdx;
    const a = kPointMap.get(ibzPath[segIdx]);
    const b = kPointMap.get(ibzPath[segIdx + 1]);
    if (!a || !b) return null;
    return [
      a.pos[0] + (b.pos[0] - a.pos[0]) * t,
      a.pos[1] + (b.pos[1] - a.pos[1]) * t,
      a.pos[2] + (b.pos[2] - a.pos[2]) * t,
    ];
  }, [showPath, ibzPath, kPointMap, pathProgress]);

  const originProj = useMemo(
    () => projectPoint([0, 0, 0], rotX, rotY, scale, cx, cy),
    [rotX, rotY, scale, cx, cy]
  );

  const axisEnds = useMemo(() => {
    const len = 1.18;
    return [
      { label: palette === 'cyan' ? 'k_x' : 'a', p: projectPoint([len, 0, 0], rotX, rotY, scale, cx, cy), color: '#f87171' },
      { label: palette === 'cyan' ? 'k_y' : 'b', p: projectPoint([0, len, 0], rotX, rotY, scale, cx, cy), color: '#34d399' },
      { label: palette === 'cyan' ? 'k_z' : 'c', p: projectPoint([0, 0, len], rotX, rotY, scale, cx, cy), color: '#60a5fa' },
    ];
  }, [palette, rotX, rotY, scale, cx, cy]);

  const strokeMain = palette === 'cyan' ? '#38bdf8' : '#f59e0b';
  const strokeBack = palette === 'cyan' ? 'rgba(56,189,248,0.24)' : 'rgba(245,158,11,0.24)';
  const activeKp = activeKPointSymbol ? kPointMap.get(activeKPointSymbol) : undefined;
  const activeKpProj = activeKp ? projectPoint(activeKp.pos, rotX, rotY, scale, cx, cy) : null;
  const probeProj = probe3D ? projectPoint(probe3D, rotX, rotY, scale, cx, cy) : null;

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      className="relative bg-[#04070F] border border-slate-800/90 rounded-lg overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Top-Left Subtle Canvas Label */}
      <div className="absolute top-2 left-2.5 z-10 pointer-events-none flex items-center gap-2 font-mono text-[10px]">
        <span className={palette === 'cyan' ? 'text-cyan-300 font-bold' : 'text-amber-300 font-bold'}>
          {badgeLabel}
        </span>
        <span className="text-slate-500">·</span>
        <span className="text-slate-400 tabular-nums">
          {mesh.faceCount}F / {mesh.edgeCount}E / {mesh.vertexCount}V
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block">
        {/* Calibrated background reticle */}
        <circle
          cx={cx}
          cy={cy}
          r={scale * 1.12}
          fill="none"
          stroke="rgba(148,163,184,0.08)"
          strokeWidth="0.75"
          strokeDasharray="2 4"
        />
        <line x1={cx - scale * 1.2} y1={cy} x2={cx + scale * 1.2} y2={cy} stroke="rgba(148,163,184,0.06)" strokeWidth="0.75" />
        <line x1={cx} y1={cy - scale * 1.2} x2={cx} y2={cy + scale * 1.2} stroke="rgba(148,163,184,0.06)" strokeWidth="0.75" />

        {/* Coordinate axes */}
        {axisEnds.map((ax) => (
          <g key={ax.label} opacity="0.55">
            <line
              x1={originProj.x}
              y1={originProj.y}
              x2={ax.p.x}
              y2={ax.p.y}
              stroke={ax.color}
              strokeWidth="0.9"
              strokeDasharray="2 2"
            />
            <text
              x={ax.p.x + (ax.p.x >= cx ? 4 : -10)}
              y={ax.p.y + (ax.p.y >= cy ? 8 : -3)}
              fill={ax.color}
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {ax.label}
            </text>
          </g>
        ))}

        {/* Painter-sorted translucent faces */}
        {showFaces &&
          sortedFaces.map(({ f, idx, light }) => {
            const pts = f.indices.map((vi) => `${projectedVerts[vi].x.toFixed(1)},${projectedVerts[vi].y.toFixed(1)}`).join(' ');
            const alpha = (0.06 + light * 0.14).toFixed(3);
            const fill =
              palette === 'cyan'
                ? f.kind === 'hex'
                  ? `rgba(14, 165, 233, ${alpha})`
                  : f.kind === 'square'
                  ? `rgba(56, 189, 248, ${(Number(alpha) * 1.25).toFixed(3)})`
                  : `rgba(34, 211, 238, ${alpha})`
                : f.kind === 'hex'
                ? `rgba(245, 158, 11, ${alpha})`
                : `rgba(251, 191, 36, ${(Number(alpha) * 1.15).toFixed(3)})`;
            return (
              <polygon
                key={`face-${idx}`}
                points={pts}
                fill={fill}
                stroke="none"
              />
            );
          })}

        {/* Depth-cued edges */}
        {sortedEdges.map((e, idx) => {
          const isBack = e.avgZ < -0.08;
          return (
            <line
              key={`edge-${idx}`}
              x1={e.p1.x}
              y1={e.p1.y}
              x2={e.p2.x}
              y2={e.p2.y}
              stroke={isBack ? strokeBack : strokeMain}
              strokeWidth={isBack ? 0.85 : 1.35}
              strokeDasharray={isBack ? '2.5 2.5' : undefined}
              strokeLinecap="round"
            />
          );
        })}

        {/* Irreducible Brillouin Zone High-Symmetry k-Path */}
        {showPath && ibzPath.length >= 2 && (
          <g>
            {ibzPath.slice(0, -1).map((symA, idx) => {
              const symB = ibzPath[idx + 1];
              const a = kPointMap.get(symA);
              const b = kPointMap.get(symB);
              if (!a || !b) return null;
              const pa = projectPoint(a.pos, rotX, rotY, scale, cx, cy);
              const pb = projectPoint(b.pos, rotX, rotY, scale, cx, cy);
              return (
                <line
                  key={`path-${idx}`}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="#fbbf24"
                  strokeWidth="1.9"
                  strokeOpacity="0.88"
                  strokeLinecap="round"
                />
              );
            })}
          </g>
        )}

        {/* Active Γ → k vector highlight */}
        {showKPoints && activeKpProj && activeKPointSymbol !== 'Γ' && (
          <line
            x1={originProj.x}
            y1={originProj.y}
            x2={activeKpProj.x}
            y2={activeKpProj.y}
            stroke="#34d399"
            strokeWidth="2.1"
            strokeDasharray="3 2"
          />
        )}

        {/* Animated k-path probe particle */}
        {probeProj && (
          <g>
            <circle cx={probeProj.x} cy={probeProj.y} r="5.5" fill="rgba(251,191,36,0.22)" />
            <circle cx={probeProj.x} cy={probeProj.y} r="2.8" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
          </g>
        )}

        {/* Central Lattice Node (for WS mode) */}
        {!showKPoints && (
          <g>
            <circle cx={originProj.x} cy={originProj.y} r="4.5" fill="#f59e0b" stroke="#fef3c7" strokeWidth="1" />
            <text
              x={originProj.x + 7}
              y={originProj.y - 5}
              fill="#fde68a"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              R₀ (0,0,0)
            </text>
          </g>
        )}

        {/* Clickable High-Symmetry k-Points */}
        {showKPoints &&
          kPoints.map((kp) => {
            const p = projectPoint(kp.pos, rotX, rotY, scale, cx, cy);
            const isSelected = kp.symbol === activeKPointSymbol;
            return (
              <g
                key={kp.symbol}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectKPoint?.(kp.symbol);
                }}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 5.2 : 3.4}
                  fill={isSelected ? '#10b981' : kp.symbol === 'Γ' ? '#fbbf24' : '#38bdf8'}
                  stroke="#020617"
                  strokeWidth="1.2"
                />
                <text
                  x={p.x + 7}
                  y={p.y - 4}
                  fill={isSelected ? '#6ee7b7' : kp.symbol === 'Γ' ? '#fef08a' : '#e0f2fe'}
                  fontSize={isSelected ? '11' : '9.5'}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {kp.symbol}
                </text>
              </g>
            );
          })}
      </svg>

      {/* Bottom Hint */}
      <div className="absolute bottom-1.5 right-2.5 pointer-events-none font-mono text-[9px] text-slate-500">
        Drag to orbit
      </div>
    </div>
  );
};

export const WignerSeitzBrillouinPanel: React.FC<WignerSeitzBrillouinPanelProps> = ({
  pearson,
  Z,
  coordinationNumber,
  maxApf,
  latticeParams,
  isExpanded,
  onToggleExpand,
}) => {
  const spec = BRAVAIS_DUAL_SPECS[pearson] ?? BRAVAIS_DUAL_SPECS.cF;

  const [spaceMode, setSpaceMode] = useState<SpaceViewMode>('BZ');
  const [rot, setRot] = useState<{ x: number; y: number }>({ x: 0.48, y: 0.68 });
  const [autoOrbit, setAutoOrbit] = useState<boolean>(false);
  const [showFaces, setShowFaces] = useState<boolean>(true);
  const [showPath, setShowPath] = useState<boolean>(true);
  const [selectedKPoint, setSelectedKPoint] = useState<string>(spec.kPoints[1]?.symbol ?? 'Γ');
  const [pathProgress, setPathProgress] = useState<number>(0.18);
  const [isPlayingPath, setIsPlayingPath] = useState<boolean>(false);

  const draggingRef = useRef<{ active: boolean; x: number; y: number }>({
    active: false,
    x: 0,
    y: 0,
  });

  // Reset selected k-point cleanly when switching Bravais lattice
  useEffect(() => {
    setSelectedKPoint(spec.kPoints[1]?.symbol ?? 'Γ');
    setPathProgress(0.18);
  }, [pearson, spec.kPoints]);

  // Smooth auto-orbit animation
  useEffect(() => {
    if (!autoOrbit) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!draggingRef.current.active) {
        setRot((prev) => ({ x: prev.x, y: prev.y + dt * 0.55 }));
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [autoOrbit]);

  // Smooth IBZ path probe animation
  useEffect(() => {
    if (!isPlayingPath) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      setPathProgress((prev) => (prev + dt * 0.14) % 1);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlayingPath]);

  const handlePointerDown = (e: React.PointerEvent) => {
    draggingRef.current = { active: true, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current.active) return;
    const dx = e.clientX - draggingRef.current.x;
    const dy = e.clientY - draggingRef.current.y;
    draggingRef.current.x = e.clientX;
    draggingRef.current.y = e.clientY;
    setRot((prev) => ({
      x: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev.x + dy * 0.01)),
      y: prev.y + dx * 0.01,
    }));
  };

  const handlePointerUp = () => {
    draggingRef.current.active = false;
  };

  const metrics = useMemo(
    () =>
      computeWignerSeitzMetrics(
        latticeParams.a,
        latticeParams.b,
        latticeParams.c,
        latticeParams.alpha,
        latticeParams.beta,
        latticeParams.gamma,
        Z
      ),
    [latticeParams, Z]
  );

  const activeKpObj = useMemo(
    () => spec.kPoints.find((k) => k.symbol === selectedKPoint) ?? spec.kPoints[0],
    [spec.kPoints, selectedKPoint]
  );

  const activeKMag = activeKpObj ? activeKpObj.kScaleFactor * metrics.kRefScale : 0;
  const activeBraggD = activeKMag > 1e-4 ? Math.PI / activeKMag : null;

  const activeMesh = spaceMode === 'WS' ? spec.realPoly : spec.bzPoly;

  // Current segment along IBZ path
  const currentSegmentLabel = useMemo(() => {
    if (spec.ibzPath.length < 2) return 'Γ';
    const segs = spec.ibzPath.length - 1;
    const idx = Math.min(segs - 1, Math.floor(pathProgress * segs));
    return `${spec.ibzPath[idx]} → ${spec.ibzPath[idx + 1]}`;
  }, [spec.ibzPath, pathProgress]);

  return (
    <div className="bg-[#070A12] border border-slate-800 rounded-xl p-4 space-y-3.5 font-sans text-left">
      {/* Header Row: Title + Space Toggle + Expand */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 truncate">
              2. Wigner–Seitz &amp; 1st Brillouin Zone
            </h4>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              {spec.dualityFormula}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Space Selector Segmented Control */}
          <div className="flex items-center gap-0.5 bg-[#04070F] p-0.5 rounded-lg border border-slate-800 font-mono text-[10.5px]">
            <button
              type="button"
              onClick={() => setSpaceMode('BZ')}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                spaceMode === 'BZ'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/45'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              1st BZ (k)
            </button>
            <button
              type="button"
              onClick={() => setSpaceMode('WS')}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                spaceMode === 'WS'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/45'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              Wigner–Seitz (r)
            </button>
            <button
              type="button"
              onClick={() => setSpaceMode('DUAL')}
              className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                spaceMode === 'DUAL'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/45'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
              title="Compare Real-Space Wigner–Seitz and Reciprocal-Space 1st Brillouin Zone side-by-side"
            >
              <SplitSquareHorizontal className="w-3 h-3" />
              <span>Dual</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={isExpanded ? 'Return to compact grid' : 'Expand Wigner–Seitz & BZ workbench full width'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Split Stage: 3D Polyhedron(s) + Scientific Inspector */}
      <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-12' : 'xl:grid-cols-12'} gap-4 items-start`}>
        {/* Left: Interactive 3D Viewport + Camera Toolbar */}
        <div className={`${isExpanded ? 'lg:col-span-6' : 'xl:col-span-6'} space-y-2`}>
          {spaceMode === 'DUAL' ? (
            <div className="grid grid-cols-2 gap-2">
              <InteractivePolyhedronCanvas
                mesh={spec.realPoly}
                palette="amber"
                rotX={rot.x}
                rotY={rot.y}
                showFaces={showFaces}
                showKPoints={false}
                showPath={false}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                badgeLabel="Real WS (r)"
                compact
              />
              <InteractivePolyhedronCanvas
                mesh={spec.bzPoly}
                palette="cyan"
                rotX={rot.x}
                rotY={rot.y}
                showFaces={showFaces}
                showKPoints={true}
                showPath={showPath}
                kPoints={spec.kPoints}
                ibzPath={spec.ibzPath}
                activeKPointSymbol={selectedKPoint}
                pathProgress={pathProgress}
                onSelectKPoint={setSelectedKPoint}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                badgeLabel="1st BZ (k)"
                compact
              />
            </div>
          ) : (
            <InteractivePolyhedronCanvas
              mesh={activeMesh}
              palette={spaceMode === 'WS' ? 'amber' : 'cyan'}
              rotX={rot.x}
              rotY={rot.y}
              showFaces={showFaces}
              showKPoints={spaceMode === 'BZ'}
              showPath={spaceMode === 'BZ' && showPath}
              kPoints={spec.kPoints}
              ibzPath={spec.ibzPath}
              activeKPointSymbol={selectedKPoint}
              pathProgress={pathProgress}
              onSelectKPoint={setSelectedKPoint}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              badgeLabel={spaceMode === 'WS' ? 'Real-Space Wigner–Seitz' : 'Reciprocal 1st Brillouin Zone'}
            />
          )}

          {/* Compact Camera & Layer Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 font-mono text-[10px]">
            <div className="flex items-center gap-1">
              {[
                { label: 'Iso', x: 0.48, y: 0.68 },
                { label: '[100]', x: 0, y: 0 },
                { label: '[001]', x: Math.PI / 2, y: 0 },
                { label: '[111]', x: 0.615, y: Math.PI / 4 },
              ].map((snap) => (
                <button
                  key={snap.label}
                  type="button"
                  onClick={() => setRot({ x: snap.x, y: snap.y })}
                  className="px-2 py-1 rounded bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {snap.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAutoOrbit((v) => !v)}
                className={`px-2 py-1 rounded border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  autoOrbit
                    ? 'bg-cyan-500/20 border-cyan-500/45 text-cyan-200'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {autoOrbit ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>Orbit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowFaces((v) => !v)}
                className={`px-2 py-1 rounded border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  showFaces
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-white'
                }`}
                title="Toggle shaded Voronoi/Bragg faces"
              >
                {showFaces ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Faces</span>
              </button>
              {spaceMode !== 'WS' && (
                <button
                  type="button"
                  onClick={() => setShowPath((v) => !v)}
                  className={`px-2 py-1 rounded border flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    showPath
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-[#0B0F19] border-slate-800 text-slate-500 hover:text-white'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>k-Path</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setRot({ x: 0.48, y: 0.68 })}
                className="p-1 rounded bg-[#0B0F19] border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Reset camera orientation"
              >
                <RotateCw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Dual Polyhedron Telemetry, Interactive k-Points & IBZ Scrubber */}
        <div className={`${isExpanded ? 'lg:col-span-6' : 'xl:col-span-6'} space-y-3`}>
          {/* Duality Description (Clean unboxed typography with hairline divider) */}
          <div className="space-y-1.5 pb-2.5 border-b border-slate-800/80">
            <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-[11px]">
              <span className="text-slate-400">
                {spaceMode === 'WS' ? 'Real-Space Proximity Polyhedron' : '1st Brillouin Polyhedron'}
              </span>
              <span className="text-slate-500 tabular-nums">
                Euler V − E + F = {activeMesh.vertexCount - activeMesh.edgeCount + activeMesh.faceCount}
              </span>
            </div>
            <div className="text-xs font-semibold text-white">
              {spaceMode === 'WS' ? spec.realSpaceName : spec.reciprocalSpaceName}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {spec.dualityNote}
            </p>
          </div>

          {/* Interactive High-Symmetry k-Point Inspector */}
          <div className="space-y-2 pb-2.5 border-b border-slate-800/80">
            <div className="flex items-center justify-between font-mono text-[10px]">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                High-Symmetry k-Points
              </span>
              <span className="text-slate-500">Click to inspect Γ → k</span>
            </div>

            <div className="flex flex-wrap gap-1 font-mono">
              {spec.kPoints.map((kp) => {
                const isSelected = kp.symbol === selectedKPoint;
                return (
                  <button
                    key={kp.symbol}
                    type="button"
                    onClick={() => {
                      setSelectedKPoint(kp.symbol);
                      if (spaceMode === 'WS') setSpaceMode('BZ');
                    }}
                    className={`px-2 py-1 rounded text-[11px] font-bold border whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50'
                        : 'bg-[#0B0F19] text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {kp.symbol}
                  </button>
                );
              })}
            </div>

            {activeKpObj && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10.5px] tabular-nums">
                <div>
                  <span className="text-[9.5px] text-slate-500 block">Fractional k</span>
                  <span className="text-emerald-300 font-bold">
                    {activeKpObj.symbol} {activeKpObj.fracLabel}
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-500 block">|k| from Γ</span>
                  <span className="text-cyan-300 font-bold">
                    {activeKMag.toFixed(3)} <span className="text-slate-500 font-normal">Å⁻¹</span>
                  </span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-500 block">Bragg d = π/|k|</span>
                  <span className="text-amber-300 font-bold">
                    {activeBraggD !== null ? `${activeBraggD.toFixed(3)} Å` : 'Origin'}
                  </span>
                </div>
                <div className="sm:col-span-3 text-[11px] font-sans text-slate-400">
                  {activeKpObj.role}
                </div>
              </div>
            )}
          </div>

          {/* Standard IBZ Band k-Path Scrubber */}
          <div className="space-y-1.5 pb-2.5 border-b border-slate-800/80 font-mono">
            <div className="flex items-center justify-between gap-2 text-[10px]">
              <span className="text-slate-400 uppercase tracking-wider font-semibold">
                IBZ Band Path · <span className="text-amber-300">{currentSegmentLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (spaceMode === 'WS') setSpaceMode('BZ');
                  setShowPath(true);
                  setIsPlayingPath((v) => !v);
                }}
                className="px-2 py-0.5 rounded bg-[#0B0F19] hover:bg-slate-800 border border-slate-800 text-amber-300 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isPlayingPath ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
                <span>{isPlayingPath ? 'Pause' : 'Traverse'}</span>
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.005}
              value={pathProgress}
              onChange={(e) => {
                if (spaceMode === 'WS') setSpaceMode('BZ');
                setShowPath(true);
                setPathProgress(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
              aria-label="Scrub irreducible Brillouin zone k-path"
            />
            <div className="text-[10px] text-slate-400 tracking-wide overflow-x-auto whitespace-nowrap">
              {spec.ibzPath.join(' → ')}
            </div>
          </div>

          {/* Calibrated Live Quantitative Metrology Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2 font-mono tabular-nums">
            <div>
              <span className="text-[9.5px] text-slate-500 block">Primitive V_p</span>
              <span className="text-xs font-bold text-white">
                {metrics.vPrimA3.toFixed(2)} <span className="text-[9.5px] text-slate-500 font-normal">Å³</span>
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 block">BZ Vol (2π)³/V_p</span>
              <span className="text-xs font-bold text-cyan-300">
                {metrics.vBzInvA3.toFixed(2)} <span className="text-[9.5px] text-slate-500 font-normal">Å⁻³</span>
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 block">WS Radius r_WS</span>
              <span className="text-xs font-bold text-amber-300">
                {metrics.rWsA.toFixed(3)} <span className="text-[9.5px] text-slate-500 font-normal">Å</span>
              </span>
            </div>
            <div>
              <span className="text-[9.5px] text-slate-500 block">Packing / CN</span>
              <span className="text-xs font-bold text-emerald-300">
                {maxApf.split(' ')[0]} <span className="text-[9.5px] text-slate-400 font-normal">· {coordinationNumber.split(' ')[0]}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
