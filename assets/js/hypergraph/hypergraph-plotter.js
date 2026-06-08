import { Vec, getBlobPath } from './geom.js?v=1.0.21';
import { BipartiteForceLayout, circularLayout, gridLayout } from './layout.js?v=1.0.21';

function getNodeHullPoints(node) {
  if (node.isHub) {
    return [{ x: node.x, y: node.y }];
  }
  if (node.shape === 'rect') {
    const x = node.x;
    const y = node.y;
    const hw = node.halfWidth || 10;
    const hh = node.halfHeight || 10;
    return [
      { x: x - hw, y: y - hh },
      { x: x - hw, y: y + hh },
      { x: x + hw, y: y - hh },
      { x: x + hw, y: y + hh }
    ];
  }
  if (node.shape === 'capsule') {
    const x = node.x;
    const y = node.y;
    const hw = node.halfWidth || 10;
    const hh = node.halfHeight || 10;
    if (hw > hh) {
      // Horizontal pill: return left and right end centers of the capsule
      const offset = hw - hh;
      return [
        { x: x - offset, y: y },
        { x: x + offset, y: y }
      ];
    } else if (hh > hw) {
      // Vertical pill: return top and bottom end centers of the capsule
      const offset = hh - hw;
      return [
        { x: x, y: y - offset },
        { x: x, y: y + offset }
      ];
    }
  }
  // Circle / default
  return [{ x: node.x, y: node.y }];
}

/**
 * HypergraphPlotter - A standalone JavaScript library to visualize and lay out mathematical hypergraphs.
 */
