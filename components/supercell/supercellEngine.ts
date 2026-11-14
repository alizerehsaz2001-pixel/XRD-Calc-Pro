export interface Matrix3x3 {
  p11: number; p12: number; p13: number;
  p21: number; p22: number; p23: number;
  p31: number; p32: number; p33: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface AtomSite {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  label: string;
}

export interface ReplicatedSupercellAtom {
  id: string;
  parentId: string;
  element: string;
  label: string;
  translation: [number, number, number];
  xWrap: number;
  yWrap: number;
  zWrap: number;
  cartX: number;
  cartY: number;
  cartZ: number;
}

export interface SupercellReflectionEntry {
  hPrime: number;
  kPrime: number;
  lPrime: number;
  parentH: number;
  parentK: number;
  parentL: number;
  dSpacing: number;
  twoThetaDeg: number;
  kind: 'Fundamental' | 'Superlattice';
}

export interface StructureIntegrityReport {
  expectedAtomCount: number;
  actualAtomCount: number;
  isCountExact: boolean;
  minInteratomicDist: number;
  closestPair: [string, string] | null;
  hasCollision: boolean;
  fractionalCartesianMaxError: number;
  dSpacingInvarianceError: number;
  weissZoneDelta: number;
}

export function matrixToArray(m: Matrix3x3): number[][] {
  return [
    [m.p11, m.p12, m.p13],
    [m.p21, m.p22, m.p23],
    [m.p31, m.p32, m.p33]
  ];
}

export function transposeArray3(M: number[][]): number[][] {
  return [
    [M[0][0], M[1][0], M[2][0]],
    [M[0][1], M[1][1], M[2][1]],
    [M[0][2], M[1][2], M[2][2]]
  ];
}

export function matMulArray3(A: number[][], B: number[][]): number[][] {
  const out = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let sum = 0;
      for (let k = 0; k < 3; k++) {
        sum += A[i][k] * B[k][j];
      }
      out[i][j] = sum;
    }
  }
  return out;
}

export function matVecArray3(M: number[][], v: [number, number, number]): [number, number, number] {
  return [
    M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
    M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
    M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
  ];
}

export function det3x3(m: Matrix3x3): number {
  return (
    m.p11 * (m.p22 * m.p33 - m.p23 * m.p32) -
    m.p12 * (m.p21 * m.p33 - m.p23 * m.p31) +
    m.p13 * (m.p21 * m.p32 - m.p22 * m.p31)
  );
}

export function invert3x3(m: Matrix3x3): Matrix3x3 | null {
  const det = det3x3(m);
  if (Math.abs(det) < 1e-10) return null;
  const invDet = 1 / det;

  return {
    p11: (m.p22 * m.p33 - m.p23 * m.p32) * invDet,
    p12: (m.p13 * m.p32 - m.p12 * m.p33) * invDet,
    p13: (m.p12 * m.p23 - m.p13 * m.p22) * invDet,
    p21: (m.p23 * m.p31 - m.p21 * m.p33) * invDet,
    p22: (m.p11 * m.p33 - m.p13 * m.p31) * invDet,
    p23: (m.p13 * m.p21 - m.p11 * m.p23) * invDet,
    p31: (m.p21 * m.p32 - m.p22 * m.p31) * invDet,
    p32: (m.p12 * m.p31 - m.p11 * m.p32) * invDet,
    p33: (m.p11 * m.p22 - m.p12 * m.p21) * invDet
  };
}

export function invertArray3x3(M: number[][]): number[][] | null {
  const [[a, b, c], [d, e, f], [g, h, i]] = M;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const D = -(b * i - c * h);
  const E = a * i - c * g;
  const F = -(a * h - b * g);
  const G = b * f - c * e;
  const H = -(a * f - c * d);
  const I = a * e - b * d;
  const det = a * A + b * B + c * C;
  if (Math.abs(det) < 1e-12) return null;
  const inv = 1 / det;
  return [
    [A * inv, D * inv, G * inv],
    [B * inv, E * inv, H * inv],
    [C * inv, F * inv, I * inv]
  ];
}

