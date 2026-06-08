import { Vec } from './geom.js?v=1.0.70';

/**
 * Helper to find the closest point on segment [a, b] to point p.
 * Returns the closest point coordinates and projection factor t in [0, 1].
 */
function getClosestPointOnSegment(p, a, b) {
  const abX = b.x - a.x;
  const abY = b.y - a.y;
  const l2 = abX * abX + abY * abY;
  if (l2 < 0.1) return { x: a.x, y: a.y, t: 0 };
  
  let t = ((p.x - a.x) * abX + (p.y - a.y) * abY) / l2;
  t = Math.max(0, Math.min(1, t));
  
  return {
    x: a.x + t * abX,
    y: a.y + t * abY,
    t: t
  };
}

/**
 * Manages the force-directed simulation for a bipartite representation of the hypergraph.
 * Bipartite graph: Original Vertices <-> Hyperedge Hubs
 */
export class BipartiteForceLayout {
  constructor(options = {}) {
    this.options = options;
    this.width = options.width || 800;
    this.height = options.height || 600;
    
    // Hypergraph physics coefficients
    this.kAttract = options.kAttract !== undefined ? options.kAttract : 0.35;
    this.kRepel = options.kRepel !== undefined ? options.kRepel : 7000;
    this.kHyperedgeRepel = options.kHyperedgeRepel !== undefined ? options.kHyperedgeRepel : 20000;
    this.kCenter = options.kCenter !== undefined ? options.kCenter : 0.008;
    this.restLength = options.restLength !== undefined ? options.restLength : 0;
    this.componentSpacing = options.componentSpacing !== undefined ? options.componentSpacing : 120;
    this.damping = options.damping !== undefined ? options.damping : 0.82;
    this.maxSpeed = options.maxSpeed !== undefined ? options.maxSpeed : 8;
    this.sameCompRepelScale = options.sameCompRepelScale !== undefined ? options.sameCompRepelScale : 0.3;
    this.sameCompRepelCap = options.sameCompRepelCap !== undefined ? options.sameCompRepelCap : 10.0;
    this.kSharedAttract = options.kSharedAttract !== undefined ? options.kSharedAttract : 0.08;
    // Force pushing non-member vertices out of foreign blob regions
    this.kNonMemberRepel = options.kNonMemberRepel !== undefined ? options.kNonMemberRepel : 2.2;
    this.coolingRate = options.coolingRate !== undefined ? options.coolingRate : 0.985;
    this.temperatureThreshold = options.temperatureThreshold !== undefined ? options.temperatureThreshold : 0.005;
    this.maxBlobReach = options.maxBlobReach !== undefined ? options.maxBlobReach : 400;
    this.nonMemberGap = options.nonMemberGap !== undefined ? options.nonMemberGap : 12;

    this.nodes = []; // All nodes (vertices + hubs)
    this.nodeMap = new Map(); // id -> node reference
    this.links = []; // bipartite links: { vertexId, hubId }
    this.draggedNodeId = null;
    this.fixedNodeIds = new Set();
    this.temperature = 1.0;
  }