export class HypergraphPlotter {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      throw new Error('HypergraphPlotter: Container element not found.');
    }

    // Default Configuration Options
    this.options = {
      width: 800,
      height: 600,
      canvasBg: 'transparent',
      canvasBgCustom: '#ffffff',
      layoutType: 'spring-embedding',
      vertexSize: 0.15,
      vertexOutlineWidth: 1.5,
      plotTheme: 'name-labeled',
      nodeFillType: 'automatic',
      nodeFillCustom: '#ffffff',
      labelFontFamily: 'sans-serif',
      labelFontSize: 12,
      showSubsetBoundary: true,
      boundaryScale: 2.0,
      blobOpacity: 0.18,
      blobOutlineWidth: 1.5,
      showSubsetEdge: true,
      edgeWidth: 2.0,
      edgePalette: 'rainbow',
      edgeColorCustom: '#3b82f6',
      showHubs: false,
      showGrid: false,
      gridColor: '#000000',
      gridOpacity: 0.04,
      physicsPlaying: true,
      pinOnDrag: false,
      allowPan: true,
      allowZoom: true,
      initialZoom: null,

      // Force-directed layout physics parameters
      kAttract: 0.2,
      kRepel: 10000,
      kHyperedgeRepel: 10000,
      kCenter: 0.004,
      restLength: 0,
      componentSpacing: 90,
      damping: 0.88,
      maxSpeed: 10,
      ...options
    };

    // State Variables
    this.vertices = [];
    this.hyperedges = [];
    this.selectedVertexIds = new Set();
    this.pinnedNodeIds = new Set();

    // Viewport transform (zoom/pan)
    this.pan = { x: 0, y: 0 };
    this.zoom = 1.0;

    // Interaction dragging state
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.draggedNodeId = null;
    this.hasDragged = false;
    this.isAutoSettling = true;
    this.needVertexRebuild = true;

    // Unique ID suffix to prevent collision of SVG definitions across multiple instances
    this.uuid = 'hgp-' + Math.random().toString(36).substring(2, 9);

    // Callback Hooks
    this.onSelectionChanged = null;
    this.onNodeDragged = null;
    this.onViewportChanged = null;
    this.onDataChanged = null;

    // Animation frames tracker
    this.animationFrameId = null;

    // Initialize Layout and DOM
    this._initDom();
    this._initPhysics();
    this._initEvents();
    
    // Auto-start simulation loops
    this.startSimulation();
  }

  /**
   * Constructs the SVG canvas and component drawing layers dynamically.
   */
  _initDom() {
    let svg;
    if (this.container.tagName && this.container.tagName.toLowerCase() === 'svg') {
      svg = this.container;
    } else {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      this.container.appendChild(svg);
    }
    this.svg = svg;

    this.svg.style.userSelect = 'none';
    this.svg.style.overflow = 'hidden';
    this.svg.style.display = 'block';

    // Create defs block if not present
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svg.appendChild(defs);
    }
    this.defs = defs;

    // Create unique background grid pattern definition
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', `${this.uuid}-grid-pattern`);
    pattern.setAttribute('width', '40');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('id', `${this.uuid}-grid-pattern-path`);
    path.setAttribute('d', 'M 40 0 L 0 0 0 40');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', this.options.gridColor);
    path.setAttribute('stroke-width', '1');
    path.setAttribute('stroke-opacity', String(this.options.gridOpacity));

    pattern.appendChild(path);
    this.defs.appendChild(pattern);
    this.gridPatternPath = path;

    // Create background grid rect
    const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridRect.setAttribute('id', `${this.uuid}-grid-rect`);
    gridRect.setAttribute('width', '100%');
    gridRect.setAttribute('height', '100%');
    gridRect.setAttribute('fill', `url(#${this.uuid}-grid-pattern)`);
    gridRect.style.display = this.options.showGrid ? 'inline' : 'none';
    this.svg.appendChild(gridRect);
    this.gridRect = gridRect;

    // Create zoom transform layer container
    const zoomLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoomLayer.setAttribute('id', `${this.uuid}-zoom-transform-layer`);
    this.svg.appendChild(zoomLayer);
    this.zoomLayer = zoomLayer;

    // Create modular drawing layers
    this.blobsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.blobsLayer.setAttribute('id', `${this.uuid}-blobs-layer`);
    this.zoomLayer.appendChild(this.blobsLayer);

    this.edgesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.edgesLayer.setAttribute('id', `${this.uuid}-edges-layer`);
    this.zoomLayer.appendChild(this.edgesLayer);

    this.hubsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.hubsLayer.setAttribute('id', `${this.uuid}-hubs-layer`);
    this.zoomLayer.appendChild(this.hubsLayer);

    this.verticesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.verticesLayer.setAttribute('id', `${this.uuid}-vertices-layer`);
    this.zoomLayer.appendChild(this.verticesLayer);

    this.labelsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.labelsLayer.setAttribute('id', `${this.uuid}-labels-layer`);
    this.zoomLayer.appendChild(this.labelsLayer);

    this._updateBackground();
  }

  /**
   * Initializes the force-directed physics engine.
   */
  _initPhysics() {
    this.physicsLayout = new BipartiteForceLayout({
      width: this.svg.clientWidth || this.options.width,
      height: this.svg.clientHeight || this.options.height,
      kAttract: this.options.kAttract,
      kRepel: this.options.kRepel,
      kHyperedgeRepel: this.options.kHyperedgeRepel,
      kCenter: this.options.kCenter,
      restLength: this.options.restLength,
      componentSpacing: this.options.componentSpacing,
      damping: this.options.damping,
      maxSpeed: this.options.maxSpeed
    });
    this.physicsLayout.fixedNodeIds = this.pinnedNodeIds;
  }

  /**
   * Binds layout-level SVG mouse and zoom event listeners.
   */
  _initEvents() {
    this.svg.addEventListener('mousedown', (e) => {
      const target = e.target;
      const vertexGroup = target.closest('.vertex');
      if (vertexGroup) {
        const vId = vertexGroup.getAttribute('data-id');
        this.draggedNodeId = vId;
        this.physicsLayout.draggedNodeId = vId;
        if (this.onNodeDragged) {
          this.onNodeDragged(vId, 'start');
        }
        return;
      }

      const hubElement = target.closest('.hub');
      if (hubElement) {
        const hubId = hubElement.getAttribute('data-hub-id');
        this.draggedNodeId = hubId;
        this.physicsLayout.draggedNodeId = hubId;
        if (this.onNodeDragged) {
          this.onNodeDragged(hubId, 'start');
        }
        return;
      }

      if (this.options.allowPan) {
        this.isPanning = true;
        this.panStart = {
          x: e.clientX - this.pan.x,
          y: e.clientY - this.pan.y
        };
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.draggedNodeId) {
        this.hasDragged = true;
        const coords = this.getCanvasCoords(e);
        const node = this.physicsLayout.nodeMap.get(this.draggedNodeId);
        if (node) {
          node.x = coords.x;
          node.y = coords.y;
          node.vx = 0;
          node.vy = 0;

          if (!this.options.physicsPlaying || this.options.layoutType !== 'spring-embedding') {
            this.draw();
          }
          if (this.onNodeDragged) {
            this.onNodeDragged(this.draggedNodeId, 'drag', coords);
          }
        }
      } else if (this.isPanning && this.options.allowPan) {
        this.pan.x = e.clientX - this.panStart.x;
        this.pan.y = e.clientY - this.panStart.y;
        this.applyTransform();
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.draggedNodeId) {
        if (this.hasDragged && this.options.pinOnDrag) {
          this.pinnedNodeIds.add(this.draggedNodeId);
          this.draw();
        } else if (!this.hasDragged) {
          // Node was clicked, not dragged. Release it if it is currently locked.
          if (this.pinnedNodeIds.has(this.draggedNodeId)) {
            this.pinnedNodeIds.delete(this.draggedNodeId);
            this.draw();
          }
          if (!String(this.draggedNodeId).startsWith('_hub_') && this.onSelectionChanged) {
            this.onSelectionChanged(this.draggedNodeId);
          }
        }
        if (this.onNodeDragged) {
          this.onNodeDragged(this.draggedNodeId, 'end');
        }
      }
      this.isPanning = false;
      this.draggedNodeId = null;
      this.hasDragged = false;
      if (this.physicsLayout) {
        this.physicsLayout.draggedNodeId = null;
      }
    });

    this.svg.addEventListener('wheel', (e) => {
      if (!this.options.allowZoom) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.92;
      this.adjustZoom(factor, e.clientX, e.clientY);
    }, { passive: false });

    this.svg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      const target = e.target;
      const vertexGroup = target.closest('.vertex');
      if (vertexGroup) {
        const vId = vertexGroup.getAttribute('data-id');
        if (this.pinnedNodeIds.has(vId)) {
          this.pinnedNodeIds.delete(vId);
        } else {
          this.pinnedNodeIds.add(vId);
        }
        this.draw();
        return;
      }

      const hubElement = target.closest('.hub');
      if (hubElement) {
        const hubId = hubElement.getAttribute('data-hub-id');
        if (this.pinnedNodeIds.has(hubId)) {
          this.pinnedNodeIds.delete(hubId);
        } else {
          this.pinnedNodeIds.add(hubId);
        }
        this.draw();
        return;
      }
    });

    window.addEventListener('resize', () => {
      const svgRect = this.svg.getBoundingClientRect();
      const actualWidth = svgRect.width || this.options.width;
      const actualHeight = svgRect.height || this.options.height;
      if (this.physicsLayout) {
        this.physicsLayout.updateCenter(actualWidth, actualHeight);
      }
      this.zoomToFit();
    });
  }

  /**
   * Generates a path to the small copy (-xs.png) version of a thumbnail if it exists.
   */
  getSmallThumbnail(thumbPath) {
    if (!thumbPath) return '';
    if (thumbPath.endsWith('.gif')) return thumbPath;
    const lastSlash = thumbPath.lastIndexOf('/');
    if (lastSlash === -1) return thumbPath;
    const dir = thumbPath.substring(0, lastSlash + 1);
    const filename = thumbPath.substring(lastSlash + 1);
    const dotIdx = filename.lastIndexOf('.');
    if (dotIdx === -1) return thumbPath;
    const base = filename.substring(0, dotIdx);
    const ext = filename.substring(dotIdx);
    return `${dir}responsive/${base}-xs${ext}`;
  }

  /**
   * Main render function representing the state on the SVG canvas layers.
   */
  draw() {
    // Clear layers
    this.blobsLayer.innerHTML = '';
    this.edgesLayer.innerHTML = '';
    this.hubsLayer.innerHTML = '';
    
    if (this.needVertexRebuild) {
      this.verticesLayer.innerHTML = '';
      this.needVertexRebuild = false;
    }
    
    this.labelsLayer.innerHTML = '';

    const vertexRadius = this.getVertexRadius();
    const palette = this.options.edgePalette;
    const theme = this.options.plotTheme;

    // Resolve theme-specific background contrasts
    const isDarkCanvas = this.options.canvasBg === 'dark-slate' || 
                         (this.options.canvasBg === 'custom' && this.isDarkColor(this.options.canvasBgCustom));
    const labelColor = isDarkCanvas ? '#f8f9fa' : '#212529';
    const nodeStrokeColor = isDarkCanvas ? '#e9ecef' : '#212529';
    const nodeFillColor = this.options.nodeFillType === 'custom' ? this.options.nodeFillCustom : (isDarkCanvas ? '#2c3036' : '#ffffff');

    // Font mapping
    let fontFamilyStr = '"Outfit", sans-serif';
    if (this.options.labelFontFamily === 'serif') {
      fontFamilyStr = '"Times New Roman", Times, "Century Schoolbook", serif';
    } else if (this.options.labelFontFamily === 'monospace') {
      fontFamilyStr = '"JetBrains Mono", Consolas, Monaco, monospace';
    }

    // 1. Draw Subset Boundaries (Blobs)
    if (this.options.showSubsetBoundary) {
      this.hyperedges.forEach((edge, idx) => {
        const coords = [];
        edge.vertices.forEach(vId => {
          const simNode = this.physicsLayout.nodeMap.get(vId);
          if (simNode) {
            coords.push(...getNodeHullPoints(simNode));
          }
        });

        if (coords.length === 0) return;

        const hubNode = this.physicsLayout.nodeMap.get(`_hub_${edge.id}`);
        if (hubNode) {
          coords.push({ x: hubNode.x, y: hubNode.y });
        }

        const blobRadius = vertexRadius * this.options.boundaryScale;
        const pathData = getBlobPath(coords, blobRadius);

        if (!pathData) return;

        const blobColor = edge.color || this.getPaletteColor(idx, this.hyperedges.length, palette);

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('fill', blobColor);
        path.setAttribute('stroke', blobColor);
        path.setAttribute('fill-opacity', String(this.options.blobOpacity));
        path.setAttribute('stroke-opacity', this.options.blobOutlineWidth > 0 ? '0.7' : '0');
        path.setAttribute('stroke-width', `${this.options.blobOutlineWidth}px`);
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('data-id', edge.id);
        this.blobsLayer.appendChild(path);
      });
    }

    // 2. Draw Subset Edges (Hub curves or concentric circles for single node edges)
    if (this.options.showSubsetEdge) {
      this.hyperedges.forEach((edge, idx) => {
        if (edge.vertices.length < 1) return;

        const edgeColor = edge.color || this.getPaletteColor(idx, this.hyperedges.length, palette);

        if (edge.vertices.length === 1) {
          // Render concentric line circle for single-node edge ONLY if boundary blobs are disabled.
          // If boundary blobs are enabled, the blob itself already encloses the node cleanly,
          // so rendering both would create an redundant double-ring (bullseye) target.
          if (!this.options.showSubsetBoundary) {
            const vNode = this.physicsLayout.nodeMap.get(edge.vertices[0]);
            if (!vNode) return;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', String(vNode.x));
            circle.setAttribute('cy', String(vNode.y));
            circle.setAttribute('r', String(vertexRadius * 1.5));
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', edgeColor);
            circle.setAttribute('stroke-width', `${this.options.edgeWidth}px`);
            circle.setAttribute('opacity', '0.85');
            this.edgesLayer.appendChild(circle);
          }
        } else {
          const hubNode = this.physicsLayout.nodeMap.get(`_hub_${edge.id}`);
          if (!hubNode) return;
          const v0 = this.physicsLayout.nodeMap.get(edge.vertices[0]);
          if (!v0) return;

          for (let i = 1; i < edge.vertices.length; i++) {
            const vi = this.physicsLayout.nodeMap.get(edge.vertices[i]);
            if (!vi) continue;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = `M ${v0.x} ${v0.y} Q ${hubNode.x} ${hubNode.y} ${vi.x} ${vi.y}`;
            path.setAttribute('d', pathData);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', edgeColor);
            path.setAttribute('stroke-width', `${this.options.edgeWidth}px`);
            path.setAttribute('opacity', '0.85');
            this.edgesLayer.appendChild(path);
          }
        }
      });
    }

    // 3. Draw Hub Centers
    if (this.options.showHubs) {
      this.hyperedges.forEach((edge, idx) => {
        const hubNode = this.physicsLayout.nodeMap.get(`_hub_${edge.id}`);
        if (!hubNode) return;

        const edgeColor = edge.color || this.getPaletteColor(idx, this.hyperedges.length, palette);
        const isHubPinned = this.pinnedNodeIds.has(hubNode.id);

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('class', 'hub');
        circle.setAttribute('cx', String(hubNode.x));
        circle.setAttribute('cy', String(hubNode.y));
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', edgeColor);
        circle.setAttribute('stroke', isHubPinned ? 'var(--primary, #3b82f6)' : '#ffffff');
        circle.setAttribute('stroke-width', isHubPinned ? '1.5px' : '1px');
        if (isHubPinned) {
          circle.setAttribute('stroke-dasharray', '2,1');
        }
        circle.setAttribute('fill-opacity', '0.5');
        circle.setAttribute('data-hub-id', hubNode.id);
        circle.style.cursor = 'pointer';
        this.hubsLayer.appendChild(circle);
      });
    }

    // 4. Draw Vertices (Circles or Capsules)
    this.vertices.forEach(v => {
      const simNode = this.physicsLayout.nodeMap.get(v.id);
      if (!simNode) return;

      const isSelected = this.selectedVertexIds.has(v.id);
      const isPinned = this.pinnedNodeIds.has(v.id);

      // Cache and reuse vertex group elements to prevent layout repaints and image reloads
      let g = this.verticesLayer.querySelector(`.vertex[data-id="${v.id}"]`);
      if (!g) {
        g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'vertex');
        g.setAttribute('data-id', v.id);

        const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        titleEl.textContent = v.label || String(v.id);
        g.appendChild(titleEl);

        let shapeEl = null;
        if (theme === 'name-labeled' && simNode.shape === 'rect') {
          const w = simNode.width;
          const h = simNode.height;
          
          const fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
          fo.setAttribute('x', String(simNode.x - w / 2));
          fo.setAttribute('y', String(simNode.y - h / 2));
          fo.setAttribute('width', String(w));
          fo.setAttribute('height', String(h));
          
          const tagColor = v.tagColor || ((v.edgeIdx !== undefined && v.edgeIdx !== -1)
            ? this.getPaletteColor(v.edgeIdx, this.hyperedges.length, palette)
            : '#6D6E6F');

          const cardContainer = document.createElement('div');
          cardContainer.className = `c-card c-graph-card default ${isSelected ? 'is-selected' : ''}`;
          cardContainer.style.cssText = `
            width: 100%;
            height: 100%;
            border: ${isSelected ? '2px solid var(--primary, #3b82f6)' : '1px solid #e2e8f0'};
            box-sizing: border-box;
            display: block;
            position: relative;
          `;
          
          if (v.thumbnail) {
            const xsThumb = this.getSmallThumbnail(v.thumbnail);
            cardContainer.innerHTML = `
              <img class="c-graph-card__image" src="${xsThumb}" onerror="this.onerror=null; this.src='${v.thumbnail}';" alt="" draggable="false">
              <div class="c-graph-card__overlay">
                <h2 class="c-graph-card__title">${v.label}</h2>
              </div>
            `;
          } else {
            cardContainer.innerHTML = `
              <div class="c-graph-card__no-thumb" style="background-color: ${tagColor};">
                <h2 class="c-graph-card__title">${v.label}</h2>
              </div>
            `;
          }
          
          cardContainer.addEventListener('dragstart', (e) => {
            e.preventDefault();
          });

          fo.appendChild(cardContainer);
          g.appendChild(fo);
        } else if (theme === 'name-labeled' && simNode.shape === 'capsule') {
          shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const w = simNode.width;
          const h = simNode.height;
          shapeEl.setAttribute('x', String(simNode.x - w / 2));
          shapeEl.setAttribute('y', String(simNode.y - h / 2));
          shapeEl.setAttribute('width', String(w));
          shapeEl.setAttribute('height', String(h));
          shapeEl.setAttribute('rx', String(h / 2));
          shapeEl.setAttribute('ry', String(h / 2));
          shapeEl.setAttribute('fill', isSelected ? '#e9ecef' : nodeFillColor);
          shapeEl.setAttribute('stroke', isSelected ? 'var(--primary, #3b82f6)' : nodeStrokeColor);
          shapeEl.setAttribute('stroke-width', `${isSelected ? this.options.vertexOutlineWidth + 1.5 : this.options.vertexOutlineWidth}px`);
        } else {
          shapeEl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          shapeEl.setAttribute('cx', String(simNode.x));
          shapeEl.setAttribute('cy', String(simNode.y));
          shapeEl.setAttribute('stroke', isSelected ? 'var(--primary, #3b82f6)' : nodeStrokeColor);
          shapeEl.setAttribute('stroke-width', `${isSelected ? this.options.vertexOutlineWidth + 1.5 : this.options.vertexOutlineWidth}px`);

          let currentRadius = vertexRadius;
          if (theme === 'clean') {
            currentRadius = vertexRadius;
            shapeEl.setAttribute('r', String(currentRadius));
            const cleanFill = this.options.nodeFillType === 'custom' ? nodeFillColor : (isDarkCanvas ? '#adb5bd' : '#495057');
            shapeEl.setAttribute('fill', isSelected ? 'var(--primary, #3b82f6)' : cleanFill);
          } else if (theme === 'detailed') {
            currentRadius = Math.max(4, vertexRadius * 0.4);
            shapeEl.setAttribute('r', String(currentRadius));
            const detailedFill = this.options.nodeFillType === 'custom' ? nodeFillColor : (isDarkCanvas ? '#e9ecef' : '#000000');
            shapeEl.setAttribute('fill', isSelected ? 'var(--primary, #3b82f6)' : detailedFill);
          } else {
            // name-labeled circle
            currentRadius = vertexRadius;
            shapeEl.setAttribute('r', String(simNode.radius || currentRadius));
            shapeEl.setAttribute('fill', isSelected ? '#e9ecef' : nodeFillColor);
          }
        }

        if (shapeEl) {
          if (isPinned) {
            shapeEl.setAttribute('stroke-dasharray', '3,2');
          }
          g.appendChild(shapeEl);
        }
        this.verticesLayer.appendChild(g);
      } else {
        // Update coordinates and selection state on existing vertex group element
        if (theme === 'name-labeled' && simNode.shape === 'rect') {
          const w = simNode.width;
          const h = simNode.height;
          const fo = g.querySelector('foreignObject');
          if (fo) {
            fo.setAttribute('x', String(simNode.x - w / 2));
            fo.setAttribute('y', String(simNode.y - h / 2));
            fo.setAttribute('width', String(w));
            fo.setAttribute('height', String(h));
            
            const cardContainer = fo.querySelector('.c-graph-card');
            if (cardContainer) {
              cardContainer.style.border = isSelected ? '2px solid var(--primary, #3b82f6)' : '1px solid #e2e8f0';
              if (isSelected) {
                cardContainer.classList.add('is-selected');
              } else {
                cardContainer.classList.remove('is-selected');
              }
            }
          }
        } else {
          const shapeEl = g.querySelector('rect') || g.querySelector('circle');
          if (shapeEl) {
            if (simNode.shape === 'capsule') {
              const w = simNode.width;
              const h = simNode.height;
              shapeEl.setAttribute('x', String(simNode.x - w / 2));
              shapeEl.setAttribute('y', String(simNode.y - h / 2));
              shapeEl.setAttribute('width', String(w));
              shapeEl.setAttribute('height', String(h));
              shapeEl.setAttribute('rx', String(h / 2));
              shapeEl.setAttribute('ry', String(h / 2));
            } else {
              shapeEl.setAttribute('cx', String(simNode.x));
              shapeEl.setAttribute('cy', String(simNode.y));
              let currentRadius = vertexRadius;
              if (theme === 'clean') {
                currentRadius = vertexRadius;
              } else if (theme === 'detailed') {
                currentRadius = Math.max(4, vertexRadius * 0.4);
              } else {
                currentRadius = simNode.radius || vertexRadius;
              }
              shapeEl.setAttribute('r', String(currentRadius));
            }
            shapeEl.setAttribute('stroke', isSelected ? 'var(--primary, #3b82f6)' : nodeStrokeColor);
            shapeEl.setAttribute('stroke-width', `${isSelected ? this.options.vertexOutlineWidth + 1.5 : this.options.vertexOutlineWidth}px`);
            if (isPinned) {
              shapeEl.setAttribute('stroke-dasharray', '3,2');
            } else {
              shapeEl.removeAttribute('stroke-dasharray');
            }
          }
        }
      }

      // 5. Draw Labels
      if (theme !== 'clean' && simNode.shape !== 'rect') {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('font-family', fontFamilyStr);
        text.setAttribute('font-size', `${this.options.labelFontSize}px`);
        text.setAttribute('fill', labelColor);
        text.setAttribute('font-weight', '500');
        text.setAttribute('pointer-events', 'none');

        if (theme === 'detailed') {
          text.textContent = simNode.label || v.label;
          text.setAttribute('x', String(simNode.x + Math.max(8, vertexRadius * 0.5)));
          text.setAttribute('y', String(simNode.y - Math.max(8, vertexRadius * 0.5)));
          text.setAttribute('text-anchor', 'start');
          this.labelsLayer.appendChild(text);
        } else {
          // name-labeled (Default) - support wrapping & multiple tspans
          const lines = simNode.lines || this.physicsLayout.wrapText(simNode.label || v.label, 16);
          const lineHeight = this.options.labelFontSize * 1.2;
          const startY = simNode.y - ((lines.length - 1) * lineHeight) / 2 + (this.options.labelFontSize * 0.35);

          lines.forEach((lineText, idx) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = lineText;
            tspan.setAttribute('x', String(simNode.x));
            tspan.setAttribute('y', String(startY + idx * lineHeight));
            tspan.setAttribute('text-anchor', 'middle');
            text.appendChild(tspan);
          });
          this.labelsLayer.appendChild(text);
        }
      }
    });
  }

  /**
   * Sets the dataset (vertices & hyperedges) of the visualizer.
   * Runs layout warmup ticks to settle nodes and centers the view by default.
   */
  setData(data) {
    this.isAutoSettling = true;
    this.needVertexRebuild = true;
    const isFirstLoad = this.vertices.length === 0;
    this.vertices = data.vertices || [];
    this.hyperedges = data.hyperedges || [];

    const svgRect = this.svg.getBoundingClientRect();
    const actualWidth = svgRect.width || this.options.width;
    const actualHeight = svgRect.height || this.options.height;
    if (this.physicsLayout) {
      this.physicsLayout.updateCenter(actualWidth, actualHeight);
    }

    this.physicsLayout.setGraph(this.vertices, this.hyperedges, this.options);

    if (this.options.layoutType === 'spring-embedding') {
      // Warm up the simulation so it is mostly settled before framing/rendering
      const ticks = isFirstLoad ? 250 : 100;
      for (let i = 0; i < ticks; i++) {
        this.physicsLayout.tick();
      }
    } else {
      this._applyStaticLayout();
    }

    if (isFirstLoad && this.options.initialZoom != null) {
      this.zoom  = this.options.initialZoom;
      this.pan.x = actualWidth / 2 - (this.physicsLayout.width  / 2) * this.zoom;
      this.pan.y = actualHeight / 2 - (this.physicsLayout.height / 2) * this.zoom;
      this.applyTransform();
    } else {
      // Fit to viewport. On first load, we apply a 1.0x zoom to fit all nodes cleanly.
      const zoomMultiplier = isFirstLoad ? 1.0 : 1.0;
      this.zoomToFit(null, zoomMultiplier);
    }

    if (this.onDataChanged) {
      this.onDataChanged();
    }
    this.draw();
  }

  /**
   * Adjusts the configurations and styling of the visualizer.
   */
  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
    this.needVertexRebuild = true;

    if (this.gridRect) {
      this.gridRect.style.display = this.options.showGrid ? 'inline' : 'none';
    }
    if (this.gridPatternPath) {
      this.gridPatternPath.setAttribute('stroke', this.options.gridColor);
      this.gridPatternPath.setAttribute('stroke-opacity', String(this.options.gridOpacity));
    }
    this._updateBackground();

    if (this.physicsLayout) {
      this.physicsLayout.kAttract = this.options.kAttract;
      this.physicsLayout.kRepel = this.options.kRepel;
      this.physicsLayout.kHyperedgeRepel = this.options.kHyperedgeRepel;
      this.physicsLayout.kCenter = this.options.kCenter;
      this.physicsLayout.restLength = this.options.restLength;
      this.physicsLayout.componentSpacing = this.options.componentSpacing;
      this.physicsLayout.damping = this.options.damping;
      this.physicsLayout.maxSpeed = this.options.maxSpeed;

      this.physicsLayout.updateNodeDimensions(this.options);

      // Update target centers immediately if spacing parameter changes
      if (options.componentSpacing !== undefined && this.vertices.length > 0) {
        this.physicsLayout.setGraph(this.vertices, this.hyperedges, this.options);
      }
    }

    if (this.options.layoutType !== 'spring-embedding') {
      this._applyStaticLayout();
    }

    this.draw();
  }

  /**
   * Computes static coordinates when force simulation is turned off.
   */
  _applyStaticLayout() {
    const w = this.svg.clientWidth || this.options.width;
    const h = this.svg.clientHeight || this.options.height;

    let posMap = null;
    if (this.options.layoutType === 'radial-embedding') {
      posMap = circularLayout(this.vertices, this.hyperedges, w, h);
    } else if (this.options.layoutType === 'grid-layout') {
      posMap = gridLayout(this.vertices, this.hyperedges, w, h);
    }

    if (posMap) {
      this.physicsLayout.nodes.forEach(node => {
        const pos = posMap.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
          node.vx = 0;
          node.vy = 0;
        }
      });
    }
  }

  /**
   * Triggers background updates on the canvas container style.
   */
  _updateBackground() {
    if (this.options.canvasBg === 'white') {
      this.svg.style.backgroundColor = '#ffffff';
    } else if (this.options.canvasBg === 'light-grey') {
      this.svg.style.backgroundColor = '#f8f9fa';
    } else if (this.options.canvasBg === 'dark-slate') {
      this.svg.style.backgroundColor = '#1a1e24';
    } else if (this.options.canvasBg === 'custom') {
      this.svg.style.backgroundColor = this.options.canvasBgCustom || '#ffffff';
    } else {
      this.svg.style.backgroundColor = 'transparent';
    }
  }

  /**
   * Starts the animation frame loop for the physics simulation.
   */
  startSimulation() {
    if (this.animationFrameId) return;

    const tickLoop = () => {
      if (this.options.physicsPlaying && this.options.layoutType === 'spring-embedding') {
        const isDragging = this.draggedNodeId !== null;
        const isWarm = this.physicsLayout.temperature >= 0.005;
        if (isWarm || isDragging) {
          if (this.isAutoSettling && !isDragging) {
            this.container.classList.add('is-simulating');
          } else {
            this.container.classList.remove('is-simulating');
          }
          this.physicsLayout.tick();
          this.draw();
        } else {
          this.isAutoSettling = false;
          this.container.classList.remove('is-simulating');
        }
      } else {
        this.isAutoSettling = false;
        this.container.classList.remove('is-simulating');
      }
      this.animationFrameId = requestAnimationFrame(tickLoop);
    };

    this.animationFrameId = requestAnimationFrame(tickLoop);
  }

  /**
   * Cancels the animation frame loop.
   */
  stopSimulation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.container.classList.remove('is-simulating');
  }

  /**
   * Translates screen offset coordinates into the SVG scale space.
   */
  getCanvasCoords(event) {
    const rect = this.svg.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.pan.x) / this.zoom;
    const y = (event.clientY - rect.top - this.pan.y) / this.zoom;
    return { x, y };
  }

  /**
   * Scales the view frame based on a zoom multiplier.
   */
  adjustZoom(factor, clientX = null, clientY = null) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, Math.min(10.0, this.zoom * factor));

    if (clientX !== null && clientY !== null) {
      const rect = this.svg.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      const localX = (mx - this.pan.x) / oldZoom;
      const localY = (my - this.pan.y) / oldZoom;

      this.pan.x = mx - localX * this.zoom;
      this.pan.y = my - localY * this.zoom;
    }

    this.applyTransform();
  }

  /**
   * Set zoom level relative to center of the canvas viewport
   */
  zoomTo(targetZoom) {
    const oldZoom = this.zoom;
    this.zoom = Math.max(0.1, Math.min(10.0, targetZoom));

    const svgRect = this.svg.getBoundingClientRect();
    const cx = svgRect.width / 2;
    const cy = svgRect.height / 2;

    const localX = (cx - this.pan.x) / oldZoom;
    const localY = (cy - this.pan.y) / oldZoom;

    this.pan.x = cx - localX * this.zoom;
    this.pan.y = cy - localY * this.zoom;

    this.applyTransform();
  }

  /**
   * Applies current zoom/pan values onto the DOM layers.
   */
  applyTransform() {
    this.zoomLayer.setAttribute('transform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.zoom})`);
    if (this.onViewportChanged) {
      this.onViewportChanged(this.zoom);
    }
  }

  /**
   * Recompute vertex sizing based on properties.
   */
  getVertexRadius() {
    return 12 * (this.options.vertexSize / 0.15);
  }

  /**
   * Centers the centroid of layout nodes in the middle of the container.
   */
  recenter() {
    if (this.vertices.length === 0) return;

    const svgRect = this.svg.getBoundingClientRect();
    const width = svgRect.width || this.options.width;
    const height = svgRect.height || this.options.height;

    const layoutNodes = this.physicsLayout.nodes;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    layoutNodes.forEach(node => {
      if (node.isHub && !this.options.showSubsetEdge && !this.options.showSubsetBoundary) return;
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y);
    });

    const graphW = maxX - minX;
    const graphH = maxY - minY;

    if (graphW <= 0 || graphH <= 0) return;

    const graphCenterX = minX + graphW / 2;
    const graphCenterY = minY + graphH / 2;

    this.pan.x = width / 2 - graphCenterX * this.zoom;
    this.pan.y = height / 2 - graphCenterY * this.zoom;

    this.applyTransform();
    this.draw();
  }

  /**
   * Scales the view scale and centers the viewport to frame all layout nodes.
   */
  zoomToFit(padding = null, zoomMultiplier = 1.0) {
    if (this.vertices.length === 0) return;

    const svgRect = this.svg.getBoundingClientRect();
    const width = svgRect.width || this.options.width;
    const height = svgRect.height || this.options.height;

    if (this.physicsLayout) {
      this.physicsLayout.updateCenter(width, height);
    }

    const layoutNodes = this.physicsLayout.nodes;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    layoutNodes.forEach(node => {
      if (node.isHub && !this.options.showSubsetEdge && !this.options.showSubsetBoundary) return;
      const hw = node.halfWidth || 0;
      const hh = node.halfHeight || 0;
      minX = Math.min(minX, node.x - hw);
      maxX = Math.max(maxX, node.x + hw);
      minY = Math.min(minY, node.y - hh);
      maxY = Math.max(maxY, node.y + hh);
    });

    const graphW = maxX - minX;
    const graphH = maxY - minY;

    if (graphW <= 0 || graphH <= 0) return;

    // Default to a clean, responsive padding to fit the viewport nicely
    const finalPadding = padding !== null ? padding : Math.max(40, Math.min(width * 0.12, height * 0.12));
    const scaleX = (width - finalPadding * 2) / graphW;
    const scaleY = (height - finalPadding * 2) / graphH;
    let targetZoom = Math.max(0.1, Math.min(2.5, Math.min(scaleX, scaleY)));

    // Apply zoom multiplier (e.g. to start more zoomed in)
    targetZoom = Math.min(2.5, targetZoom * zoomMultiplier);

    const graphCenterX = minX + graphW / 2;
    const graphCenterY = minY + graphH / 2;

    this.zoom = targetZoom;
    this.pan.x = width / 2 - graphCenterX * targetZoom;
    this.pan.y = height / 2 - graphCenterY * targetZoom;

    this.applyTransform();
  }

  /**
   * Generates a self-contained, standalone presentation SVG vector string.
   */
  getSVGString() {
    const clonedSvg = this.svg.cloneNode(true);

    // 1. Remove editor helper elements
    const grid = clonedSvg.querySelector(`#${this.uuid}-grid-rect`);
    if (grid) grid.remove();

    const hubs = clonedSvg.querySelector(`#${this.uuid}-hubs-layer`);
    if (hubs) hubs.remove();

    // Remove dash array highlights for nodes
    clonedSvg.querySelectorAll('.vertex circle, .vertex rect').forEach(el => {
      el.removeAttribute('stroke-dasharray');
    });

    // 2. Align namespaces and bounds
    const rect = this.svg.getBoundingClientRect();
    clonedSvg.setAttribute('width', rect.width || '800');
    clonedSvg.setAttribute('height', rect.height || '600');
    clonedSvg.setAttribute('viewBox', `0 0 ${rect.width || 800} ${rect.height || 600}`);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    // 3. Set visual background if solid
    let bgFill = 'none';
    if (this.options.canvasBg === 'white') bgFill = '#ffffff';
    else if (this.options.canvasBg === 'light-grey') bgFill = '#f8f9fa';
    else if (this.options.canvasBg === 'dark-slate') bgFill = '#1a1e24';
    else if (this.options.canvasBg === 'custom') bgFill = this.options.canvasBgCustom || '#ffffff';

    if (bgFill !== 'none') {
      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      bgRect.setAttribute('width', '100%');
      bgRect.setAttribute('height', '100%');
      bgRect.setAttribute('fill', bgFill);
      clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(clonedSvg);
  }

  /**
   * Helper to determine luminance of hex strings.
   */
  isDarkColor(hex) {
    if (!hex || hex === 'transparent') return false;
    let color = hex.replace('#', '');
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq < 128;
  }

  /**
   * Color generation logic mapped to preset keys.
   */
  getPaletteColor(index, total, palette) {
    if (total <= 0) return 'hsl(0, 0%, 20%)';
    const ratio = index / Math.max(1, total);

    switch (palette) {
      case 'grayscale': {
        const grayVal = Math.round(ratio * 55);
        return `hsl(0, 0%, ${grayVal}%)`;
      }
      case 'pastel': {
        const hue = (index * 137.5) % 360;
        return `hsl(${hue}, 80%, 55%)`;
      }
      case 'cool-ice': {
        const hue = 180 + ratio * 90;
        return `hsl(${hue}, 85%, 50%)`;
      }
      case 'warm-sunset': {
        const hue = (330 + ratio * 90) % 360;
        return `hsl(${Math.round(hue)}, 90%, 50%)`;
      }
      case 'ocean-breeze': {
        const hue = 160 + ratio * 100;
        return `hsl(${hue}, 85%, 45%)`;
      }
      case 'forest-earth': {
        const hue = 80 + ratio * 60;
        return `hsl(${hue}, 55%, 40%)`;
      }
      case 'neon-glow': {
        const hue = (index * 137.5) % 360;
        return `hsl(${hue}, 100%, 50%)`;
      }
      case 'viridis': {
        const hue = 280 - ratio * 220;
        const lightness = 35 + ratio * 15;
        return `hsl(${hue}, 85%, ${lightness}%)`;
      }
      case 'plasma': {
        const hue = (240 + ratio * 170) % 360;
        const lightness = 40 + ratio * 15;
        return `hsl(${hue}, 85%, ${lightness}%)`;
      }
      case 'cividis': {
        const hue = 225 - ratio * 165;
        const saturation = 60 - Math.sin(ratio * Math.PI) * 45;
        const lightness = 30 + ratio * 35;
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      }
      case 'magma': {
        let h, s, l;
        if (ratio < 0.3) {
          const t = ratio / 0.3;
          h = 260 + t * 40;
          s = 60 + t * 10;
          l = 15 + t * 20;
        } else if (ratio < 0.6) {
          const t = (ratio - 0.3) / 0.3;
          h = 300 + t * 40;
          s = 70 + t * 15;
          l = 35 + t * 15;
        } else if (ratio < 0.9) {
          const t = (ratio - 0.6) / 0.3;
          h = 340 + t * 40;
          s = 85 + t * 10;
          l = 50 + t * 10;
        } else {
          const t = (ratio - 0.9) / 0.1;
          h = 20 + t * 30;
          s = 95 + t * 5;
          l = 60 + t * 15;
        }
        return `hsl(${Math.round(h) % 360}, ${Math.round(s)}%, ${Math.round(l)}%)`;
      }
      case 'inferno': {
        let h, s, l;
        if (ratio < 0.3) {
          const t = ratio / 0.3;
          h = 260 + t * 80;
          s = 70 + t * 15;
          l = 12 + t * 18;
        } else if (ratio < 0.6) {
          const t = (ratio - 0.3) / 0.3;
          h = 340 + t * 35;
          s = 85 + t * 10;
          l = 30 + t * 20;
        } else if (ratio < 0.9) {
          const t = (ratio - 0.6) / 0.3;
          h = 15 + t * 30;
          s = 95 + t * 5;
          l = 50 + t * 15;
        } else {
          const t = (ratio - 0.9) / 0.1;
          h = 45 + t * 15;
          s = 100;
          l = 65 + t * 15;
        }
        return `hsl(${Math.round(h) % 360}, ${Math.round(s)}%, ${Math.round(l)}%)`;
      }
      case 'cyberpunk': {
        const colors = [
          'hsl(320, 100%, 50%)',
          'hsl(180, 100%, 45%)',
          'hsl(280, 100%, 50%)',
          'hsl(45, 100%, 50%)',
          'hsl(210, 100%, 50%)'
        ];
        return colors[index % colors.length];
      }
      case 'aurora': {
        const colors = [
          'hsl(150, 80%, 40%)',
          'hsl(175, 75%, 45%)',
          'hsl(195, 85%, 40%)',
          'hsl(230, 80%, 50%)',
          'hsl(275, 75%, 45%)',
          'hsl(295, 80%, 50%)'
        ];
        return colors[index % colors.length];
      }
      case 'desert-sand': {
        const colors = [
          'hsl(20, 55%, 45%)',
          'hsl(35, 60%, 40%)',
          'hsl(12, 50%, 35%)',
          'hsl(140, 20%, 40%)',
          'hsl(45, 40%, 55%)',
          'hsl(330, 30%, 45%)'
        ];
        return colors[index % colors.length];
      }
      case 'botanical': {
        const colors = [
          'hsl(130, 30%, 35%)',
          'hsl(85, 35%, 40%)',
          'hsl(160, 25%, 42%)',
          'hsl(110, 20%, 45%)',
          'hsl(40, 30%, 50%)',
          'hsl(200, 20%, 45%)'
        ];
        return colors[index % colors.length];
      }
      case 'berry-wine': {
        const colors = [
          'hsl(340, 65%, 35%)',
          'hsl(310, 50%, 30%)',
          'hsl(355, 60%, 45%)',
          'hsl(280, 45%, 40%)',
          'hsl(325, 55%, 45%)',
          'hsl(250, 40%, 40%)'
        ];
        return colors[index % colors.length];
      }
      case 'academic-bold': {
        const colors = [
          'hsl(350, 75%, 45%)',
          'hsl(217, 85%, 45%)',
          'hsl(152, 70%, 35%)',
          'hsl(35, 85%, 40%)',
          'hsl(270, 70%, 45%)',
          'hsl(190, 85%, 35%)'
        ];
        return colors[index % colors.length];
      }
      case 'academic-set1': {
        const colors = [
          'hsl(359, 79%, 50%)',
          'hsl(207, 54%, 47%)',
          'hsl(118, 41%, 49%)',
          'hsl(292, 35%, 47%)',
          'hsl(30, 100%, 50%)',
          'hsl(60, 100%, 40%)',
          'hsl(22, 61%, 40%)',
          'hsl(329, 87%, 74%)',
          'hsl(0, 0%, 60%)'
        ];
        return colors[index % colors.length];
      }
      case 'academic-set2': {
        const colors = [
          'hsl(161, 44%, 58%)',
          'hsl(17, 97%, 69%)',
          'hsl(222, 38%, 67%)',
          'hsl(323, 62%, 72%)',
          'hsl(83, 62%, 59%)',
          'hsl(49, 100%, 59%)',
          'hsl(35, 62%, 74%)',
          'hsl(0, 0%, 70%)'
        ];
        return colors[index % colors.length];
      }
      case 'academic-dark': {
        const colors = [
          'hsl(162, 71%, 36%)',
          'hsl(26, 98%, 43%)',
          'hsl(245, 31%, 57%)',
          'hsl(329, 80%, 53%)',
          'hsl(88, 69%, 38%)',
          'hsl(44, 98%, 45%)',
          'hsl(39, 70%, 38%)',
          'hsl(0, 0%, 40%)'
        ];
        return colors[index % colors.length];
      }
      case 'academic-paired': {
        const colors = [
          'hsl(201, 53%, 77%)',
          'hsl(204, 70%, 41%)',
          'hsl(90, 56%, 71%)',
          'hsl(116, 56%, 40%)',
          'hsl(0, 91%, 79%)',
          'hsl(359, 79%, 50%)',
          'hsl(34, 98%, 71%)',
          'hsl(30, 100%, 50%)',
          'hsl(281, 28%, 77%)',
          'hsl(269, 43%, 42%)',
          'hsl(60, 100%, 80%)',
          'hsl(21, 63%, 42%)'
        ];
        return colors[index % colors.length];
      }
      case 'custom-solid': {
        return this.options.edgeColorCustom || '#3b82f6';
      }
      case 'rainbow':
      default: {
        const hue = ratio * 280;
        return `hsl(${hue}, 85%, 45%)`;
      }
    }
  }

  /**
   * Helper mapping HSL color strings to Hex representation.
   */
  hslToHex(hsl) {
    const matches = hsl.match(/hsl\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\%\s*,\s*(\d+(?:\.\d+)?)\%\s*\)/);
    if (!matches) return '#000000';
    let h = parseFloat(matches[1]);
    let s = parseFloat(matches[2]) / 100;
    let l = parseFloat(matches[3]) / 100;

    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
      r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
      r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
      r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
      r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
      r = c; g = 0; b = x;
    }
    
    let rHex = Math.round((r + m) * 255).toString(16).padStart(2, '0');
    let gHex = Math.round((g + m) * 255).toString(16).padStart(2, '0');
    let bHex = Math.round((b + m) * 255).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  /**
   * Cleans up simulation animation ticks and DOM references.
   */
  destroy() {
    this.stopSimulation();
    if (this.container && this.svg && this.svg.parentNode === this.container) {
      // Only remove if we created the SVG node ourselves
      if (this.svg !== this.container) {
        this.container.removeChild(this.svg);
      }
    }
  }
}
