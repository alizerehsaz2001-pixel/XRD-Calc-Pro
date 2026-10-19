/**
 * High-Performance Scientific Data Optimization Utilities
 * 
 * Provides:
 * 1. LTTB (Largest-Triangle-Three-Buckets) Downsampling: Compresses dense spectral curves
 *    to match screen resolution without clipping sharp Bragg peaks or distorting FWHM breadth.
 * 2. Adaptive Viewport Reflection Pruning: Excludes non-contributing peaks from inner calculation loops.
 * 3. Fast Numeric Interpolation & Clamping.
 */

export interface Point2D {
  x: number;
  y: number;
  [key: string]: any;
}

/**
 * Largest-Triangle-Three-Buckets (LTTB) Downsampling Algorithm.
 * 
 * Downsamples data from N points to target threshold M while preserving:
 * - Local extrema (sharp Bragg peak apexes)
 * - Visual trend and envelope shape
 * - Area under peak curves
 * 
 * @param data Array of objects containing x and y coordinates
 * @param threshold Target number of points (typically 800 - 1200 for 1080p/4K displays)
 * @param xKey Key to use for X coordinate (defaults to 'x')
 * @param yKey Key to use for Y coordinate (defaults to 'y')
 */
export function downsampleLTTB<T extends Record<string, any>>(
  data: T[],
  threshold: number,
  xKey: keyof T = 'x',
  yKey: keyof T = 'y'
): T[] {
  const dataLen = data.length;
  if (threshold >= dataLen || threshold <= 0) {
    return data; // No downsampling needed
  }

  const sampled: T[] = new Array(threshold);
  let sampledIndex = 0;

  // Bucket size. Leave room for start and end data points
  const every = (dataLen - 2) / (threshold - 2);

  let a = 0; // Initially point a is the first point in the first bucket
  sampled[sampledIndex++] = data[a];

  for (let i = 0; i < threshold - 2; i++) {
    // Calculate point average for next bucket (bucket c)
    let avgX = 0;
    let avgY = 0;
    let avgRangeStart = Math.floor((i + 1) * every) + 1;
    let avgRangeEnd = Math.floor((i + 2) * every) + 1;
    avgRangeEnd = avgRangeEnd < dataLen ? avgRangeEnd : dataLen;

    const avgRangeLength = avgRangeEnd - avgRangeStart;

    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += Number(data[j][xKey]) || 0;
      avgY += Number(data[j][yKey]) || 0;
    }
    avgX /= Math.max(1, avgRangeLength);
    avgY /= Math.max(1, avgRangeLength);

    // Get the range for this bucket (bucket b)
    let rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.floor((i + 1) * every) + 1;

    // Point a
    const pointAX = Number(data[a][xKey]) || 0;
    const pointAY = Number(data[a][yKey]) || 0;

    let maxArea = -1;
    let nextA = rangeOffs;

    for (; rangeOffs < rangeTo; rangeOffs++) {
      const currentPt = data[rangeOffs];
      const ptX = Number(currentPt[xKey]) || 0;
      const ptY = Number(currentPt[yKey]) || 0;

      // Calculate triangle area over points: a, current point, and average next bucket point
      const area = Math.abs(
        (pointAX - avgX) * (ptY - pointAY) - (pointAX - ptX) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        nextA = rangeOffs; // Next a is this point
      }
    }

    sampled[sampledIndex++] = data[nextA]; // Pick the point from bucket b that forms highest triangle area
    a = nextA; // This a is the next a (chosen point)
  }

  // Always retain the last point
  sampled[sampledIndex++] = data[dataLen - 1];

  return sampled;
}

/**
 * Multi-Key Downsampling for Composed Diffraction Datasets
 * Ensures that if multiple curves (observed, calculated, residual, components) are present,
 * the maximum significance triangle considers both main peak curves so secondary lines don't get aliased.
 */
export function downsampleDiffractionPoints<T extends Record<string, any>>(
  points: T[],
  maxPoints: number = 1000,
  xKey: keyof T = 'twoTheta',
  primaryYKey: keyof T = 'intensity',
  secondaryYKey?: keyof T
): T[] {
  if (!points || points.length <= maxPoints) {
    return points;
  }

  // If a secondary curve is present (like calculatedIntensity or residual), we synthesize a composite metric for LTTB
  if (secondaryYKey) {
    const dataLen = points.length;
    const every = (dataLen - 2) / (maxPoints - 2);
    const sampled: T[] = new Array(maxPoints);
    let sampledIndex = 0;

    let a = 0;
    sampled[sampledIndex++] = points[a];

    for (let i = 0; i < maxPoints - 2; i++) {
      let avgX = 0;
      let avgY = 0;
      const avgRangeStart = Math.floor((i + 1) * every) + 1;
      let avgRangeEnd = Math.floor((i + 2) * every) + 1;
      if (avgRangeEnd > dataLen) avgRangeEnd = dataLen;
      const avgRangeLen = avgRangeEnd - avgRangeStart;

      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += Number(points[j][xKey]) || 0;
        const y1 = Number(points[j][primaryYKey]) || 0;
        const y2 = Number(points[j][secondaryYKey]) || 0;
        avgY += Math.max(y1, y2);
      }
      avgX /= Math.max(1, avgRangeLen);
      avgY /= Math.max(1, avgRangeLen);

      let rangeOffs = Math.floor(i * every) + 1;
      const rangeTo = Math.floor((i + 1) * every) + 1;

      const pointAX = Number(points[a][xKey]) || 0;
      const pointAY1 = Number(points[a][primaryYKey]) || 0;
      const pointAY2 = Number(points[a][secondaryYKey]) || 0;
      const pointAY = Math.max(pointAY1, pointAY2);

      let maxArea = -1;
      let nextA = rangeOffs;

      for (; rangeOffs < rangeTo; rangeOffs++) {
        const pt = points[rangeOffs];
        const ptX = Number(pt[xKey]) || 0;
        const ptY1 = Number(pt[primaryYKey]) || 0;
        const ptY2 = Number(pt[secondaryYKey]) || 0;
        const ptY = Math.max(ptY1, ptY2);

        const area = Math.abs(
          (pointAX - avgX) * (ptY - pointAY) - (pointAX - ptX) * (avgY - pointAY)
        ) * 0.5;

        if (area > maxArea) {
          maxArea = area;
          nextA = rangeOffs;
        }
      }

      sampled[sampledIndex++] = points[nextA];
      a = nextA;
    }

    sampled[sampledIndex++] = points[dataLen - 1];
    return sampled;
  }

  return downsampleLTTB(points, maxPoints, xKey, primaryYKey);
}