  /**
   * Initializes or updates the simulation nodes and links.
   * If nodes already exist, we preserve their positions for a smooth transition.
   * @param {Array} vertices - List of vertex objects: { id, label }
   * @param {Array} hyperedges - List of hyperedges: { id, vertices: [vId1, vId2, ...] }
   * @param {Object} options - Visual styling/customization options (theme, fonts, sizes)
   */
  setGraph(vertices, hyperedges, options = {}) {
    this.options = { ...this.options, ...options };
    this.temperature = 1.0;
    const oldNodeMap = new Map(this.nodes.map(n => [n.id, n]));
    this.nodes = [];
    this.nodeMap.clear();
    this.links = [];

    const isDesktop = this.width > 768;
    const centerX = isDesktop ? (this.width / 2 + 90) : (this.width / 2);
    const centerY = this.height / 2;

    // Detect Connected Components of the hypergraph (bipartite BFS)
    const components = [];
    const visitedVertices = new Set();
    const vertexMap = new Map(vertices.map(v => [v.id, v]));

    // Build vertex-to-hyperedge adjacency list
    const adj = new Map();
    vertices.forEach(v => adj.set(v.id, new Set()));
    hyperedges.forEach(e => {
      e.vertices.forEach(vId => {
        if (adj.has(vId)) {
          adj.get(vId).add(e.id);
        }
      });
    });

    vertices.forEach(v => {
      if (visitedVertices.has(v.id)) return;

      const compVertices = [];
      const compEdges = new Set();
      const queue = [v.id];
      visitedVertices.add(v.id);

      while (queue.length > 0) {
        const currV = queue.shift();
        compVertices.push(currV);

        const edgeIds = adj.get(currV) || [];
        edgeIds.forEach(eId => {
          compEdges.add(eId);
          const edge = hyperedges.find(e => e.id === eId);
          if (edge) {
            edge.vertices.forEach(nextV => {
              if (vertexMap.has(nextV) && !visitedVertices.has(nextV)) {
                visitedVertices.add(nextV);
                queue.push(nextV);
              }
            });
          }
        });
      }

      components.push({
        vertices: compVertices,
        edges: Array.from(compEdges)
      });
    });

    // Sort components by size (vertices count) descending
    components.sort((a, b) => b.vertices.length - a.vertices.length);

    // Map each node ID to its initial spawn coordinate and component ID
    const nodeTargetCenters = new Map();
    const numComponents = components.length;

    // Use a pre-separation radius for components when spawning
    // Use componentSpacing if it's > 0, otherwise default to a reasonable value (e.g. 150)
    const R = this.componentSpacing > 0 ? this.componentSpacing : 150;

    components.forEach((comp, idx) => {
      // Angle on spawning circle
      const angle = numComponents <= 1 ? 0 : (idx / numComponents) * 2 * Math.PI;
      const compR = numComponents <= 1 ? 0 : (this.componentSpacing > 0 ? this.componentSpacing * 2.5 : 250);
      const offsetX = compR * Math.cos(angle);
      const offsetY = compR * Math.sin(angle);
      const spawnX = centerX + offsetX;
      const spawnY = centerY + offsetY;

      // Target centers for simulation space components out
      comp.vertices.forEach(vId => nodeTargetCenters.set(vId, {
        spawnX,
        spawnY,
        targetX: centerX + offsetX,
        targetY: centerY + offsetY,
        targetOffsetX: offsetX,
        targetOffsetY: offsetY,
        componentId: idx,
        componentSize: comp.vertices.length
      }));
      comp.edges.forEach(eId => nodeTargetCenters.set(`_hub_${eId}`, {
        spawnX,
        spawnY,
        targetX: centerX + offsetX,
        targetY: centerY + offsetY,
        targetOffsetX: offsetX,
        targetOffsetY: offsetY,
        componentId: idx,
        componentSize: comp.vertices.length
      }));
    });

    const aspectRatio = this.width / this.height;

    // 1. Add Vertices
    vertices.forEach(v => {
      const oldNode = oldNodeMap.get(v.id);
      const target = nodeTargetCenters.get(v.id) || { spawnX: centerX, spawnY: centerY, targetX: centerX, targetY: centerY, componentId: 0, componentSize: 1 };

      // Spawn vertices in a ring around their COMPONENT spawn center instead of the global center
      // to start them pre-separated and prevent overlapping components on load.
      const angle = Math.random() * 2 * Math.PI;
      const radius = numComponents <= 1 ? (130 + Math.random() * 40) : (30 + Math.random() * 20);
      const radiusX = radius * (aspectRatio > 1 ? aspectRatio : 1);
      const radiusY = radius;

      let label = v.label || String(v.id);
      if (label.length > 80) {
        label = label.substring(0, 77) + '...';
      }

      const node = {
        id: v.id,
        isHub: false,
        label: label,
        thumbnail: v.thumbnail || '',
        targetX: target.targetX,
        targetY: target.targetY,
        targetOffsetX: target.targetOffsetX !== undefined ? target.targetOffsetX : 0,
        targetOffsetY: target.targetOffsetY !== undefined ? target.targetOffsetY : 0,
        componentId: target.componentId !== undefined ? target.componentId : 0,
        componentSize: target.componentSize !== undefined ? target.componentSize : 1,
        x: oldNode ? oldNode.x : target.spawnX + Math.cos(angle) * radiusX,
        y: oldNode ? oldNode.y : target.spawnY + Math.sin(angle) * radiusY,
        vx: oldNode ? oldNode.vx : 0,
        vy: oldNode ? oldNode.vy : 0
      };
      this.nodes.push(node);
      this.nodeMap.set(v.id, node);
    });

    // 2. Add Hyperedge Hubs (Only for hyperedges containing more than one vertex)
    hyperedges.forEach(e => {
      if (e.vertices.length <= 1) return;
      const hubId = `_hub_${e.id}`;
      const oldNode = oldNodeMap.get(hubId);
      const target = nodeTargetCenters.get(hubId) || { x: centerX, y: centerY, componentSize: 1 };

      // Initial position of hub is center of gravity of its vertices
      let initX = 0;
      let initY = 0;
      let count = 0;
      e.vertices.forEach(vId => {
        const vNode = this.nodeMap.get(vId);
        if (vNode) {
          initX += vNode.x;
          initY += vNode.y;
          count++;
        }
      });
      if (count > 0) {
        initX /= count;
        initY /= count;
      } else {
        initX = target.x;
        initY = target.y;
      }

      const node = {
        id: hubId,
        edgeId: e.id,
        isHub: true,
        label: '',
        targetX: target.targetX,
        targetY: target.targetY,
        targetOffsetX: target.targetOffsetX !== undefined ? target.targetOffsetX : 0,
        targetOffsetY: target.targetOffsetY !== undefined ? target.targetOffsetY : 0,
        componentId: target.componentId !== undefined ? target.componentId : 0,
        componentSize: target.componentSize !== undefined ? target.componentSize : 1,
        x: oldNode ? oldNode.x : initX,
        y: oldNode ? oldNode.y : initY,
        vx: oldNode ? oldNode.vx : 0,
        vy: oldNode ? oldNode.vy : 0
      };
      this.nodes.push(node);
      this.nodeMap.set(hubId, node);

      // Create links between each vertex and the hub
      e.vertices.forEach(vId => {
        if (this.nodeMap.has(vId)) {
          this.links.push({
            vertexId: vId,
            hubId: hubId
          });
        }
      });
    });

    // 3. Compute shared vertex pairs for direct attraction
    this.sharedVertexPairs = [];
    const numVertices = vertices.length;
    for (let i = 0; i < numVertices; i++) {
      const v1Id = vertices[i].id;
      const set1 = adj.get(v1Id);
      if (!set1) continue;
      for (let j = i + 1; j < numVertices; j++) {
        const v2Id = vertices[j].id;
        const set2 = adj.get(v2Id);
        if (!set2) continue;

        let sharedCount = 0;
        for (const edgeId of set1) {
          if (set2.has(edgeId)) {
            sharedCount++;
          }
        }

        if (sharedCount > 0) {
          const unionSize = set1.size + set2.size - sharedCount;
          const similarity = unionSize > 0 ? sharedCount / unionSize : 0;
          this.sharedVertexPairs.push({
            v1Id,
            v2Id,
            count: sharedCount,
            similarity: similarity
          });
        }
      }
    }

    // 4. Build per-vertex edge membership set (for non-member blob avoidance in tick)
    this.vertexEdgeSet = new Map(); // vId -> Set<eId>
    vertices.forEach(v => this.vertexEdgeSet.set(v.id, new Set()));
    hyperedges.forEach(e => {
      e.vertices.forEach(vId => {
        if (this.vertexEdgeSet.has(vId)) this.vertexEdgeSet.get(vId).add(e.id);
      });
    });
    // Store hyperedges reference for tick()
    this.hyperedges = hyperedges;

    this.updateNodeDimensions(options);
  }

