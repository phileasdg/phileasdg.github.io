import { Vec } from './geom.js';

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
    this.kAttract = options.kAttract !== undefined ? options.kAttract : 0.2;
    this.kRepel = options.kRepel !== undefined ? options.kRepel : 10000;
    this.kHyperedgeRepel = options.kHyperedgeRepel !== undefined ? options.kHyperedgeRepel : 10000;
    this.kCenter = options.kCenter !== undefined ? options.kCenter : 0.004;
    this.restLength = options.restLength !== undefined ? options.restLength : 0;
    this.componentSpacing = options.componentSpacing !== undefined ? options.componentSpacing : 90;
    this.damping = options.damping !== undefined ? options.damping : 0.88;
    this.maxSpeed = options.maxSpeed !== undefined ? options.maxSpeed : 10;

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

    const centerX = this.width / 2;
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
      const spawnX = numComponents <= 1 ? centerX : centerX + R * Math.cos(angle);
      const spawnY = numComponents <= 1 ? centerY : centerY + R * Math.sin(angle);

      // Target centers for simulation is always the global center (centerX, centerY)
      comp.vertices.forEach(vId => nodeTargetCenters.set(vId, {
        spawnX,
        spawnY,
        targetX: centerX,
        targetY: centerY,
        componentId: idx
      }));
      comp.edges.forEach(eId => nodeTargetCenters.set(`_hub_${eId}`, {
        spawnX,
        spawnY,
        targetX: centerX,
        targetY: centerY,
        componentId: idx
      }));
    });

    const aspectRatio = this.width / this.height;

    // 1. Add Vertices
    vertices.forEach(v => {
      const oldNode = oldNodeMap.get(v.id);
      const target = nodeTargetCenters.get(v.id) || { spawnX: centerX, spawnY: centerY, targetX: centerX, targetY: centerY, componentId: 0 };

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
        componentId: target.componentId !== undefined ? target.componentId : 0,
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
      const target = nodeTargetCenters.get(hubId) || { x: centerX, y: centerY };

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
        componentId: target.componentId !== undefined ? target.componentId : 0,
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

    this.updateNodeDimensions(options);
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
    if (this.temperature < 0.005 && this.draggedNodeId === null) {
      for (let i = 0; i < n; i++) {
        this.nodes[i].vx = 0;
        this.nodes[i].vy = 0;
      }
      return;
    }

    if (this.draggedNodeId !== null) {
      this.temperature = 1.0; // Melt on drag
    } else {
      this.temperature *= 0.985; // Cool down
    }

    // Visual blob margin: how far the rendered blob extends past each node's surface.
    // Used to ensure cross-component spacing keeps blobs from visually overlapping.
    const vertexSize = this.options.vertexSize || 0.15;
    const vertexRadius = 12 * (vertexSize / 0.15);
    const blobMargin = vertexRadius * (this.options.boundaryScale || 2.0);

    // Reset forces (using vx, vy temporarily to accumulate forces, then apply them)
    const fx = new Array(n).fill(0);
    const fy = new Array(n).fill(0);

    const centerX = this.width / 2;
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
        const vReach = d + (v.radius || v.halfWidth || vertexRadius);
        if (vReach > maxDist) maxDist = vReach;
      });
      const rawReach = maxDist + blobMargin;
      // EMA: 95% previous value + 5% new measurement — smooths out frame-to-frame jitter
      node.blobReach = node.blobReach != null
        ? 0.95 * node.blobReach + 0.05 * rawReach
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

        // Compute radius for node 1: same-component repulsion uses isotropic bounding circles (n1.radius)
        // to prevent vibration/jitter. Cross-component uses direction-sensitive ray-cast for accuracy.
        let r1 = 0;
        if (n1.isHub) {
          r1 = n1.radius || 4;
        } else if (!sameComp && (n1.shape === 'capsule' || n1.shape === 'rect')) {
          r1 = Math.min(n1.halfWidth / Math.max(0.0001, Math.abs(ux)), n1.halfHeight / Math.max(0.0001, Math.abs(uy)));
        } else {
          r1 = n1.radius || 12;
        }

        // Compute radius for node 2
        let r2 = 0;
        if (n2.isHub) {
          r2 = n2.radius || 4;
        } else if (!sameComp && (n2.shape === 'capsule' || n2.shape === 'rect')) {
          r2 = Math.min(n2.halfWidth / Math.max(0.0001, Math.abs(ux)), n2.halfHeight / Math.max(0.0001, Math.abs(uy)));
        } else {
          r2 = n2.radius || 12;
        }

        const R_repel = r1 + r2;

        let force = 0;
        let repelCoeff = this.kRepel;
        if (n1.isHub && n2.isHub) {
          repelCoeff = this.kHyperedgeRepel;
        } else if (n1.isHub || n2.isHub) {
          repelCoeff = (this.kRepel + this.kHyperedgeRepel) / 2;
        }

        // 1. Long-range standard / linear overlap repulsion
        if (d >= R_repel) {
          const dEff = d - R_repel + 24.0;
          force = repelCoeff / (dEff * dEff);
        } else {
          const overlap = R_repel - d;
          const kOverlap = repelCoeff / 500;
          force = (repelCoeff / 576.0) + kOverlap * overlap;
        }

        // 2. Blob-surface non-overlap enforcement (for non-member vertex-to-hub or hub-to-hub pairs)
        let blobGoal = 0;
        if (n1.isHub && !n2.isHub) {
          blobGoal = (n1.blobReach || blobMargin) + r2 + blobGap;
        } else if (n2.isHub && !n1.isHub) {
          blobGoal = (n2.blobReach || blobMargin) + r1 + blobGap;
        } else if (n1.isHub && n2.isHub) {
          const reach1 = n1.blobReach || blobMargin;
          const reach2 = n2.blobReach || blobMargin;
          blobGoal = reach1 + reach2 + blobGap;
        }

        if (!sameComp) {
          blobGoal = Math.max(blobGoal, this.componentSpacing);
        }

        if (blobGoal > 0 && d < blobGoal) {
          let factor = 1.0;
          if (this.kRepel > 0) {
            factor = repelCoeff / this.kRepel;
          }
          // Dynamic spring force to separate overlapping blobs / non-member nodes
          const overlapForce = 0.35 * factor * (blobGoal - d);
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
      // Account for the vertex's own radius in the spring's rest length.
      // This gives larger nodes more "slack" (space to repel each other) by pulling
      // based on their surface distance rather than center distance.
      const effRestLength = this.restLength + (vNode.radius || 12);
      const force = this.kAttract * (d - effRestLength);
      const fX = (dx / d) * force;
      const fY = (dy / d) * force;

      fx[idxV] -= fX;
      fy[idxV] -= fY;
      fx[idxH] += fX;
      fy[idxH] += fY;
    });

    // 3. Gravity / Centering force (attraction to component center target)
    // Scale centering forces according to aspect ratio to flatten the layout and expand horizontally.
    const aspectRatio = this.width / this.height;
    const kCenterX = this.kCenter / (aspectRatio > 1 ? aspectRatio * 1.2 : 1);
    const kCenterY = this.kCenter * (aspectRatio > 1 ? aspectRatio * 1.2 : 1);

    for (let i = 0; i < n; i++) {
      const node = this.nodes[i];
      const targetX = node.targetX !== undefined ? node.targetX : centerX;
      const targetY = node.targetY !== undefined ? node.targetY : centerY;
      const dx = targetX - node.x;
      const dy = targetY - node.y;
      
      fx[i] += dx * kCenterX;
      fy[i] += dy * kCenterY;
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
        const w1 = n1.width || (n1.radius ? n1.radius * 2 : 24);
        const h1 = n1.height || (n1.radius ? n1.radius * 2 : 24);

        for (let j = i + 1; j < n; j++) {
          const n2 = this.nodes[j];
          if (n2.isHub) continue;

          const isFixed2 = (n2.id === this.draggedNodeId || (this.fixedNodeIds && this.fixedNodeIds.has(n2.id)));
          if (isFixed1 && isFixed2) continue; // both fixed, can't separate

          const w2 = n2.width || (n2.radius ? n2.radius * 2 : 24);
          const h2 = n2.height || (n2.radius ? n2.radius * 2 : 24);

          // Center difference
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);

          // Required distance along x and y to avoid overlap including margin
          const reqX = (w1 + w2) / 2 + clearanceMargin;
          const reqY = (h1 + h2) / 2 + clearanceMargin;

          if (absDx < reqX && absDy < reqY) {
            // Overlapping on both axes! Push them apart along the axis of minimum penetration.
            const penX = reqX - absDx;
            const penY = reqY - absDy;

            if (penX < penY) {
              const pushX = penX;
              const sign = dx >= 0 ? 1 : -1;
              if (isFixed1) {
                n2.x += pushX * sign;
              } else if (isFixed2) {
                n1.x -= pushX * sign;
              } else {
                n1.x -= pushX * 0.5 * sign;
                n2.x += pushX * 0.5 * sign;
              }
            } else {
              const pushY = penY;
              const sign = dy >= 0 ? 1 : -1;
              if (isFixed1) {
                n2.y += pushY * sign;
              } else if (isFixed2) {
                n1.y -= pushY * sign;
              } else {
                n1.y -= pushY * 0.5 * sign;
                n2.y += pushY * 0.5 * sign;
              }
            }
          }
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
        const w = 140;
        const h = 100;
        node.shape = 'rect';
        node.width = w;
        node.height = h;
        node.halfWidth = w / 2;
        node.halfHeight = h / 2;
        node.radius = 80;
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
    const centerX = w / 2;
    const centerY = h / 2;
    this.nodes.forEach(node => {
      node.targetX = centerX;
      node.targetY = centerY;
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
