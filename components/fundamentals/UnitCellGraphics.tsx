import React from 'react';
import { CrystalSystemId, CenteringType } from './UnitCellsSection';

interface MiniSchematicProps {
  systemId: CrystalSystemId;
  centering?: CenteringType;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * High-precision isometric vector schematic for each of the 7 Crystal Systems.
 * Shows characteristic cell geometry, axial lengths (a, b, c), interaxial angle arcs,
 * essential symmetry axis glyph, and active Bravais centering nodes.
 */
export const CrystalSystemMiniSchematic: React.FC<MiniSchematicProps> = ({
  systemId,
  centering = 'P',
  isSelected = false,
  size = 'md'
}) => {
  const strokeMain = isSelected ? '#818cf8' : '#64748b';
  const strokeBack = isSelected ? '#4f46e5' : '#334155';
  const fillFace = isSelected ? 'rgba(99, 102, 241, 0.14)' : 'rgba(51, 65, 85, 0.10)';
  const nodeColor = isSelected ? '#c7d2fe' : '#94a3b8';
  const nodeStroke = isSelected ? '#4f46e5' : '#1e293b';

  const dimClass =
    size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-28 h-24' : 'w-16 h-14';

  const renderCenteringNodes = (
    frontCorners: [number, number][],
    backCorners: [number, number][]
  ) => {
    const cx =
      (frontCorners.reduce((s, p) => s + p[0], 0) +
        backCorners.reduce((s, p) => s + p[0], 0)) /
      8;
    const cy =
      (frontCorners.reduce((s, p) => s + p[1], 0) +
        backCorners.reduce((s, p) => s + p[1], 0)) /
      8;

    const topFaceCenter: [number, number] = [
      (frontCorners[2][0] + frontCorners[3][0] + backCorners[2][0] + backCorners[3][0]) / 4,
      (frontCorners[2][1] + frontCorners[3][1] + backCorners[2][1] + backCorners[3][1]) / 4
    ];
    const botFaceCenter: [number, number] = [
      (frontCorners[0][0] + frontCorners[1][0] + backCorners[0][0] + backCorners[1][0]) / 4,
      (frontCorners[0][1] + frontCorners[1][1] + backCorners[0][1] + backCorners[1][1]) / 4
    ];
    const frontFaceCenter: [number, number] = [
      (frontCorners[0][0] + frontCorners[1][0] + frontCorners[2][0] + frontCorners[3][0]) / 4,
      (frontCorners[0][1] + frontCorners[1][1] + frontCorners[2][1] + frontCorners[3][1]) / 4
    ];
    const rightFaceCenter: [number, number] = [
      (frontCorners[1][0] + frontCorners[2][0] + backCorners[1][0] + backCorners[2][0]) / 4,
      (frontCorners[1][1] + frontCorners[2][1] + backCorners[1][1] + backCorners[2][1]) / 4
    ];

    if (centering === 'I') {
      return (
        <g>
          <line x1={frontCorners[0][0]} y1={frontCorners[0][1]} x2={cx} y2={cy} stroke="#f43f5e" strokeWidth="0.9" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1={backCorners[2][0]} y1={backCorners[2][1]} x2={cx} y2={cy} stroke="#f43f5e" strokeWidth="0.9" strokeDasharray="1.5 1.5" opacity="0.7" />
          <circle cx={cx} cy={cy} r="2.8" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="0.8" />
        </g>
      );
    }
    if (centering === 'F') {
      return (
        <g>
          {[topFaceCenter, botFaceCenter, frontFaceCenter, rightFaceCenter].map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r="2.2" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.7" />
          ))}
        </g>
      );
    }
    if (centering === 'C') {
      return (
        <g>
          <circle cx={topFaceCenter[0]} cy={topFaceCenter[1]} r="2.4" fill="#10b981" stroke="#d1fae5" strokeWidth="0.7" />
          <circle cx={botFaceCenter[0]} cy={botFaceCenter[1]} r="2.4" fill="#10b981" stroke="#d1fae5" strokeWidth="0.7" />
        </g>
      );
    }
    if (centering === 'R') {
      const r1x = frontCorners[0][0] * 0.35 + backCorners[2][0] * 0.65;
      const r1y = frontCorners[0][1] * 0.35 + backCorners[2][1] * 0.65;
      const r2x = frontCorners[0][0] * 0.65 + backCorners[2][0] * 0.35;
      const r2y = frontCorners[0][1] * 0.65 + backCorners[2][1] * 0.35;
      return (
        <g>
          <circle cx={r1x} cy={r1y} r="2.3" fill="#eab308" stroke="#fef9c3" strokeWidth="0.7" />
          <circle cx={r2x} cy={r2y} r="2.3" fill="#eab308" stroke="#fef9c3" strokeWidth="0.7" />
        </g>
      );
    }
    return null;
  };

  const renderParallelepiped = (
    front: [number, number][], // [botLeft, botRight, topRight, topLeft]
    back: [number, number][],
    symmetryGlyph?: React.ReactNode
  ) => {
    const frontPoly = front.map(p => p.join(',')).join(' ');
    const backPoly = back.map(p => p.join(',')).join(' ');
    const topPoly = [front[3], front[2], back[2], back[3]].map(p => p.join(',')).join(' ');

    return (
      <svg viewBox="0 0 80 68" className={`${dimClass} overflow-visible shrink-0`}>
        {/* Back Face */}
        <polygon points={backPoly} fill="none" stroke={strokeBack} strokeWidth="1" strokeDasharray="2 1.5" />
        {/* Hidden bottom-left connector */}
        <line x1={front[0][0]} y1={front[0][1]} x2={back[0][0]} y2={back[0][1]} stroke={strokeBack} strokeWidth="1" strokeDasharray="2 1.5" />
        {/* Shaded Top & Front Faces */}
        <polygon points={topPoly} fill={fillFace} stroke="none" />
        <polygon points={frontPoly} fill={fillFace} stroke={strokeMain} strokeWidth="1.4" strokeLinejoin="round" />
        {/* Visible depth connectors */}
        <line x1={front[1][0]} y1={front[1][1]} x2={back[1][0]} y2={back[1][1]} stroke={strokeMain} strokeWidth="1.3" />
        <line x1={front[2][0]} y1={front[2][1]} x2={back[2][0]} y2={back[2][1]} stroke={strokeMain} strokeWidth="1.3" />
        <line x1={front[3][0]} y1={front[3][1]} x2={back[3][0]} y2={back[3][1]} stroke={strokeMain} strokeWidth="1.3" />

        {/* Symmetry Glyph Overlay */}
        {symmetryGlyph}

        {/* Centering Nodes */}
        {renderCenteringNodes(front, back)}

        {/* 8 Vertex Nodes */}
        {[...back, ...front].map((pt, idx) => (
          <circle
            key={idx}
            cx={pt[0]}
            cy={pt[1]}
            r="1.9"
            fill={nodeColor}
            stroke={nodeStroke}
            strokeWidth="0.8"
          />
        ))}
      </svg>
    );
  };

  switch (systemId) {
    case 'cubic': {
      // Equal cube with <111> triad diagonal
      const front: [number, number][] = [[16, 54], [48, 54], [48, 22], [16, 22]];
      const back: [number, number][] = [[28, 42], [60, 42], [60, 10], [28, 10]];
      const glyph = (
        <g>
          {/* <111> body diagonal 3-fold axis */}
          <line x1="16" y1="54" x2="60" y2="10" stroke="#f59e0b" strokeWidth="1.1" strokeDasharray="2 1.5" opacity="0.85" />
          <polygon points="62,8 57,9 61,13" fill="#f59e0b" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'hexagonal': {
      // Hexagonal 6-fold prism with internal rhombic cell
      return (
        <svg viewBox="0 0 80 68" className={`${dimClass} overflow-visible shrink-0`}>
          {/* Top Hexagon */}
          <polygon
            points="40,7 60,14 60,26 40,33 20,26 20,14"
            fill={fillFace}
            stroke={strokeMain}
            strokeWidth="1.3"
          />
          {/* Bottom Hexagon */}
          <polygon
            points="40,37 60,44 60,56 40,63 20,56 20,44"
            fill="none"
            stroke={strokeBack}
            strokeWidth="1.1"
          />
          {/* Vertical Pillars */}
          <line x1="20" y1="14" x2="20" y2="44" stroke={strokeMain} strokeWidth="1.2" />
          <line x1="20" y1="26" x2="20" y2="56" stroke={strokeMain} strokeWidth="1.3" />
          <line x1="40" y1="33" x2="40" y2="63" stroke={strokeMain} strokeWidth="1.4" />
          <line x1="60" y1="26" x2="60" y2="56" stroke={strokeMain} strokeWidth="1.3" />
          <line x1="60" y1="14" x2="60" y2="44" stroke={strokeMain} strokeWidth="1.2" />
          <line x1="40" y1="7" x2="40" y2="37" stroke={strokeBack} strokeWidth="1" strokeDasharray="2 1.5" />
          {/* 120° Rhombic Sub-cell highlight */}
          <line x1="40" y1="20" x2="60" y2="14" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />
          <line x1="40" y1="20" x2="20" y2="14" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />
          <line x1="40" y1="20" x2="40" y2="33" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />
          {/* 6-fold c-axis */}
          <line x1="40" y1="20" x2="40" y2="50" stroke="#10b981" strokeWidth="1.2" strokeDasharray="2 1.5" />
          <circle cx="40" cy="20" r="2.2" fill="#10b981" />
          <circle cx="40" cy="50" r="2.2" fill="#10b981" />
        </svg>
      );
    }

    case 'trigonal': {
      // Sheared Rhombohedron (a = b = c, alpha != 90)
      const front: [number, number][] = [[14, 56], [46, 56], [55, 25], [23, 25]];
      const back: [number, number][] = [[25, 43], [57, 43], [66, 12], [34, 12]];
      const glyph = (
        <g>
          <line x1="14" y1="56" x2="66" y2="12" stroke="#f43f5e" strokeWidth="1.1" strokeDasharray="2 1.5" />
          <path d="M 23,56 A 9 9 0 0 0 18,48" fill="none" stroke="#fda4af" strokeWidth="1.2" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'tetragonal': {
      // Tall square prism (a = b != c)
      const front: [number, number][] = [[22, 60], [46, 60], [46, 16], [22, 16]];
      const back: [number, number][] = [[32, 50], [56, 50], [56, 6], [32, 6]];
      const glyph = (
        <g>
          {/* 4-fold vertical c-axis */}
          <line x1="39" y1="55" x2="39" y2="11" stroke="#f97316" strokeWidth="1.1" strokeDasharray="2 1.5" />
          <rect x="36.8" y="6.5" width="4.4" height="4.4" transform="rotate(45 39 8.7)" fill="#f97316" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'orthorhombic': {
      // Unequal rectangular prism (a != b != c)
      const front: [number, number][] = [[12, 56], [52, 56], [52, 24], [12, 24]];
      const back: [number, number][] = [[24, 44], [64, 44], [64, 12], [24, 12]];
      const glyph = (
        <g>
          {/* 90 deg right angle marker */}
          <polyline points="12,49 19,49 19,56" fill="none" stroke="#84cc16" strokeWidth="1.1" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'monoclinic': {
      // Oblique beta != 90deg prism
      const front: [number, number][] = [[12, 56], [48, 56], [60, 22], [24, 22]];
      const back: [number, number][] = [[22, 45], [58, 45], [70, 11], [34, 11]];
      const glyph = (
        <g>
          {/* Beta > 90° angle arc */}
          <path d="M 40,56 A 9 9 0 0 1 51,48" fill="none" stroke="#38bdf8" strokeWidth="1.3" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'triclinic': {
      // Fully skewed parallelepiped (a != b != c, alpha != beta != gamma != 90)
      const front: [number, number][] = [[12, 58], [46, 53], [58, 22], [24, 27]];
      const back: [number, number][] = [[22, 44], [56, 39], [68, 8], [34, 13]];
      const glyph = (
        <g>
          {/* Inversion center -1 symbol */}
          <circle cx="40" cy="33" r="2.6" fill="none" stroke="#06b6d4" strokeWidth="1.2" />
          <circle cx="40" cy="33" r="0.9" fill="#06b6d4" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }
  }
};

interface BravaisSchematicProps {
  type: CenteringType;
  isSelected?: boolean;
}

/**
 * Vector schematic for the 5 Bravais Centering Modes (P, I, F, C, R)
 * showing corner (1/8), face (1/2), base (1/2), body (1), and rhombohedral sites.
 */
export const BravaisCenteringSchematic: React.FC<BravaisSchematicProps> = ({
  type,
  isSelected = false
}) => {
  const front: [number, number][] = [[14, 52], [44, 52], [44, 22], [14, 22]];
  const back: [number, number][] = [[26, 40], [56, 40], [56, 10], [26, 10]];

  const strokeEdge = isSelected ? '#818cf8' : '#475569';
  const strokeBack = isSelected ? '#4f46e5' : '#334155';

  return (
    <svg viewBox="0 0 70 62" className="w-14 h-12 overflow-visible shrink-0">
      {/* Back wireframe */}
      <polygon
        points={back.map(p => p.join(',')).join(' ')}
        fill="none"
        stroke={strokeBack}
        strokeWidth="1"
        strokeDasharray="2 1.5"
      />
      <line x1="14" y1="52" x2="26" y2="40" stroke={strokeBack} strokeWidth="1" strokeDasharray="2 1.5" />

      {/* Front wireframe */}
      <polygon
        points={front.map(p => p.join(',')).join(' ')}
        fill={isSelected ? 'rgba(99,102,241,0.08)' : 'none'}
        stroke={strokeEdge}
        strokeWidth="1.3"
      />
      <line x1="44" y1="52" x2="56" y2="40" stroke={strokeEdge} strokeWidth="1.2" />
      <line x1="44" y1="22" x2="56" y2="10" stroke={strokeEdge} strokeWidth="1.2" />
      <line x1="14" y1="22" x2="26" y2="10" stroke={strokeEdge} strokeWidth="1.2" />

      {/* Centering specific nodes */}
      {type === 'I' && (
        <g>
          <line x1="14" y1="52" x2="56" y2="10" stroke="#f43f5e" strokeWidth="0.9" strokeDasharray="1.5 1.5" />
          <line x1="44" y1="52" x2="26" y2="10" stroke="#f43f5e" strokeWidth="0.9" strokeDasharray="1.5 1.5" />
          <circle cx="35" cy="31" r="3.6" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1" />
        </g>
      )}

      {type === 'F' && (
        <g>
          {/* 6 Face centers */}
          <circle cx="35" cy="16" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
          <circle cx="35" cy="46" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
          <circle cx="29" cy="37" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
          <circle cx="41" cy="25" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
          <circle cx="20" cy="31" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
          <circle cx="50" cy="31" r="2.5" fill="#38bdf8" stroke="#e0f2fe" strokeWidth="0.8" />
        </g>
      )}

      {type === 'C' && (
        <g>
          {/* Top and Bottom Basal Faces highlighted */}
          <polygon points="14,22 44,22 56,10 26,10" fill="rgba(16,185,129,0.18)" />
          <polygon points="14,52 44,52 56,40 26,40" fill="rgba(16,185,129,0.18)" />
          <circle cx="35" cy="16" r="2.9" fill="#10b981" stroke="#d1fae5" strokeWidth="0.9" />
          <circle cx="35" cy="46" r="2.9" fill="#10b981" stroke="#d1fae5" strokeWidth="0.9" />
        </g>
      )}

      {type === 'R' && (
        <g>
          <line x1="14" y1="52" x2="56" y2="10" stroke="#eab308" strokeWidth="1" strokeDasharray="2 1.5" />
          <circle cx="28" cy="38" r="2.8" fill="#eab308" stroke="#fef9c3" strokeWidth="0.9" />
          <circle cx="42" cy="24" r="2.8" fill="#eab308" stroke="#fef9c3" strokeWidth="0.9" />
        </g>
      )}

      {/* 8 Corner Vertices */}
      {[...back, ...front].map((pt, i) => (
        <circle
          key={i}
          cx={pt[0]}
          cy={pt[1]}
          r="2.1"
          fill="#818cf8"
          stroke="#1e1b4b"
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
};

interface HeroSchematicProps {
  systemId: CrystalSystemId;
  centering: CenteringType;
  systemName: string;
  axialRelation: string;
  angleRelation: string;
  spaceGroupsCount: number;
  pointsPerCell: number;
}

/**
 * Hero Crystallographic Telemetry & Lattice Tessellation Graphic for the Unit Cells Banner.
 */
export const UnitCellHeroSchematic: React.FC<HeroSchematicProps> = ({
  systemId,
  centering,
  systemName,
  axialRelation,
  angleRelation,
  spaceGroupsCount,
  pointsPerCell
}) => {
  // Compute Pearson Symbol
  const pearsonPrefix: Record<CrystalSystemId, string> = {
    cubic: 'c',
    hexagonal: 'h',
    trigonal: 'h',
    tetragonal: 't',
    orthorhombic: 'o',
    monoclinic: 'm',
    triclinic: 'a'
  };
  const pearsonSymbol = `${pearsonPrefix[systemId]}${centering}`;

  return (
    <div className="relative bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 shadow-2xl overflow-hidden">
      {/* Subtle coordinate grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:18px_18px] opacity-35 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: Live 3D Isometric Schematic with Ghost Translational Tessellation */}
        <div className="relative flex items-center justify-center p-2 bg-slate-900/90 rounded-xl border border-slate-800">
          <CrystalSystemMiniSchematic
            systemId={systemId}
            centering={centering}
            isSelected={true}
            size="lg"
          />
          <div className="absolute top-1.5 left-2 text-[9px] font-mono font-bold text-indigo-400">
            {pearsonSymbol}
          </div>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-emerald-400 font-bold">
            Z={pointsPerCell}
          </div>
        </div>

        {/* Right: Crystallographic Metric & Symmetry Readout */}
        <div className="flex-1 min-w-0 space-y-2 font-mono">
          <div className="border-b border-slate-800 pb-1.5">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              Active Bravais State
            </div>
            <div className="text-sm font-bold text-white truncate">
              {systemName} · {centering}-Centered ({pearsonSymbol})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Axial Metric</span>
              <span className="text-indigo-300 font-bold truncate block">{axialRelation}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 uppercase block">Interaxial Angles</span>
              <span className="text-cyan-300 font-bold truncate block">{angleRelation}</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span>
              Space Groups: <strong className="text-amber-300">{spaceGroupsCount} / 230</strong>
            </span>
            <span>
              Multiplicity: <strong className="text-emerald-300">{pointsPerCell} pt/cell</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