  /**
   * Calculates the direction-sensitive radius of a node along a unit vector (ux, uy).
   * Rectangular nodes are simulated as their isotropic minimum enclosing disks to allow smooth sliding.
   */
  getNodeRadius(node, ux, uy) {
    if (node.isHub) {
      return node.radius || 4;
    }
    if (node.shape === 'rect') {
      return node.halfWidth || 70;
    }
    if (node.shape === 'capsule') {
      return Math.min(
        node.halfWidth / Math.max(0.0001, Math.abs(ux)),
        node.halfHeight / Math.max(0.0001, Math.abs(uy))
      );
    }
    return node.radius || 12;
  }

  /**
   * Runs a single step of the force-directed layout.
   */
  tick() {
    const n = this.nodes.length;
    if (n === 0) return;

    // Cool down the layout to resolve high frequency jitter
    const currentMaxSpeed = this.maxSpeed * this.temperature;
    
    // If temperature is extremely low and we are not dragging, freeze layout
    if (this.temperature < this.temperatureThreshold && this.draggedNodeId === null) {
      for (let i = 0; i < n; i++) {
        this.nodes[i].vx = 0;
        this.nodes[i].vy = 0;
      }
      return;
    }

    if (this.draggedNodeId !== null) {
      this.temperature = 1.0; // Melt on drag
    } else {
      this.temperature *= this.coolingRate; // Cool down
    }

    // Visual blob margin: how far the rendered blob extends past each node's surface.
    // Used to ensure cross-component spacing keeps blobs from visually overlapping.
    const vertexSize = this.options.vertexSize || 0.15;
    const vertexRadius = 12 * (vertexSize / 0.15);
    const blobMargin = vertexRadius * (this.options.boundaryScale || 2.0);

    // Reset forces (using vx, vy temporarily to accumulate forces, then apply them)
    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);

