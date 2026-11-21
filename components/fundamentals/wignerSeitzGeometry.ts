export type Vec3 = [number, number, number];

export interface PolyhedronFace {
  indices: number[];
  kind: 'primary' | 'secondary' | 'hex' | 'square' | 'rhomb';
}

export interface PolyhedronMesh {
  name: string;
  vertices: Vec3[];
  faces: PolyhedronFace[];
  edges: [number, number][];
  faceCount: number;
  edgeCount: number;
  vertexCount: number;
  faceBreakdown: string;
}

export interface HighSymmetryKPoint {
  symbol: string;
  fracLabel: string;
  pos: Vec3; // normalized coordinates matching the BZ polyhedron frame
  kScaleFactor: number; // multiplier on (2*pi/a) for approximate |k|
  role: string;
}

export interface BravaisDualSpec {
  pearson: string;
  realSpaceName: string;
  reciprocalSpaceName: string;
  dualityFormula: string;
  dualityNote: string;
  realPoly: PolyhedronMesh;
  bzPoly: PolyhedronMesh;
  kPoints: HighSymmetryKPoint[];
  ibzPath: string[]; // sequence of kPoint symbols
  eulerVerified: boolean;
}

function extractUniqueEdges(faces: PolyhedronFace[]): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];
  for (const f of faces) {
    const n = f.indices.length;
    for (let i = 0; i < n; i++) {
      const a = f.indices[i];
      const b = f.indices[(i + 1) % n];
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const key = `${lo}_${hi}`;
      if (!seen.has(key)) {
        seen.add(key);
        edges.push([lo, hi]);
      }
    }
  }
  return edges;
}

function scaleVertices(verts: Vec3[], sx: number, sy: number, sz: number): Vec3[] {
  return verts.map(([x, y, z]) => [x * sx, y * sy, z * sz]);
}

function rotateZ(verts: Vec3[], deg: number): Vec3[] {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return verts.map(([x, y, z]) => [x * c - y * s, x * s + y * c, z]);
}

function shearXZ(verts: Vec3[], shear: number): Vec3[] {
  return verts.map(([x, y, z]) => [x + shear * z, y, z]);
}

function shearTriclinic(verts: Vec3[], sxy: number, sxz: number, syz: number): Vec3[] {
  return verts.map(([x, y, z]) => [x + sxy * y + sxz * z, y + syz * z, z]);
}

/**
 * 1. Exact Cube / Rectangular Prism (6F, 12E, 8V)
 */
function buildBoxMesh(
  name: string,
  sx: number,
  sy: number,
  sz: number,
  faceBreakdown = '6 Rectangular Faces'
): PolyhedronMesh {
  const base: Vec3[] = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
  ];
  const vertices = scaleVertices(base, sx, sy, sz);
  const faces: PolyhedronFace[] = [
    { indices: [0, 3, 2, 1], kind: 'square' }, // -z
    { indices: [4, 5, 6, 7], kind: 'square' }, // +z
    { indices: [0, 1, 5, 4], kind: 'square' }, // -y
    { indices: [2, 3, 7, 6], kind: 'square' }, // +y
    { indices: [0, 4, 7, 3], kind: 'square' }, // -x
    { indices: [1, 2, 6, 5], kind: 'square' }, // +x
  ];
  const edges = extractUniqueEdges(faces);
  return {
    name,
    vertices,
    faces,
    edges,
    faceCount: faces.length,
    edgeCount: edges.length,
    vertexCount: vertices.length,
    faceBreakdown,
  };
}

/**
 * 2. Exact Truncated Octahedron (14F: 6 Squares + 8 Hexagons, 36E, 24V)
 *    Vertices are all 24 permutations of (±1, ±0.5, 0)
 */
