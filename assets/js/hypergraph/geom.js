/**
 * Geometry and Vector math helpers for Hypergraph Plotter
 */

// Vector operations
export const Vec = {
  add: (v1, v2) => ({ x: v1.x + v2.x, y: v1.y + v2.y }),
  sub: (v1, v2) => ({ x: v1.x - v2.x, y: v1.y - v2.y }),
  mult: (v, s) => ({ x: v.x * s, y: v.y * s }),
  div: (v, s) => ({ x: v.x / s, y: v.y / s }),
  mag: (v) => Math.sqrt(v.x * v.x + v.y * v.y),
  dist: (v1, v2) => Math.sqrt((v1.x - v2.x) ** 2 + (v1.y - v2.y) ** 2),
  normalize: (v) => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
  },
  limit: (v, max) => {
    const m = Math.sqrt(v.x * v.x + v.y * v.y);
    return m > max ? { x: (v.x / m) * max, y: (v.y / m) * max } : { ...v };
  }
};

/**
 * Computes the Convex Hull of a set of 2D points using the Monotone Chain algorithm.
 * Returns points in clockwise order.
 */
export function convexHull(points) {
  if (points.length <= 1) return [...points];

  // Remove duplicates and sort by x, then y
  const sorted = [...points]
    .filter((p, i, self) => self.findIndex(o => Math.abs(o.x - p.x) < 1e-5 && Math.abs(o.y - p.y) < 1e-5) === i)
    .sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

  if (sorted.length <= 2) return sorted;

  // 2D cross product of OA and OB vectors, returns positive if O-A-B makes a counter-clockwise turn
  const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  // Build lower hull
  const lower = [];
  for (let i = 0; i < sorted.length; i++) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
      lower.pop();
    }
    lower.push(sorted[i]);
  }

  // Build upper hull
  const upper = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
      upper.pop();
    }
    upper.push(sorted[i]);
  }

  // Remove the last point of each list because it's the duplicate of the first point of the other list
  lower.pop();
  upper.pop();

  const hull = lower.concat(upper);

  // Ensure clockwise order (shoelace area calculation in SVG y-down coords)
  let areaSum = 0;
  for (let i = 0; i < hull.length; i++) {
    const p1 = hull[i];
    const p2 = hull[(i + 1) % hull.length];
    areaSum += (p1.x * p2.y) - (p2.x * p1.y);
  }
  
  if (areaSum < 0) {
    hull.reverse();
  }

  return hull;
}

/**
 * Computes an SVG path representing the Minkowski sum of a set of points and a circle of a given radius.
 * This draws a smooth rounded blob enclosing all the points.
 * Handles 1-point (circle), 2-points (capsule), and 3+ points (rounded polygon).
 */
export function getBlobPath(points, radius) {
  if (!points || points.length === 0) return '';
  if (radius <= 0) radius = 10;

  // Deduplicate points
  const uniquePoints = points.filter((p, i, self) => 
    self.findIndex(o => Math.abs(o.x - p.x) < 0.1 && Math.abs(o.y - p.y) < 0.1) === i
  );

  if (uniquePoints.length === 0) return '';

  if (uniquePoints.length === 1) {
    const p = uniquePoints[0];
    return `M ${p.x - radius} ${p.y} 
            A ${radius} ${radius} 0 1 0 ${p.x + radius} ${p.y} 
            A ${radius} ${radius} 0 1 0 ${p.x - radius} ${p.y} Z`;
  }

  if (uniquePoints.length === 2) {
    const p0 = uniquePoints[0];
    const p1 = uniquePoints[1];
    const d = Vec.dist(p0, p1);
    if (d < 0.1) {
      return getBlobPath([p0], radius);
    }
    const t = Vec.normalize(Vec.sub(p1, p0));
    // Normal vector pointing "up/left" in y-down coords
    const n = { x: t.y, y: -t.x };

    // Outer offset points
    const p0_l = Vec.add(p0, Vec.mult(n, radius));
    const p0_r = Vec.sub(p0, Vec.mult(n, radius));
    const p1_l = Vec.add(p1, Vec.mult(n, radius));
    const p1_r = Vec.sub(p1, Vec.mult(n, radius));

    // Draw capsule
    return `M ${p0_l.x} ${p0_l.y} 
            L ${p1_l.x} ${p1_l.y} 
            A ${radius} ${radius} 0 0 1 ${p1_r.x} ${p1_r.y} 
            L ${p0_r.x} ${p0_r.y} 
            A ${radius} ${radius} 0 0 1 ${p0_l.x} ${p0_l.y} Z`;
  }

  // 3+ points: compute convex hull
  const hull = convexHull(uniquePoints);

  if (hull.length === 1) {
    return getBlobPath([hull[0]], radius);
  }
  if (hull.length === 2) {
    return getBlobPath([hull[0], hull[1]], radius);
  }

  // Draw rounded polygon by offsetting each edge and drawing arcs at vertices
  // We assume hull is in clockwise order.
  const pathParts = [];
  const n = hull.length;

  for (let i = 0; i < n; i++) {
    const pCurr = hull[i];
    const pNext = hull[(i + 1) % n];
    const pPrev = hull[(i - 1 + n) % n];

    // Compute edge vectors
    const vNext = Vec.sub(pNext, pCurr);
    const vPrev = Vec.sub(pCurr, pPrev);

    const tNext = Vec.normalize(vNext);
    const tPrev = Vec.normalize(vPrev);

    // Normal vectors pointing outwards (clockwise polygon in y-down coords -> normal is (t.y, -t.x))
    const nNext = { x: tNext.y, y: -tNext.x };
    const nPrev = { x: tPrev.y, y: -tPrev.x };

    // Start point of the offset edge to next
    const pStartOffset = Vec.add(pCurr, Vec.mult(nNext, radius));
    // End point of the offset edge from prev (which ends at pCurr)
    const pEndOffset = Vec.add(pCurr, Vec.mult(nPrev, radius));

    if (i === 0) {
      // Start the path at the beginning of the first offset edge
      pathParts.push(`M ${pStartOffset.x} ${pStartOffset.y}`);
    } else {
      // Draw circular arc around pCurr from the end of the previous edge's offset to the start of this edge's offset
      pathParts.push(`A ${radius} ${radius} 0 0 1 ${pStartOffset.x} ${pStartOffset.y}`);
    }

    // Line to the end of the current offset edge (which goes to pNext)
    const pNextStartOffset = Vec.add(pNext, Vec.mult(nNext, radius));
    pathParts.push(`L ${pNextStartOffset.x} ${pNextStartOffset.y}`);
  }

  // Close the path by drawing the final arc back to the start of the first edge's offset
  const firstEdgeOffset = Vec.add(hull[0], Vec.mult({ 
    x: Vec.normalize(Vec.sub(hull[1], hull[0])).y, 
    y: -Vec.normalize(Vec.sub(hull[1], hull[0])).x 
  }, radius));
  pathParts.push(`A ${radius} ${radius} 0 0 1 ${firstEdgeOffset.x} ${firstEdgeOffset.y} Z`);

  return pathParts.join(' ');
}