    const isDesktop = this.width > 768;
    const centerX = isDesktop ? (this.width / 2 + 90) : (this.width / 2);
    const centerY = this.height / 2;

    // Build a set of linked vertex-hub pairs to skip self-repulsion in the layout physics
    const linkedPairs = new Set();
    this.links.forEach(link => {
      linkedPairs.add(`${link.vertexId}_${link.hubId}`);
    });

    // Precompute each hub's blob reach: the maximum distance from the hub to any of its
    // linked vertex nodes, plus the blob visual margin. This is the true visual "radius"
    // of the hyperedge blob from the hub's perspective, and is used to enforce
    // blob-surface separation between different hyperedges.
    //
    // blobReach is smoothed with an exponential moving average (EMA) to prevent the
    // goal distance from jumping on every frame (which would cause oscillation).
    const blobGap = 10; // minimum gap (px) to maintain between blob surfaces
    this.nodes.forEach(node => {
      if (!node.isHub) return;
      let maxDist = 0;
      this.links.forEach(link => {
        if (link.hubId !== node.id) return;
        const v = this.nodeMap.get(link.vertexId);
        if (!v) return;
        const dx = v.x - node.x;
        const dy = v.y - node.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        // Account for the vertex node's own half-extent in the blob direction
        const ux = d > 0.001 ? dx / d : 1;
        const uy = d > 0.001 ? dy / d : 0;
        const r_v = this.getNodeRadius(v, ux, uy);
        const vReach = d + r_v;
        if (vReach > maxDist) maxDist = vReach;
      });
      const rawReach = Math.min(maxDist + blobMargin, this.maxBlobReach);
      // EMA: 85% previous value + 15% new measurement — reacts faster to drags
      node.blobReach = node.blobReach != null
        ? 0.85 * node.blobReach + 0.15 * rawReach
        : rawReach;
    });