function buildTruncatedOctahedronMesh(
  name: string,
  sx = 1,
  sy = 1,
  sz = 1,
  shearX = 0,
  faceBreakdown = '8 Hexagons + 6 Squares'
): PolyhedronMesh {
  const raw: Vec3[] = [];
  const coords = [
    [1, 0.5, 0],
    [1, 0, 0.5],
    [0.5, 1, 0],
    [0, 1, 0.5],
    [0.5, 0, 1],
    [0, 0.5, 1],
  ];
  const keyMap = new Map<string, number>();
  const addV = (v: Vec3) => {
    const k = `${v[0].toFixed(3)}_${v[1].toFixed(3)}_${v[2].toFixed(3)}`;
    if (!keyMap.has(k)) {
      keyMap.set(k, raw.length);
      raw.push(v);
    }
  };
  for (const [a, b, c] of coords) {
    for (const sa of a === 0 ? [1] : [-1, 1]) {
      for (const sb of b === 0 ? [1] : [-1, 1]) {
        for (const sc of c === 0 ? [1] : [-1, 1]) {
          addV([a * sa, b * sb, c * sc]);
        }
      }
    }
  }

  const orderFace = (indices: number[], normal: Vec3): number[] => {
    // Project onto plane perpendicular to normal and sort counter-clockwise
    const cx = indices.reduce((s, i) => s + raw[i][0], 0) / indices.length;
    const cy = indices.reduce((s, i) => s + raw[i][1], 0) / indices.length;
    const cz = indices.reduce((s, i) => s + raw[i][2], 0) / indices.length;
    const nLen = Math.hypot(normal[0], normal[1], normal[2]) || 1;
    const nx = normal[0] / nLen;
    const ny = normal[1] / nLen;
    const nz = normal[2] / nLen;
    const ref: Vec3 = Math.abs(nz) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    // u = ref x n
    const ux = ref[1] * nz - ref[2] * ny;
    const uy = ref[2] * nx - ref[0] * nz;
    const uz = ref[0] * ny - ref[1] * nx;
    const uLen = Math.hypot(ux, uy, uz) || 1;
    const u: Vec3 = [ux / uLen, uy / uLen, uz / uLen];
    // v = n x u
    const v: Vec3 = [ny * u[2] - nz * u[1], nz * u[0] - nx * u[2], nx * u[1] - ny * u[0]];

    return [...indices].sort((i1, i2) => {
      const d1: Vec3 = [raw[i1][0] - cx, raw[i1][1] - cy, raw[i1][2] - cz];
      const d2: Vec3 = [raw[i2][0] - cx, raw[i2][1] - cy, raw[i2][2] - cz];
      const a1 = Math.atan2(d1[0] * v[0] + d1[1] * v[1] + d1[2] * v[2], d1[0] * u[0] + d1[1] * u[1] + d1[2] * u[2]);
      const a2 = Math.atan2(d2[0] * v[0] + d2[1] * v[1] + d2[2] * v[2], d2[0] * u[0] + d2[1] * u[1] + d2[2] * u[2]);
      return a1 - a2;
    });
  };

  const faces: PolyhedronFace[] = [];
  // 6 Square faces: x = ±1, y = ±1, z = ±1
  const axes: { axis: 0 | 1 | 2; sign: -1 | 1; normal: Vec3 }[] = [
    { axis: 0, sign: 1, normal: [1, 0, 0] },
    { axis: 0, sign: -1, normal: [-1, 0, 0] },
    { axis: 1, sign: 1, normal: [0, 1, 0] },
    { axis: 1, sign: -1, normal: [0, -1, 0] },
    { axis: 2, sign: 1, normal: [0, 0, 1] },
    { axis: 2, sign: -1, normal: [0, 0, -1] },
  ];
  for (const { axis, sign, normal } of axes) {
    const idxs = raw
      .map((v, i) => (Math.abs(v[axis] - sign) < 1e-4 ? i : -1))
      .filter((i) => i >= 0);
    faces.push({ indices: orderFace(idxs, normal), kind: 'square' });
  }

  // 8 Hexagonal faces: sx*x + sy*y + sz*z = 1.5
  for (const s1 of [-1, 1]) {
    for (const s2 of [-1, 1]) {
      for (const s3 of [-1, 1]) {
        const idxs = raw
          .map((v, i) => (Math.abs(s1 * v[0] + s2 * v[1] + s3 * v[2] - 1.5) < 1e-4 ? i : -1))
          .filter((i) => i >= 0);
        faces.push({ indices: orderFace(idxs, [s1, s2, s3]), kind: 'hex' });
      }
    }
  }

  let vertices = scaleVertices(raw, sx * 0.92, sy * 0.92, sz * 0.92);
  if (Math.abs(shearX) > 1e-4) {
    vertices = shearXZ(vertices, shearX);
  }
  const edges = extractUniqueEdges(faces);
  return {
    name,
    vertices,
    faces,
    edges,
    faceCount: faces.length,
    edgeCount: edges.length,
    vertexCount: vertices.length,
    faceBreakdown,
  };
}

/**
 * 3. Exact Rhombic Dodecahedron (12 Congruent Rhombic Faces, 24E, 14V)
 */
function buildRhombicDodecahedronMesh(
  name: string,
  sx = 1,
  sy = 1,
  sz = 1,
  faceBreakdown = '12 Congruent Rhombi'
): PolyhedronMesh {
  const raw: Vec3[] = [
    // 6 octahedral vertices (indices 0..5)
    [1, 0, 0],  // 0: +x
    [-1, 0, 0], // 1: -x
    [0, 1, 0],  // 2: +y
    [0, -1, 0], // 3: -y
    [0, 0, 1],  // 4: +z
    [0, 0, -1], // 5: -z
    // 8 cubic vertices (indices 6..13)
    [0.5, 0.5, 0.5],    // 6: +++
    [0.5, 0.5, -0.5],   // 7: ++-
    [0.5, -0.5, 0.5],   // 8: +-+
    [0.5, -0.5, -0.5],  // 9: +--
    [-0.5, 0.5, 0.5],   // 10: -++
    [-0.5, 0.5, -0.5],  // 11: -+-
    [-0.5, -0.5, 0.5],  // 12: --+
    [-0.5, -0.5, -0.5], // 13: ---
  ];

  // 12 faces, each connecting two adjacent octahedral vertices and the two shared cubic vertices
  const faces: PolyhedronFace[] = [
    { indices: [0, 6, 2, 7], kind: 'rhomb' },    // +x +y
    { indices: [0, 9, 3, 8], kind: 'rhomb' },    // +x -y
    { indices: [0, 8, 4, 6], kind: 'rhomb' },    // +x +z
    { indices: [0, 7, 5, 9], kind: 'rhomb' },    // +x -z
    { indices: [1, 11, 2, 10], kind: 'rhomb' },  // -x +y
    { indices: [1, 12, 3, 13], kind: 'rhomb' },  // -x -y
    { indices: [1, 10, 4, 12], kind: 'rhomb' },  // -x +z
    { indices: [1, 13, 5, 11], kind: 'rhomb' },  // -x -z
    { indices: [2, 6, 4, 10], kind: 'rhomb' },   // +y +z
    { indices: [2, 11, 5, 7], kind: 'rhomb' },   // +y -z
    { indices: [3, 12, 4, 8], kind: 'rhomb' },   // -y +z
    { indices: [3, 9, 5, 13], kind: 'rhomb' },   // -y -z
  ];

  const vertices = scaleVertices(raw, sx * 1.05, sy * 1.05, sz * 1.05);
  const edges = extractUniqueEdges(faces);
  return {
    name,
    vertices,
    faces,
    edges,
    faceCount: faces.length,
    edgeCount: edges.length,
    vertexCount: vertices.length,
    faceBreakdown,
  };
}

