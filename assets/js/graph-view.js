/**
 * GraphView - A high-performance, D3.js-powered graph visualizer.
 * Displays posts as nodes connected by weighted edges representing shared tags.
 */
class GraphView {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) {
      throw new Error('GraphView: Container element not found.');
    }

    // Default configuration options
    this.options = {
      width: 800,
      height: 600,
      canvasBg: 'white',
      canvasBgCustom: '#ffffff',
      layoutType: 'spring-embedding',
      vertexSize: 0.15,
      vertexOutlineWidth: 1.5,
      plotTheme: 'name-labeled',
      nodeFillType: 'automatic',
      nodeFillCustom: '#ffffff',
      labelFontFamily: 'sans-serif',
      labelFontSize: 12,
      showSubsetBoundary: false,
      boundaryScale: 1.35,
      blobOpacity: 0.10,
      blobOutlineWidth: 1.5,
      showSubsetEdge: true,
      edgeWidth: 1.8,
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

      // D3 Force settings
      kAttract: 0.04,
      kRepel: -800,
      kCenter: 0.04,
      damping: 0.85,
      maxSpeed: 8,
      restLength: 120,
      ...options
    };

    // State variables
    this.vertices = [];
    this.hyperedges = [];
    this.selectedVertexIds = new Set();
    this.pinnedNodeIds = new Set();

    this.nodes = [];
    this.links = [];
    this.nodeMap = new Map();

    // Viewport transform (zoom/pan)
    this.pan = { x: 0, y: 0 };
    this.zoom = 1.0;

    // Unique prefix to avoid element clashes
    this.uuid = 'gv-' + Math.random().toString(36).substring(2, 9);

    // Callbacks
    this.onSelectionChanged = null;
    this.onNodeDragged = null;
    this.onViewportChanged = null;
    this.onDataChanged = null;

    this._initDom();
    this._initSimulation();
    this._initZoom();
  }

  /**
   * Helper to resolve small/xs responsive thumbnail paths.
   */
  getSmallThumbnail(thumbPath) {
    if (!thumbPath || thumbPath.endsWith('.gif') || thumbPath.startsWith('http') || thumbPath.startsWith('https')) {
      return thumbPath;
    }
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
   * Helper to generate rainbow palette colors.
   */
  getPaletteColor(index, total, palette = 'rainbow') {
    if (total <= 0) return '#6d6e6f';
    const hue = (index / total) * 360;
    return `hsl(${hue}, 70%, 50%)`;
  }

  /**
   * Initializes the SVG canvas and container groups.
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
    this.svg.classList.add('graph-svg');
    this.svg.style.userSelect = 'none';
    this.svg.style.overflow = 'hidden';
    this.svg.style.display = 'block';

    // Defs block
    let defs = this.svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      this.svg.appendChild(defs);
    }
    this.defs = defs;

    // Inject stylesheet and filter
    this._injectStylesAndFilters();

    // Background Grid
    const gridRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    gridRect.setAttribute('id', `${this.uuid}-grid-rect`);
    gridRect.setAttribute('width', '100%');
    gridRect.setAttribute('height', '100%');
    gridRect.setAttribute('fill', `url(#${this.uuid}-grid-pattern)`);
    gridRect.style.display = this.options.showGrid ? 'inline' : 'none';
    this.svg.appendChild(gridRect);
    this.gridRect = gridRect;

    // Main Zoom Transform Layer
    const zoomLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    zoomLayer.setAttribute('id', `${this.uuid}-zoom-transform-layer`);
    this.svg.appendChild(zoomLayer);
    this.zoomLayer = zoomLayer;

    // Rendering layers
    this.edgesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.zoomLayer.appendChild(this.edgesLayer);

    this.verticesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.zoomLayer.appendChild(this.verticesLayer);

    this._updateBackground();
  }

  /**
   * Injects visual styling and shadow effects.
   */
  _injectStylesAndFilters() {
    // 1. Grid Pattern
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', `${this.uuid}-grid-pattern`);
    pattern.setAttribute('width', '40');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');

    const gridPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    gridPath.setAttribute('d', 'M 40 0 L 0 0 0 40');
    gridPath.setAttribute('fill', 'none');
    gridPath.setAttribute('stroke', this.options.gridColor);
    gridPath.setAttribute('stroke-width', '1');
    gridPath.setAttribute('stroke-opacity', String(this.options.gridOpacity));
    pattern.appendChild(gridPath);
    this.defs.appendChild(pattern);
    this.gridPatternPath = gridPath;

    // 2. Shadows Filter
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', `${this.uuid}-shadow`);
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    shadow.setAttribute('dx', '0');
    shadow.setAttribute('dy', '3');
    shadow.setAttribute('stdDeviation', '4');
    shadow.setAttribute('flood-opacity', '0.12');
    shadow.setAttribute('flood-color', '#000000');
    filter.appendChild(shadow);
    this.defs.appendChild(filter);

    // 3. Stylesheet
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      .vertex {
        cursor: grab;
      }
      .vertex:active {
        cursor: grabbing;
      }
      .vertex circle.bg-circle {
        fill: #ffffff;
        stroke: #e2e8f0;
        stroke-width: 1.5px;
        transition: stroke 0.2s, stroke-width 0.2s;
      }
      .vertex.is-pinned circle.bg-circle {
        stroke-dasharray: 4, 2;
        stroke-width: 2px;
        stroke: #3b82f6;
      }
      .vertex.is-selected circle.bg-circle {
        stroke: #3b82f6;
        stroke-width: 3px;
      }
      .vertex:hover circle.bg-circle {
        stroke: #3b82f6;
        stroke-width: 2px;
      }
      .vertex .card-overlay {
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .vertex:hover .card-overlay {
        opacity: 1;
      }
      .vertex .card-title-group {
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .vertex:hover .card-title-group {
        opacity: 1;
      }
      /* Hover interaction dimming */
      .graph-svg.has-focus .vertex:not(.is-focused),
      .graph-svg.has-focus line:not(.is-focused) {
        opacity: 0.12 !important;
      }
      .graph-svg.has-focus line.is-focused {
        opacity: 0.90 !important;
        stroke-width: 4.5px !important;
      }
    `;
    this.defs.appendChild(style);
  }

  /**
   * Initializes D3 force simulation configurations.
   */
  _initSimulation() {
    let chargeStrength = this.options.kRepel || -800;
    if (chargeStrength > 0) chargeStrength = -chargeStrength;

    this.simulation = d3.forceSimulation()
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('link', d3.forceLink().id(d => d.id).distance(120).strength(l => l.weight * 0.18))
      .force('collide', d3.forceCollide().radius(d => d.radius + 15).iterations(2))
      .force('center', d3.forceCenter(this.options.width / 2, this.options.height / 2))
      .on('tick', () => this._ticked());

    // Custom clustering target force for connected components
    this.simulation.force('componentCenter', (alpha) => {
      const w = this.svg.clientWidth || this.options.width;
      const h = this.svg.clientHeight || this.options.height;
      this.nodes.forEach(node => {
        const tx = node.targetX !== undefined ? node.targetX : w / 2;
        const ty = node.targetY !== undefined ? node.targetY : h / 2;
        node.vx += (tx - node.x) * this.options.kCenter * alpha;
        node.vy += (ty - node.y) * this.options.kCenter * alpha;
      });
    });
  }

  /**
   * Initializes D3 zoom behavior.
   */
  _initZoom() {
    this.zoomBehavior = d3.zoom()
      .scaleExtent([0.15, 6.0])
      .on('zoom', (e) => {
        d3.select(this.zoomLayer).attr('transform', e.transform);
        this.zoom = e.transform.k;
        this.pan = { x: e.transform.x, y: e.transform.y };
        if (this.onViewportChanged) {
          this.onViewportChanged(this.zoom);
        }
      });

    if (this.options.allowZoom || this.options.allowPan) {
      d3.select(this.svg).call(this.zoomBehavior)
        .on('dblclick.zoom', null); // disable double click zoom to preserve node pinning
    }
  }

  /**
   * Translates screen coords to canvas coords.
   */
  getCanvasCoords(event) {
    const rect = this.svg.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.pan.x) / this.zoom;
    const y = (event.clientY - rect.top - this.pan.y) / this.zoom;
    return { x, y };
  }

  /**
   * D3 simulation tick handler.
   */
  _ticked() {
    const w = this.svg.clientWidth || this.options.width;
    const h = this.svg.clientHeight || this.options.height;
    const pad = 60;

    this.nodes.forEach(n => {
      if (n.x < pad) { n.x = pad; n.vx = 0; }
      if (n.x > w - pad) { n.x = w - pad; n.vx = 0; }
      if (n.y < pad) { n.y = pad; n.vy = 0; }
      if (n.y > h - pad) { n.y = h - pad; n.vy = 0; }
    });

    this.draw();
  }

  /**
   * Redraw elements based on node positions.
   */
  draw() {
    // 1. Draw Links
    const linkSel = d3.select(this.edgesLayer).selectAll('line')
      .data(this.links, d => `${d.source.id}-${d.target.id}`);

    linkSel.exit().remove();

    const linkEnter = linkSel.enter().append('line')
      .attr('stroke', d => {
        if (d.sharedTags && d.sharedTags.length > 0) {
          const t = this.hyperedges.find(e => e.id === d.sharedTags[0]);
          if (t && t.color) return t.color;
        }
        return '#cbd5e1';
      })
      .attr('stroke-width', d => this.options.edgeWidth * Math.sqrt(d.weight))
      .attr('opacity', d => Math.min(0.75, 0.16 + 0.16 * d.weight))
      .attr('data-source', d => d.source.id)
      .attr('data-target', d => d.target.id)
      .attr('data-tags', d => d.sharedTags.join(','));

    const mergedLinks = linkEnter.merge(linkSel);
    mergedLinks
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    // 2. Draw Post Card Nodes
    const nodeSel = d3.select(this.verticesLayer).selectAll('.vertex')
      .data(this.nodes, d => d.id);

    nodeSel.exit().remove();

    const nodeEnter = nodeSel.enter().append('g')
      .attr('class', 'vertex')
      .attr('data-id', d => d.id)
      .call(d3.drag()
        .on('start', (e, d) => this._dragStarted(e, d))
        .on('drag', (e, d) => this._dragged(e, d))
        .on('end', (e, d) => this._dragEnded(e, d))
      );

    // Setup clip-path for each node
    nodeEnter.each((d, i, nodes) => {
      const el = d3.select(nodes[i]);
      const clipId = `clip-${this.uuid}-${d.id}`;
      
      // Append clip path to defs
      d3.select(this.defs).append('clipPath')
        .attr('id', clipId)
        .append('circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d.radius);

      // Outer outline/shadow
      el.append('circle')
        .attr('class', 'bg-circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d.radius)
        .attr('filter', `url(#${this.uuid}-shadow)`);

      // Card image
      if (d.thumbnail) {
        const xsThumb = this.getSmallThumbnail(d.thumbnail);
        el.append('image')
          .attr('href', xsThumb)
          .attr('x', -d.radius)
          .attr('y', -d.radius)
          .attr('width', d.radius * 2)
          .attr('height', d.radius * 2)
          .attr('clip-path', `url(#${clipId})`)
          .attr('preserveAspectRatio', 'xMidYMid slice')
          .on('error', function() {
            d3.select(this).attr('href', d.thumbnail);
          });
      } else {
        // Colored circle fallback
        el.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', d.radius)
          .attr('fill', d.tagColor || '#6d6e6f');
      }

      // Card dark overlay
      el.append('circle')
        .attr('class', 'card-overlay')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d.radius)
        .attr('fill', 'rgba(16, 16, 17, 0.85)');

      // Card hover titles
      const textGroup = el.append('g').attr('class', 'card-title-group');
      const lines = this._wrapText(d.label, 14);
      const fontSize = 10.5;
      const lineHeight = fontSize * 1.25;
      const startY = -((lines.length - 1) * lineHeight) / 2;

      lines.forEach((lineText, idx) => {
        textGroup.append('tspan')
          .attr('x', 0)
          .attr('dy', idx === 0 ? startY + 3 : lineHeight)
          .attr('text-anchor', 'middle')
          .attr('font-family', '-apple-system, BlinkMacSystemFont, "Outfit", sans-serif')
          .attr('font-size', `${fontSize}px`)
          .attr('font-weight', '600')
          .attr('fill', '#ffffff')
          .text(lineText);
      });

      // Always visible text fallback for no-thumbnail cards
      if (!d.thumbnail) {
        const staticTextGroup = el.append('g')
          .attr('class', 'static-title-group')
          .style('pointer-events', 'none');

        const staticLines = this._wrapText(d.label, 13);
        const staticFontSize = 10;
        const staticLineHeight = staticFontSize * 1.25;
        const staticStartY = -((staticLines.length - 1) * staticLineHeight) / 2;

        staticLines.forEach((lineText, idx) => {
          staticTextGroup.append('tspan')
            .attr('x', 0)
            .attr('dy', idx === 0 ? staticStartY + 3 : staticLineHeight)
            .attr('text-anchor', 'middle')
            .attr('font-family', '-apple-system, BlinkMacSystemFont, "Outfit", sans-serif')
            .attr('font-size', `${staticFontSize}px`)
            .attr('font-weight', '700')
            .attr('fill', '#ffffff')
            .text(lineText);
        });
      }

      // Bind node interactions
      el.on('mouseenter', () => this._nodeMouseEnter(d.id))
        .on('mouseleave', () => this._nodeMouseLeave())
        .on('click', (e) => {
          if (this.onSelectionChanged) {
            this.onSelectionChanged(d.id);
          }
        });
    });

    const mergedNodes = nodeEnter.merge(nodeSel);
    mergedNodes
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .classed('is-pinned', d => this.pinnedNodeIds.has(d.id))
      .classed('is-selected', d => this.selectedVertexIds.has(d.id));
  }

  _dragStarted(e, d) {
    if (!e.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    if (this.onNodeDragged) {
      this.onNodeDragged(d.id, 'start');
    }
  }

  _dragged(e, d) {
    d.fx = e.x;
    d.fy = e.y;
    if (this.onNodeDragged) {
      this.onNodeDragged(d.id, 'drag', { x: e.x, y: e.y });
    }
  }

  _dragEnded(e, d) {
    if (!e.active) this.simulation.alphaTarget(0);
    const wasPinned = this.pinnedNodeIds.has(d.id);
    if (this.options.pinOnDrag || wasPinned) {
      d.fx = d.x;
      d.fy = d.y;
      this.pinnedNodeIds.add(d.id);
    } else {
      d.fx = null;
      d.fy = null;
    }
    if (this.onNodeDragged) {
      this.onNodeDragged(d.id, 'end');
    }
  }

  _nodeMouseEnter(vId) {
    d3.select(this.svg).classed('has-focus', true);
    
    const postEl = d3.select(this.verticesLayer).selectAll('.vertex');
    postEl.classed('is-focused', d => d.id === vId);

    // Find direct neighbors
    const connectedNodeIds = new Set([vId]);
    this.links.forEach(link => {
      if (link.source.id === vId) {
        connectedNodeIds.add(link.target.id);
      } else if (link.target.id === vId) {
        connectedNodeIds.add(link.source.id);
      }
    });

    postEl.classed('is-focused', d => connectedNodeIds.has(d.id));

    d3.select(this.edgesLayer).selectAll('line')
      .classed('is-focused', d => d.source.id === vId || d.target.id === vId);
  }

  _nodeMouseLeave() {
    d3.select(this.svg).classed('has-focus', false);
    d3.select(this.verticesLayer).selectAll('.vertex').classed('is-focused', false);
    d3.select(this.edgesLayer).selectAll('line').classed('is-focused', false);
  }

  /**
   * Public API to highlight a tag from the sidebar list.
   */
  highlightTag(tagSlug) {
    d3.select(this.svg).classed('has-focus', true);

    // Highlight all member nodes
    d3.select(this.verticesLayer).selectAll('.vertex')
      .classed('is-focused', d => d.tags.includes(tagSlug));

    // Highlight lines sharing this tag
    d3.select(this.edgesLayer).selectAll('line')
      .classed('is-focused', d => d.sharedTags && d.sharedTags.includes(tagSlug));
  }

  /**
   * Public API to clear the tag highlight.
   */
  clearHighlight() {
    d3.select(this.svg).classed('has-focus', false);
    d3.select(this.verticesLayer).selectAll('.vertex').classed('is-focused', false);
    d3.select(this.edgesLayer).selectAll('line').classed('is-focused', false);
  }

  /**
   * Updates graph data and positions.
   */
  setData(data) {
    this.vertices = data.vertices || [];
    this.hyperedges = data.hyperedges || [];
    this.needVertexRebuild = true;

    const svgRect = this.svg.getBoundingClientRect();
    const actualWidth = svgRect.width || this.options.width;
    const actualHeight = svgRect.height || this.options.height;
    
    // 1. Maintain coordinate preservation for existing nodes
    const oldNodeMap = new Map(this.nodes.map(n => [n.id, n]));
    this.nodes = [];
    this.nodeMap.clear();

    const isDesktop = actualWidth > 768;
    const radius = isDesktop ? 60 : 40;

    // Build nodes list
    this.vertices.forEach(v => {
      const oldNode = oldNodeMap.get(v.id);
      const angle = Math.random() * 2 * Math.PI;
      const rOffset = 50 + Math.random() * 50;

      const node = {
        id: v.id,
        label: v.label || String(v.id),
        thumbnail: v.thumbnail || '',
        isPlayground: v.isPlayground || false,
        url: v.url || '',
        tagColor: v.tagColor || '#6d6e6f',
        radius: radius,
        x: oldNode ? oldNode.x : actualWidth / 2 + Math.cos(angle) * rOffset,
        y: oldNode ? oldNode.y : actualHeight / 2 + Math.sin(angle) * rOffset,
        vx: oldNode ? oldNode.vx : 0,
        vy: oldNode ? oldNode.vy : 0,
        fx: oldNode ? oldNode.fx : (this.pinnedNodeIds.has(v.id) ? (oldNode ? oldNode.x : actualWidth / 2) : null),
        fy: oldNode ? oldNode.fy : (this.pinnedNodeIds.has(v.id) ? (oldNode ? oldNode.y : actualHeight / 2) : null)
      };

      // Map active tags
      const activeTags = [];
      this.hyperedges.forEach(e => {
        if (e.vertices.includes(v.id)) {
          activeTags.push(e.id);
        }
      });
      node.tags = activeTags;

      this.nodes.push(node);
      this.nodeMap.set(v.id, node);
    });

    // 2. Generate edges based on co-occurrence
    this.links = [];
    const numNodes = this.nodes.length;
    for (let i = 0; i < numNodes; i++) {
      const nodeA = this.nodes[i];
      for (let j = i + 1; j < numNodes; j++) {
        const nodeB = this.nodes[j];
        const sharedTags = nodeA.tags.filter(t => nodeB.tags.includes(t));
        if (sharedTags.length > 0) {
          this.links.push({
            source: nodeA,
            target: nodeB,
            weight: sharedTags.length,
            sharedTags: sharedTags
          });
        }
      }
    }

    // 3. Compute Connected Components & target centers to keep separate components clustered
    const components = [];
    const visited = new Set();
    const adj = new Map(this.nodes.map(n => [n.id, new Set()]));
    
    this.links.forEach(link => {
      adj.get(link.source.id).add(link.target.id);
      adj.get(link.target.id).add(link.source.id);
    });

    this.nodes.forEach(n => {
      if (visited.has(n.id)) return;

      const compNodes = [];
      const queue = [n.id];
      visited.add(n.id);

      while (queue.length > 0) {
        const curr = queue.shift();
        compNodes.push(curr);

        const neighbors = adj.get(curr) || [];
        neighbors.forEach(nbr => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            queue.push(nbr);
          }
        });
      }
      components.push(compNodes);
    });

    components.sort((a, b) => b.length - a.length);

    const numComponents = components.length;
    components.forEach((comp, idx) => {
      let tx = actualWidth / 2;
      let ty = actualHeight / 2;

      if (numComponents > 1 && idx > 0) {
        const angle = ((idx - 1) / (numComponents - 1)) * 2 * Math.PI;
        const R_orbit = 220 + Math.sqrt(comp.length) * 45;
        tx = actualWidth / 2 + R_orbit * Math.cos(angle);
        ty = actualHeight / 2 + R_orbit * Math.sin(angle);
      }

      comp.forEach(vId => {
        const node = this.nodeMap.get(vId);
        if (node) {
          node.targetX = tx;
          node.targetY = ty;
        }
      });
    });

    // 4. Settle physics
    this.simulation.nodes(this.nodes);
    this.simulation.force('link').links(this.links);
    
    // Sync pre-ticks on load
    const isFirstLoad = this.pan.x === 0 && this.pan.y === 0;
    this.simulation.alpha(1);
    
    if (isFirstLoad) {
      for (let i = 0; i < 90; i++) {
        this.simulation.tick();
      }
      this._ticked();
      this.zoomToFit();
    } else {
      this.simulation.restart();
    }

    if (this.onDataChanged) {
      this.onDataChanged();
    }
  }

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

    if (this.simulation) {
      let chargeStrength = this.options.kRepel || -800;
      if (chargeStrength > 0) chargeStrength = -chargeStrength;
      this.simulation.force('charge').strength(chargeStrength);
      this.simulation.force('link').distance(120).strength(l => l.weight * 0.18);
      this.simulation.alpha(0.3).restart();
    }
  }

  _updateBackground() {
    if (this.options.canvasBg === 'white') {
      this.svg.style.backgroundColor = '#ffffff';
    } else if (this.options.canvasBg === 'light-grey') {
      this.svg.style.backgroundColor = '#f8f9fa';
    } else if (this.options.canvasBg === 'dark-slate') {
      this.svg.style.backgroundColor = '#0f172a';
    } else if (this.options.canvasBg === 'custom') {
      this.svg.style.backgroundColor = this.options.canvasBgCustom || '#ffffff';
    } else {
      this.svg.style.backgroundColor = 'transparent';
    }
  }

  startSimulation() {
    if (this.simulation) {
      this.simulation.restart();
    }
  }

  stopSimulation() {
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  adjustZoom(factor, clientX = null, clientY = null) {
    const oldZoom = this.zoom;
    const nextZoom = Math.max(0.15, Math.min(6.0, this.zoom * factor));

    if (clientX !== null && clientY !== null) {
      const rect = this.svg.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      const localX = (mx - this.pan.x) / oldZoom;
      const localY = (my - this.pan.y) / oldZoom;

      const tx = mx - localX * nextZoom;
      const ty = my - localY * nextZoom;

      d3.select(this.svg).call(this.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(nextZoom));
    } else {
      d3.select(this.svg).call(this.zoomBehavior.scaleTo, nextZoom);
    }
  }

  zoomTo(targetZoom) {
    const nextZoom = Math.max(0.15, Math.min(6.0, targetZoom));
    const width = this.svg.clientWidth || this.options.width;
    const height = this.svg.clientHeight || this.options.height;
    
    const cx = width / 2;
    const cy = height / 2;

    const tx = cx - (cx - this.pan.x) / this.zoom * nextZoom;
    const ty = cy - (cy - this.pan.y) / this.zoom * nextZoom;

    d3.select(this.svg).transition().duration(250)
      .call(this.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(nextZoom));
  }

  zoomToFit() {
    if (this.nodes.length === 0) return;

    const width = this.svg.clientWidth || this.options.width;
    const height = this.svg.clientHeight || this.options.height;

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    this.nodes.forEach(node => {
      const r = node.radius || 40;
      minX = Math.min(minX, node.x - r);
      maxX = Math.max(maxX, node.x + r);
      minY = Math.min(minY, node.y - r);
      maxY = Math.max(maxY, node.y + r);
    });

    const graphW = maxX - minX;
    const graphH = maxY - minY;

    if (graphW <= 0 || graphH <= 0) return;

    const padding = 50;
    const scale = Math.max(0.15, Math.min(2.0, Math.min((width - padding * 2) / graphW, (height - padding * 2) / graphH)));
    
    const tx = width / 2 - (minX + graphW / 2) * scale;
    const ty = height / 2 - (minY + graphH / 2) * scale;

    d3.select(this.svg).transition().duration(400)
      .call(this.zoomBehavior.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  _wrapText(text, maxChars = 16) {
    if (!text) return [];
    const words = text.split(/\s+/);
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= maxChars) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  getSVGString() {
    const clonedSvg = this.svg.cloneNode(true);
    const grid = clonedSvg.querySelector(`#${this.uuid}-grid-rect`);
    if (grid) grid.remove();

    clonedSvg.querySelectorAll('.vertex circle').forEach(el => {
      el.removeAttribute('stroke-dasharray');
    });

    const rect = this.svg.getBoundingClientRect();
    clonedSvg.setAttribute('width', rect.width || '800');
    clonedSvg.setAttribute('height', rect.height || '600');
    clonedSvg.setAttribute('viewBox', `0 0 ${rect.width || 800} ${rect.height || 600}`);
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    let bgFill = '#ffffff';
    if (this.options.canvasBg === 'light-grey') bgFill = '#f8f9fa';
    else if (this.options.canvasBg === 'dark-slate') bgFill = '#0f172a';
    else if (this.options.canvasBg === 'custom') bgFill = this.options.canvasBgCustom || '#ffffff';

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', '100%');
    bgRect.setAttribute('height', '100%');
    bgRect.setAttribute('fill', bgFill);
    clonedSvg.insertBefore(bgRect, clonedSvg.firstChild);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(clonedSvg);
  }

  destroy() {
    this.stopSimulation();
    if (this.container && this.svg && this.svg.parentNode === this.container) {
      if (this.svg !== this.container) {
        this.container.removeChild(this.svg);
      }
    }
  }
}

// Expose GraphView globally on the window object
window.GraphView = GraphView;
