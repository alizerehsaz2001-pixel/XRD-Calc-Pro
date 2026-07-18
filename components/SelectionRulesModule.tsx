import React, { useState, useEffect, useMemo, useRef } from "react";
import { CrystalSystem, SelectionRuleResult } from "../types";
import { parseHKLString, validateSelectionRule } from "../utils/physics";
import { ScientificMathControl } from "./ScientificMathControl";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  Info,
  RefreshCw,
  Filter,
  BookOpen,
  Layers,
  Zap,
  ChevronDown,
  Check,
  Maximize,
  RotateCw,
  Split,
  CircleDot,
  ShieldQuestion,
  Loader2,
  Atom,
  Binary,
  Beaker,
  Network,
  Hexagon,
  Component,
  Box,
  Cuboid,
  Pyramid,
  Download,
  X,
  Play,
  Pause,
  Activity,
  Compass,
  Sparkles,
} from "lucide-react";

const Symmetry3DVisualizer = ({
  system,
  showLatticeOutline,
  showMirrorPlanes,
  showSymmetryAxes,
  showInversionCenter,
  currentSymmetry,
  showBasisAtoms = true,
  showCoordinationBonds = true,
  showMillerPlane = false,
  millerH = 1,
  millerK = 1,
  millerL = 1,
}: any) => {
  const [rotation, setRotation] = useState({ x: -Math.PI / 6, y: Math.PI / 4 });
  const [isDragging, setIsDragging] = useState(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    setRotation((prev) => ({
      x: prev.x - dy * 0.01,
      y: prev.y - dx * 0.01,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isHex = system === "Hexagonal";
  const isMono = system === "Monoclinic";
  const isTri = system === "Triclinic";
  const isOrth = ["Orthorhombic", "Orthorhombic_F", "Orthorhombic_C"].includes(
    system,
  );
  const isTet = ["Tetragonal", "Tetragonal_I"].includes(system);
  const isCubic = ["SC", "BCC", "FCC", "Cubic", "Diamond"].includes(system);

  // Manual rotated view
  const angleY = rotation.y;
  const angleX = rotation.x;

  const project3D = (x: number, y: number, z: number) => {
    // Rotation around Y
    const x1 = x * Math.cos(angleY) - z * Math.sin(angleY);
    const z1 = x * Math.sin(angleY) + z * Math.cos(angleY);
    const y1 = y; // y is up

    // Rotation around X
    const y2 = y1 * Math.cos(angleX) - z1 * Math.sin(angleX);
    const z2 = y1 * Math.sin(angleX) + z1 * Math.cos(angleX);
    const x2 = x1;

    const scale = 55;
    return {
      x: 150 + x2 * scale,
      y: 100 + y2 * scale,
      z: z2,
    };
  };

  let vertices: [number, number, number][] = [];
  let axes: {
    start: [number, number, number];
    end: [number, number, number];
    label: string;
    color: string;
  }[] = [];
  let planes: [number, number, number][][] = [];

  const hexRadius = 0.9;

  if (isHex) {
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      vertices.push([Math.cos(a) * hexRadius, Math.sin(a) * hexRadius, 0.9]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      vertices.push([Math.cos(a) * hexRadius, Math.sin(a) * hexRadius, -0.9]);
    }
    axes = [
      {
        start: [0, 0, -1.3],
        end: [0, 0, 1.3],
        label: "6-fold (C6)",
        color: "#06b6d4",
      },
      {
        start: [-1.2, 0, 0],
        end: [1.2, 0, 0],
        label: "2-fold (C2)",
        color: "#a855f7",
      },
      {
        start: [-0.6, -1.03, 0],
        end: [0.6, 1.03, 0],
        label: "2-fold (C2)",
        color: "#a855f7",
      },
      {
        start: [0.6, -1.03, 0],
        end: [-0.6, 1.03, 0],
        label: "2-fold (C2)",
        color: "#a855f7",
      },
    ];
    const hexPlane: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      hexPlane.push([Math.cos(a) * hexRadius, Math.sin(a) * hexRadius, 0]);
    }
    planes = [hexPlane];
  } else {
    let sx = 0.85,
      sy = 0.85,
      sz = 0.85;
    if (isTet) {
      sx = 0.7;
      sy = 0.7;
      sz = 1.1;
    } else if (isOrth) {
      sx = 0.6;
      sy = 1.0;
      sz = 1.25;
    } else if (isMono) {
      sx = 0.6;
      sy = 0.9;
      sz = 1.0;
    } else if (isTri) {
      sx = 0.6;
      sy = 0.85;
      sz = 0.95;
    }

    const getPt = (
      dx: number,
      dy: number,
      dz: number,
    ): [number, number, number] => {
      let rx = dx * sx;
      let ry = dy * sy;
      let rz = dz * sz;
      if (isMono) {
        ry += dz * 0.35;
      } else if (isTri) {
        rx += dy * 0.15 + dz * 0.25;
        ry += dz * 0.35;
      }
      return [rx, ry, rz];
    };

    vertices = [
      getPt(-1, -1, -1),
      getPt(1, -1, -1),
      getPt(1, 1, -1),
      getPt(-1, 1, -1),
      getPt(-1, -1, 1),
      getPt(1, -1, 1),
      getPt(1, 1, 1),
      getPt(-1, 1, 1),
    ];

    if (isCubic) {
      axes = [
        {
          start: [0, 0, -1.45 * sz],
          end: [0, 0, 1.45 * sz],
          label: "4-fold (C4)",
          color: "#10b981",
        },
        {
          start: [-1.45 * sx, 0, 0],
          end: [1.45 * sx, 0, 0],
          label: "4-fold (C4)",
          color: "#10b981",
        },
        {
          start: [0, -1.45 * sy, 0],
          end: [0, 1.45 * sy, 0],
          label: "4-fold (C4)",
          color: "#10b981",
        },
        {
          start: getPt(-1.25, -1.25, -1.25),
          end: getPt(1.25, 1.25, 1.25),
          label: "3-fold (C3)",
          color: "#a855f7",
        },
      ];
      planes = [
        [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)],
        [getPt(-1, 0, -1), getPt(1, 0, -1), getPt(1, 0, 1), getPt(-1, 0, 1)],
      ];
    } else if (isTet) {
      axes = [
        {
          start: [0, 0, -1.4 * sz],
          end: [0, 0, 1.4 * sz],
          label: "4-fold (C4)",
          color: "#06b6d4",
        },
        {
          start: [-1.3 * sx, 0, 0],
          end: [1.3 * sx, 0, 0],
          label: "2-fold (C2)",
          color: "#a855f7",
        },
        {
          start: [0, -1.3 * sy, 0],
          end: [0, 1.3 * sy, 0],
          label: "2-fold (C2)",
          color: "#a855f7",
        },
      ];
      planes = [
        [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)],
      ];
    } else if (isOrth) {
      axes = [
        {
          start: [-1.3 * sx, 0, 0],
          end: [1.3 * sx, 0, 0],
          label: "2-fold (C2)",
          color: "#a855f7",
        },
        {
          start: [0, -1.3 * sy, 0],
          end: [0, 1.3 * sy, 0],
          label: "2-fold (C2)",
          color: "#a855f7",
        },
        {
          start: [0, 0, -1.3 * sz],
          end: [0, 0, 1.3 * sz],
          label: "2-fold (C2)",
          color: "#a855f7",
        },
      ];
      planes = [
        [getPt(-1, -1, 0), getPt(1, -1, 0), getPt(1, 1, 0), getPt(-1, 1, 0)],
      ];
    } else if (isMono) {
      axes = [
        {
          start: [0, -1.35 * sy, 0],
          end: [0, 1.35 * sy, 0],
          label: "2-fold (C2)",
          color: "#db2777",
        },
      ];
      planes = [
        [getPt(-1, 0, -1), getPt(1, 0, -1), getPt(1, 0, 1), getPt(-1, 0, 1)],
      ];
    }
  }

  type RenderElement = {
    type: string;
    zObj: number;
    content: React.ReactElement;
  };
  const renderQueue: RenderElement[] = [];

  const getPtCustom = (dx: number, dy: number, dz: number): [number, number, number] => {
    if (isHex) {
      return [dx, dy, dz];
    }
    let sx = 0.85, sy = 0.85, sz = 0.85;
    if (isTet) {
      sx = 0.7; sy = 0.7; sz = 1.1;
    } else if (isOrth) {
      sx = 0.6; sy = 1.0; sz = 1.25;
    } else if (isMono) {
      sx = 0.6; sy = 0.9; sz = 1.0;
    } else if (isTri) {
      sx = 0.6; sy = 0.85; sz = 0.95;
    }
    let rx = dx * sx;
    let ry = dy * sy;
    let rz = dz * sz;
    if (isMono) {
      ry += dz * 0.35;
    } else if (isTri) {
      rx += dy * 0.15 + dz * 0.25;
      ry += dz * 0.35;
    }
    return [rx, ry, rz];
  };

  if (showMirrorPlanes) {
    planes.forEach((p, idx) => {
      const pts = p.map((pt) => project3D(pt[0], pt[1], pt[2]));
      const avgZ = pts.reduce((sum, pt) => sum + pt.z, 0) / pts.length;
      const pathString =
        `M ${pts[0].x} ${pts[0].y} ` +
        pts
          .slice(1)
          .map((pt) => `L ${pt.x} ${pt.y}`)
          .join(" ") +
        " Z";
      renderQueue.push({
        type: "plane",
        zObj: avgZ,
        content: (
          <path
            key={`plane-${idx}`}
            d={pathString}
            fill="url(#glass-gradient)"
            stroke="#06b6d4"
            strokeWidth={1}
            strokeDasharray="4 4"
            className="transition-all"
            style={{ filter: "drop-shadow(0 0 6px rgba(6,182,212,0.4))" }}
          />
        ),
      });
    });
  }

  if (showLatticeOutline) {
    if (isHex) {
      const topPts = vertices
        .slice(0, 6)
        .map((v) => project3D(v[0], v[1], v[2]));
      const botPts = vertices
        .slice(6, 12)
        .map((v) => project3D(v[0], v[1], v[2]));

      const avgTopZ = topPts.reduce((acc, p) => acc + p.z, 0) / 6;
      const avgBotZ = botPts.reduce((acc, p) => acc + p.z, 0) / 6;

      const pathTop =
        `M ${topPts[0].x} ${topPts[0].y} ` +
        topPts
          .slice(1)
          .map((pt) => `L ${pt.x} ${pt.y}`)
          .join(" ") +
        " Z";
      const pathBot =
        `M ${botPts[0].x} ${botPts[0].y} ` +
        botPts
          .slice(1)
          .map((pt) => `L ${pt.x} ${pt.y}`)
          .join(" ") +
        " Z";

      renderQueue.push({
        type: "latt-face-t",
        zObj: avgTopZ,
        content: (
          <path
            key="hex-top"
            d={pathTop}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1.5}
            fill="rgba(255,255,255,0.02)"
          />
        ),
      });
      renderQueue.push({
        type: "latt-face-b",
        zObj: avgBotZ,
        content: (
          <path
            key="hex-bot"
            d={pathBot}
            stroke="rgba(255,255,255,0.7)"
            strokeWidth={1.5}
            fill="rgba(255,255,255,0.02)"
          />
        ),
      });

      for (let i = 0; i < 6; i++) {
        renderQueue.push({
          type: "latt-edge",
          zObj: (topPts[i].z + botPts[i].z) / 2,
          content: (
            <line
              key={`side-${i}`}
              x1={topPts[i].x}
              y1={topPts[i].y}
              x2={botPts[i].x}
              y2={botPts[i].y}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1}
            />
          ),
        });
      }
    } else {
      const pts = vertices.map((v) => project3D(v[0], v[1], v[2]));
      const edges = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ];
      edges.forEach(([u, v], idx) => {
        renderQueue.push({
          type: "latt-edge",
          zObj: (pts[u].z + pts[v].z) / 2,
          content: (
            <line
              key={`latt-edge-${idx}`}
              x1={pts[u].x}
              y1={pts[u].y}
              x2={pts[v].x}
              y2={pts[v].y}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={1.5}
            />
          ),
        });
      });
    }
  }

  if (showSymmetryAxes) {
    axes.forEach((axis, idx) => {
      const ptStart = project3D(axis.start[0], axis.start[1], axis.start[2]);
      const ptEnd = project3D(axis.end[0], axis.end[1], axis.end[2]);
      renderQueue.push({
        type: "axis",
        zObj: (ptStart.z + ptEnd.z) / 2,
        content: (
          <g key={`axis-${idx}`}>
            <line
              x1={ptStart.x}
              y1={ptStart.y}
              x2={ptEnd.x}
              y2={ptEnd.y}
              stroke={axis.color}
              strokeWidth={2.5}
              style={{ filter: `drop-shadow(0 0 5px ${axis.color})` }}
            />
            <circle cx={ptStart.x} cy={ptStart.y} r={3} fill={axis.color} />
            <circle cx={ptEnd.x} cy={ptEnd.y} r={3} fill={axis.color} />
          </g>
        ),
      });
    });
  }

  // Draw Corner Nodes
  if (showLatticeOutline) {
    vertices.forEach((v, idx) => {
      const p = project3D(v[0], v[1], v[2]);
      renderQueue.push({
        type: "node",
        zObj: p.z,
        content: (
          <g key={`node-${idx}`}>
            <circle cx={p.x} cy={p.y} r={5} fill="#0f172a" />
            <circle cx={p.x} cy={p.y} r={3.5} fill="#cbd5e1" />
          </g>
        ),
      });
    });
  }

  // Draw Basis Atoms
  if (showBasisAtoms) {
    let basisNodes: { pos: [number, number, number]; color: string; label: string; size: number }[] = [];

    if (isCubic) {
      if (system === "BCC") {
        basisNodes.push({ pos: [0, 0, 0], color: "#fbbf24", label: "Body Center (0.5, 0.5, 0.5)", size: 4.5 });
      } else if (system === "FCC" || system === "Diamond") {
        const fcs: [number, number, number][] = [
          [0, 0, -1], [0, 0, 1],
          [0, -1, 0], [0, 1, 0],
          [-1, 0, 0], [1, 0, 0]
        ];
        fcs.forEach((fc, idx) => {
          basisNodes.push({ pos: fc, color: "#3b82f6", label: `Face Center ${idx+1}`, size: 4 });
        });

        if (system === "Diamond") {
          const tets: [number, number, number][] = [
            [-0.5, -0.5, -0.5],
            [0.5, 0.5, -0.5],
            [-0.5, 0.5, 0.5],
            [0.5, -0.5, 0.5]
          ];
          tets.forEach((tet, idx) => {
            basisNodes.push({ pos: tet, color: "#10b981", label: `Tetrahedral basis ${idx+1}`, size: 4 });
          });
        }
      }
    } else if (isHex) {
      basisNodes.push({ pos: [0, 0, 0.9], color: "#3b82f6", label: "Top Face Center", size: 4 });
      basisNodes.push({ pos: [0, 0, -0.9], color: "#3b82f6", label: "Bottom Face Center", size: 4 });
      
      const midPts: [number, number, number][] = [
        [0, 0.6 * 0.9, 0],
        [-0.52 * 0.9, -0.3 * 0.9, 0],
        [0.52 * 0.9, -0.3 * 0.9, 0]
      ];
      midPts.forEach((mp, idx) => {
        basisNodes.push({ pos: mp, color: "#a855f7", label: `HCP Interstitial ${idx+1}`, size: 4.2 });
      });
    }

    basisNodes.forEach((node, idx) => {
      const p = project3D(...getPtCustom(node.pos[0], node.pos[1], node.pos[2]));
      renderQueue.push({
        type: "basis-node",
        zObj: p.z,
        content: (
          <g key={`basis-node-${idx}`}>
            <circle cx={p.x} cy={p.y} r={node.size + 1.5} fill="#0f172a" />
            <circle cx={p.x} cy={p.y} r={node.size} fill={node.color} stroke="#fff" strokeWidth={1} style={{ filter: `drop-shadow(0 0 5px ${node.color})` }} />
            <title>{node.label}</title>
          </g>
        )
      });
    });

    if (showCoordinationBonds) {
      if (system === "BCC") {
        const corners: [number, number, number][] = [
          [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
          [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
        ];
        corners.forEach((corner, idx) => {
          const ptStart = project3D(...getPtCustom(0, 0, 0));
          const ptEnd = project3D(...getPtCustom(corner[0], corner[1], corner[2]));
          renderQueue.push({
            type: "bond",
            zObj: (ptStart.z + ptEnd.z) / 2,
            content: (
              <line
                key={`bcc-bond-${idx}`}
                x1={ptStart.x}
                y1={ptStart.y}
                x2={ptEnd.x}
                y2={ptEnd.y}
                stroke="#fbbf24"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />
            )
          });
        });
      } else if (system === "Diamond") {
        const bondsList: { from: [number, number, number]; to: [number, number, number] }[] = [
          { from: [-0.5, -0.5, -0.5], to: [-1, -1, -1] },
          { from: [-0.5, -0.5, -0.5], to: [0, -1, -1] },
          { from: [-0.5, -0.5, -0.5], to: [-1, 0, -1] },
          { from: [-0.5, -0.5, -0.5], to: [-1, -1, 0] },

          { from: [0.5, 0.5, -0.5], to: [1, 1, -1] },
          { from: [0.5, 0.5, -0.5], to: [0, 1, -1] },
          { from: [0.5, 0.5, -0.5], to: [1, 0, -1] },
          { from: [0.5, 0.5, -0.5], to: [1, 1, 0] },

          { from: [-0.5, 0.5, 0.5], to: [-1, 1, 1] },
          { from: [-0.5, 0.5, 0.5], to: [0, 1, 1] },
          { from: [-0.5, 0.5, 0.5], to: [-1, 0, 1] },
          { from: [-0.5, 0.5, 0.5], to: [-1, 1, 0] },

          { from: [0.5, -0.5, 0.5], to: [1, -1, 1] },
          { from: [0.5, -0.5, 0.5], to: [0, -1, 1] },
          { from: [0.5, -0.5, 0.5], to: [1, 0, 1] },
          { from: [0.5, -0.5, 0.5], to: [1, -1, 0] }
        ];

        bondsList.forEach((bond, idx) => {
          const ptStart = project3D(...getPtCustom(...bond.from));
          const ptEnd = project3D(...getPtCustom(...bond.to));
          renderQueue.push({
            type: "bond",
            zObj: (ptStart.z + ptEnd.z) / 2,
            content: (
              <line
                key={`diamond-bond-${idx}`}
                x1={ptStart.x}
                y1={ptStart.y}
                x2={ptEnd.x}
                y2={ptEnd.y}
                stroke="#10b981"
                strokeWidth={1.2}
                strokeDasharray="2 2"
                opacity={0.8}
              />
            )
          });
        });
      } else if (isHex) {
        const midPts: [number, number, number][] = [
          [0, 0.6 * 0.9, 0],
          [-0.52 * 0.9, -0.3 * 0.9, 0],
          [0.52 * 0.9, -0.3 * 0.9, 0]
        ];
        for (let i = 0; i < 3; i++) {
          const ptStart = project3D(...getPtCustom(...midPts[i]));
          const ptEnd = project3D(...getPtCustom(...midPts[(i+1)%3]));
          renderQueue.push({
            type: "bond",
            zObj: (ptStart.z + ptEnd.z) / 2,
            content: (
              <line
                key={`hcp-mid-bond-${i}`}
                x1={ptStart.x}
                y1={ptStart.y}
                x2={ptEnd.x}
                y2={ptEnd.y}
                stroke="#a855f7"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />
            )
          });
        }
      }
    }
  }

  // Miller Index plane intersection algorithm
  let planePoints: [number, number, number][] = [];
  if (showMillerPlane && (millerH !== 0 || millerK !== 0 || millerL !== 0)) {
    const A = millerH;
    const B = millerK;
    const C = millerL;
    const D = 2 - (millerH + millerK + millerL);

    let boxVerts: [number, number, number][] = [];
    let boxEdges: [number, number][] = [];

    if (isHex) {
      boxVerts = vertices; // 12 vertices: 0-5 top, 6-11 bottom
      boxEdges = [
        [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], // Top
        [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 6], // Bottom
        [0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11] // Vertical
      ];
    } else {
      boxVerts = [
        [-1, -1, -1],
        [1, -1, -1],
        [1, 1, -1],
        [-1, 1, -1],
        [-1, -1, 1],
        [1, -1, 1],
        [1, 1, 1],
        [-1, 1, 1]
      ];
      boxEdges = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ];
    }

    const rawIntersections: [number, number, number][] = [];

    boxEdges.forEach(([u, v]) => {
      const p1 = boxVerts[u];
      const p2 = boxVerts[v];

      const dx = p2[0] - p1[0];
      const dy = p2[1] - p1[1];
      const dz = p2[2] - p1[2];

      const denom = A * dx + B * dy + C * dz;
      if (Math.abs(denom) > 1e-6) {
        const t = (D - (A * p1[0] + B * p1[1] + C * p1[2])) / denom;
        if (t >= 0 && t <= 1) {
          const ix = p1[0] + t * dx;
          const iy = p1[1] + t * dy;
          const iz = p1[2] + t * dz;
          rawIntersections.push([ix, iy, iz]);
        }
      }
    });

    const uniquePoints: [number, number, number][] = [];
    rawIntersections.forEach(p => {
      if (!uniquePoints.some(up => 
        Math.abs(up[0] - p[0]) < 1e-4 && 
        Math.abs(up[1] - p[1]) < 1e-4 && 
        Math.abs(up[2] - p[2]) < 1e-4
      )) {
        uniquePoints.push(p);
      }
    });

    if (uniquePoints.length >= 3) {
      const cx = uniquePoints.reduce((sum, p) => sum + p[0], 0) / uniquePoints.length;
      const cy = uniquePoints.reduce((sum, p) => sum + p[1], 0) / uniquePoints.length;
      const cz = uniquePoints.reduce((sum, p) => sum + p[2], 0) / uniquePoints.length;

      let Ux = -B, Uy = A, Uz = 0;
      if (Math.abs(A) < 1e-5 && Math.abs(B) < 1e-5) {
        Ux = 0; Uy = 1; Uz = 0;
      }
      const uLen = Math.sqrt(Ux*Ux + Uy*Uy + Uz*Uz);
      const uxNorm = Ux / (uLen || 1), uyNorm = Uy / (uLen || 1), uzNorm = Uz / (uLen || 1);

      const vx = B * uzNorm - C * uyNorm;
      const vy = C * uxNorm - A * uzNorm;
      const vz = A * uyNorm - B * uxNorm;
      const vLen = Math.sqrt(vx*vx + vy*vy + vz*vz);
      const vxNorm = vx / (vLen || 1), vyNorm = vy / (vLen || 1), vzNorm = vz / (vLen || 1);

      const pointsWithAngles = uniquePoints.map(p => {
        const dx = p[0] - cx;
        const dy = p[1] - cy;
        const dz = p[2] - cz;
        const u = dx * uxNorm + dy * uyNorm + dz * uzNorm;
        const v = dx * vxNorm + dy * vyNorm + dz * vzNorm;
        const angle = Math.atan2(v, u);
        return { p, angle };
      });

      pointsWithAngles.sort((a, b) => a.angle - b.angle);
      planePoints = pointsWithAngles.map(item => item.p);
    }
  }

  if (showMillerPlane && planePoints.length >= 3) {
    const projectedPts = planePoints.map(pt => project3D(...getPtCustom(pt[0], pt[1], pt[2])));
    const avgZ = projectedPts.reduce((sum, pt) => sum + pt.z, 0) / projectedPts.length;
    const pathString = `M ${projectedPts[0].x} ${projectedPts[0].y} ` + 
      projectedPts.slice(1).map(pt => `L ${pt.x} ${pt.y}`).join(" ") + " Z";
    
    renderQueue.push({
      type: "miller-plane",
      zObj: avgZ + 0.05,
      content: (
        <g key="miller-plane-g">
          <path
            d={pathString}
            fill="rgba(16, 185, 129, 0.28)"
            stroke="#10b981"
            strokeWidth={1.75}
            style={{ filter: "drop-shadow(0 0 8px rgba(16,185,129,0.5))" }}
          />
          {projectedPts.map((pt, idx) => (
            <circle
              key={`miller-pt-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={2.5}
              fill="#34d399"
              stroke="#fff"
              strokeWidth={0.75}
            />
          ))}
        </g>
      )
    });
  }

  // Draw Base Lattice Vectors Originating at Vertex 0
  if (showLatticeOutline && !isHex) {
    const originPt = project3D(...getPtCustom(-1, -1, -1));
    const vecA = project3D(...getPtCustom(-0.4, -1, -1));
    const vecB = project3D(...getPtCustom(-1, -0.4, -1));
    const vecC = project3D(...getPtCustom(-1, -1, -0.4));

    const axesVectors = [
      { start: originPt, end: vecA, color: "#ef4444", label: "a" },
      { start: originPt, end: vecB, color: "#22c55e", label: "b" },
      { start: originPt, end: vecC, color: "#3b82f6", label: "c" }
    ];

    axesVectors.forEach((av, idx) => {
      renderQueue.push({
        type: "axis-vector",
        zObj: Math.max(av.start.z, av.end.z) + 0.1,
        content: (
          <g key={`axis-vector-${idx}`}>
            <line
              x1={av.start.x}
              y1={av.start.y}
              x2={av.end.x}
              y2={av.end.y}
              stroke={av.color}
              strokeWidth={1.75}
              markerEnd="url(#arrow-head)"
            />
            <text
              x={av.end.x + (av.end.x - av.start.x) * 0.3}
              y={av.end.y + (av.end.y - av.start.y) * 0.3}
              fill={av.color}
              fontSize="8"
              fontFamily="JetBrains Mono"
              fontWeight="black"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {av.label}
            </text>
          </g>
        )
      });
    });
  }

  if (showInversionCenter && currentSymmetry.inversion) {
    const center = project3D(0, 0, 0);
    renderQueue.push({
      type: "center",
      zObj: center.z,
      content: (
        <g key="inv-center">
          <circle
            cx={center.x}
            cy={center.y}
            r={12}
            fill="#fbbf24"
            fillOpacity={0.2}
            className="animate-pulse"
            style={{ filter: "drop-shadow(0 0 10px #fbbf24)" }}
          />
          <circle
            cx={center.x}
            cy={center.y}
            r={4.5}
            fill="#f59e0b"
            stroke="#fff"
            strokeWidth={1.5}
          />
        </g>
      ),
    });
  }

  renderQueue.sort((a, b) => a.zObj - b.zObj);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300 w-full">
      <div 
        className="h-64 bg-[#030712] rounded-2xl border border-[#1e293b] relative overflow-hidden flex items-center justify-center shadow-inner group cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] opacity-100 pointer-events-none"></div>
        <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>

        <svg
          className="w-full h-full max-w-[400px] max-h-[300px] overflow-visible"
          viewBox="0 0 300 200"
        >
          <defs>
            <linearGradient
              id="glass-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(6,182,212,0.4)" />
              <stop offset="100%" stopColor="rgba(6,182,212,0.1)" />
            </linearGradient>
            <marker
              id="arrow-head"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4"
              markerHeight="4"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="context-stroke" />
            </marker>
          </defs>
          <g className="opacity-30 stroke-slate-700" strokeWidth={0.5}>
            <line x1={0} y1={100} x2={300} y2={100} />
            <line x1={150} y1={0} x2={150} y2={200} />
            <circle
              cx={150}
              cy={100}
              r={55}
              fill="none"
              strokeDasharray="2 4"
            />
            <circle
              cx={150}
              cy={100}
              r={85}
              fill="none"
              strokeDasharray="2 4"
            />
          </g>

          {renderQueue.map((item, idx) => React.cloneElement(item.content, { key: `item-${item.type}-${idx}` }))}
        </svg>

        {/* Dynamic Coordinates Overlay */}
        <div className="absolute top-4 left-5 flex items-start flex-col gap-1.5 z-20 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </span>
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-[0.2em] drop-shadow-md">
              Live Matrix
            </span>
          </div>
          <div className="flex flex-col gap-0.5 ml-4">
            <span className="text-[8.5px] font-mono font-bold text-slate-400 uppercase tracking-widest">{system} Lattice</span>
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest">
              θ: {(((angleY * (180 / Math.PI)) % 360 + 360) % 360).toFixed(1).padStart(5, '0')}°
            </span>
            <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest">
              φ: {(((angleX * (180 / Math.PI)) % 360 + 360) % 360).toFixed(1).padStart(5, '0')}°
            </span>
          </div>
        </div>

        {/* Center Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-1.5 h-1.5 border border-indigo-500/40 rounded-full"></div>
        </div>

        {/* Bottom Right Info */}
        <div className="absolute bottom-4 right-5 flex flex-col items-end gap-1.5 z-20 pointer-events-none">
          {showMillerPlane && (
             <div className="text-[9px] font-mono font-black text-emerald-400 bg-emerald-950/40 backdrop-blur px-2 py-1 rounded border border-emerald-900/50 flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
               <span className="opacity-60 text-[8px] uppercase tracking-widest">HKL</span>
               <span>{millerH} {millerK} {millerL}</span>
             </div>
          )}
          <div className="text-[9px] font-mono font-black text-slate-500 bg-[#070D18]/90 backdrop-blur px-2.5 py-1 rounded border border-[#1e293b] shadow-lg uppercase tracking-widest">
            Kinematic 3D Matrix
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateDSpacingForProbe = (
  h: number,
  k: number,
  l: number,
  system: string,
  a: number,
) => {
  if (h === 0 && k === 0 && l === 0) return 0;

  // Set representative cell constants based on the system to showcase realistic non-cubic physics
  let b = a;
  let c = a;

  if (system.startsWith("Tetragonal")) {
    c = a * 1.35; // realistic Tetragonal c/a ratio
    const dInvSq = (h * h + k * k) / (a * a) + (l * l) / (c * c);
    return dInvSq > 0 ? 1 / Math.sqrt(dInvSq) : 0;
  } else if (system.startsWith("Orthorhombic")) {
    b = a * 1.15;
    c = a * 1.45;
    const dInvSq = (h * h) / (a * a) + (k * k) / (b * b) + (l * l) / (c * c);
    return dInvSq > 0 ? 1 / Math.sqrt(dInvSq) : 0;
  } else if (system === "Hexagonal") {
    c = a * 1.633; // ideal HCP c/a packing ratio
    const dInvSq =
      ((4 / 3) * (h * h + k * k + h * k)) / (a * a) + (l * l) / (c * c);
    return dInvSq > 0 ? 1 / Math.sqrt(dInvSq) : 0;
  } else {
    // Cubic systems: SC, BCC, FCC, Diamond, etc.
    const dInvSq = (h * h + k * k + l * l) / (a * a);
    return dInvSq > 0 ? 1 / Math.sqrt(dInvSq) : 0;
  }
};

export const SelectionRulesModule: React.FC = () => {
  const [system, setSystem] = useState<CrystalSystem>("FCC");
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [hklInput, setHklInput] = useState<string>(
    "1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 2 0, 3 1 1",
  );
  const [results, setResults] = useState<SelectionRuleResult[]>([]);
  const [filter, setFilter] = useState<"All" | "Allowed" | "Forbidden">("All");
  const [maxIndex, setMaxIndex] = useState<number>(3);
  const menuRef = useRef<HTMLDivElement>(null);

  const [symmetryTab, setSymmetryTab] = useState<
    "visualizer" | "properties" | "sandbox"
  >("visualizer");
  const [showLatticeOutline, setShowLatticeOutline] = useState(true);
  const [showSymmetryAxes, setShowSymmetryAxes] = useState(true);
  const [showMirrorPlanes, setShowMirrorPlanes] = useState(true);
  const [showInversionCenter, setShowInversionCenter] = useState(true);
  const [showBasisAtoms, setShowBasisAtoms] = useState(true);
  const [showCoordinationBonds, setShowCoordinationBonds] = useState(true);
  const [showMillerPlane, setShowMillerPlane] = useState(false);
  const [visualizerH, setVisualizerH] = useState(1);
  const [visualizerK, setVisualizerK] = useState(1);
  const [visualizerL, setVisualizerL] = useState(1);

  const [sandboxH, setSandboxH] = useState(1);
  const [sandboxK, setSandboxK] = useState(1);
  const [sandboxL, setSandboxL] = useState(0);

  // Reciprocal space 3D visualizer states
  const [recipRotation, setRecipRotation] = useState({ x: 25, y: -45 });
  const [isRecipDragging, setIsRecipDragging] = useState(false);
  const [recipDragStart, setRecipDragStart] = useState({ x: 0, y: 0 });
  const recipCanvasRef = useRef<HTMLCanvasElement>(null);
  const clickStartPos = useRef({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<
    [number, number, number] | null
  >(null);
  const [manualProbe, setManualProbe] = useState<[number, number, number]>([1, 1, 0]);

  // Custom states to improve 3D Reciprocal Space Probe
  const [isOrbiting, setIsOrbiting] = useState<boolean>(false);
  const [projectionMode, setProjectionMode] = useState<"ortho" | "perspective">(
    "perspective",
  );
  const [showEwaldSphere, setShowEwaldSphere] = useState<boolean>(true);
  const [wavelength, setWavelength] = useState<number>(1.5406); // Cu-Ka wavelength in Angstroms
  const [latticeParameter, setLatticeParameter] = useState<number>(4.07); // Custom lattice constant 'a' in Angstroms

  // Helper to get true reciprocal space coordinates based on crystal system
  const getReciprocalBasisCoord = (h: number, k: number, l: number, currentSystem: string) => {
    let rx_basis = h;
    let ry_basis = k;
    let rz_basis = l;

    if (currentSystem === "Hexagonal") {
      rx_basis = h + k * 0.5;
      ry_basis = k * (Math.sqrt(3) / 2);
      rz_basis = l / 1.633;
    } else if (currentSystem.startsWith("Tetragonal")) {
      rz_basis = l / 1.35;
    } else if (currentSystem.startsWith("Orthorhombic")) {
      ry_basis = k / 1.15;
      rz_basis = l / 1.45;
    }
    return { x: rx_basis, y: ry_basis, z: rz_basis };
  };

  // Quick addition indices state
  const [quickH, setQuickH] = useState(1);
  const [quickK, setQuickK] = useState(1);
  const [quickL, setQuickL] = useState(1);

  // Toggle index in the array list
  const toggleHKLNode = (h: number, k: number, l: number) => {
    const parsed = parseHKLString(hklInput);
    const exists = parsed.some((p) => p[0] === h && p[1] === k && p[2] === l);
    let newParsed: [number, number, number][];
    if (exists) {
      newParsed = parsed.filter(
        (p) => !(p[0] === h && p[1] === k && p[2] === l),
      );
    } else {
      newParsed = [...parsed, [h, k, l]];
    }
    setHklInput(newParsed.map((p) => `${p[0]} ${p[1]} ${p[2]}`).join(", "));
  };

  const addQuickHKL = () => {
    const parsed = parseHKLString(hklInput);
    const exists = parsed.some(
      (p) => p[0] === quickH && p[1] === quickK && p[2] === quickL,
    );
    if (!exists) {
      const newParsed = [...parsed, [quickH, quickK, quickL]];
      setHklInput(newParsed.map((p) => `${p[0]} ${p[1]} ${p[2]}`).join(", "));
    }
  };

  const removeHKLAtIndex = (index: number) => {
    const parsed = parseHKLString(hklInput);
    const newParsed = parsed.filter((_, idx) => idx !== index);
    setHklInput(newParsed.map((p) => `${p[0]} ${p[1]} ${p[2]}`).join(", "));
  };

  const clearAllHKLs = () => {
    setHklInput("");
  };

  const loadLowIndexPresets = () => {
    setHklInput("1 0 0, 1 1 0, 1 1 1, 2 0 0, 2 1 0, 2 1 1, 2 2 0, 3 1 1");
  };

  // Orbit animation loop
  useEffect(() => {
    if (!isOrbiting) return;
    let animId: number;
    const animate = () => {
      setRecipRotation((prev) => ({ ...prev, y: (prev.y + 0.4) % 360 }));
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isOrbiting]);

  // 3D Reciprocal visualizer event handlers
  const handleRecipMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsRecipDragging(true);
    setRecipDragStart({ x: e.clientX, y: e.clientY });
    clickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleRecipMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = recipCanvasRef.current;
    if (!canvas) return;

    if (isRecipDragging) {
      const dx = e.clientX - recipDragStart.x;
      const dy = e.clientY - recipDragStart.y;
      setRecipRotation((prev) => ({
        x: Math.max(-95, Math.min(95, prev.x - dy * 0.5)),
        y: prev.y + dx * 0.5,
      }));
      setRecipDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let found: [number, number, number] | null = null;
    let mindist = 15;

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const maxBound = Math.min(Math.max(1, maxIndex), 3);
    const scaleBase = Math.min(rect.width, rect.height) * 0.42;
    const scale = scaleBase / (maxBound + 0.5);
    const rx = (recipRotation.x * Math.PI) / 180;
    const ry = (recipRotation.y * Math.PI) / 180;

    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          if (h === 0 && k === 0 && l === 0) continue; // skip center

          const basis = getReciprocalBasisCoord(h, k, l, system);
          const x1 = basis.x * Math.cos(ry) - basis.z * Math.sin(ry);
          const z1 = basis.x * Math.sin(ry) + basis.z * Math.cos(ry);
          const y2 = basis.y * Math.cos(rx) - z1 * Math.sin(rx);
          const z2 = basis.y * Math.sin(rx) + z1 * Math.cos(rx);

          let projX = cx + x1 * scale;
          let projY = cy + y2 * scale;

          if (projectionMode === "perspective") {
            const cameraDistance = (maxBound + 1.2) * 1.5;
            const depthFactor = Math.max(0.1, 1 - z2 / cameraDistance);
            projX = cx + (x1 * scale) / depthFactor;
            projY = cy + (y2 * scale) / depthFactor;
          }

          const dist = Math.sqrt((mouseX - projX) ** 2 + (mouseY - projY) ** 2);
          if (dist < mindist) {
            mindist = dist;
            found = [h, k, l];
          }
        }
      }
    }
    setHoveredNode(found);
    if (found) {
      setManualProbe(found);
    }
  };

  const handleRecipMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsRecipDragging(false);

    if (
      Math.abs(e.clientX - clickStartPos.current.x) < 5 &&
      Math.abs(e.clientY - clickStartPos.current.y) < 5
    ) {
      const canvas = recipCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let closest: { h: number; k: number; l: number; dist: number } | null =
        null;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const maxBound = Math.min(Math.max(1, maxIndex), 3);
      const scaleBase = Math.min(rect.width, rect.height) * 0.42;
      const scale = scaleBase / (maxBound + 0.5);
      const rx = (recipRotation.x * Math.PI) / 180;
      const ry = (recipRotation.y * Math.PI) / 180;

      for (let h = -maxBound; h <= maxBound; h++) {
        for (let k = -maxBound; k <= maxBound; k++) {
          for (let l = -maxBound; l <= maxBound; l++) {
            if (h === 0 && k === 0 && l === 0) continue;

            const basis = getReciprocalBasisCoord(h, k, l, system);
            const x1 = basis.x * Math.cos(ry) - basis.z * Math.sin(ry);
            const z1 = basis.x * Math.sin(ry) + basis.z * Math.cos(ry);
            const y2 = basis.y * Math.cos(rx) - z1 * Math.sin(rx);
            const z2 = basis.y * Math.sin(rx) + z1 * Math.cos(rx);

            let projX = cx + x1 * scale;
            let projY = cy + y2 * scale;

            if (projectionMode === "perspective") {
              const cameraDistance = (maxBound + 1.2) * 1.5;
              const depthFactor = Math.max(0.1, 1 - z2 / cameraDistance);
              projX = cx + (x1 * scale) / depthFactor;
              projY = cy + (y2 * scale) / depthFactor;
            }

            const dist = Math.sqrt(
              (clickX - projX) ** 2 + (clickY - projY) ** 2,
            );
            if (dist < 15) {
              if (!closest || dist < closest.dist) {
                closest = { h, k, l, dist };
              }
            }
          }
        }
      }

      if (closest) {
        toggleHKLNode(closest.h, closest.k, closest.l);
        setManualProbe([closest.h, closest.k, closest.l]);
      }
    }
  };

  // Drawing reciprocal space nodes in 3D
  useEffect(() => {
    const canvas = recipCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    const rx = (recipRotation.x * Math.PI) / 180;
    const ry = (recipRotation.y * Math.PI) / 180;

    const maxBound = Math.min(Math.max(1, maxIndex), 3);
    const activeNode = hoveredNode || manualProbe;

    const projectPhysical = (x: number, y: number, z: number) => {
      // Dynamic scale based on extent
      const scaleBase = Math.min(width, height) * 0.42;
      const scale = scaleBase / (maxBound + 0.5);
      
      const x1 = x * Math.cos(ry) - z * Math.sin(ry);
      const z1 = x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = y * Math.cos(rx) - z1 * Math.sin(rx);
      const z2 = y * Math.sin(rx) + z1 * Math.cos(rx);

      if (projectionMode === "perspective") {
        const cameraDistance = (maxBound + 1.2) * 1.5;
        const depthFactor = Math.max(0.1, 1 - z2 / cameraDistance);
        return {
          x: cx + (x1 * scale) / depthFactor,
          y: cy + (y2 * scale) / depthFactor,
          z: z2,
        };
      } else {
        return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2 };
      }
    };

    const project = (h: number, k: number, l: number) => {
      const basis = getReciprocalBasisCoord(h, k, l, system);
      return projectPhysical(basis.x, basis.y, basis.z);
    };

    const parsedHKLs = parseHKLString(hklInput);
    const elements: any[] = [];

    // Axis projections
    const origin = project(0, 0, 0);
    const axH = project(maxBound + 0.5, 0, 0);
    const axK = project(0, maxBound + 0.5, 0);
    const axL = project(0, 0, maxBound + 0.5);

    // Grid edges and nodes
    for (let h = -maxBound; h <= maxBound; h++) {
      for (let k = -maxBound; k <= maxBound; k++) {
        for (let l = -maxBound; l <= maxBound; l++) {
          const p1 = project(h, k, l);

          // Render edges
          if (h < maxBound) {
            const p2 = project(h + 1, k, l);
            elements.push({
              type: "edge",
              p1,
              p2,
              h1: h,
              k1: k,
              l1: l,
              h2: h + 1,
              k2: k,
              l2: l,
              z: (p1.z + p2.z) / 2,
            });
          }
          if (k < maxBound) {
            const p2 = project(h, k + 1, l);
            elements.push({
              type: "edge",
              p1,
              p2,
              h1: h,
              k1: k,
              l1: l,
              h2: h,
              k2: k + 1,
              l2: l,
              z: (p1.z + p2.z) / 2,
            });
          }
          if (l < maxBound) {
            const p2 = project(h, k, l + 1);
            elements.push({
              type: "edge",
              p1,
              p2,
              h1: h,
              k1: k,
              l1: l,
              h2: h,
              k2: k,
              l2: l + 1,
              z: (p1.z + p2.z) / 2,
            });
          }

          if (h === 0 && k === 0 && l === 0) continue;

          const isSelected = parsedHKLs.some(
            (p) => p[0] === h && p[1] === k && p[2] === l,
          );

          const val = validateSelectionRule(system, [h, k, l]);
          const status = val.status;
          const reason = val.reason;

          // Ewald Sphere intersection check inside dimensionless space
          const xc_val = -latticeParameter / wavelength;
          const r_val = latticeParameter / wavelength;
          const basis = getReciprocalBasisCoord(h, k, l, system);
          const distToCenter = Math.sqrt((basis.x - xc_val) ** 2 + basis.y ** 2 + basis.z ** 2);
          const isEwaldIntersecting =
            showEwaldSphere && Math.abs(distToCenter - r_val) < 0.25;

          elements.push({
            type: "node",
            h,
            k,
            l,
            p: p1,
            isSelected,
            status,
            reason,
            isEwaldIntersecting,
            z: p1.z,
          });
        }
      }
    }

    // Add Ewald Sphere wireframe
    if (showEwaldSphere) {
      const xc_val = -latticeParameter / wavelength;
      const yc_val = 0;
      const zc_val = 0;
      const r_val = latticeParameter / wavelength;

      // Draw wireframes
      const rings = [
        { plane: "xy", color: "rgba(56, 189, 248, 0.22)" },
        { plane: "xz", color: "rgba(56, 189, 248, 0.22)" },
        { plane: "yz", color: "rgba(56, 189, 248, 0.22)" },
      ];

      rings.forEach((ring) => {
        const ringPoints: any[] = [];
        const divisions = 48; // smoother rings
        for (let i = 0; i <= divisions; i++) {
          const phi = (i / divisions) * 2 * Math.PI;
          let x = xc_val,
            y = yc_val,
            z = zc_val;
          if (ring.plane === "xy") {
            x = xc_val + r_val * Math.cos(phi);
            y = yc_val + r_val * Math.sin(phi);
          } else if (ring.plane === "xz") {
            x = xc_val + r_val * Math.cos(phi);
            z = zc_val + r_val * Math.sin(phi);
          } else if (ring.plane === "yz") {
            y = yc_val + r_val * Math.cos(phi);
            z = zc_val + r_val * Math.sin(phi);
          }
          ringPoints.push(projectPhysical(x, y, z));
        }

        for (let i = 0; i < divisions; i++) {
          const p1 = ringPoints[i];
          const p2 = ringPoints[i + 1];
          elements.push({
            type: "sphere-wire",
            p1,
            p2,
            color: ring.color,
            z: (p1.z + p2.z) / 2,
          });
        }
      });
    }

    elements.push({
      type: "axis",
      p1: origin,
      p2: axH,
      label: "h* (a*)",
      color: "#ff4d4d",
      z: origin.z + 0.1,
    });
    elements.push({
      type: "axis",
      p1: origin,
      p2: axK,
      label: "k* (b*)",
      color: "#10b981",
      z: origin.z + 0.1,
    });
    elements.push({
      type: "axis",
      p1: origin,
      p2: axL,
      label: "l* (c*)",
      color: "#0fbcf9",
      z: origin.z + 0.1,
    });
    elements.push({ type: "origin", p: origin, z: origin.z });

    // Add Ewald Sphere Center & Wave vectors if sphere is visible
    if (showEwaldSphere) {
      const xc_val = -latticeParameter / wavelength;
      const yc_val = 0;
      const zc_val = 0;
      const c = projectPhysical(xc_val, yc_val, zc_val);

      elements.push({ type: "ewald-center", p: c, z: c.z });

      // Incident wave vector k0 (from Center to Origin)
      elements.push({
        type: "k-vector",
        p1: c,
        p2: origin,
        color: "#38bdf8", // sky-400
        label: "k₀",
        z: (c.z + origin.z) / 2 + 0.1,
      });

      // Diffracted wave vector k (from Center to active node)
      if (activeNode) {
        const p_hover = project(activeNode[0], activeNode[1], activeNode[2]);
        elements.push({
          type: "k-vector",
          p1: c,
          p2: p_hover,
          color: "#a78bfa", // violet-400
          label: "k",
          z: (c.z + p_hover.z) / 2 + 0.1,
        });
      }
    }

    // Draw reciprocal standard vector (g*) for active node from origin (0,0,0) to node
    if (activeNode) {
      const p_hover = project(activeNode[0], activeNode[1], activeNode[2]);
      elements.push({
        type: "recip-vector",
        p1: origin,
        p2: p_hover,
        color: "#fbbf24", // golden yellow
        label: "g*",
        z: (origin.z + p_hover.z) / 2 + 0.2,
      });
    }

    elements.sort((a, b) => b.z - a.z);

    elements.forEach((el) => {
      if (el.type === "edge") {
        const isHoveredEdge =
          activeNode &&
          ((activeNode[0] === el.h1 &&
            activeNode[1] === el.k1 &&
            activeNode[2] === el.l1) ||
            (activeNode[0] === el.h2 &&
              activeNode[1] === el.k2 &&
              activeNode[2] === el.l2));
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = isHoveredEdge
          ? "rgba(52, 211, 153, 0.5)"
          : "rgba(148, 163, 184, 0.1)";
        ctx.lineWidth = isHoveredEdge ? 1.5 : 0.8;
        ctx.stroke();
      } else if (el.type === "sphere-wire") {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (el.type === "recip-vector") {
        // Draw standard vector
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        ctx.beginPath();
        ctx.moveTo(el.p2.x, el.p2.y);
        ctx.lineTo(
          el.p2.x - 6 * Math.cos(angle - Math.PI / 6),
          el.p2.y - 6 * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          el.p2.x - 6 * Math.cos(angle + Math.PI / 6),
          el.p2.y - 6 * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        if (el.label) {
          ctx.fillStyle = el.color;
          ctx.font = "bold 10px monospace";
          // Label slightly offset
          ctx.fillText(el.label, el.p2.x + 8, el.p2.y - 6);
        }
      } else if (el.type === "axis") {
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.fillStyle = el.color;
        ctx.font = "bold 9px monospace";
        ctx.fillText(el.label, el.p2.x + 4, el.p2.y + 4);
      } else if (el.type === "origin") {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "rgba(250, 204, 21, 0.6)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 8.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("(0,0,0)", el.p.x, el.p.y - 6);
      } else if (el.type === "ewald-center") {
        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "rgba(56, 189, 248, 0.6)";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 8.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText("C", el.p.x, el.p.y - 7);
      } else if (el.type === "k-vector") {
        // Draw dashed wave vector
        ctx.beginPath();
        ctx.moveTo(el.p1.x, el.p1.y);
        ctx.lineTo(el.p2.x, el.p2.y);
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw arrow head
        const angle = Math.atan2(el.p2.y - el.p1.y, el.p2.x - el.p1.x);
        const headX = el.p2.x - 5 * Math.cos(angle);
        const headY = el.p2.y - 5 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(
          headX - 6 * Math.cos(angle - Math.PI / 6),
          headY - 6 * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          headX - 6 * Math.cos(angle + Math.PI / 6),
          headY - 6 * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fillStyle = el.color;
        ctx.fill();

        // Draw label
        const midX = (el.p1.x + el.p2.x) / 2;
        const midY = (el.p1.y + el.p2.y) / 2;
        ctx.fillStyle = el.color;
        ctx.font = "bold 9px monospace";
        ctx.fillText(el.label, midX, midY - 5);
      } else if (el.type === "node") {
        const isHovered =
          hoveredNode &&
          hoveredNode[0] === el.h &&
          hoveredNode[1] === el.k &&
          hoveredNode[2] === el.l;
        const isManual =
          manualProbe &&
          manualProbe[0] === el.h &&
          manualProbe[1] === el.k &&
          manualProbe[2] === el.l;
        const isProbeActive = isHovered || isManual;

        const radius = el.isSelected
          ? isProbeActive
            ? 8.5
            : 6.5
          : isProbeActive
            ? 6.0
            : 3.5;

        // If node satisfies Ewald Sphere reflection, add a glowing aura
        if (el.isEwaldIntersecting) {
          ctx.beginPath();
          ctx.arc(
            el.p.x,
            el.p.y,
            radius + (isProbeActive ? 5 : 3.5),
            0,
            2 * Math.PI,
          );
          ctx.strokeStyle = "rgba(251, 191, 36, 0.45)"; // golden glow
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw selection halo/pointer ring for hovered or manually focused probe
        if (isProbeActive) {
          ctx.beginPath();
          ctx.arc(el.p.x, el.p.y, radius + 4, 0, 2 * Math.PI);
          ctx.strokeStyle = isHovered ? "rgba(52, 211, 153, 0.75)" : "rgba(168, 85, 247, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        ctx.arc(el.p.x, el.p.y, radius, 0, 2 * Math.PI);

        if (el.status === "Allowed") {
          const grad = ctx.createRadialGradient(
            el.p.x - radius * 0.3,
            el.p.y - radius * 0.3,
            radius * 0.1,
            el.p.x,
            el.p.y,
            radius,
          );
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, el.isSelected ? "#10b981" : el.isEwaldIntersecting ? "#fbbf24" : "#059669");
          grad.addColorStop(1, el.isSelected ? "#064e3b" : el.isEwaldIntersecting ? "#b45309" : "#022c22");
          ctx.fillStyle = grad;
          ctx.strokeStyle = el.isSelected ? "#34d399" : el.isEwaldIntersecting ? "#fcd34d" : "#047857";
          ctx.lineWidth = el.isSelected || isProbeActive ? 1 : 0.5;
          if (el.isSelected || isProbeActive || el.isEwaldIntersecting) {
            ctx.shadowColor = el.isEwaldIntersecting ? "rgba(251, 191, 36, 0.45)" : "rgba(16, 185, 129, 0.45)";
            ctx.shadowBlur = isProbeActive ? 12 : 6;
          }
        } else {
          // Forbidden node
          const grad = ctx.createRadialGradient(
            el.p.x - radius * 0.3,
            el.p.y - radius * 0.3,
            radius * 0.1,
            el.p.x,
            el.p.y,
            radius,
          );
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.3, el.isSelected ? "#ef4444" : "#b91c1c");
          grad.addColorStop(1, el.isSelected ? "#7f1d1d" : "#450a0a");
          ctx.fillStyle = grad;
          ctx.strokeStyle = el.isSelected ? "#f87171" : "rgba(153, 27, 27, 0.5)";
          ctx.lineWidth = el.isSelected || isProbeActive ? 1 : 0.5;
          if (el.isSelected || isProbeActive) {
            ctx.shadowColor = "rgba(239, 68, 68, 0.45)";
            ctx.shadowBlur = isProbeActive ? 12 : 6;
          }
        }
        
        ctx.globalAlpha = el.isSelected || isProbeActive || el.isEwaldIntersecting ? 1.0 : 0.6;
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        if (el.isSelected || isProbeActive) {
          ctx.fillStyle = el.isSelected ? "#ffffff" : isHovered ? "#34d399" : "#a855f7";
          ctx.font = isProbeActive ? "bold 8.5px monospace" : "7.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(
            `(${el.h},${el.k},${el.l})`,
            el.p.x,
            el.p.y - radius - (isProbeActive ? 6 : 3),
          );
        }
      }
    });

    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "left";
    ctx.fillText(
      `ROTATION X: ${Math.round(recipRotation.x)}° Y: ${Math.round(recipRotation.y)}°`,
      10,
      15,
    );
    ctx.fillText("DRAG ORBIT / CLICK NODE TO TOGGLE ARRAY", 10, 26);
  }, [
    hklInput,
    recipRotation,
    system,
    hoveredNode,
    manualProbe,
    maxIndex,
    projectionMode,
    showEwaldSphere,
    wavelength,
    latticeParameter,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsSystemMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const systemGroups = [
    {
      label: "Cubic",
      icon: <Box className="w-4 h-4" />,
      options: [
        {
          value: "SC",
          label: "Simple Cubic",
          badge: "P",
          color: "text-emerald-400",
        },
        {
          value: "BCC",
          label: "Body-Centered",
          badge: "I",
          color: "text-emerald-400",
        },
        {
          value: "FCC",
          label: "Face-Centered",
          badge: "F",
          color: "text-emerald-400",
        },
        {
          value: "Diamond",
          label: "Diamond",
          badge: "Fd-3m",
          color: "text-emerald-400",
        },
      ],
    },
    {
      label: "Hexagonal",
      icon: <Hexagon className="w-4 h-4" />,
      options: [
        {
          value: "Hexagonal",
          label: "Hexagonal",
          badge: "HCP",
          color: "text-amber-400",
        },
      ],
    },
    {
      label: "Tetragonal",
      icon: <Pyramid className="w-4 h-4" />,
      options: [
        {
          value: "Tetragonal",
          label: "Primitive",
          badge: "P",
          color: "text-blue-400",
        },
        {
          value: "Tetragonal_I",
          label: "Body-Centered",
          badge: "I",
          color: "text-blue-400",
        },
      ],
    },
    {
      label: "Orthorhombic",
      icon: <Cuboid className="w-4 h-4" />,
      options: [
        {
          value: "Orthorhombic",
          label: "Primitive",
          badge: "P",
          color: "text-rose-400",
        },
        {
          value: "Orthorhombic_F",
          label: "Face-Centered",
          badge: "F",
          color: "text-rose-400",
        },
        {
          value: "Orthorhombic_C",
          label: "Base-Centered",
          badge: "C",
          color: "text-rose-400",
        },
      ],
    },
  ];

  const handleValidate = () => {
    const hklList = parseHKLString(hklInput);
    const validationResults = hklList.map((hkl) =>
      validateSelectionRule(system, hkl),
    );
    setResults(validationResults);
  };

  const generateHKLs = () => {
    const newHKLs: string[] = [];
    for (let h = 0; h <= maxIndex; h++) {
      for (let k = 0; k <= maxIndex; k++) {
        for (let l = 0; l <= maxIndex; l++) {
          if (h === 0 && k === 0 && l === 0) continue;
          newHKLs.push(`${h} ${k} ${l}`);
        }
      }
    }
    setHklInput(newHKLs.join(", "));
  };

  useEffect(() => {
    handleValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

  const handleSave = () => {
    if (results.length === 0) return;

    const csvHeader = "Reflection (h k l),Status,Reason\n";
    const csvRows = results
      .map(
        (res) =>
          `"(${res.hkl.join(" ")})","${res.status}","${res.reason.replace(/"/g, '""')}"`,
      )
      .join("\n");

    const blob = new Blob([csvHeader + csvRows], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `validation_results_${system}_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = useMemo(() => {
    if (filter === "All") return results;
    return results.filter((r) => r.status === filter);
  }, [results, filter]);

  const systemDetails = {
    SC: {
      title: "Simple Cubic (SC)",
      rule: "All (h k l) are allowed.",
      origin:
        "The primitive unit cell has only one lattice point at (0,0,0). No destructive interference occurs between basis atoms.",
      formula: "F(hkl) = f",
      examples: "Polonium (Po), Pyrite (FeS2 - Pa3)",
    },
    BCC: {
      title: "Body-Centered Cubic (BCC)",
      rule: "h + k + l must be even.",
      origin:
        "Lattice points at (0,0,0) and (½,½,½). Destructive interference occurs when the phase difference is π (odd sum).",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Iron (α-Fe), Chromium (Cr), Tungsten (W), Sodium (Na)",
    },
    FCC: {
      title: "Face-Centered Cubic (FCC)",
      rule: "h, k, l must be all even or all odd.",
      origin:
        "Lattice points at (0,0,0), (½,½,0), (½,0,½), (0,½,½). Mixed parity leads to total destructive interference.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples:
        "Aluminum (Al), Copper (Cu), Gold (Au), Silver (Ag), Nickel (Ni)",
    },
    Diamond: {
      title: "Diamond Cubic",
      rule: "FCC rules + if all even, h+k+l must be divisible by 4.",
      origin:
        "Basis of two atoms at (0,0,0) and (¼,¼,¼) combined with FCC lattice. This adds extra extinctions (e.g., 200 forbidden).",
      formula: "F(hkl) = F_{FCC} [1 + exp(πi/2(h+k+l))]",
      examples: "Silicon (Si), Germanium (Ge), Diamond (C)",
    },
    Hexagonal: {
      title: "Hexagonal Close Packed (HCP)",
      rule: "Forbidden if l is odd AND (h + 2k) is divisible by 3.",
      origin:
        "Basis of two atoms at (0,0,0) and (2/3, 1/3, 1/2) in a primitive hexagonal cell.",
      formula: "F(hkl) = f[1 + exp(2πi(h/3 + 2k/3 + l/2))]",
      examples: "Magnesium (Mg), Titanium (Ti), Zinc (Zn)",
    },
    Tetragonal: {
      title: "Tetragonal (Primitive)",
      rule: "All (h k l) are allowed.",
      origin:
        "Primitive cell with lattice points only at corners. No centering to cause destructive interference.",
      formula: "F(hkl) = f",
      examples: "Rutile (TiO2), Stishovite (SiO2)",
    },
    Tetragonal_I: {
      title: "Tetragonal (Body Centered)",
      rule: "h + k + l must be even.",
      origin:
        "Lattice points at (0,0,0) and (½,½,½). Same extinction condition as BCC.",
      formula: "F(hkl) = f[1 + exp(πi(h+k+l))]",
      examples: "Anatase (TiO2), Tin (White Sn)",
    },
    Orthorhombic: {
      title: "Orthorhombic (Primitive)",
      rule: "All (h k l) are allowed.",
      origin: "Primitive cell with lattice points only at corners.",
      formula: "F(hkl) = f",
      examples: "Topaz, Aragonite (CaCO3), Sulfur (α-S)",
    },
    Orthorhombic_F: {
      title: "Orthorhombic (Face Centered)",
      rule: "h, k, l must be all even or all odd.",
      origin: "Lattice points at faces. Same extinction condition as FCC.",
      formula: "F(hkl) = f[1 + e^{πi(h+k)} + e^{πi(h+l)} + e^{πi(k+l)}]",
      examples: "Gallium (Ga - pseudo-orthorhombic)",
    },
    Orthorhombic_C: {
      title: "Orthorhombic (Base Centered C)",
      rule: "h + k must be even.",
      origin:
        "Lattice points at (0,0,0) and (½,½,0). Centering on C-face causes extinction when h+k is odd.",
      formula: "F(hkl) = f[1 + exp(πi(h+k))]",
      examples: "Alpha-Uranium (α-U)",
    },
  };

  const symmetryDetails: Record<
    CrystalSystem,
    {
      rotation: string[];
      reflection: string;
      inversion: boolean;
      identity: string;
      group: string;
      laueClass: string;
      bravais: string;
      operations: number;
      description: string;
    }
  > = {
    SC: {
      group: "m-3m (Oh)",
      laueClass: "m-3m",
      bravais: "Primitive (P)",
      operations: 48,
      rotation: [
        "3 x 4-fold (Axes)",
        "4 x 3-fold (Diagonals)",
        "6 x 2-fold (Edges)",
      ],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Highest possible crystallographic symmetry. Point group includes full octahedral symmetry.",
    },
    BCC: {
      group: "m-3m (Oh)",
      laueClass: "m-3m",
      bravais: "Body-Centered (I)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Shares the same point group as SC, but lattice translations differ.",
    },
    FCC: {
      group: "m-3m (Oh)",
      laueClass: "m-3m",
      bravais: "Face-Centered (F)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Shares the same point group as SC, but with face-centering translations.",
    },
    Diamond: {
      group: "m-3m (Oh)",
      laueClass: "m-3m",
      bravais: "Face-Centered (F)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "The diamond structure belongs to the Fd-3m space group, sharing the O_h point group.",
    },
    Hexagonal: {
      group: "6/mmm (D6h)",
      laueClass: "6/mmm",
      bravais: "Primitive (P)",
      operations: 24,
      rotation: ["1 x 6-fold (c-axis)", "6 x 2-fold (basal)"],
      reflection: "7 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Hexagonal symmetry requires a 6-fold rotation axis. Characteristic of close-packed HCP.",
    },
    Tetragonal: {
      group: "4/mmm (D4h)",
      laueClass: "4/mmm",
      bravais: "Primitive (P)",
      operations: 16,
      rotation: ["1 x 4-fold (c-axis)", "4 x 2-fold"],
      reflection: "5 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Symmetry is reduced from cubic by stretching one axis. Retains one 4-fold axis.",
    },
    Tetragonal_I: {
      group: "4/mmm (D4h)",
      laueClass: "4/mmm",
      bravais: "Body-Centered (I)",
      operations: 16,
      rotation: ["1 x 4-fold", "4 x 2-fold"],
      reflection: "5 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Body-centered tetragonal lattice with full 4/mmm point symmetry.",
    },
    Orthorhombic: {
      group: "mmm (D2h)",
      laueClass: "mmm",
      bravais: "Primitive (P)",
      operations: 8,
      rotation: ["3 x 2-fold (Orthogonal)"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "Three mutually perpendicular 2-fold axes. Low symmetry relative to cubic.",
    },
    Orthorhombic_F: {
      group: "mmm (D2h)",
      laueClass: "mmm",
      bravais: "Face-Centered (F)",
      operations: 8,
      rotation: ["3 x 2-fold"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Face-centered variant of the orthorhombic lattice system.",
    },
    Orthorhombic_C: {
      group: "mmm (D2h)",
      laueClass: "mmm",
      bravais: "Base-Centered (C)",
      operations: 8,
      rotation: ["3 x 2-fold"],
      reflection: "3 Symmetry Planes",
      inversion: true,
      identity: "1",
      description: "Base-centered variant of the orthorhombic lattice system.",
    },
    Cubic: {
      group: "m-3m (Oh)",
      laueClass: "m-3m",
      bravais: "Primitive (P)",
      operations: 48,
      rotation: ["3 x 4-fold", "4 x 3-fold", "6 x 2-fold"],
      reflection: "9 Symmetry Planes",
      inversion: true,
      identity: "1",
      description:
        "General cubic point group symmetry. Highest density of symmetry operations.",
    },
    Monoclinic: {
      group: "2/m (C2h)",
      laueClass: "2/m",
      bravais: "Primitive (P) / Base-Centered (C)",
      operations: 4,
      rotation: ["1 x 2-fold (b-axis)"],
      reflection: "1 Mirror Plane",
      inversion: true,
      identity: "1",
      description:
        "Symmetry follows reaching a single 2-fold axis and a perpendicular mirror plane.",
    },
    Triclinic: {
      group: "-1 (Ci)",
      laueClass: "-1",
      bravais: "Primitive (P)",
      operations: 2,
      rotation: ["None (except identity)"],
      reflection: "No Planes",
      inversion: true,
      identity: "1",
      description:
        "Lowest possible symmetry. Contains only inversion and identity.",
    },
  };

  const generateEquivalentPlanes = (
    h: number,
    k: number,
    l: number,
    system: CrystalSystem,
  ): string[] => {
    const uniq = new Set<string>();
    const add = (x: number, y: number, z: number) => {
      uniq.add(`(${x}, ${y}, ${z})`);
    };

    const cubicPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            const px = x * sx;
            const py = y * sy;
            const pz = z * sz;
            add(px, py, pz);
            add(px, pz, py);
            add(py, px, pz);
            add(py, pz, px);
            add(pz, px, py);
            add(pz, py, px);
          }
        }
      }
    };

    const tetragonalPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            const px = x * sx;
            const py = y * sy;
            const pz = z * sz;
            add(px, py, pz);
            add(py, px, pz);
          }
        }
      }
    };

    const hexagonalPermutations = (x: number, y: number, z: number) => {
      const base = [
        [x, y, z],
        [-y, x + y, z],
        [-x - y, x, z],
        [-x, -y, z],
        [y, -x - y, z],
        [x + y, -x, z],
        [y, x, -z],
        [-x, x + y, -z],
        [-x - y, y, -z],
        [-y, -x, -z],
        [x, -x - y, -z],
        [x + y, -y, -z],
      ];
      for (const [v1, v2, v3] of base) {
        add(v1, v2, v3);
        add(-v1, -v2, -v3);
      }
    };

    const orthorhombicPermutations = (x: number, y: number, z: number) => {
      const signs = [-1, 1];
      for (const sx of signs) {
        for (const sy of signs) {
          for (const sz of signs) {
            add(x * sx, y * sy, z * sz);
          }
        }
      }
    };

    const monoclinicPermutations = (x: number, y: number, z: number) => {
      add(x, y, z);
      add(-x, y, -z);
      add(-x, -y, -z);
      add(x, -y, z);
    };

    const triclinicPermutations = (x: number, y: number, z: number) => {
      add(x, y, z);
      add(-x, -y, -z);
    };

    if (["Cubic", "SC", "BCC", "FCC", "Diamond"].includes(system)) {
      cubicPermutations(h, k, l);
    } else if (["Tetragonal", "Tetragonal_I"].includes(system)) {
      tetragonalPermutations(h, k, l);
    } else if (system === "Hexagonal") {
      hexagonalPermutations(h, k, l);
    } else if (
      ["Orthorhombic", "Orthorhombic_F", "Orthorhombic_C"].includes(system)
    ) {
      orthorhombicPermutations(h, k, l);
    } else if (system === "Monoclinic") {
      monoclinicPermutations(h, k, l);
    } else {
      triclinicPermutations(h, k, l);
    }

    return Array.from(uniq).sort();
  };

  const currentSymmetry =
    symmetryDetails[system as keyof typeof symmetryDetails];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500 items-start">
      {/* Configuration Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] border border-[#1e293b] relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-emerald-600 rounded-full opacity-10 blur-2xl"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Layers className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Configuration</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="relative" ref={menuRef}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  Lattice Architectural Core
                </label>
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/30" />
                  <div className="w-1 h-1 rounded-full bg-emerald-500/10" />
                </div>
              </div>

              <button
                onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
                className="w-full px-4 py-4 bg-[#0B1221] hover:bg-[#0f172a] border-2 border-[#1e293b] hover:border-emerald-500/40 rounded-2xl outline-none transition-all flex items-center justify-between group shadow-inner backdrop-blur-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 font-black text-xs shadow-inner">
                    {
                      systemGroups
                        .flatMap((g) => g.options)
                        .find((o) => o.value === system)?.badge
                    }
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-base font-black text-white leading-none tracking-tight">
                      {
                        systemGroups
                          .flatMap((g) => g.options)
                          .find((o) => o.value === system)?.label
                      }
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none bg-[#050B14] px-1.5 py-0.5 rounded border border-[#1e293b]">
                        {
                          systemGroups.find((g) =>
                            g.options.some((o) => o.value === system),
                          )?.label
                        }{" "}
                        System
                      </span>
                      {
                        systemGroups.find((g) =>
                          g.options.some((o) => o.value === system),
                        )?.icon
                      }
                    </div>
                  </div>
                </div>
                <div className="p-1.5 bg-[#050B14] rounded-lg group-hover:bg-emerald-500/10 transition-colors border border-[#1e293b]">
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-transform duration-300 ${isSystemMenuOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              <AnimatePresence>
                {isSystemMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute top-full left-0 right-0 mt-3 bg-[#0B1221]/95 backdrop-blur-xl rounded-2xl border-2 border-[#1e293b] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    {systemGroups.map((group, gIdx) => (
                      <div
                        key={`group-${group.label}-${gIdx}`}
                        className="border-b border-[#1e293b] last:border-0"
                      >
                        <div className="px-5 py-3 bg-[#050B14]/80 flex items-center gap-2 shadow-inner">
                          <div className="text-emerald-500/70">
                            {group.icon}
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            {group.label} Architectural Model
                          </span>
                        </div>
                        <div className="p-2 grid grid-cols-1 gap-1">
                          {group.options.map((option, oIdx) => (
                            <button
                              key={`opt-${option.value}-${oIdx}`}
                              onClick={() => {
                                setSystem(option.value as CrystalSystem);
                                setIsSystemMenuOpen(false);
                              }}
                              className={`w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all group/item
                                ${system === option.value ? "bg-emerald-500/10 border border-emerald-500/20" : "hover:bg-[#0f172a] border border-transparent"}
                              `}
                            >
                              <div className="flex items-center gap-4">
                                <div
                                  className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center text-[11px] font-black transition-all
                                  ${
                                    system === option.value
                                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]"
                                      : "bg-[#050B14] border-[#1e293b] text-slate-500 group-hover/item:border-slate-500 shadow-inner"
                                  }
                                `}
                                >
                                  {option.badge}
                                </div>
                                <div className="flex flex-col items-start">
                                  <span
                                    className={`text-sm font-bold transition-colors ${system === option.value ? "text-emerald-400" : "text-slate-300"}`}
                                  >
                                    {option.label}
                                  </span>
                                  <span className="text-[9px] text-slate-500 font-mono uppercase">
                                    Selection Logic: {option.badge}-centering
                                  </span>
                                </div>
                              </div>
                              {system === option.value && (
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-5 bg-[#050B14] rounded-2xl border border-[#1e293b] shadow-inner group/rule transition-all hover:border-emerald-500/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                    Active Extinction Logic
                  </h3>
                </div>
                <Zap className="w-3.5 h-3.5 text-emerald-500/30 group-hover/rule:text-emerald-500/60 transition-colors" />
              </div>
              <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 font-mono text-xs text-emerald-400/90 leading-relaxed text-center italic">
                "{systemDetails[system as keyof typeof systemDetails].rule}"
              </div>
            </div>

            <div className="bg-[#0B1221] p-5 rounded-2xl border border-[#1e293b] shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-400" />
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                    Index Synthesis
                  </label>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    max_n:
                  </span>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {maxIndex}
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-1 px-1">
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="1"
                    value={maxIndex}
                    onChange={(e) => setMaxIndex(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all hover:bg-slate-600"
                  />
                  <div className="flex justify-between mt-2 px-0.5">
                    {[1, 2, 3, 4, 5, 6].map((v) => (
                      <span
                        key={v}
                        className={`text-[8px] font-bold font-mono transition-colors ${maxIndex === v ? "text-emerald-500" : "text-slate-600"}`}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={generateHKLs}
                  className="px-5 py-2.5 bg-[#050B14] hover:bg-[#0f172a] text-emerald-400 text-[10px] font-black rounded-xl transition-all border border-[#1e293b] flex items-center gap-2 shadow-inner active:scale-95 uppercase tracking-widest"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  Execute
                </button>
              </div>
            </div>

            {/* Reciprocal Space 3D interactive grid */}
            <div className="space-y-4 p-5 bg-[#0B0F19] rounded-2xl border border-white/5 shadow-[0_0_30px_rgba(0,0,0,0.5)] relative isolate overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0B0F19] to-[#0B0F19] pointer-events-none" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[60px] pointer-events-none" />
              
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between relative z-10">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-black font-mono text-emerald-400 uppercase tracking-widest flex items-center drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                    <Activity className="w-4 h-4 text-emerald-400 mr-1.5 animate-pulse" />
                    3D Reciprocal Space Probe
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setIsOrbiting(!isOrbiting)}
                    className={`px-2.5 py-1.5 rounded-lg border font-mono text-[9px] flex items-center transition-all uppercase tracking-widest font-bold shadow-inner ${
                      isOrbiting
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[inset_0_1px_4px_rgba(52,211,153,0.1)]"
                        : "bg-black/50 border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {isOrbiting ? (
                      <Pause className="w-3 h-3 mr-1.5 text-emerald-400" />
                    ) : (
                      <Play className="w-3 h-3 mr-1.5" />
                    )}
                    {isOrbiting ? "Orbiting" : "Auto-Orbit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecipRotation({ x: 25, y: -45 })}
                    className="px-2.5 py-1.5 bg-black/50 rounded-lg border border-white/10 text-[9px] text-slate-400 font-mono flex items-center hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest font-bold shadow-inner"
                  >
                    <RotateCw className="w-3 h-3 mr-1.5 text-slate-400" />{" "}
                    Reset View
                  </button>
                </div>
              </div>

              {/* Quick View Orienteer */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#010308]/60 p-2 rounded-xl border border-white/5 relative z-10 shadow-inner">
                <span className="text-[9px] font-bold font-mono text-slate-500 uppercase tracking-widest mr-2 pl-1">
                  Alignment:
                </span>
                <button
                  type="button"
                  onClick={() => { setRecipRotation({ x: 0, y: 0 }); setIsOrbiting(false); }}
                  className="px-2.5 py-1 bg-black/50 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono text-slate-400 hover:text-emerald-300 transition-all font-bold uppercase tracking-wider"
                >
                  [100] Front
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipRotation({ x: 0, y: 90 }); setIsOrbiting(false); }}
                  className="px-2.5 py-1 bg-black/50 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono text-slate-400 hover:text-emerald-300 transition-all font-bold uppercase tracking-wider"
                >
                  [010] Side
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipRotation({ x: 90, y: 0 }); setIsOrbiting(false); }}
                  className="px-2.5 py-1 bg-black/50 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono text-slate-400 hover:text-emerald-300 transition-all font-bold uppercase tracking-wider"
                >
                  [001] Top
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipRotation({ x: 35.26, y: -45 }); setIsOrbiting(false); }}
                  className="px-2.5 py-1 bg-black/50 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono text-slate-400 hover:text-emerald-300 transition-all font-bold uppercase tracking-wider"
                >
                  [111] Diag
                </button>
                <button
                  type="button"
                  onClick={() => { setRecipRotation({ x: 25, y: -45 }); setIsOrbiting(false); }}
                  className="px-2.5 py-1 bg-black/50 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 rounded-lg text-[9px] font-mono text-slate-400 hover:text-emerald-300 transition-all font-bold uppercase tracking-wider relative overflow-hidden"
                >
                  Isometric
                  <span className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                </button>
              </div>

              {/* 3D Canvas Box */}
              <div className="relative rounded-xl border border-white/5 overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#010308] to-[#050B14] group shadow-[inset_0_4px_20px_rgba(0,0,0,0.8)] z-10">
                <canvas
                  ref={recipCanvasRef}
                  onMouseDown={handleRecipMouseDown}
                  onMouseMove={handleRecipMouseMove}
                  onMouseUp={handleRecipMouseUp}
                  onMouseLeave={() => {
                    setIsRecipDragging(false);
                    setHoveredNode(null);
                  }}
                  className="w-full h-[320px] block"
                />
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2 pointer-events-none">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-[8px] tracking-widest text-slate-400 font-mono font-bold rounded-md border border-white/10 shadow-lg">
                      DRAG TO ROTATE
                    </span>
                    <span className="px-2 py-1 bg-black/80 backdrop-blur-md text-[8px] tracking-widest text-slate-400 font-mono font-bold rounded-md border border-white/10 shadow-lg">
                      CLICK TO TOGGLE HKL
                    </span>
                  </div>
                  
                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 p-2 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 shadow-lg text-[9px] font-mono font-bold uppercase tracking-widest pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] border border-emerald-400" />
                      <span className="text-emerald-400">Allowed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.5)] border border-rose-500" />
                      <span className="text-rose-400">Forbidden</span>
                    </div>
                    {showEwaldSphere && (
                      <div className="flex items-center gap-2 mt-1 pt-1 border-t border-white/10">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)] border border-amber-400" />
                        <span className="text-amber-400">Diffracting</span>
                      </div>
                    )}
                  </div>
                </div>

                {(hoveredNode || manualProbe) && (
                  <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-lg text-[10px] font-mono text-purple-300 flex items-center shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-purple-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                    Probe: ({(hoveredNode || manualProbe).join(" ")})
                  </div>
                )}
              </div>

              {/* Direct HKL Micro-Probe Selector Console */}
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-4 shadow-inner relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-white/5 pb-2 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-purple-400 animate-spin-slow shadow-[0_0_8px_rgba(168,85,247,0.5)] rounded-full" />
                    <span>PRECISION HKL PROBE DIAL</span>
                  </div>
                  <span className="text-[8px] font-mono text-slate-500 uppercase">
                    Direct Selector Control
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 relative z-10">
                  {/* H Index selector */}
                  <div className="bg-[#0B0F19] p-2 rounded-xl border border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl" />
                    <span className="text-[9px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest z-10">Index h</span>
                    <div className="flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextH = Math.max(-limit, manualProbe[0] - 1);
                          setManualProbe([nextH, manualProbe[1], manualProbe[2]]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        -
                      </button>
                      <span className="text-sm font-mono font-black text-emerald-400 w-6 text-center drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                        {manualProbe[0]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextH = Math.min(limit, manualProbe[0] + 1);
                          setManualProbe([nextH, manualProbe[1], manualProbe[2]]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* K Index selector */}
                  <div className="bg-[#0B0F19] p-2 rounded-xl border border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl" />
                    <span className="text-[9px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest z-10">Index k</span>
                    <div className="flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextK = Math.max(-limit, manualProbe[1] - 1);
                          setManualProbe([manualProbe[0], nextK, manualProbe[2]]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        -
                      </button>
                      <span className="text-sm font-mono font-black text-emerald-400 w-6 text-center drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                        {manualProbe[1]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextK = Math.min(limit, manualProbe[1] + 1);
                          setManualProbe([manualProbe[0], nextK, manualProbe[2]]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* L Index selector */}
                  <div className="bg-[#0B0F19] p-2 rounded-xl border border-white/5 flex flex-col items-center shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl" />
                    <span className="text-[9px] font-mono font-bold text-slate-500 mb-2 uppercase tracking-widest z-10">Index l</span>
                    <div className="flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextL = Math.max(-limit, manualProbe[2] - 1);
                          setManualProbe([manualProbe[0], manualProbe[1], nextL]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        -
                      </button>
                      <span className="text-sm font-mono font-black text-emerald-400 w-6 text-center drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                        {manualProbe[2]}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const limit = Math.min(maxIndex, 3);
                          const nextL = Math.min(limit, manualProbe[2] + 1);
                          setManualProbe([manualProbe[0], manualProbe[1], nextL]);
                        }}
                        className="w-6 h-6 rounded-md bg-black/80 hover:bg-slate-800 border border-white/10 text-[12px] font-black text-slate-400 hover:text-white transition-all text-center flex items-center justify-center font-mono shadow-sm hover:border-slate-500"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (manualProbe[0] === 0 && manualProbe[1] === 0 && manualProbe[2] === 0) return;
                    toggleHKLNode(manualProbe[0], manualProbe[1], manualProbe[2]);
                  }}
                  className={`w-full py-2.5 px-3 rounded-xl border text-[10px] font-mono font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 relative z-10 ${
                    (() => {
                      const parsed = parseHKLString(hklInput);
                      const exists = parsed.some((p) => p[0] === manualProbe[0] && p[1] === manualProbe[1] && p[2] === manualProbe[2]);
                      return exists 
                        ? "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300 shadow-[inset_0_1px_5px_rgba(244,63,94,0.1)]"
                        : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300 shadow-[inset_0_1px_5px_rgba(52,211,153,0.1)]"
                    })()
                  }`}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  {(() => {
                    const parsed = parseHKLString(hklInput);
                    const exists = parsed.some((p) => p[0] === manualProbe[0] && p[1] === manualProbe[1] && p[2] === manualProbe[2]);
                    return exists ? "Remove from analysis buffer" : "Inject into analysis buffer";
                  })()}
                </button>
              </div>

              {/* Probe Calibration Panel */}
              <div className="p-4 bg-[#0B0F19] rounded-xl border border-white/5 space-y-4 shadow-[0_0_20px_rgba(0,0,0,0.5)_inset] relative isolate overflow-hidden">
                {/* ambient core glow */}
                <div className="absolute left-1/2 top-0 blur-[50px] -translate-x-1/2 w-48 h-20 bg-sky-500/10 pointer-events-none" />
                <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-white/5 pb-2 flex items-center justify-between z-10 relative">
                  <span>PROBE CONTROLS</span>
                  <span className="text-[9px] font-mono font-bold text-sky-400 uppercase bg-sky-500/10 border border-sky-500/20 px-2 flex items-center gap-1 py-1 rounded shadow-sm">
                    <Sparkles className="w-2.5 h-2.5" />
                    EWALD CORE

                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column Controls */}
                  <div className="space-y-4">
                    {/* Projection Mode */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        Projection:
                      </span>
                      <div className="flex rounded-lg border border-white/10 p-0.5 bg-black/50 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setProjectionMode("ortho")}
                          className={`px-3 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase tracking-widest ${
                            projectionMode === "ortho"
                              ? "bg-emerald-500/15 text-emerald-400 font-black shadow-[inset_0_1px_4px_rgba(52,211,153,0.1)] border-emerald-500/20"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Ortho
                        </button>
                        <button
                          type="button"
                          onClick={() => setProjectionMode("perspective")}
                          className={`px-3 py-1 rounded-md text-[9px] font-mono font-bold transition-all uppercase tracking-widest ${
                            projectionMode === "perspective"
                              ? "bg-emerald-500/15 text-emerald-400 font-black shadow-[inset_0_1px_4px_rgba(52,211,153,0.1)] border-emerald-500/20"
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Perspective
                        </button>
                      </div>
                    </div>

                    {/* Ewald Sphere Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                        Ewald Sphere:
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowEwaldSphere(!showEwaldSphere)}
                        className={`px-3 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all shadow-inner uppercase tracking-widest ${
                          showEwaldSphere
                            ? "bg-sky-500/15 border-sky-500/30 text-sky-400 shadow-[inset_0_1px_4px_rgba(56,189,248,0.2)]"
                            : "bg-black/50 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20"
                        }`}
                      >
                        {showEwaldSphere ? "VISIBLE" : "HIDDEN"}
                      </button>
                    </div>
                  </div>

                  {/* Right Column Sliders */}
                  <div className="space-y-4">
                    {/* Wavelength */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500 uppercase tracking-widest font-bold">
                          Wavelength (λ):
                        </span>
                        <span className="text-sky-400 font-black drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]">
                          {wavelength.toFixed(4)} Å
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.05"
                        value={wavelength}
                        onChange={(e) =>
                          setWavelength(parseFloat(e.target.value))
                        }
                        className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-sky-400 transition-all hover:bg-slate-800 border border-white/5 shadow-inner"
                      />
                    </div>

                    {/* Lattice constant a */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-500 uppercase tracking-widest font-bold">
                          Lattice Param (a):
                        </span>
                        <span className="text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                          {latticeParameter.toFixed(3)} Å
                        </span>
                      </div>
                      <input
                        type="range"
                        min="2.5"
                        max="8.0"
                        step="0.05"
                        value={latticeParameter}
                        onChange={(e) =>
                          setLatticeParameter(parseFloat(e.target.value))
                        }
                        className="w-full h-1.5 bg-black rounded-lg appearance-none cursor-pointer accent-emerald-400 transition-all hover:bg-slate-800 border border-white/5 shadow-inner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Crystallographic Investigator (Real-time Bragg Equation Solver) */}
              <div className="p-3 bg-[#0A1221] rounded-xl border border-emerald-500/15">
                {(() => {
                  const activeNode = hoveredNode || manualProbe;
                  const [h, k, l] = activeNode || [0, 0, 0];
                  const hasSelection =
                    activeNode && (h !== 0 || k !== 0 || l !== 0);

                  if (!hasSelection) {
                    return (
                      <div className="flex items-start gap-2.5 text-left text-xs text-slate-400">
                        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-normal font-medium text-[11px] text-slate-400">
                          Hover over any crystallographic node (h, k, l) in the
                          interactive 3D reciprocal canvas or use the precision
                          keypad above to calculate d-spacing, Bragg angle, and
                          Ewald sphere intersection state.
                        </span>
                      </div>
                    );
                  }

                  // 1. Calculate d-spacing based on selected crystal system
                  const dSpacing = calculateDSpacingForProbe(
                    h,
                    k,
                    l,
                    system,
                    latticeParameter,
                  );

                  // 2. Calculate theta Bragg angle
                  let sinTheta = dSpacing > 0 ? wavelength / (2 * dSpacing) : 0;
                  const hasThetaSolution = sinTheta <= 1 && dSpacing > 0;
                  const thetaDeg = hasThetaSolution
                    ? Math.asin(sinTheta) * (180 / Math.PI)
                    : 0;
                  const twoThetaDeg = thetaDeg * 2;

                  // 3. Extinction check
                  const ruleResult = validateSelectionRule(system, [h, k, l]);
                  const isAllowed = ruleResult.status === "Allowed";

                  // 4. Ewald Sphere distance check
                  const xc_val = -latticeParameter / wavelength;
                  const r_val = latticeParameter / wavelength;
                  const basis = getReciprocalBasisCoord(h, k, l, system);
                  const distToCenter = Math.sqrt(
                    (basis.x - xc_val) ** 2 + basis.y ** 2 + basis.z ** 2,
                  );
                  const isEwaldIntersecting =
                    Math.abs(distToCenter - r_val) < 0.25;
                  const isWithinLimitingSphere = distToCenter <= r_val * 2.0;

                  return (
                    <div className="space-y-2 text-left font-mono">
                      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <span className="font-extrabold text-[11px] text-white shrink-0">
                            INSPECTOR: ({h} {k} {l})
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 py-0.5 rounded border truncate ${
                              isAllowed
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : "bg-red-500/10 border-red-500/20 text-red-400"
                            }`}
                          >
                            {isAllowed ? "ALLOWED" : "FORBIDDEN"}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 shrink-0">
                          System:{" "}
                          <span className="text-slate-300 font-bold">
                            {system}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px] pt-1">
                        {/* d-spacing */}
                        <div className="bg-black/55 p-2 rounded-lg border border-[#1e293b]">
                          <div className="text-slate-500 font-semibold mb-0.5 text-[8px] uppercase tracking-wider">
                            Interplanar d
                          </div>
                          <div className="text-emerald-400 font-extrabold text-[11px]">
                            {dSpacing > 0 ? `${dSpacing.toFixed(4)} Å` : "N/A"}
                          </div>
                        </div>

                        {/* Reciprocal vector length */}
                        <div className="bg-black/55 p-2 rounded-lg border border-[#1e293b]">
                          <div className="text-slate-500 font-semibold mb-0.5 text-[8px] uppercase tracking-wider">
                            Recip Vector |g*|
                          </div>
                          <div className="text-teal-400 font-extrabold text-[11px]">
                            {dSpacing > 0
                              ? `${(1 / dSpacing).toFixed(4)} Å⁻¹`
                              : "N/A"}
                          </div>
                        </div>

                        {/* Bragg angle 2theta */}
                        <div className="bg-black/55 p-2 rounded-lg border border-[#1e293b]">
                          <div className="text-slate-500 font-semibold mb-0.5 text-[8px] uppercase tracking-wider">
                            Bragg 2θ
                          </div>
                          <div className="text-sky-400 font-extrabold text-[11px]">
                            {hasThetaSolution
                              ? `${twoThetaDeg.toFixed(2)}°`
                              : "No solution"}
                          </div>
                        </div>

                        {/* Ewald Sphere Status */}
                        <div className="bg-black/55 p-2 rounded-lg border border-[#1e293b] col-span-1">
                          <div className="text-slate-500 font-semibold mb-0.5 text-[8px] uppercase tracking-wider">
                            Diffraction
                          </div>
                          <div
                            className={`font-extrabold text-[10px] uppercase truncate ${
                              isEwaldIntersecting && isAllowed
                                ? "text-yellow-400"
                                : isAllowed
                                  ? "text-slate-400"
                                  : "text-red-400/80"
                            }`}
                          >
                            {isEwaldIntersecting && isAllowed
                              ? "⚡ ACTIVE!"
                              : isAllowed
                                ? "Measurable"
                                : "Extinguished"}
                          </div>
                        </div>
                      </div>

                      {/* Descriptive status or explanation text */}
                      <div className="text-[10px] text-slate-400 bg-black/25 px-2.5 py-1.5 rounded border border-[#1e293b]/50 leading-relaxed font-sans mt-2">
                        <strong className="text-slate-300 font-semibold">
                          Rule Context:
                        </strong>{" "}
                        {ruleResult.reason}.{" "}
                        {isEwaldIntersecting && isAllowed ? (
                          <span className="text-yellow-400 font-medium border-l-2 border-yellow-400 pl-2 ml-1">
                            Diffraction is ACTIVE! (
                            <span className="font-mono font-black italic">
                              k = k₀ + g*
                            </span>
                            ). Node lies exactly on the Ewald Sphere boundary.
                          </span>
                        ) : isWithinLimitingSphere && isAllowed ? (
                          <span className="text-sky-400 font-medium">
                            Node is allowed by structure rules, but to observe
                            it physically, you must rotate the crystal to bring
                            it onto the Ewald Sphere boundary.
                          </span>
                        ) : !isWithinLimitingSphere && isAllowed ? (
                          <span className="text-orange-400 font-medium">
                            Node is allowed by structure rules, but physically
                            lies outside the Limiting Sphere mapping. It cannot
                            be observed at current wavelength λ.
                          </span>
                        ) : (
                          <span className="text-red-400/80 font-medium font-sans">
                            Destructive interference completely extinguishes
                            intensity for this index.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick manual entry helper */}
            <div className="space-y-2 p-4 bg-[#050B14]/40 rounded-2xl border border-[#1e293b]">
              <div className="flex items-center justify-between text-left">
                <div className="text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest">
                  Quick-Append Plane (h k l)
                </div>
                <span className="text-[8px] font-black text-[#10b981] bg-[#10b981]/10 border border-[#10b981]/20 px-1.5 py-0.5 rounded font-mono">
                  SYNTHESIS_PROMPT
                </span>
              </div>
              <div className="flex gap-2 items-center">
                {["h", "k", "l"].map((index, idx) => {
                  const val = idx === 0 ? quickH : idx === 1 ? quickK : quickL;
                  const setter =
                    idx === 0 ? setQuickH : idx === 1 ? setQuickK : setQuickL;
                  return (
                    <div
                      key={index}
                      className="flex-1 flex gap-1 items-center bg-black/60 rounded-xl px-2 py-1.5 border border-[#1e293b]"
                    >
                      <span className="text-[9px] font-mono font-black text-slate-500 uppercase">
                        {index}:
                      </span>
                      <input
                        type="number"
                        step="1"
                        value={val}
                        onChange={(e) => setter(parseInt(e.target.value) || 0)}
                        className="w-full font-mono font-bold text-xs bg-transparent text-emerald-400 outline-none text-center"
                      />
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addQuickHKL}
                  className="px-4 py-2 bg-[#10b981]/15 hover:bg-[#10b981]/25 border border-[#10b981]/30 text-[#10b981] font-black text-[10px] rounded-xl flex items-center justify-center uppercase tracking-wider relative active:scale-95 transition-all text-center self-stretch"
                >
                  ADD
                </button>
              </div>

              {/* Preset operational row */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={loadLowIndexPresets}
                  className="px-2 py-1 bg-black/40 border border-[#1e293b] hover:border-slate-700 rounded text-[8px] font-bold font-mono text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-tight"
                >
                  Family Preset
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHklInput(
                      "1 1 1, 2 2 2, 3 3 3, 4 4 4, 1 1 0, 2 2 0, 3 3 0",
                    )
                  }
                  className="px-2 py-1 bg-black/40 border border-[#1e293b] hover:border-slate-700 rounded text-[8px] font-bold font-mono text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-tight"
                >
                  Axes Diagonal rows
                </button>
                <button
                  type="button"
                  onClick={clearAllHKLs}
                  className="px-2 py-1 bg-red-950/20 border border-red-900/30 hover:border-red-600 rounded text-[8px] font-bold font-mono text-red-400 transition-colors uppercase tracking-tight"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Chip tag group representation */}
            {parseHKLString(hklInput).length > 0 && (
              <div className="space-y-2 p-4 bg-[#050B14]/30 rounded-2xl border border-[#1e293b] text-left">
                <div className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest pl-0.5 mb-1">
                  Active Coordinates ({parseHKLString(hklInput).length} planes)
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1 pt-1">
                  {parseHKLString(hklInput).map((pt, i) => {
                    const ruleResult = validateSelectionRule(system, pt);
                    const isAllowed = ruleResult.status === "Allowed";
                    return (
                      <div
                        key={`${pt.join("-")}-${i}`}
                        className={`pl-2 pr-1 py-1 rounded-lg border flex items-center gap-1.5 text-[10px] font-mono select-none transition-colors
                          ${
                            isAllowed
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 border-red-500/20 text-red-300"
                          }
                        `}
                      >
                        <span className="font-black">({pt.join(" ")})</span>
                        <button
                          type="button"
                          onClick={() => removeHKLAtIndex(i)}
                          className="p-0.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                          title="Remove reflection"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-emerald-500/20 rounded border border-emerald-500/30">
                    <Binary className="w-3 h-3 text-emerald-400" />
                  </div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    Raw Sequence Sequence
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 bg-[#1e293b] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-full w-full bg-emerald-500/50"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-slate-600">
                    INPUT_ACTIVE
                  </span>
                </div>
              </div>
              <div className="relative group/indices">
                <div className="absolute top-2 right-3 z-10 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                </div>
                <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500/30 rounded-full my-4 scale-y-0 group-focus-within/indices:scale-y-100 transition-transform duration-500" />
                <textarea
                  value={hklInput}
                  onChange={(e) => setHklInput(e.target.value)}
                  placeholder="e.g. 1 0 0, 1 1 0, 1 1 1"
                  className="w-full h-24 px-4 py-4 bg-[#050B14] text-emerald-400 border-2 border-[#1e293b] rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 outline-none transition-all font-mono text-[11px] leading-relaxed resize-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] custom-scrollbar"
                  spellCheck={false}
                />
              </div>
            </div>

            <button
              onClick={handleValidate}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black rounded-2xl shadow-[0_15px_30px_rgba(16,185,129,0.2)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/20 to-emerald-400/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <CheckCircle2 className="w-5 h-5" />
              <span className="uppercase tracking-[0.15em] text-sm font-black">
                Analyze Diffractive States
              </span>
            </button>
          </div>
        </div>

        {/* Lattice Centering Quick Reference */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] text-white border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mt-2 -mr-2 w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
              <Component className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Lattice Guide</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Centering Types
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            {[
              { id: "P", label: "Primitive", desc: "Points at Corners" },
              { id: "I", label: "Body-Centered", desc: "Corners + Center" },
              { id: "F", label: "Face-Centered", desc: "Corners + Faces" },
              { id: "C", label: "Base-Centered", desc: "Corners + Pair" },
            ].map((type) => (
              <div
                key={type.id}
                className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] flex flex-col items-center text-center hover:bg-[#070D18] transition-all shadow-inner"
              >
                <span className="text-sm font-black text-emerald-400 mb-1">
                  {type.id}
                </span>
                <span className="text-[9px] font-bold text-slate-300 uppercase leading-none mb-1">
                  {type.label}
                </span>
                <span className="text-[8px] text-slate-500 leading-tight">
                  {type.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        {/* Physical Context Card */}
        <div className="bg-[#050B14]/80 backdrop-blur-md p-6 rounded-[2rem] text-white border border-[#1e293b] shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 -mt-2 -mr-2 w-32 h-32 bg-blue-500/10 rounded-full blur-[60px] group-hover:bg-blue-500/20 transition-all duration-700"></div>

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Physical Context</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                Scattering Intelligence
              </p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Atom className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Origin of Extinction
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {systemDetails[system as keyof typeof systemDetails].origin}
              </p>
            </div>

            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Binary className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Structure Factor Formula
                </span>
              </div>
              <div className="bg-[#050B14] p-4 rounded-xl font-mono text-sm text-emerald-400 overflow-x-auto border border-[#1e293b] shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-pulse shrink-0" />
                  <span className="whitespace-normal break-words drop-shadow-sm">
                    {
                      systemDetails[system as keyof typeof systemDetails]
                        .formula
                    }
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0B1221] p-4 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <Beaker className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Natural Occurrence
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {systemDetails[system as keyof typeof systemDetails].examples
                  .split(",")
                  .map((ex, i) => (
                    <span
                      key={`ex-${ex.trim()}-${i}`}
                      className="text-[10px] font-bold text-slate-300 bg-[#070D18] px-2 py-1 rounded border border-[#1e293b]"
                    >
                      {ex.trim()}
                    </span>
                  ))}
              </div>
            </div>
            {/* Symmetry Intelligence Card */}
            <div className="bg-[#050B14]/80 backdrop-blur-md p-8 rounded-[2.5rem] border border-[#1e293b] shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden relative group/symmetry hover:border-indigo-500/40 transition-all duration-700">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none group-hover/symmetry:bg-indigo-500/15 transition-all duration-1000 -translate-y-20 translate-x-10" />

              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6 relative z-10 border-b border-[#1e293b] pb-6">
                <div className="flex items-center gap-6">
                  <div className="relative group/sym-icon cursor-default">
                    <div className="absolute inset-0 bg-indigo-600/20 blur-xl rounded-full group-hover/sym-icon:bg-indigo-500/30 transition-all duration-700 pointer-events-none" />
                    <div className="w-16 h-16 bg-[#070D18] rounded-3xl border border-indigo-500/40 flex items-center justify-center relative shadow-[inset_0_2px_15px_rgba(255,255,255,0.05)] group-hover/sym-icon:border-indigo-400 transition-colors duration-500 overflow-hidden">
                      <ShieldQuestion className="w-7 h-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)] group-hover/sym-icon:rotate-12 transition-transform duration-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-2">
                      Symmetry Profile
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase tracking-[0.15em]">
                          Point Group
                        </p>
                        <span className="text-[10px] font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/30 uppercase shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                          {currentSymmetry.group}
                        </span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-[#1e293b]" />
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase tracking-[0.15em]">
                          Laue Class
                        </p>
                        <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                          {currentSymmetry.laueClass}
                        </span>
                      </div>
                      <div className="hidden sm:block w-px h-4 bg-[#1e293b]" />
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono uppercase tracking-[0.15em]">
                          Bravais
                        </p>
                        <span className="text-[10px] font-mono font-black text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)]">
                          {currentSymmetry.bravais}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3 bg-[#050B14] rounded-2xl border border-[#1e293b] flex items-center gap-4 relative group/ops hover:border-indigo-500/30 transition-colors shadow-inner">
                  <div className="text-right">
                    <span className="text-4xl font-black font-mono text-indigo-400 leading-none drop-shadow-md">
                      {currentSymmetry.operations}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-[#1e293b]" />
                  <div className="text-left">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      Structural
                    </span>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest block">
                      Operations
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex bg-[#0B1221] p-1 rounded-xl border border-[#1e293b] gap-1 mb-5 relative z-10 font-mono">
                <button
                  onClick={() => setSymmetryTab("visualizer")}
                  className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === "visualizer" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                >
                  <Box className="w-3.5 h-3.5" />
                  <span className="truncate">3D Lattice</span>
                </button>
                <button
                  onClick={() => setSymmetryTab("properties")}
                  className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === "properties" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="truncate">Elements</span>
                </button>
                <button
                  onClick={() => setSymmetryTab("sandbox")}
                  className={`flex-grow py-2 px-1.5 rounded-lg text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${symmetryTab === "sandbox" ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-black shadow-inner" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span className="truncate">Equivalents</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="relative z-10 min-h-[350px]">
                {symmetryTab === "visualizer" && (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-300">
                    <Symmetry3DVisualizer
                      system={system}
                      showLatticeOutline={showLatticeOutline}
                      showMirrorPlanes={showMirrorPlanes}
                      showSymmetryAxes={showSymmetryAxes}
                      showInversionCenter={showInversionCenter}
                      currentSymmetry={currentSymmetry}
                      showBasisAtoms={showBasisAtoms}
                      showCoordinationBonds={showCoordinationBonds}
                      showMillerPlane={showMillerPlane}
                      millerH={visualizerH}
                      millerK={visualizerK}
                      millerL={visualizerL}
                    />

                    {/* Toggle Pill Buttons */}
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <button
                        onClick={() =>
                          setShowLatticeOutline(!showLatticeOutline)
                        }
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showLatticeOutline ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <Box className="w-3.5 h-3.5" /> Outlines
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${showLatticeOutline ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>

                      <button
                        onClick={() => setShowSymmetryAxes(!showSymmetryAxes)}
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showSymmetryAxes ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <RotateCw className="w-3.5 h-3.5" /> Axes (Rot)
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${showSymmetryAxes ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>

                      <button
                        onClick={() => setShowMirrorPlanes(!showMirrorPlanes)}
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showMirrorPlanes ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <Split className="w-3.5 h-3.5" /> Planes (σ)
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${showMirrorPlanes ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>

                      <button
                        onClick={() =>
                          setShowInversionCenter(!showInversionCenter)
                        }
                        disabled={!currentSymmetry.inversion}
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${!currentSymmetry.inversion ? "opacity-30 cursor-not-allowed bg-slate-900 border-transparent text-slate-600" : showInversionCenter ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <CircleDot className="w-3.5 h-3.5" /> Inversion (i)
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${!currentSymmetry.inversion ? "bg-slate-800" : showInversionCenter ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>

                      <button
                        onClick={() => setShowBasisAtoms(!showBasisAtoms)}
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showBasisAtoms ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <Component className="w-3.5 h-3.5" /> Basis Atoms
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${showBasisAtoms ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>

                      <button
                        onClick={() => setShowCoordinationBonds(!showCoordinationBonds)}
                        className={`py-1.5 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border flex items-center justify-between transition-all ${showCoordinationBonds ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-[#0B1221] border-[#1e293b] text-slate-500"}`}
                      >
                        <span className="flex items-center gap-1">
                          <Network className="w-3.5 h-3.5" /> Bonds
                        </span>
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${showCoordinationBonds ? "bg-indigo-400" : "bg-slate-700"}`}
                        />
                      </button>
                    </div>

                    {/* Miller Slicing Plane interactive controls */}
                    <div className="p-3.5 bg-[#050B14]/60 rounded-xl border border-[#1e293b]/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-400" />
                          Miller Plane (h k l) Slicer
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMillerPlane(!showMillerPlane)}
                          className={`px-3 py-1 text-[8px] font-mono font-black uppercase tracking-widest rounded-md border transition-all ${
                            showMillerPlane
                              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                              : "bg-[#0b1221] border-[#1e293b] text-slate-500"
                          }`}
                        >
                          {showMillerPlane ? "ON" : "OFF"}
                        </button>
                      </div>

                      {showMillerPlane && (
                        <div className="space-y-2.5 pt-1 border-t border-[#1e293b]/40 animate-in slide-in-from-top-1 duration-200">
                          <div className="flex items-center gap-2">
                            {["h", "k", "l"].map((coord, idx) => {
                              const val = idx === 0 ? visualizerH : idx === 1 ? visualizerK : visualizerL;
                              const setter = idx === 0 ? setVisualizerH : idx === 1 ? setVisualizerK : setVisualizerL;
                              return (
                                <div key={coord} className="flex-1 bg-black/40 rounded-lg p-1.5 border border-[#1e293b] flex flex-col items-center">
                                  <span className="text-[9px] font-mono font-black text-slate-500 uppercase">{coord}</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => setter(Math.max(-4, val - 1))}
                                      className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-mono font-bold text-emerald-400 w-5 text-center">{val}</span>
                                    <button
                                      type="button"
                                      onClick={() => setter(Math.min(4, val + 1))}
                                      className="w-4 h-4 rounded bg-slate-900 hover:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="text-[8px] font-mono text-slate-500 text-center leading-relaxed">
                            Cuts crystal lattice on plane: <span className="text-emerald-400 font-bold">({visualizerH} {visualizerK} {visualizerL})</span>. Intersects sheared bounding box boundaries.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {symmetryTab === "properties" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner">
                        <div className="flex items-center gap-1.5 mb-2.5">
                          <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            Rotation Ops
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentSymmetry.rotation.map((r, idx) => (
                            <span
                              key={`rot-${r}-${idx}`}
                              className="text-[9px] font-bold font-mono text-indigo-300 bg-[#070D18] px-2 py-0.5 rounded border border-[#1e293b]"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all shadow-inner flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <Split className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                              Reflections
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-medium font-mono">
                            {currentSymmetry.reflection}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-1.5">
                          <Hexagon className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            Inversion (i)
                          </span>
                        </div>
                        <span
                          className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded border ${currentSymmetry.inversion ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-900 border-slate-800"}`}
                        >
                          {currentSymmetry.inversion ? "Present" : "Absent"}
                        </span>
                      </div>
                      <div className="bg-[#0B1221] p-3 rounded-xl border border-[#1e293b] hover:bg-[#070D18] transition-all flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-1.5">
                          <Component className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                            Identity (E)
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-400 font-black bg-[#070D18] px-2 py-0.5 rounded border border-[#1e293b]">
                          {currentSymmetry.identity}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#0B1221] p-3.5 rounded-2xl border border-[#1e293b] shadow-inner">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Network className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono font-black">
                          Interpretation
                        </span>
                      </div>
                      <div className="bg-[#050B14] p-3.5 rounded-xl font-mono text-[11px] text-indigo-300 border border-[#1e293b] flex gap-2.5 items-start shadow-inner">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mt-1 shrink-0" />
                        <p className="leading-relaxed">
                          "{currentSymmetry.description}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {symmetryTab === "sandbox" &&
                  (() => {
                    const familyList = generateEquivalentPlanes(
                      sandboxH,
                      sandboxK,
                      sandboxL,
                      system,
                    );
                    const multiplicity = familyList.length;

                    return (
                      <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="bg-[#0B1221] p-4 rounded-2xl border border-[#1e293b] shadow-inner">
                          <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3 font-mono">
                            Input Miller Indices (h k l)
                          </span>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                                h
                              </label>
                              <input
                                type="number"
                                value={sandboxH}
                                onChange={(e) =>
                                  setSandboxH(parseInt(e.target.value) || 0)
                                }
                                className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-bold">
                                k
                              </label>
                              <input
                                type="number"
                                value={sandboxK}
                                onChange={(e) =>
                                  setSandboxK(parseInt(e.target.value) || 0)
                                }
                                className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono font-bold">
                                l
                              </label>
                              <input
                                type="number"
                                value={sandboxL}
                                onChange={(e) =>
                                  setSandboxL(parseInt(e.target.value) || 0)
                                }
                                className="w-full bg-[#050B14] border border-[#1e293b] rounded-lg text-center py-1.5 font-mono text-indigo-300 text-sm focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] flex justify-between items-center shadow-inner">
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono">
                              Peak Multiplicity (m)
                            </span>
                            <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                              Diffraction peak intensity factor
                            </p>
                          </div>
                          <div className="bg-indigo-500/15 text-indigo-400 px-3 py-1 font-black font-mono text-xs rounded border border-indigo-500/30 shadow-inner">
                            {multiplicity} Peaks
                          </div>
                        </div>

                        <div className="bg-[#0B1221] p-3.5 rounded-xl border border-[#1e293b] shadow-inner flex flex-col min-h-[160px] max-h-[220px]">
                          <span className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2 font-mono">
                            Symmetry-Equivalent Family {'{h k l}'}
                          </span>
                          <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-1.5 content-start custom-scrollbar">
                            {familyList.map((plane, i) => (
                              <span
                                key={`equiv-plane-${plane}-${i}`}
                                className="text-[10px] font-mono font-bold text-indigo-300 bg-[#050B14] px-2 py-0.5 rounded border border-[#1e293b] hover:border-indigo-500/50 hover:bg-indigo-500/10 cursor-default transition-colors animate-in zoom-in-95 duration-200"
                              >
                                {plane}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="lg:col-span-8 space-y-6">
        
        <ScientificMathControl
          title="FCC Structure Factor & Systematic Absences"
          formula="F_{hkl} = f \cdot [1 + e^{i\pi(h+k)} + e^{i\pi(k+l)} + e^{i\pi(h+l)}]"
          description="Verify selection rules and systematic absences. FCC reflections are allowed only if all indices (h, k, l) are unmixed (all even or all odd), yielding F = 4f."
          variables={[
            { symbol: 'h', name: 'Miller index h', value: (results[0]?.hkl[0] !== undefined ? results[0].hkl[0] : 1), unit: '' },
            { symbol: 'k', name: 'Miller index k', value: (results[0]?.hkl[1] !== undefined ? results[0].hkl[1] : 1), unit: '' },
            { symbol: 'l', name: 'Miller index l', value: (results[0]?.hkl[2] !== undefined ? results[0].hkl[2] : 1), unit: '' },
            { symbol: 'f', name: 'Scattering Factor f', value: 1.0, unit: '' }
          ]}
          result={
            (() => {
              const h = results[0]?.hkl[0] !== undefined ? results[0].hkl[0] : 1;
              const k = results[0]?.hkl[1] !== undefined ? results[0].hkl[1] : 1;
              const l = results[0]?.hkl[2] !== undefined ? results[0].hkl[2] : 1;
              const hEven = h % 2 === 0;
              const kEven = k % 2 === 0;
              const lEven = l % 2 === 0;
              return (hEven === kEven && kEven === lEven) ? 4.0 : 0.0;
            })()
          }
          resultUnit=""
          resultName="Structure Factor F"
        />

        <div className="bg-[#050B14]/80 backdrop-blur-md rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.05)] border border-[#1e293b] overflow-hidden flex flex-col min-h-[600px] relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05] pointer-events-none mix-blend-screen" />
          <div className="p-6 border-b border-[#1e293b] bg-[#070D18]/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-white">
                Validation Results
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Systematic absences for{" "}
                {systemDetails[system as keyof typeof systemDetails].title}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-1.5 bg-[#0B1221] p-1.5 rounded-xl border border-[#1e293b]">
                {(["All", "Allowed", "Forbidden"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      filter === f
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={results.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black rounded-xl transition-all border border-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed group/save shadow-inner uppercase tracking-widest"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Save CSV
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 p-12 text-center border-t border-[#1e293b]/50">
                <div className="relative group/empty mb-6">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl group-hover/empty:bg-emerald-500/20 transition-all duration-700" />
                  <div className="w-20 h-20 rounded-2xl bg-[#0B1221] border border-[#1e293b] flex items-center justify-center relative z-10 shadow-inner group-hover/empty:border-emerald-500/30 transition-colors">
                    <Hexagon className="w-10 h-10 text-slate-600 group-hover/empty:text-emerald-500/50 transition-colors" />
                  </div>
                </div>
                <h4 className="text-lg font-black text-white mb-2 tracking-wide">
                  Awaiting Lattice Vectors
                </h4>
                <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                  Enter custom HKL indices in the configuration panel or use the
                  Index Synthesis engine to generate a theoretical reflection
                  dataset.
                </p>
                <div className="mt-8 flex gap-2 items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400/70 uppercase tracking-widest">
                    Engine Ready
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-[#0B1221] border-b border-[#1e293b]">
                    <tr>
                      <th className="px-8 py-4 font-bold">
                        Reflection (h k l)
                      </th>
                      <th className="px-8 py-4 font-bold">Status</th>
                      <th className="px-8 py-4 font-bold">Physical Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    <AnimatePresence mode="popLayout">
                      {filteredResults.map((res, index) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={`${res.hkl.join("-")}-${index}`}
                          className="group hover:bg-[#0B1221] transition-colors"
                        >
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${res.status === "Allowed" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
                              />
                              <span className="font-mono font-bold text-white text-base">
                                ({res.hkl.join(" ")})
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${
                                res.status === "Allowed"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {res.status === "Allowed" ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {res.status}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-slate-400 font-medium text-xs leading-relaxed max-w-full group-hover:text-slate-300 transition-colors">
                              {res.reason}
                            </p>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-4 bg-[#0B1221] border-t border-[#1e293b] flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex gap-6">
              <span className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Allowed: {results.filter((r) => r.status === "Allowed").length}
              </span>
              <span className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Forbidden:{" "}
                {results.filter((r) => r.status === "Forbidden").length}
              </span>
            </div>
            <span className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              Total: {results.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
