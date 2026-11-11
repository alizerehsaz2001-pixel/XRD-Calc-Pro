import React, { useId } from 'react';
import { CrystalSystemId, CenteringType } from './UnitCellsSection';

interface MiniSchematicProps {
  systemId: CrystalSystemId;
  centering?: CenteringType;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CAD-Grade 3D Shaded Isometric Schematic for each of the 7 Crystal Systems.
 * Features directional facet shading, volumetric radial-gradient lattice spheres,
 * hidden-line back edges, basis vector arrowheads, and holohedral symmetry axes.
 */
export const CrystalSystemMiniSchematic: React.FC<MiniSchematicProps> = ({
  systemId,
  centering = 'P',
  isSelected = false,
  size = 'md'
}) => {
  const uid = useId().replace(/:/g, '');

  const strokeFront = isSelected ? '#38bdf8' : '#64748b';
  const strokeBack = isSelected ? '#1e3a5f' : '#334155';

  const dimClass =
    size === 'sm' ? 'w-12 h-12' : size === 'lg' ? 'w-32 h-28' : 'w-16 h-14';

  const renderSvgDefs = () => (
    <defs>
      {/* Top Facet Directional Lighting */}
      <linearGradient id={`topFace-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isSelected ? '#38bdf8' : '#94a3b8'} stopOpacity={isSelected ? '0.24' : '0.12'} />
        <stop offset="100%" stopColor={isSelected ? '#0284c7' : '#475569'} stopOpacity={isSelected ? '0.08' : '0.04'} />
      </linearGradient>
      {/* Front Facet Lighting */}
      <linearGradient id={`frontFace-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={isSelected ? '#0ea5e9' : '#64748b'} stopOpacity={isSelected ? '0.14' : '0.08'} />
        <stop offset="100%" stopColor="#020617" stopOpacity="0.25" />
      </linearGradient>
      {/* Right Side Facet Shadow */}
      <linearGradient id={`rightFace-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={isSelected ? '#0369a1' : '#334155'} stopOpacity={isSelected ? '0.20' : '0.10'} />
        <stop offset="100%" stopColor="#020617" stopOpacity="0.35" />
      </linearGradient>
      {/* 3D Volumetric Platinum/Cyan Vertex Sphere */}
      <radialGradient id={`vertexSphere-${uid}`} cx="32%" cy="28%" r="68%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor={isSelected ? '#7dd3fc' : '#cbd5e1'} />
        <stop offset="75%" stopColor={isSelected ? '#0284c7' : '#475569'} />
        <stop offset="100%" stopColor="#0f172a" />
      </radialGradient>
      {/* 3D Volumetric Amber Body/Rhombohedral Sphere */}
      <radialGradient id={`amberSphere-${uid}`} cx="32%" cy="28%" r="68%">
        <stop offset="0%" stopColor="#fef3c7" />
        <stop offset="35%" stopColor="#fbbf24" />
        <stop offset="78%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#451a03" />
      </radialGradient>
      {/* 3D Volumetric Cyan Face-Center Sphere */}
      <radialGradient id={`cyanSphere-${uid}`} cx="32%" cy="28%" r="68%">
        <stop offset="0%" stopColor="#ecfeff" />
        <stop offset="35%" stopColor="#22d3ee" />
        <stop offset="78%" stopColor="#0e7490" />
        <stop offset="100%" stopColor="#083344" />
      </radialGradient>
    </defs>
  );

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
    const backFaceCenter: [number, number] = [
      (backCorners[0][0] + backCorners[1][0] + backCorners[2][0] + backCorners[3][0]) / 4,
      (backCorners[0][1] + backCorners[1][1] + backCorners[2][1] + backCorners[3][1]) / 4
    ];
    const leftFaceCenter: [number, number] = [
      (frontCorners[0][0] + frontCorners[3][0] + backCorners[0][0] + backCorners[3][0]) / 4,
      (frontCorners[0][1] + frontCorners[3][1] + backCorners[0][1] + backCorners[3][1]) / 4
    ];
    const rightFaceCenter: [number, number] = [
      (frontCorners[1][0] + frontCorners[2][0] + backCorners[1][0] + backCorners[2][0]) / 4,
      (frontCorners[1][1] + frontCorners[2][1] + backCorners[1][1] + backCorners[2][1]) / 4
    ];

    if (centering === 'I') {
      return (
        <g>
          <line x1={frontCorners[0][0]} y1={frontCorners[0][1]} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="0.7" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1={backCorners[2][0]} y1={backCorners[2][1]} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="0.7" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1={frontCorners[1][0]} y1={frontCorners[1][1]} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.45" />
          <line x1={backCorners[3][0]} y1={backCorners[3][1]} x2={cx} y2={cy} stroke="#f59e0b" strokeWidth="0.6" strokeDasharray="1.5 1.5" opacity="0.45" />
          <circle cx={cx} cy={cy} r="3.4" fill={`url(#amberSphere-${uid})`} />
        </g>
      );
    }
    if (centering === 'F') {
      return (
        <g>
          {[topFaceCenter, botFaceCenter, frontFaceCenter, backFaceCenter, leftFaceCenter, rightFaceCenter].map((pt, i) => (
            <circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill={`url(#cyanSphere-${uid})`} />
          ))}
        </g>
      );
    }
    if (centering === 'C') {
      return (
        <g>
          <circle cx={topFaceCenter[0]} cy={topFaceCenter[1]} r="2.7" fill={`url(#amberSphere-${uid})`} />
          <circle cx={botFaceCenter[0]} cy={botFaceCenter[1]} r="2.7" fill={`url(#amberSphere-${uid})`} />
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
          <circle cx={r1x} cy={r1y} r="2.6" fill={`url(#amberSphere-${uid})`} />
          <circle cx={r2x} cy={r2y} r="2.6" fill={`url(#amberSphere-${uid})`} />
        </g>
      );
    }
    return null;
  };

  const renderParallelepiped = (
    front: [number, number][],
    back: [number, number][],
    symmetryGlyph?: React.ReactNode
  ) => {
    const frontPoly = front.map(p => p.join(',')).join(' ');
    const backPoly = back.map(p => p.join(',')).join(' ');
    const topPoly = [front[3], front[2], back[2], back[3]].map(p => p.join(',')).join(' ');
    const rightPoly = [front[1], back[1], back[2], front[2]].map(p => p.join(',')).join(' ');

    return (
      <svg viewBox="0 0 80 68" className={`${dimClass} overflow-visible shrink-0`}>
        {renderSvgDefs()}
        {/* Back Hidden Edges */}
        <polygon points={backPoly} fill="none" stroke={strokeBack} strokeWidth="0.85" strokeDasharray="2 1.5" />
        <line x1={front[0][0]} y1={front[0][1]} x2={back[0][0]} y2={back[0][1]} stroke={strokeBack} strokeWidth="0.85" strokeDasharray="2 1.5" />

        {/* Back Vertex Spheres */}
        {back.map((pt, idx) => (
          <circle key={`b-${idx}`} cx={pt[0]} cy={pt[1]} r="1.9" fill={`url(#vertexSphere-${uid})`} opacity="0.7" />
        ))}

        {/* Shaded Polyhedral Facets */}
        <polygon points={topPoly} fill={`url(#topFace-${uid})`} stroke="none" />
        <polygon points={rightPoly} fill={`url(#rightFace-${uid})`} stroke="none" />
        <polygon points={frontPoly} fill={`url(#frontFace-${uid})`} stroke={strokeFront} strokeWidth="1.15" strokeLinejoin="round" />

        {/* Visible Depth Edges */}
        <line x1={front[1][0]} y1={front[1][1]} x2={back[1][0]} y2={back[1][1]} stroke={strokeFront} strokeWidth="1.05" />
        <line x1={front[2][0]} y1={front[2][1]} x2={back[2][0]} y2={back[2][1]} stroke={strokeFront} strokeWidth="1.05" />
        <line x1={front[3][0]} y1={front[3][1]} x2={back[3][0]} y2={back[3][1]} stroke={strokeFront} strokeWidth="1.05" />

        {/* Crystallographic Basis Vectors on Large CAD View */}
        {size === 'lg' && (
          <g>
            <line x1={front[0][0]} y1={front[0][1]} x2={front[1][0]} y2={front[1][1]} stroke="#38bdf8" strokeWidth="1.6" />
            <text x={(front[0][0] + front[1][0]) / 2} y={front[0][1] + 9} fill="#7dd3fc" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">b</text>
            <line x1={front[0][0]} y1={front[0][1]} x2={front[3][0]} y2={front[3][1]} stroke="#22d3ee" strokeWidth="1.6" />
            <text x={front[0][0] - 5} y={(front[0][1] + front[3][1]) / 2 + 2} fill="#67e8f9" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="end">c</text>
            <line x1={front[0][0]} y1={front[0][1]} x2={back[0][0]} y2={back[0][1]} stroke="#f59e0b" strokeWidth="1.4" />
            <text x={back[0][0] - 2} y={back[0][1] - 3} fill="#fcd34d" fontSize="7" fontFamily="monospace" fontWeight="bold">a</text>
          </g>
        )}

        {/* Symmetry Axis Glyph */}
        {symmetryGlyph}

        {/* Centering Nodes */}
        {renderCenteringNodes(front, back)}

        {/* Front Vertex Spheres */}
        {front.map((pt, idx) => (
          <circle key={`f-${idx}`} cx={pt[0]} cy={pt[1]} r="2.2" fill={`url(#vertexSphere-${uid})`} />
        ))}
      </svg>
    );
  };

  switch (systemId) {
    case 'cubic': {
      const front: [number, number][] = [[16, 54], [48, 54], [48, 22], [16, 22]];
      const back: [number, number][] = [[28, 42], [60, 42], [60, 10], [28, 10]];
      const glyph = (
        <g>
          <line x1="16" y1="54" x2="60" y2="10" stroke="#f59e0b" strokeWidth="0.95" strokeDasharray="2 1.5" opacity="0.85" />
          <polygon points="62,8 57.5,9.5 60.5,12.5" fill="#f59e0b" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'hexagonal': {
      return (
        <svg viewBox="0 0 80 68" className={`${dimClass} overflow-visible shrink-0`}>
          {renderSvgDefs()}
          {/* Bottom Hexagon */}
          <polygon
            points="40,37 60,44 60,56 40,63 20,56 20,44"
            fill={`url(#frontFace-${uid})`}
            stroke={strokeBack}
            strokeWidth="0.9"
          />
          <line x1="40" y1="7" x2="40" y2="37" stroke={strokeBack} strokeWidth="0.8" strokeDasharray="2 1.5" />
          {/* Front Prism Faces */}
          <polygon points="20,26 40,33 40,63 20,56" fill={`url(#frontFace-${uid})`} stroke="none" />
          <polygon points="40,33 60,26 60,56 40,63" fill={`url(#rightFace-${uid})`} stroke="none" />
          {/* Top Basal Hexagon */}
          <polygon
            points="40,7 60,14 60,26 40,33 20,26 20,14"
            fill={`url(#topFace-${uid})`}
            stroke={strokeFront}
            strokeWidth="1.15"
          />
          {/* Vertical Prism Edges */}
          <line x1="20" y1="14" x2="20" y2="44" stroke={strokeFront} strokeWidth="1" />
          <line x1="20" y1="26" x2="20" y2="56" stroke={strokeFront} strokeWidth="1.1" />
          <line x1="40" y1="33" x2="40" y2="63" stroke={strokeFront} strokeWidth="1.2" />
          <line x1="60" y1="26" x2="60" y2="56" stroke={strokeFront} strokeWidth="1.1" />
          <line x1="60" y1="14" x2="60" y2="44" stroke={strokeFront} strokeWidth="1" />
          {/* 120° Primitive Rhombic Cell Sub-Sector */}
          <polygon
            points="40,20 60,14 60,26 40,33"
            fill="rgba(56, 189, 248, 0.14)"
            stroke="#38bdf8"
            strokeWidth="0.9"
            strokeDasharray="2 1"
          />
          <line x1="40" y1="20" x2="40" y2="50" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 1.5" />
          <circle cx="40" cy="20" r="2.3" fill={`url(#amberSphere-${uid})`} />
          <circle cx="40" cy="50" r="2.3" fill={`url(#amberSphere-${uid})`} />
          {[[40, 7], [60, 14], [60, 26], [40, 33], [20, 26], [20, 14]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.9" fill={`url(#vertexSphere-${uid})`} />
          ))}
        </svg>
      );
    }

    case 'trigonal': {
      const front: [number, number][] = [[14, 56], [46, 56], [55, 25], [23, 25]];
      const back: [number, number][] = [[25, 43], [57, 43], [66, 12], [34, 12]];
      const glyph = (
        <g>
          <line x1="14" y1="56" x2="66" y2="12" stroke="#f59e0b" strokeWidth="0.95" strokeDasharray="2 1.5" />
          <path d="M 23,56 A 9 9 0 0 0 18,48" fill="none" stroke="#38bdf8" strokeWidth="1" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'tetragonal': {
      const front: [number, number][] = [[22, 60], [46, 60], [46, 16], [22, 16]];
      const back: [number, number][] = [[32, 50], [56, 50], [56, 6], [32, 6]];
      const glyph = (
        <g>
          <line x1="39" y1="55" x2="39" y2="11" stroke="#f59e0b" strokeWidth="0.95" strokeDasharray="2 1.5" />
          <rect x="37" y="6.5" width="4" height="4" transform="rotate(45 39 8.5)" fill="#f59e0b" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'orthorhombic': {
      const front: [number, number][] = [[12, 56], [52, 56], [52, 24], [12, 24]];
      const back: [number, number][] = [[24, 44], [64, 44], [64, 12], [24, 12]];
      const glyph = (
        <g>
          <polyline points="12,49 19,49 19,56" fill="none" stroke="#38bdf8" strokeWidth="1" />
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'monoclinic': {
      const front: [number, number][] = [[12, 56], [48, 56], [60, 22], [24, 22]];
      const back: [number, number][] = [[22, 45], [58, 45], [70, 11], [34, 11]];
      const glyph = (
        <g>
          <path d="M 40,56 A 9 9 0 0 1 51,48" fill="none" stroke="#f59e0b" strokeWidth="1.15" />
          {size === 'lg' && (
            <text x="49" y="53" fill="#fcd34d" fontSize="6.5" fontFamily="monospace" fontWeight="bold">β≠90°</text>
          )}
        </g>
      );
      return renderParallelepiped(front, back, glyph);
    }

    case 'triclinic': {
      const front: [number, number][] = [[12, 58], [46, 53], [58, 22], [24, 27]];
      const back: [number, number][] = [[22, 44], [56, 39], [68, 8], [34, 13]];
      const glyph = (
        <g>
          <circle cx="40" cy="33" r="2.6" fill="none" stroke="#f59e0b" strokeWidth="1" />
          <circle cx="40" cy="33" r="0.9" fill="#f59e0b" />
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
 * CAD-Grade 3D Shaded Schematic for the 5 Bravais Centering Modes (P, I, F, C, R).
 */
export const BravaisCenteringSchematic: React.FC<BravaisSchematicProps> = ({
  type,
  isSelected = false
}) => {
  const uid = useId().replace(/:/g, '');
  const front: [number, number][] = [[14, 52], [44, 52], [44, 22], [14, 22]];
  const back: [number, number][] = [[26, 40], [56, 40], [56, 10], [26, 10]];

  const strokeEdge = isSelected ? '#38bdf8' : '#475569';
  const strokeBack = isSelected ? '#1e3a5f' : '#334155';

  return (
    <svg viewBox="0 0 70 62" className="w-14 h-12 overflow-visible shrink-0">
      <defs>
        <radialGradient id={`bvVert-${uid}`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#94a3b8" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <radialGradient id={`bvCenter-${uid}`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="80%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#451a03" />
        </radialGradient>
        <radialGradient id={`bvFace-${uid}`} cx="32%" cy="28%" r="68%">
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="35%" stopColor="#22d3ee" />
          <stop offset="80%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </radialGradient>
      </defs>

      <polygon
        points={back.map(p => p.join(',')).join(' ')}
        fill="none"
        stroke={strokeBack}
        strokeWidth="0.85"
        strokeDasharray="2 1.5"
      />
      <line x1="14" y1="52" x2="26" y2="40" stroke={strokeBack} strokeWidth="0.85" strokeDasharray="2 1.5" />

      <polygon
        points={front.map(p => p.join(',')).join(' ')}
        fill={isSelected ? 'rgba(14, 165, 233, 0.08)' : 'rgba(15, 23, 42, 0.4)'}
        stroke={strokeEdge}
        strokeWidth="1.15"
      />
      <line x1="44" y1="52" x2="56" y2="40" stroke={strokeEdge} strokeWidth="1.05" />
      <line x1="44" y1="22" x2="56" y2="10" stroke={strokeEdge} strokeWidth="1.05" />
      <line x1="14" y1="22" x2="26" y2="10" stroke={strokeEdge} strokeWidth="1.05" />

      {type === 'I' && (
        <g>
          <line x1="14" y1="52" x2="56" y2="10" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1="44" y1="52" x2="26" y2="10" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="1.5 1.5" opacity="0.7" />
          <circle cx="35" cy="31" r="3.8" fill={`url(#bvCenter-${uid})`} />
        </g>
      )}

      {type === 'F' && (
        <g>
          <circle cx="35" cy="16" r="2.6" fill={`url(#bvFace-${uid})`} />
          <circle cx="35" cy="46" r="2.6" fill={`url(#bvFace-${uid})`} />
          <circle cx="29" cy="37" r="2.6" fill={`url(#bvFace-${uid})`} />
          <circle cx="41" cy="25" r="2.6" fill={`url(#bvFace-${uid})`} />
          <circle cx="20" cy="31" r="2.6" fill={`url(#bvFace-${uid})`} />
          <circle cx="50" cy="31" r="2.6" fill={`url(#bvFace-${uid})`} />
        </g>
      )}

      {type === 'C' && (
        <g>
          <polygon points="14,22 44,22 56,10 26,10" fill="rgba(56, 189, 248, 0.14)" />
          <polygon points="14,52 44,52 56,40 26,40" fill="rgba(56, 189, 248, 0.14)" />
          <circle cx="35" cy="16" r="3" fill={`url(#bvCenter-${uid})`} />
          <circle cx="35" cy="46" r="3" fill={`url(#bvCenter-${uid})`} />
        </g>
      )}

      {type === 'R' && (
        <g>
          <line x1="14" y1="52" x2="56" y2="10" stroke="#f59e0b" strokeWidth="0.85" strokeDasharray="2 1.5" />
          <circle cx="28" cy="38" r="2.9" fill={`url(#bvCenter-${uid})`} />
          <circle cx="42" cy="24" r="2.9" fill={`url(#bvCenter-${uid})`} />
        </g>
      )}

      {[...back, ...front].map((pt, i) => (
        <circle
          key={i}
          cx={pt[0]}
          cy={pt[1]}
          r="2.1"
          fill={`url(#bvVert-${uid})`}
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
 * CAD Crystallographic Telemetry & Metric Tensor Readout Console.
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

  const independentMetrics: Record<CrystalSystemId, string> = {
    cubic: '1 Independent Tensor Scalar (a)',
    hexagonal: '2 Independent Tensor Scalars (a, c)',
    trigonal: '2 Independent Tensor Scalars (a, α)',
    tetragonal: '2 Independent Tensor Scalars (a, c)',
    orthorhombic: '3 Independent Tensor Scalars (a, b, c)',
    monoclinic: '4 Independent Tensor Scalars (a, b, c, β)',
    triclinic: '6 Independent Tensor Scalars (a, b, c, α, β, γ)'
  };

  return (
    <div className="relative bg-[#070A12] border border-slate-800 rounded-xl p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-25 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left: 3D CAD Isometric Viewport */}
        <div className="relative flex flex-col items-center justify-center p-2.5 bg-[#0B0F1A] rounded-lg border border-slate-800/90 shrink-0">
          <CrystalSystemMiniSchematic
            systemId={systemId}
            centering={centering}
            isSelected={true}
            size="lg"
          />
          <div className="w-full flex items-center justify-between text-[10px] font-mono tabular-nums pt-1.5 border-t border-slate-800/80 mt-1">
            <span className="font-semibold text-cyan-400">{pearsonSymbol}</span>
            <span className="font-semibold text-amber-400">Z = {pointsPerCell}</span>
          </div>
        </div>

        {/* Right: Metrology Readout */}
        <div className="flex-1 min-w-0 space-y-2.5 font-mono tabular-nums">
          <div className="border-b border-slate-800 pb-1.5">
            <div className="text-[10px] text-slate-400 truncate">
              {independentMetrics[systemId]}
            </div>
            <div className="text-sm font-bold text-slate-100 truncate mt-0.5 font-sans">
              {systemName} · {centering}-Centered ({pearsonSymbol})
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-[#0B0F1A] border border-slate-800/90">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Axial Metric</span>
              <span className="text-slate-200 font-semibold truncate block mt-0.5">{axialRelation}</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0B0F1A] border border-slate-800/90">
              <span className="text-[9px] text-slate-500 uppercase tracking-wider block">Interaxial Angles</span>
              <span className="text-cyan-300 font-semibold truncate block mt-0.5">{angleRelation}</span>
            </div>
          </div>

          <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Space Groups: <strong className="text-slate-200">{spaceGroupsCount} / 230</strong>
            </span>
            <span>
              Multiplicity: <strong className="text-amber-400">{pointsPerCell} pt/cell</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