/**
 * 4. Exact Hexagonal Prism (8F: 2 Hexagons + 6 Rectangles, 18E, 12V)
 */
function buildHexPrismMesh(
  name: string,
  rx: number,
  ry: number,
  hz: number,
  rotDeg = 0,
  shearX = 0,
  faceBreakdown = '2 Hexagonal + 6 Rectangular Faces'
): PolyhedronMesh {
  const raw: Vec3[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    raw.push([Math.cos(a) * rx, Math.sin(a) * ry, hz]);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    raw.push([Math.cos(a) * rx, Math.sin(a) * ry, -hz]);
  }
  let vertices = rotDeg !== 0 ? rotateZ(raw, rotDeg) : raw;
  if (Math.abs(shearX) > 1e-4) {
    vertices = shearXZ(vertices, shearX);
  }

  const faces: PolyhedronFace[] = [
    { indices: [0, 1, 2, 3, 4, 5], kind: 'hex' },
    { indices: [11, 10, 9, 8, 7, 6], kind: 'hex' },
    { indices: [0, 6, 7, 1], kind: 'square' },
    { indices: [1, 7, 8, 2], kind: 'square' },
    { indices: [2, 8, 9, 3], kind: 'square' },
    { indices: [3, 9, 10, 4], kind: 'square' },
    { indices: [4, 10, 11, 5], kind: 'square' },
    { indices: [5, 11, 6, 0], kind: 'square' },
  ];
  const edges = extractUniqueEdges(faces);
  return {
    name,
    vertices,
    faces,
    edges,
    faceCount: faces.length,
    edgeCount: edges.length,
    vertexCount: vertices.length,
    faceBreakdown,
  };
}

/**
 * 5. Rhombohedral 12-Face Trigonal Voronoi Polyhedron (stretched along 3-fold [111] → z-axis)
 */
function buildRhombohedralDualMesh(name: string, stretchZ: number): PolyhedronMesh {
  // Orient a rhombic dodecahedron so its 3-fold body diagonal [1,1,1] aligns with +z
  const base = buildRhombicDodecahedronMesh(name, 1, 1, 1, '12 Trigonal Rhombic / Hex Faces');
  // Orthonormal basis with e3 = (1,1,1)/sqrt(3)
  const e1: Vec3 = [1 / Math.SQRT2, -1 / Math.SQRT2, 0];
  const e2: Vec3 = [1 / Math.sqrt(6), 1 / Math.sqrt(6), -2 / Math.sqrt(6)];
  const e3: Vec3 = [1 / Math.sqrt(3), 1 / Math.sqrt(3), 1 / Math.sqrt(3)];

  const vertices: Vec3[] = base.vertices.map(([x, y, z]) => {
    const nx = x * e1[0] + y * e1[1] + z * e1[2];
    const ny = x * e2[0] + y * e2[1] + z * e2[2];
    const nz = (x * e3[0] + y * e3[1] + z * e3[2]) * stretchZ;
    return [nx * 0.95, ny * 0.95, nz * 0.95];
  });

  return {
    ...base,
    name,
    vertices,
  };
}