    // 1. Repulsion between all node pairs
    for (let i = 0; i < n; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < n; j++) {
        const n2 = this.nodes[j];
        
        let dx = n1.x - n2.x;
        let dy = n1.y - n2.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        
        if (d < 0.1) {
          // Break tie
          dx = (Math.random() - 0.5) * 2;
          dy = (Math.random() - 0.5) * 2;
          d = Math.sqrt(dx * dx + dy * dy);
        }

        const ux = dx / d;
        const uy = dy / d;

        const sameComp = (n1.componentId === n2.componentId);

        // Skip repulsion between a hub and its own member vertices to improve stability
        const isLinked = (n1.isHub && !n2.isHub && linkedPairs.has(`${n2.id}_${n1.id}`)) ||
                         (n2.isHub && !n1.isHub && linkedPairs.has(`${n1.id}_${n2.id}`));
        if (isLinked) {
          continue;
        }

        // Compute direction-sensitive radius. Rectangles are treated as minimum enclosing ellipses.
        const r1 = this.getNodeRadius(n1, ux, uy);
        const r2 = this.getNodeRadius(n2, ux, uy);

        const R_repel = r1 + r2;

        let force = 0;
        let repelCoeff = this.kRepel;
        if (n1.isHub && n2.isHub) {
          repelCoeff = this.kHyperedgeRepel;
        } else if (n1.isHub || n2.isHub) {
          repelCoeff = (this.kRepel + this.kHyperedgeRepel) / 2;
        }

        // 1. Long-range standard / linear overlap repulsion with smooth range cutoff
        if (d >= R_repel) {
          const maxRepelRange = R_repel + 180.0;
          if (d >= maxRepelRange) {
            force = 0;
          } else {
            const dEff = d - R_repel + 24.0;
            const baseForce = repelCoeff / (dEff * dEff);
            // Smoothly fade repulsion force to 0 as distance approaches the cutoff
            const fade = (maxRepelRange - d) / 180.0;
            force = baseForce * fade;
          }
        } else {
          const overlap = R_repel - d;
          const kOverlap = repelCoeff / 500;
          force = (repelCoeff / 576.0) + kOverlap * overlap;
        }

        // 2. Blob-surface non-overlap enforcement (for non-member vertex-to-hub or hub-to-hub pairs)
        let blobGoal = 0;
        if (n1.isHub && n2.isHub) {
          // Repel distinct hyperedge hubs to keep their blobs from overlapping
          const reach1 = n1.blobReach || blobMargin;
          const reach2 = n2.blobReach || blobMargin;
          blobGoal = reach1 + reach2 + blobGap;
          if (!sameComp) {
            blobGoal = Math.max(blobGoal, this.componentSpacing);
          }
        } else if (!sameComp) {
          // Cross-component vertex-hub repulsion
          if (n1.isHub && !n2.isHub) {
            blobGoal = (n1.blobReach || blobMargin) + r2 + blobGap;
          } else if (n2.isHub && !n1.isHub) {
            blobGoal = (n2.blobReach || blobMargin) + r1 + blobGap;
          }
          blobGoal = Math.max(blobGoal, this.componentSpacing);
        } else {
          if (n1.isHub && !n2.isHub) {
            const memberSet = this.vertexEdgeSet.get(n2.id);
            const isMember = memberSet && memberSet.has(n1.edgeId);
            if (!isMember) {
              const r2_eff = this.getNodeRadius(n2, ux, uy);
              blobGoal = (n1.blobReach || blobMargin) + r2_eff + blobGap;
            }
          } else if (n2.isHub && !n1.isHub) {
            const memberSet = this.vertexEdgeSet.get(n1.id);
            const isMember = memberSet && memberSet.has(n2.edgeId);
            if (!isMember) {
              const r1_eff = this.getNodeRadius(n1, ux, uy);
              blobGoal = (n2.blobReach || blobMargin) + r1_eff + blobGap;
            }
          }
        }

        if (blobGoal > 0 && d < blobGoal) {
          let factor = 1.0;
          if (this.kRepel > 0) {
            factor = repelCoeff / this.kRepel;
          }
          // Dynamic spring force to separate overlapping blobs / non-member nodes
          let overlapForce = 0.35 * factor * (blobGoal - d);
          if (sameComp) {
            // For same-component, limit the force so it doesn't tear the component apart
            overlapForce = this.sameCompRepelScale * factor * (blobGoal - d);
            overlapForce = Math.min(overlapForce, this.sameCompRepelCap);
          }
          force = Math.max(force, overlapForce);
        }

        if (force > 0) {
          const fX = (dx / d) * force;
          const fY = (dy / d) * force;

          fx[i] += fX;
          fy[i] += fY;
          fx[j] -= fX;
          fy[j] -= fY;
        }
      }
    }

    // 2. Attraction along links (springs between Vertices <-> Hubs)
    this.links.forEach(link => {
      const vNode = this.nodeMap.get(link.vertexId);
      const hNode = this.nodeMap.get(link.hubId);
      if (!vNode || !hNode) return;

      const idxV = this.nodes.indexOf(vNode);
      const idxH = this.nodes.indexOf(hNode);

      const dx = vNode.x - hNode.x;
      const dy = vNode.y - hNode.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.1) return;

      // Spring force: F = kAttract * (d - effRestLength)
      // The rest length is now exactly this.restLength (defaulting to 0) to pull nodes closer to hubs.
      const effRestLength = this.restLength;
      const force = this.kAttract * (d - effRestLength);
      const fX = (dx / d) * force;
      const fY = (dy / d) * force;

      fx[idxV] -= fX;
      fy[idxV] -= fY;
      fx[idxH] += fX;
      fy[idxH] += fY;
    });

    // 2b. Direct attraction between vertices sharing hyperedges
    this.sharedVertexPairs.forEach(pair => {
      const v1Node = this.nodeMap.get(pair.v1Id);
      const v2Node = this.nodeMap.get(pair.v2Id);
      if (!v1Node || !v2Node) return;

      const idx1 = this.nodes.indexOf(v1Node);
      const idx2 = this.nodes.indexOf(v2Node);

      const dx = v2Node.x - v1Node.x;
      const dy = v2Node.y - v1Node.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 0.1) return;

      const ux = dx / d;
      const uy = dy / d;

      // Rest length: pull them together until their cards touch with a safe gap (20px clearance)
      const r1 = this.getNodeRadius(v1Node, ux, uy);
      const r2 = this.getNodeRadius(v2Node, ux, uy);
      const safeDist = r1 + r2 + 20;

      if (d > safeDist) {
        // Hookean spring force scaled by non-linear Jaccard similarity weighting.
        // Highly similar / identical membership nodes are pulled together extremely strongly.
        const similarityWeight = pair.similarity === 1.0 
          ? 15.0 
          : Math.pow(pair.similarity, 2.0) * 8.0;

        const forceFactor = this.kSharedAttract * similarityWeight * (d - safeDist);
        const forceX = ux * forceFactor;
        const forceY = uy * forceFactor;

        fx[idx1] += forceX;
        fy[idx1] += forceY;
        fx[idx2] -= forceX;
        fy[idx2] -= forceY;
      }
    });

    // 2c. Non-member blob avoidance:
    //   For each vertex V that does NOT belong to edge E, if V falls inside E's blob
    //   boundary (skeleton of E + local reach + blobMargin), push V perpendicularly outward.
    //   Direction: V - closestPointOnSkeleton, which points toward the nearest boundary exit.
    if (this.hyperedges && this.vertexEdgeSet) {
      this.hyperedges.forEach(edge => {
        if (edge.vertices.length < 2) return;
 
        const hubNode = this.nodeMap.get(`_hub_${edge.id}`);
        if (!hubNode) return;
 
        const idxHub = this.nodes.indexOf(hubNode);
        const nonMemberRepelStrength = this.kNonMemberRepel;
 
        for (let i = 0; i < n; i++) {
          const node = this.nodes[i];
          if (node.isHub) continue;
 
          // Skip member vertices
          const memberSet = this.vertexEdgeSet.get(node.id);
          if (memberSet && memberSet.has(edge.id)) continue;
 

 
          // Find the closest point on the hyperedge's star skeleton (segments connecting members to hub)
          let minD = Infinity;
          let closestPt = null;
          let closestMemberNode = null;
 
          for (const vId of edge.vertices) {
            const vNode = this.nodeMap.get(vId);
            if (!vNode) continue;
 
            const res = getClosestPointOnSegment(node, vNode, hubNode);
            const dx = node.x - res.x;
            const dy = node.y - res.y;
            const d = Math.sqrt(dx * dx + dy * dy);
 
            if (d < minD) {
              minD = d;
              closestPt = res;
              closestMemberNode = vNode;
            }
          }
 
          if (!closestPt) continue;
 
          let dx = node.x - closestPt.x;
          let dy = node.y - closestPt.y;
          let d = minD;
 
          if (d < 0.1) {
            // Nudge randomly
            dx = (Math.random() - 0.5) * 2;
            dy = (Math.random() - 0.5) * 2;
            d = Math.sqrt(dx * dx + dy * dy);
          }
 
          const ux = dx / d;
          const uy = dy / d;
 
          // Interpolated local reach of the visual blob at this point on the skeleton
          const nodeReach = this.getNodeRadius(node, ux, uy);
          const memberReach = this.getNodeRadius(closestMemberNode, ux, uy);
          const hubReach = hubNode.radius || 4;
          const localReach = (1 - closestPt.t) * memberReach + closestPt.t * hubReach;
 
          // Inside threshold: visual blob boundary is at localReach + blobMargin + nonMemberGap
          const penetration = (localReach + blobMargin + this.nonMemberGap) - (d - nodeReach);
          
          if (penetration > 0) {
            // Smooth linear spring force to prevent wiggling/jitter
            const force = nonMemberRepelStrength * penetration * 0.22;
            const pushX = ux * force;
            const pushY = uy * force;

            fx[i] += pushX;
            fy[i] += pushY;

            // Distribute equal and opposite reaction force to endpoints using linear interpolation
            const weightM = 1 - closestPt.t;
            const weightH = closestPt.t;
            const idxM = this.nodes.indexOf(closestMemberNode);
            if (idxM !== -1) {
              fx[idxM] -= pushX * weightM;
              fy[idxM] -= pushY * weightM;
            }
            if (idxHub !== -1) {
              fx[idxHub] -= pushX * weightH;
              fy[idxHub] -= pushY * weightH;
            }
          }

          // Gentle hub repulsion to clear the interior dead zones of large multi-node edges
          // Run this independently of segment penetration to clear interior zones
          if (hubNode && hubNode.blobReach) {
            const dxH = node.x - hubNode.x;
            const dyH = node.y - hubNode.y;
            const dH = Math.sqrt(dxH * dxH + dyH * dyH);
            if (dH > 0.1) {
              const uxH = dxH / dH;
              const uyH = dyH / dH;
              const nodeReachH = this.getNodeRadius(node, uxH, uyH);
              const hubThreshold = hubNode.blobReach + nodeReachH + this.nonMemberGap;
              const hubPenetration = hubThreshold - dH;
              if (hubPenetration > 0) {
                const hubForce = nonMemberRepelStrength * hubPenetration * 0.15;
                const pushXH = uxH * hubForce;
                const pushYH = uyH * hubForce;

                fx[i] += pushXH;
                fy[i] += pushYH;

                if (idxHub !== -1) {
                  fx[idxHub] -= pushXH;
                  fy[idxHub] -= pushYH;
                }
              }
            }
          }
        }
      });
    }

    // 3. Gravity / Centering force (attraction to component center target)
    // Scale centering forces according to aspect ratio to flatten the layout and expand horizontally.
    const aspectRatio = this.width / this.height;
    const kCenterX = this.kCenter * (aspectRatio > 1 ? 0.85 : 1);
    const kCenterY = this.kCenter * (aspectRatio > 1 ? 1.15 : 1);

    for (let i = 0; i < n; i++) {
      const node = this.nodes[i];

      const targetX = node.targetX !== undefined ? node.targetX : centerX;
      const targetY = node.targetY !== undefined ? node.targetY : centerY;
      const dx = targetX - node.x;
      const dy = targetY - node.y;
      
      // Pull isolated/loose nodes and small components stronger to prevent drift due to other component repulsions
      let sizeFactor = 1.0;
      if (node.componentSize === 1) {
        sizeFactor = 10.0;
      } else if (node.componentSize === 2) {
        sizeFactor = 2.0;
      } else if (node.componentSize <= 4) {
        sizeFactor = 1.5;
      }
      
      fx[i] += dx * kCenterX * sizeFactor;
      fy[i] += dy * kCenterY * sizeFactor;
    }

    // 4. Update velocities and positions
    for (let i = 0; i < n; i++) {
      const node = this.nodes[i];
      if (node.id === this.draggedNodeId || (this.fixedNodeIds && this.fixedNodeIds.has(node.id))) {
        // Dragged or fixed node doesn't move due to forces
        node.vx = 0;
        node.vy = 0;
        continue;
      }

      // Add forces to velocity
      node.vx += fx[i];
      node.vy += fy[i];

      // Damping
      node.vx *= this.damping;
      node.vy *= this.damping;

      // Cap speed
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > currentMaxSpeed) {
        node.vx = (node.vx / speed) * currentMaxSpeed;
        node.vy = (node.vy / speed) * currentMaxSpeed;
      }

      // Update position
      node.x += node.vx;
      node.y += node.vy;
    }

    // 5. Resolve overlaps (Collision resolution for non-hub card nodes)
    const resolveIterations = 3;
    const clearanceMargin = 20; // enforce at least 20px clearance gap between cards
    for (let iter = 0; iter < resolveIterations; iter++) {
      for (let i = 0; i < n; i++) {
        const n1 = this.nodes[i];
        if (n1.isHub) continue;

        const isFixed1 = (n1.id === this.draggedNodeId || (this.fixedNodeIds && this.fixedNodeIds.has(n1.id)));

        for (let j = i + 1; j < n; j++) {
          const n2 = this.nodes[j];
          if (n2.isHub) continue;

          const isFixed2 = (n2.id === this.draggedNodeId || (this.fixedNodeIds && this.fixedNodeIds.has(n2.id)));
          if (isFixed1 && isFixed2) continue; // both fixed, can't separate

          // Center difference
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          let d = Math.sqrt(dx * dx + dy * dy);
          if (d < 0.1) {
            d = 0.1;
          }
          const ux = dx / d;
          const uy = dy / d;

          // Treat cards as minimum enclosing ellipses to resolve overlaps and slide smoothly
          const r1 = this.getNodeRadius(n1, ux, uy);
          const r2 = this.getNodeRadius(n2, ux, uy);
          const reqDist = r1 + r2 + clearanceMargin;

          if (d < reqDist) {
            const overlap = reqDist - d;
            const pushX = overlap * ux;
            const pushY = overlap * uy;

            if (isFixed1) {
              n2.x += pushX;
              n2.y += pushY;
              // Damp velocity of the colliding node to absorb kinetic energy
              n2.vx *= 0.5;
              n2.vy *= 0.5;
            } else if (isFixed2) {
              n1.x -= pushX;
              n1.y -= pushY;
              n1.vx *= 0.5;
              n1.vy *= 0.5;
            } else {
              n1.x -= pushX * 0.5;
              n1.y -= pushY * 0.5;
              n2.x += pushX * 0.5;
              n2.y += pushY * 0.5;
              n1.vx *= 0.5;
              n1.vy *= 0.5;
              n2.vx *= 0.5;
              n2.vy *= 0.5;
            }
          }
        }
      }
    }

    // 6. Recenter all nodes to prevent global drift
    // Skip recentering while dragging or if any nodes are pinned to prevent fighting inputs and causing drift
    if (this.draggedNodeId === null && (!this.fixedNodeIds || this.fixedNodeIds.size === 0)) {
      let sumX = 0, sumY = 0, massCount = 0;
      for (let i = 0; i < n; i++) {
        const node = this.nodes[i];
        if (!node.isHub) {
          sumX += node.x;
          sumY += node.y;
          massCount++;
        }
      }
      if (massCount > 0) {
        const comX = sumX / massCount;
        const comY = sumY / massCount;
        const dx = centerX - comX;
        const dy = centerY - comY;
        for (let i = 0; i < n; i++) {
          const node = this.nodes[i];
          node.x += dx;
          node.y += dy;
        }
      }
    }
  }

  /**
   * Runs the layout simulation synchronously for a number of iterations.
   * Useful for a non-animated layout computation.
   */
  wrapText(text, maxCharsPerLine = 16) {
    if (!text) return [''];
    if (text.length <= maxCharsPerLine) return [text];

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    });
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  updateNodeDimensions(options = {}) {
    this.options = { ...this.options, ...options };
    const theme = this.options.plotTheme || 'name-labeled';
    const labelFontSize = this.options.labelFontSize || 12;
    const vertexSize = this.options.vertexSize || 0.15;
    const vertexRadius = 12 * (vertexSize / 0.15);

    this.nodes.forEach(node => {
      if (node.isHub) {
        node.shape = 'circle';
        node.radius = 4;
        node.halfWidth = 4;
        node.halfHeight = 4;
        return;
      }

      const label = node.label || '';
      if (theme === 'clean') {
        node.shape = 'circle';
        node.radius = vertexRadius;
        node.halfWidth = vertexRadius;
        node.halfHeight = vertexRadius;
      } else if (theme === 'detailed') {
        const r = Math.max(4, vertexRadius * 0.4);
        node.shape = 'circle';
        node.radius = r;
        node.halfWidth = r;
        node.halfHeight = r;
      } else {
        // name-labeled: Event card layout
        const w = 120;
        const h = 120;
        node.shape = 'rect';
        node.width = w;
        node.height = h;
        node.halfWidth = w / 2;
        node.halfHeight = h / 2;
        node.radius = 60;
      }
    });
  }

  runStatic(iterations = 250) {
    for (let i = 0; i < iterations; i++) {
      this.tick();
    }
  }

  updateCenter(w, h) {
    this.width = w;
    this.height = h;
    const isDesktop = w > 768;
    const centerX = isDesktop ? (w / 2 + 90) : (w / 2);
    const centerY = h / 2;
    this.nodes.forEach(node => {
      node.targetX = centerX + (node.targetOffsetX || 0);
      node.targetY = centerY + (node.targetOffsetY || 0);
    });
  }
}