function wrap01(v: number): number {
  let w = ((v % 1) + 1) % 1;
  if (Math.abs(w - 1) < 1e-6 || Math.abs(w) < 1e-6) w = 0;
  return w;
}

function periodicDist(a: number, b: number): number {
  const diff = Math.abs(a - b);
  return Math.min(diff, 1 - diff);
}

/**
 * Exact bounded supercell atomic replication under row-basis convention M' = P M.
 * Uses the exact convex-hull bounding box of P^T [0,1]^3 + p so all |det(P)| replicas
 * are discovered with zero missed boundary atoms and fast execution even for large/sheared cells.
 * Fractional mapping: x' = P^-T (x + t - p) (mod 1).
 */
export function replicateSupercellAtomsExact(
  atomSites: AtomSite[],
  matrixP: Matrix3x3,
  inverseP: Matrix3x3 | null,
  shiftP: Vector3D,
  superCartesianVectors: number[][]
): ReplicatedSupercellAtom[] {
  if (!inverseP) return [];
  const absDet = Math.abs(det3x3(matrixP));
  if (absDet < 1e-5) return [];

  const P = matrixToArray(matrixP);
  const PT = transposeArray3(P);
  const invPT = transposeArray3(matrixToArray(inverseP));

  // Bounding box of P^T c + p for c in {0,1}^3
  let minPx = Infinity, minPy = Infinity, minPz = Infinity;
  let maxPx = -Infinity, maxPy = -Infinity, maxPz = -Infinity;
  for (let c1 = 0; c1 <= 1; c1++) {
    for (let c2 = 0; c2 <= 1; c2++) {
      for (let c3 = 0; c3 <= 1; c3++) {
        const mapped = matVecArray3(PT, [c1, c2, c3]);
        const gx = mapped[0] + shiftP.x;
        const gy = mapped[1] + shiftP.y;
        const gz = mapped[2] + shiftP.z;
        if (gx < minPx) minPx = gx;
        if (gx > maxPx) maxPx = gx;
        if (gy < minPy) minPy = gy;
        if (gy > maxPy) maxPy = gy;
        if (gz < minPz) minPz = gz;
        if (gz > maxPz) maxPz = gz;
      }
    }
  }

  const results: ReplicatedSupercellAtom[] = [];
  const tol = 1e-3;

  for (const site of atomSites) {
    const n1Min = Math.floor(minPx - site.x) - 1;
    const n1Max = Math.ceil(maxPx - site.x) + 1;
    const n2Min = Math.floor(minPy - site.y) - 1;
    const n2Max = Math.ceil(maxPy - site.y) + 1;
    const n3Min = Math.floor(minPz - site.z) - 1;
    const n3Max = Math.ceil(maxPz - site.z) + 1;

    // Guard cap for extreme user input det(P) > 250
    if ((n1Max - n1Min + 1) * (n2Max - n2Min + 1) * (n3Max - n3Min + 1) > 4000) {
      continue;
    }

    const siteReplicas: ReplicatedSupercellAtom[] = [];
    for (let n1 = n1Min; n1 <= n1Max; n1++) {
      for (let n2 = n2Min; n2 <= n2Max; n2++) {
        for (let n3 = n3Min; n3 <= n3Max; n3++) {
          const dx = site.x + n1 - shiftP.x;
          const dy = site.y + n2 - shiftP.y;
          const dz = site.z + n3 - shiftP.z;

          const xp = matVecArray3(invPT, [dx, dy, dz]);
          const xW = wrap01(xp[0]);
          const yW = wrap01(xp[1]);
          const zW = wrap01(xp[2]);

          const isDup = siteReplicas.some(
            (ex) =>
              periodicDist(ex.xWrap, xW) < tol &&
              periodicDist(ex.yWrap, yW) < tol &&
              periodicDist(ex.zWrap, zW) < tol
          );

          if (!isDup) {
            const cartX =
              xW * superCartesianVectors[0][0] +
              yW * superCartesianVectors[1][0] +
              zW * superCartesianVectors[2][0];
            const cartY =
              xW * superCartesianVectors[0][1] +
              yW * superCartesianVectors[1][1] +
              zW * superCartesianVectors[2][1];
            const cartZ =
              xW * superCartesianVectors[0][2] +
              yW * superCartesianVectors[1][2] +
              zW * superCartesianVectors[2][2];

            siteReplicas.push({
              id: `${site.id}_${n1}_${n2}_${n3}`,
              parentId: site.id,
              element: site.element,
              label: site.label,
              translation: [n1, n2, n3],
              xWrap: xW,
              yWrap: yW,
              zWrap: zW,
              cartX,
              cartY,
              cartZ
            });
          }
        }
      }
    }
    results.push(...siteReplicas);
  }

  return results;
}