export const BRAVAIS_DUAL_SPECS: Record<string, BravaisDualSpec> = {
  cP: {
    pearson: 'cP',
    realSpaceName: 'Simple Cube (6F, 12E, 8V)',
    reciprocalSpaceName: 'Simple Cubic 1st BZ (6F, 12E, 8V)',
    dualityFormula: 'cP ↔ cP* (Self-Dual)',
    dualityNote: 'Both Wigner–Seitz cell and 1st Brillouin Zone are cubes bounded by {100} planes at ±a/2 and ±π/a.',
    realPoly: buildBoxMesh('Simple Cube (WS)', 0.78, 0.78, 0.78, '6 Congruent Squares'),
    bzPoly: buildBoxMesh('Simple Cubic 1st BZ', 0.78, 0.78, 0.78, '6 Congruent Squares'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (full O_h symmetry)' },
      { symbol: 'X', fracLabel: '(0, ½, 0)', pos: [0, 0.78, 0], kScaleFactor: 0.5, role: 'Square face center · {100} Bragg plane' },
      { symbol: 'M', fracLabel: '(½, ½, 0)', pos: [0.78, 0.78, 0], kScaleFactor: Math.SQRT1_2, role: 'Cube edge midpoint · {110} direction' },
      { symbol: 'R', fracLabel: '(½, ½, ½)', pos: [0.78, 0.78, 0.78], kScaleFactor: Math.sqrt(3) / 2, role: 'Cube corner vertex · maximum |k|' },
    ],
    ibzPath: ['Γ', 'X', 'M', 'Γ', 'R', 'X'],
    eulerVerified: true,
  },
  cI: {
    pearson: 'cI',
    realSpaceName: 'Truncated Octahedron (14F, 36E, 24V)',
    reciprocalSpaceName: 'Rhombic Dodecahedron (12F, 24E, 14V)',
    dualityFormula: 'cI (BCC) ↔ cF* (FCC Reciprocal)',
    dualityNote: 'Real-space BCC Wigner–Seitz is a 14-face Truncated Octahedron (8 nearest + 6 next-nearest neighbors); its reciprocal lattice is FCC, whose 1st BZ is a 12-face Rhombic Dodecahedron.',
    realPoly: buildTruncatedOctahedronMesh('BCC Wigner–Seitz (Truncated Octahedron)', 1, 1, 1),
    bzPoly: buildRhombicDodecahedronMesh('BCC 1st BZ (Rhombic Dodecahedron)', 1, 1, 1),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (O_h)' },
      { symbol: 'H', fracLabel: '(0, 1, 0)', pos: [0, 1.05, 0], kScaleFactor: 1.0, role: '4-fold octahedral vertex along ⟨100⟩' },
      { symbol: 'N', fracLabel: '(½, ½, 0)', pos: [0.525, 0.525, 0], kScaleFactor: Math.SQRT1_2, role: 'Rhombic face center · {110} Bragg plane' },
      { symbol: 'P', fracLabel: '(½, ½, ½)', pos: [0.525, 0.525, 0.525], kScaleFactor: Math.sqrt(3) / 2, role: '3-fold tetrahedral corner (T_d)' },
    ],
    ibzPath: ['Γ', 'H', 'N', 'Γ', 'P', 'H'],
    eulerVerified: true,
  },
  cF: {
    pearson: 'cF',
    realSpaceName: 'Rhombic Dodecahedron (12F, 24E, 14V)',
    reciprocalSpaceName: 'Truncated Octahedron (14F, 36E, 24V)',
    dualityFormula: 'cF (FCC) ↔ cI* (BCC Reciprocal)',
    dualityNote: 'Real-space FCC Wigner–Seitz is a 12-face Rhombic Dodecahedron (12 nearest neighbors); its reciprocal lattice is BCC, whose 1st BZ is the iconic 14-face Truncated Octahedron bounded by {111} hexagons & {200} squares.',
    realPoly: buildRhombicDodecahedronMesh('FCC Wigner–Seitz (Rhombic Dodecahedron)', 1, 1, 1),
    bzPoly: buildTruncatedOctahedronMesh('FCC 1st BZ (Truncated Octahedron)', 1, 1, 1),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (O_h · Si/Cu VBM)' },
      { symbol: 'X', fracLabel: '(0, 1, 0)', pos: [0, 0.92, 0], kScaleFactor: 1.0, role: 'Square {200} face center (near Si CBM)' },
      { symbol: 'W', fracLabel: '(½, 1, 0)', pos: [0.46, 0.92, 0], kScaleFactor: Math.sqrt(1.25), role: 'Square–hexagon corner vertex' },
      { symbol: 'K', fracLabel: '(¾, ¾, 0)', pos: [0.69, 0.69, 0], kScaleFactor: Math.sqrt(1.125), role: 'Hexagon–hexagon edge midpoint' },
      { symbol: 'L', fracLabel: '(½, ½, ½)', pos: [0.46, 0.46, 0.46], kScaleFactor: Math.sqrt(0.75), role: 'Hexagonal {111} face center (Ge CBM / Cu neck)' },
      { symbol: 'U', fracLabel: '(¼, 1, ¼)', pos: [0.23, 0.92, 0.23], kScaleFactor: Math.sqrt(1.125), role: 'Square–hexagon edge midpoint' },
    ],
    ibzPath: ['Γ', 'X', 'W', 'K', 'Γ', 'L', 'U', 'W', 'L', 'K'],
    eulerVerified: true,
  },
  hP: {
    pearson: 'hP',
    realSpaceName: 'Hexagonal Prism (8F, 18E, 12V)',
    reciprocalSpaceName: 'Hexagonal Prism · 30° Rotated (8F, 18E, 12V)',
    dualityFormula: 'hP ↔ hP* (Rotated 30° about c*)',
    dualityNote: 'The reciprocal lattice of a hexagonal net is another hexagonal net rotated by 30° in the basal plane; both WS and 1st BZ are hexagonal prisms.',
    realPoly: buildHexPrismMesh('Hexagonal Wigner–Seitz Prism', 0.88, 0.88, 0.72, 0),
    bzPoly: buildHexPrismMesh('Hexagonal 1st BZ (30° Dual)', 0.88, 0.88, 0.66, 30),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_6h)' },
      { symbol: 'M', fracLabel: '(½, 0, 0)', pos: [0.762, 0, 0], kScaleFactor: 1 / Math.sqrt(3), role: 'Rectangular {10-10} face center' },
      { symbol: 'K', fracLabel: '(⅓, ⅓, 0)', pos: [0.762, 0.44, 0], kScaleFactor: 2 / 3, role: 'Basal corner (Dirac cone in graphene)' },
      { symbol: 'A', fracLabel: '(0, 0, ½)', pos: [0, 0, 0.66], kScaleFactor: 0.31, role: 'Top hexagonal {0002} face center' },
      { symbol: 'L', fracLabel: '(½, 0, ½)', pos: [0.762, 0, 0.66], kScaleFactor: 0.66, role: 'Top rectangular edge midpoint' },
      { symbol: 'H', fracLabel: '(⅓, ⅓, ½)', pos: [0.762, 0.44, 0.66], kScaleFactor: 0.74, role: 'Top hexagonal corner vertex' },
    ],
    ibzPath: ['Γ', 'M', 'K', 'Γ', 'A', 'L', 'H', 'A'],
    eulerVerified: true,
  },
  hR: {
    pearson: 'hR',
    realSpaceName: 'Rhombohedral 12-Face Voronoi (12F, 24E, 14V)',
    reciprocalSpaceName: 'Trigonal Rhombohedral 1st BZ (12F, 24E, 14V)',
    dualityFormula: 'hR ↔ hR* (Self-Dual Rhombohedral)',
    dualityNote: 'Rhombohedral obverse centering produces a 3-fold symmetric Voronoi polyhedron elongated/compressed along the trigonal c*-axis.',
    realPoly: buildRhombohedralDualMesh('Rhombohedral Wigner–Seitz', 1.15),
    bzPoly: buildRhombohedralDualMesh('Rhombohedral 1st BZ', 0.85),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_3d)' },
      { symbol: 'Z', fracLabel: '(½, ½, ½)', pos: [0, 0, 0.82], kScaleFactor: 0.55, role: '3-fold trigonal apex along c*' },
      { symbol: 'L', fracLabel: '(½, 0, 0)', pos: [0.76, 0, 0.22], kScaleFactor: 0.62, role: 'Side rhombic face center' },
      { symbol: 'F', fracLabel: '(½, ½, 0)', pos: [0.45, 0.68, -0.18], kScaleFactor: 0.72, role: 'Secondary face center' },
    ],
    ibzPath: ['Γ', 'L', 'F', 'Γ', 'Z'],
    eulerVerified: true,
  },
  tP: {
    pearson: 'tP',
    realSpaceName: 'Tetragonal Square Prism (6F, 12E, 8V)',
    reciprocalSpaceName: 'Inverted Tetragonal 1st BZ (6F, 12E, 8V)',
    dualityFormula: 'tP ↔ tP* (c*/a* = a/c Inversion)',
    dualityNote: 'Elongated real-space c > a inverts into a compressed reciprocal-space c* < a* square prism.',
    realPoly: buildBoxMesh('Tetragonal Wigner–Seitz (c > a)', 0.64, 0.64, 0.96, '2 Squares + 4 Rectangles'),
    bzPoly: buildBoxMesh('Tetragonal 1st BZ (c* < a*)', 0.88, 0.88, 0.56, '2 Squares + 4 Rectangles'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_4h)' },
      { symbol: 'X', fracLabel: '(0, ½, 0)', pos: [0, 0.88, 0], kScaleFactor: 0.5, role: 'Lateral {100} face center' },
      { symbol: 'M', fracLabel: '(½, ½, 0)', pos: [0.88, 0.88, 0], kScaleFactor: Math.SQRT1_2, role: 'Vertical edge midpoint' },
      { symbol: 'Z', fracLabel: '(0, 0, ½)', pos: [0, 0, 0.56], kScaleFactor: 0.35, role: 'Top square {001} face center' },
      { symbol: 'R', fracLabel: '(0, ½, ½)', pos: [0, 0.88, 0.56], kScaleFactor: 0.61, role: 'Top edge midpoint' },
      { symbol: 'A', fracLabel: '(½, ½, ½)', pos: [0.88, 0.88, 0.56], kScaleFactor: 0.79, role: 'Top corner vertex' },
    ],
    ibzPath: ['Γ', 'X', 'M', 'Γ', 'Z', 'R', 'A', 'Z'],
    eulerVerified: true,
  },
  tI: {
    pearson: 'tI',
    realSpaceName: 'Anisotropic Truncated Octahedron (14F, 36E, 24V)',
    reciprocalSpaceName: 'BCT 1st Brillouin Zone (14F, 36E, 24V)',
    dualityFormula: 'tI ↔ tI* (Self-Dual BCT with c*/a* = a/c)',
    dualityNote: 'BCT is self-dual because tF reduces to tI by a 45° Bain rotation; its BZ topology transitions across c/a = 1 (BCC) and c/a = √2 (FCC).',
    realPoly: buildTruncatedOctahedronMesh('BCT Wigner–Seitz (c > a)', 0.84, 0.84, 1.12),
    bzPoly: buildTruncatedOctahedronMesh('BCT 1st Brillouin Zone (c* < a*)', 1.06, 1.06, 0.78),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_4h)' },
      { symbol: 'X', fracLabel: '(0, 0, ½)', pos: [0, 0.76, 0], kScaleFactor: 0.5, role: 'Lateral face center' },
      { symbol: 'M', fracLabel: '(½, ½, −½)', pos: [0, 0, 0.72], kScaleFactor: 0.58, role: 'Top square face center along c*' },
      { symbol: 'P', fracLabel: '(¼, ¼, ¼)', pos: [0.5, 0.5, 0.36], kScaleFactor: 0.69, role: 'Hexagonal–square junction vertex' },
      { symbol: 'N', fracLabel: '(0, ½, 0)', pos: [0.49, 0.49, 0.36], kScaleFactor: 0.62, role: 'Hexagonal {101} face center' },
    ],
    ibzPath: ['Γ', 'X', 'P', 'N', 'Γ', 'M'],
    eulerVerified: true,
  },
  oP: {
    pearson: 'oP',
    realSpaceName: 'Orthorhombic Cuboid (6F, 12E, 8V)',
    reciprocalSpaceName: 'Inverted Orthorhombic 1st BZ (6F, 12E, 8V)',
    dualityFormula: 'oP ↔ oP* (1/a : 1/b : 1/c Inversion)',
    dualityNote: 'Longest real-space edge becomes the shortest reciprocal-space axis in the rectangular Brillouin zone.',
    realPoly: buildBoxMesh('Orthorhombic WS (a < b < c)', 0.56, 0.78, 0.96, '3 Pairs of Unequal Rectangles'),
    bzPoly: buildBoxMesh('Orthorhombic 1st BZ (a* > b* > c*)', 0.96, 0.72, 0.54, '3 Pairs of Unequal Rectangles'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_2h)' },
      { symbol: 'X', fracLabel: '(½, 0, 0)', pos: [0.96, 0, 0], kScaleFactor: 0.5, role: 'a*-face center' },
      { symbol: 'Y', fracLabel: '(0, ½, 0)', pos: [0, 0.72, 0], kScaleFactor: 0.39, role: 'b*-face center' },
      { symbol: 'Z', fracLabel: '(0, 0, ½)', pos: [0, 0, 0.54], kScaleFactor: 0.31, role: 'c*-face center' },
      { symbol: 'S', fracLabel: '(½, ½, 0)', pos: [0.96, 0.72, 0], kScaleFactor: 0.63, role: 'xy-edge midpoint' },
      { symbol: 'R', fracLabel: '(½, ½, ½)', pos: [0.96, 0.72, 0.54], kScaleFactor: 0.71, role: 'Cuboid corner vertex' },
    ],
    ibzPath: ['Γ', 'X', 'S', 'Y', 'Γ', 'Z', 'R'],
    eulerVerified: true,
  },
  oI: {
    pearson: 'oI',
    realSpaceName: 'Anisotropic Truncated Octahedron (14F, 36E, 24V)',
    reciprocalSpaceName: 'Anisotropic Rhombic Dodecahedron (12F, 24E, 14V)',
    dualityFormula: 'oI ↔ oF* (Body ↔ Face Dual)',
    dualityNote: 'Body-centered orthorhombic (oI) transforms in reciprocal space into face-centered orthorhombic (oF*), switching 14F ↔ 12F.',
    realPoly: buildTruncatedOctahedronMesh('oI Wigner–Seitz (14F)', 0.82, 0.96, 1.12),
    bzPoly: buildRhombicDodecahedronMesh('oI 1st BZ (Anisotropic 12F)', 1.10, 0.92, 0.78),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_2h)' },
      { symbol: 'X', fracLabel: '(½, 0, 0)', pos: [1.15, 0, 0], kScaleFactor: 0.56, role: 'a*-axis vertex' },
      { symbol: 'S', fracLabel: '(½, 0, ½)', pos: [0.58, 0, 0.41], kScaleFactor: 0.61, role: 'Rhombic face center' },
      { symbol: 'R', fracLabel: '(0, ½, 0)', pos: [0, 0.96, 0], kScaleFactor: 0.49, role: 'b*-axis vertex' },
      { symbol: 'W', fracLabel: '(¼, ¼, ¼)', pos: [0.58, 0.48, 0.41], kScaleFactor: 0.76, role: 'Anisotropic tetrahedral corner' },
    ],
    ibzPath: ['Γ', 'X', 'S', 'R', 'Γ', 'W'],
    eulerVerified: true,
  },
  oF: {
    pearson: 'oF',
    realSpaceName: 'Anisotropic Rhombic Dodecahedron (12F, 24E, 14V)',
    reciprocalSpaceName: 'Anisotropic Truncated Octahedron (14F, 36E, 24V)',
    dualityFormula: 'oF ↔ oI* (Face ↔ Body Dual)',
    dualityNote: 'Face-centered orthorhombic (oF) is dual to body-centered orthorhombic (oI*), lifting cubic degeneracy across all 3 orthogonal axes.',
    realPoly: buildRhombicDodecahedronMesh('oF Wigner–Seitz (12F)', 0.80, 0.95, 1.14),
    bzPoly: buildTruncatedOctahedronMesh('oF 1st BZ (Anisotropic 14F)', 1.12, 0.94, 0.78),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_2h)' },
      { symbol: 'Y', fracLabel: '(½, 0, ½)', pos: [0, 0.86, 0], kScaleFactor: 0.52, role: 'b*-face center' },
      { symbol: 'Z', fracLabel: '(½, ½, 0)', pos: [0, 0, 0.72], kScaleFactor: 0.44, role: 'c*-face center' },
      { symbol: 'T', fracLabel: '(1, ½, ½)', pos: [1.03, 0, 0], kScaleFactor: 0.64, role: 'a*-face center' },
      { symbol: 'L', fracLabel: '(½, ½, ½)', pos: [0.51, 0.43, 0.36], kScaleFactor: 0.69, role: 'Hexagonal {111} face center' },
    ],
    ibzPath: ['Γ', 'Y', 'T', 'Z', 'Γ', 'L'],
    eulerVerified: true,
  },
  oC: {
    pearson: 'oC',
    realSpaceName: 'Base-Centered Hexagonal Prism (8F, 18E, 12V)',
    reciprocalSpaceName: 'Base-Centered Orthorhombic 1st BZ (8F, 18E, 12V)',
    dualityFormula: 'oC ↔ oC* (Self-Dual Base-Centered)',
    dualityNote: 'C-face centering turns the rectangular basal cross-section into an anisotropic hexagonal prism in both direct and reciprocal space.',
    realPoly: buildHexPrismMesh('oC Wigner–Seitz Prism', 0.72, 0.96, 0.84, 0, 0, '2 Hexagonal + 6 Rectangular Faces'),
    bzPoly: buildHexPrismMesh('oC 1st BZ Prism', 0.96, 0.72, 0.64, 0, 0, '2 Hexagonal + 6 Rectangular Faces'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (D_2h)' },
      { symbol: 'Y', fracLabel: '(0, ½, 0)', pos: [0, 0.62, 0], kScaleFactor: 0.48, role: 'b*-axis lateral face center' },
      { symbol: 'S', fracLabel: '(0, ½, 0) / (½, ½, 0)', pos: [0.72, 0.42, 0], kScaleFactor: 0.58, role: 'Diagonal {110} face center' },
      { symbol: 'Z', fracLabel: '(0, 0, ½)', pos: [0, 0, 0.64], kScaleFactor: 0.38, role: 'Top hexagonal {001} face center' },
      { symbol: 'R', fracLabel: '(0, ½, ½)', pos: [0.72, 0.42, 0.64], kScaleFactor: 0.69, role: 'Top diagonal edge midpoint' },
    ],
    ibzPath: ['Γ', 'Y', 'S', 'Γ', 'Z', 'R'],
    eulerVerified: true,
  },
  mP: {
    pearson: 'mP',
    realSpaceName: 'Oblique Hexagonal Prism ⊥ b (8F, 18E, 12V)',
    reciprocalSpaceName: 'Monoclinic 1st BZ · β* = 180° − β (8F, 18E, 12V)',
    dualityFormula: 'mP ↔ mP* (β* = 180° − β)',
    dualityNote: 'Non-orthogonal angle β > 90° bevels two acute prism corners into an 8-face hexagonal prism along unique b, while β* = 180° − β reverses the shear tilt in k-space.',
    realPoly: buildHexPrismMesh('Monoclinic mP Wigner–Seitz', 0.82, 0.74, 0.72, 15, 0.24, '8 Oblique Prism Faces'),
    bzPoly: buildHexPrismMesh('Monoclinic mP 1st BZ (β* = 180°−β)', 0.82, 0.74, 0.68, -15, -0.24, '8 Oblique Prism Faces'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (C_2h)' },
      { symbol: 'Y', fracLabel: '(0, ½, 0)', pos: [0, 0.68, 0], kScaleFactor: 0.46, role: 'Unique 2-fold b*-axis boundary' },
      { symbol: 'B', fracLabel: '(½, 0, 0)', pos: [0.76, 0, -0.14], kScaleFactor: 0.51, role: 'Oblique a*-face center' },
      { symbol: 'Z', fracLabel: '(0, 0, ½)', pos: [-0.16, 0, 0.68], kScaleFactor: 0.48, role: 'Oblique c*-face center' },
      { symbol: 'C', fracLabel: '(0, ½, ½)', pos: [-0.16, 0.68, 0.68], kScaleFactor: 0.66, role: 'Top b*-c* edge midpoint' },
    ],
    ibzPath: ['Γ', 'Y', 'C', 'Z', 'Γ', 'B'],
    eulerVerified: true,
  },
  mC: {
    pearson: 'mC',
    realSpaceName: 'Oblique 14-Face Voronoi (14F, 36E, 24V)',
    reciprocalSpaceName: 'C-Monoclinic 1st BZ (14F, 36E, 24V)',
    dualityFormula: 'mC ↔ mC* (Self-Dual Oblique)',
    dualityNote: 'Combining C-face centering with oblique β ≠ 90° produces a sheared 14-face parallelohedron in both real and k-space.',
    realPoly: buildTruncatedOctahedronMesh('Monoclinic mC Wigner–Seitz', 0.86, 1.04, 0.88, 0.26, '14 Oblique Faces'),
    bzPoly: buildTruncatedOctahedronMesh('Monoclinic mC 1st BZ', 0.96, 0.82, 0.90, -0.26, '14 Oblique Faces'),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Zone center (C_2h)' },
      { symbol: 'Y', fracLabel: '(0, 1, 0)', pos: [0, 0.75, 0], kScaleFactor: 0.49, role: 'Unique b*-axis boundary' },
      { symbol: 'A', fracLabel: '(½, ½, 0)', pos: [0.66, 0.54, 0], kScaleFactor: 0.62, role: 'Base-centered diagonal boundary' },
      { symbol: 'M', fracLabel: '(½, ½, ½)', pos: [0.35, 0.41, 0.45], kScaleFactor: 0.68, role: 'Oblique hexagonal face center' },
      { symbol: 'V', fracLabel: '(0, 0, ½)', pos: [-0.21, 0, 0.82], kScaleFactor: 0.53, role: 'Oblique c*-face center' },
    ],
    ibzPath: ['Γ', 'Y', 'A', 'M', 'Γ', 'V'],
    eulerVerified: true,
  },
  aP: {
    pearson: 'aP',
    realSpaceName: 'General Fedorov Parallelohedron (14F, 36E, 24V)',
    reciprocalSpaceName: 'Triclinic 1st BZ · 7 Pairs of ±G Planes (14F, 36E, 24V)',
    dualityFormula: 'aP ↔ aP* (Full 3×3 Metric Tensor Dual)',
    dualityNote: 'Every triclinic 1st Brillouin Zone is a general centrosymmetric 14-face Fedorov parallelohedron bounded by 7 pairs of parallel Bragg planes (±G).',
    realPoly: (() => {
      const m = buildTruncatedOctahedronMesh('Triclinic Wigner–Seitz (14F)', 0.86, 0.95, 0.90, 0, '7 Pairs of Parallel Faces (14F)');
      return { ...m, vertices: shearTriclinic(m.vertices, 0.14, 0.22, -0.15) };
    })(),
    bzPoly: (() => {
      const m = buildTruncatedOctahedronMesh('Triclinic 1st BZ (14F)', 0.94, 0.88, 0.86, 0, '7 Pairs of Parallel Faces (14F)');
      return { ...m, vertices: shearTriclinic(m.vertices, -0.14, -0.22, 0.15) };
    })(),
    kPoints: [
      { symbol: 'Γ', fracLabel: '(0, 0, 0)', pos: [0, 0, 0], kScaleFactor: 0, role: 'Inversion center (C_i)' },
      { symbol: 'X', fracLabel: '(½, 0, 0)', pos: [0.84, 0, 0], kScaleFactor: 0.48, role: 'a*-plane center (TRIC1a)' },
      { symbol: 'Y', fracLabel: '(0, ½, 0)', pos: [-0.11, 0.78, 0], kScaleFactor: 0.44, role: 'b*-plane center' },
      { symbol: 'Z', fracLabel: '(0, 0, ½)', pos: [-0.17, 0.12, 0.78], kScaleFactor: 0.51, role: 'c*-plane center' },
      { symbol: 'R', fracLabel: '(½, ½, ½)', pos: [0.32, 0.42, 0.44], kScaleFactor: 0.72, role: 'Inversion-paired zone corner' },
    ],
    ibzPath: ['Γ', 'X', 'Y', 'Γ', 'Z', 'R'],
    eulerVerified: true,
  },
};

export interface LatticeCellMetrics {
  vConvA3: number;
  vPrimA3: number;
  vBzInvA3: number;
  rWsA: number;
  kRefScale: number; // 2*pi / a in Å^-1
}

export function computeWignerSeitzMetrics(
  a: number,
  b: number,
  c: number,
  alphaDeg: number,
  betaDeg: number,
  gammaDeg: number,
  Z: number
): LatticeCellMetrics {
  const rad = Math.PI / 180;
  const ca = Math.cos(alphaDeg * rad);
  const cb = Math.cos(betaDeg * rad);
  const cg = Math.cos(gammaDeg * rad);
  const volFactor = Math.max(1e-6, 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg);
  const vConvA3 = a * b * c * Math.sqrt(volFactor);
  const vPrimA3 = vConvA3 / Math.max(1, Z);
  const vBzInvA3 = Math.pow(2 * Math.PI, 3) / Math.max(1e-6, vPrimA3);
  const rWsA = Math.cbrt((3 * vPrimA3) / (4 * Math.PI));
  const kRefScale = (2 * Math.PI) / Math.max(0.5, a);
  return { vConvA3, vPrimA3, vBzInvA3, rWsA, kRefScale };
}