/**
 * Arranges vertices in a circle. Hubs are placed at the center of gravity of their vertices.
 */
export function circularLayout(vertices, hyperedges, width, height, radius = null) {
  const n = vertices.length;
  if (n === 0) return new Map();

  const centerX = width / 2;
  const centerY = height / 2;
  const r = radius || Math.min(width, height) * 0.35;
  const positions = new Map();

  // Position original vertices
  vertices.forEach((v, idx) => {
    const angle = (idx / n) * 2 * Math.PI;
    positions.set(v.id, {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle)
    });
  });

  // Position hubs at the average position of their vertices
  hyperedges.forEach(e => {
    const hubId = `_hub_${e.id}`;
    let avgX = 0;
    let avgY = 0;
    let count = 0;
    
    e.vertices.forEach(vId => {
      const pos = positions.get(vId);
      if (pos) {
        avgX += pos.x;
        avgY += pos.y;
        count++;
      }
    });

    if (count > 0) {
      positions.set(hubId, { x: avgX / count, y: avgY / count });
    } else {
      positions.set(hubId, { x: centerX, y: centerY });
    }
  });

  return positions;
}

/**
 * Arranges vertices in a grid layout. Hubs are placed at the center of gravity of their vertices.
 */
export function gridLayout(vertices, hyperedges, width, height) {
  const n = vertices.length;
  if (n === 0) return new Map();

  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  
  const paddingX = width / (cols + 1);
  const paddingY = height / (rows + 1);
  const positions = new Map();

  // Position original vertices
  vertices.forEach((v, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    positions.set(v.id, {
      x: paddingX * (col + 1),
      y: paddingY * (row + 1)
    });
  });

  // Position hubs at the average position of their vertices
  hyperedges.forEach(e => {
    const hubId = `_hub_${e.id}`;
    let avgX = 0;
    let avgY = 0;
    let count = 0;
    
    e.vertices.forEach(vId => {
      const pos = positions.get(vId);
      if (pos) {
        avgX += pos.x;
        avgY += pos.y;
        count++;
      }
    });

    if (count > 0) {
      positions.set(hubId, { x: avgX / count, y: avgY / count });
    } else {
      positions.set(hubId, { x: width / 2, y: height / 2 });
    }
  });

  return positions;
}