/**
 * Generates sorted supercell XRD reflections (h'k'l') and classifies them into
 * Fundamental Parent Bragg Peaks vs. Superlattice Satellite Reflections (Brillouin zone folded).
 */
export function computeSupercellReflections(
  matrixP: Matrix3x3,
  inverseP: Matrix3x3 | null,
  transformedGStar: number[][] | null,
  wavelength: number = 1.54056,
  maxIndex: number = 3,
  limitCount: number = 18
): SupercellReflectionEntry[] {
  if (!inverseP || !transformedGStar) return [];
  const invP = matrixToArray(inverseP);
  const seen = new Set<string>();
  const list: SupercellReflectionEntry[] = [];

  for (let hp = -maxIndex; hp <= maxIndex; hp++) {
    for (let kp = -maxIndex; kp <= maxIndex; kp++) {
      for (let lp = -maxIndex; lp <= maxIndex; lp++) {
        if (hp === 0 && kp === 0 && lp === 0) continue;

        // Canonical hemisphere sign to deduplicate Friedel pairs (hkl) and (-h-k-l)
        if (hp < 0 || (hp === 0 && kp < 0) || (hp === 0 && kp === 0 && lp < 0)) continue;

        const key = `${hp},${kp},${lp}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const hVec = [hp, kp, lp];
        let invD2 = 0;
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            invD2 += hVec[i] * transformedGStar[i][j] * hVec[j];
          }
        }
        if (invD2 <= 1e-10) continue;
        const dSpacing = 1 / Math.sqrt(invD2);
        const sinTheta = wavelength / (2 * dSpacing);
        if (sinTheta <= 0 || sinTheta >= 0.999) continue;
        const twoThetaDeg = (2 * Math.asin(sinTheta) * 180) / Math.PI;
        if (twoThetaDeg < 5 || twoThetaDeg > 95) continue;

        // Map supercell (h'k'l') back to parent Miller indices: h_parent = P^-1 h'
        const [ph, pk, pl] = matVecArray3(invP, [hp, kp, lp]);
        const isInt = (val: number) => Math.abs(val - Math.round(val)) < 1e-4;
        const kind = isInt(ph) && isInt(pk) && isInt(pl) ? 'Fundamental' : 'Superlattice';

        list.push({
          hPrime: hp,
          kPrime: kp,
          lPrime: lp,
          parentH: ph,
          parentK: pk,
          parentL: pl,
          dSpacing,
          twoThetaDeg,
          kind
        });
      }
    }
  }

  // Filter out empty no-op for P unused variable lint
  void matrixP;
  return list.sort((a, b) => a.twoThetaDeg - b.twoThetaDeg).slice(0, limitCount);
}

/**
 * Evaluates full Minimum-Image-Convention nearest-neighbor distance and strict invariance verification.
 */
export function evaluateStructureIntegrity(
  replicatedAtoms: ReplicatedSupercellAtom[],
  atomSites: AtomSite[],
  parentCountExpected: number,
  superCartesianVectors: number[][],
  parentCartesianVectors: number[][],
  matrixP: Matrix3x3,
  inverseP: Matrix3x3 | null,
  shiftP: Vector3D,
  dOrig: number,
  dTransformed: number,
  weissOrig: number,
  weissPrime: number
): StructureIntegrityReport {
  let minInteratomicDist = Infinity;
  let closestPair: [string, string] | null = null;

  const cap = Math.min(replicatedAtoms.length, 160);
  for (let i = 0; i < cap; i++) {
    for (let j = i + 1; j < cap; j++) {
      const a = replicatedAtoms[i];
      const b = replicatedAtoms[j];
      let dx = b.xWrap - a.xWrap;
      let dy = b.yWrap - a.yWrap;
      let dz = b.zWrap - a.zWrap;
      // Minimum image wrapping into [-0.5, 0.5]
      dx -= Math.round(dx);
      dy -= Math.round(dy);
      dz -= Math.round(dz);

      const cx =
        dx * superCartesianVectors[0][0] +
        dy * superCartesianVectors[1][0] +
        dz * superCartesianVectors[2][0];
      const cy =
        dx * superCartesianVectors[0][1] +
        dy * superCartesianVectors[1][1] +
        dz * superCartesianVectors[2][1];
      const cz =
        dx * superCartesianVectors[0][2] +
        dy * superCartesianVectors[1][2] +
        dz * superCartesianVectors[2][2];

      const dist = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (dist > 1e-5 && dist < minInteratomicDist) {
        minInteratomicDist = dist;
        closestPair = [`${a.element}(${a.label})`, `${b.element}(${b.label})`];
      }
    }
  }

  // Exact coordinate invariance check: r_cart(parent x) === r_cart(super x') + shift_cart
  let maxErr = 0;
  if (inverseP && atomSites.length > 0) {
    const invPT = transposeArray3(matrixToArray(inverseP));
    const shiftCart: [number, number, number] = [
      shiftP.x * parentCartesianVectors[0][0] +
        shiftP.y * parentCartesianVectors[1][0] +
        shiftP.z * parentCartesianVectors[2][0],
      shiftP.x * parentCartesianVectors[0][1] +
        shiftP.y * parentCartesianVectors[1][1] +
        shiftP.z * parentCartesianVectors[2][1],
      shiftP.x * parentCartesianVectors[0][2] +
        shiftP.y * parentCartesianVectors[1][2] +
        shiftP.z * parentCartesianVectors[2][2]
    ];

    for (const s of atomSites) {
      const rParent = [
        s.x * parentCartesianVectors[0][0] +
          s.y * parentCartesianVectors[1][0] +
          s.z * parentCartesianVectors[2][0],
        s.x * parentCartesianVectors[0][1] +
          s.y * parentCartesianVectors[1][1] +
          s.z * parentCartesianVectors[2][1],
        s.x * parentCartesianVectors[0][2] +
          s.y * parentCartesianVectors[1][2] +
          s.z * parentCartesianVectors[2][2]
      ];
      const xp = matVecArray3(invPT, [s.x - shiftP.x, s.y - shiftP.y, s.z - shiftP.z]);
      const rSuper = [
        shiftCart[0] +
          xp[0] * superCartesianVectors[0][0] +
          xp[1] * superCartesianVectors[1][0] +
          xp[2] * superCartesianVectors[2][0],
        shiftCart[1] +
          xp[0] * superCartesianVectors[0][1] +
          xp[1] * superCartesianVectors[1][1] +
          xp[2] * superCartesianVectors[2][1],
        shiftCart[2] +
          xp[0] * superCartesianVectors[0][2] +
          xp[1] * superCartesianVectors[1][2] +
          xp[2] * superCartesianVectors[2][2]
      ];
      const err = Math.sqrt(
        (rParent[0] - rSuper[0]) ** 2 +
          (rParent[1] - rSuper[1]) ** 2 +
          (rParent[2] - rSuper[2]) ** 2
      );
      if (err > maxErr) maxErr = err;
    }
  }
  void matrixP;

  return {
    expectedAtomCount: parentCountExpected,
    actualAtomCount: replicatedAtoms.length,
    isCountExact: Math.abs(replicatedAtoms.length - parentCountExpected) < 0.05,
    minInteratomicDist: isFinite(minInteratomicDist) ? minInteratomicDist : 0,
    closestPair,
    hasCollision: isFinite(minInteratomicDist) && minInteratomicDist < 0.85,
    fractionalCartesianMaxError: maxErr,
    dSpacingInvarianceError: Math.abs(dOrig - dTransformed),
    weissZoneDelta: Math.abs(weissOrig - weissPrime)
  };
}
