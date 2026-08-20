console.warn("common.js: Loaded and executing!");
// Global Click Interception & Routing Helpers
const getSiteRelativePath = (resolvedPathname) => {
  let path = resolvedPathname;
  const match = path.match(/[\/\\](phileasdg\.github\.io|newsite)/i);
  if (match) {
    path = path.substring(match.index + match[0].length);
  }
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  return path;
};

const getSiteBasePath = () => {
  const pathname = window.location.pathname;
  const siteRelative = getSiteRelativePath(pathname);
  const base = pathname.substring(0, pathname.length - siteRelative.length);
  return base.endsWith('/') ? base.slice(0, -1) : base;
};

// Dynamic Header Component
class SiteHeader extends HTMLElement {
  connectedCallback() {
    const basePath = getSiteBasePath();
    this.innerHTML = `
      <header class="header" id="js-header">
        <a href="${basePath}/" class="logo">Phileas Dazeley-Gaist</a>
        <nav class="navbar js-navbar">
          <button class="navbar__toggle js-toggle" aria-label="Menu">
            <span class="navbar__toggle-box"><span class="navbar__toggle-inner">Menu</span></span>
          </button>
          <ul class="navbar__menu">
            <li><a href="${basePath}/" target="_self">Home</a></li>
            <li><a href="${basePath}/pages/guest-lectures-and-public-speaking-events/" target="_self">Public Speaking</a></li>
            <li><a href="${basePath}/pages/publications/" target="_self">Publications</a></li>
            <li><a href="${basePath}/pages/playgrounds/" target="_self">Playgrounds</a></li>
            <li><a href="${basePath}/pages/about/" target="_self">About</a></li>
            <li><a href="${basePath}/pages/resume-cv/" target="_self">CV</a></li>
          </ul>
        </nav>
      </header>
    `;
    if (window.updateActiveLinks) {
      window.updateActiveLinks();
    }
  }
}

// Dynamic Footer Component
class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer class="footer">
        <div class="footer__social">
          <a href="https://www.instagram.com/phileasdg/" aria-label="Instagram" class="instagram">
            <svg><use xlink:href="assets/svg/svg-map.svg#instagram"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/phileas/" aria-label="LinkedIn" class="linkedin">
            <svg><use xlink:href="assets/svg/svg-map.svg#linkedin"/></svg>
          </a>
          <a href="https://www.youtube.com/@phileasdg" aria-label="Youtube" class="youtube">
            <svg><use xlink:href="assets/svg/svg-map.svg#youtube"/></svg>
          </a>
        </div>
        <div class="footer__copyright">Phileas Dazeley-Gaist</div>
      </footer>
    `;
  }
}

// Define the custom elements
customElements.define('site-header', SiteHeader);
customElements.define('site-footer', SiteFooter);

// Active Links Handler
window.updateActiveLinks = () => {
  const relativePath = getSiteRelativePath(window.location.pathname);
  const menuItems = document.querySelectorAll('.navbar__menu li, .navbar_mobile_sidebar li, .navbar_mobile_overlay li');
  menuItems.forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const hrefRelative = getSiteRelativePath(new URL(a.href, window.location.href).pathname);
    if (hrefRelative === relativePath) {
      li.classList.add('active');
    } else if (relativePath.startsWith('/pages/') && hrefRelative.startsWith('/pages/')) {
      const pageSlug = relativePath.replace(/^\/pages\//, '').replace(/\/$/, '');
      const menuSlug = hrefRelative.replace(/^\/pages\//, '').replace(/\/$/, '');
      if (menuSlug === 'resume-cv' && (pageSlug === 'resume-english' || pageSlug === 'cv-francais' || pageSlug === 'resume-cv')) {
        li.classList.add('active');
      } else if (pageSlug === menuSlug) {
        li.classList.add('active');
      } else {
        li.classList.remove('active');
      }
    } else {
      li.classList.remove('active');
    }
  });
};
window.addEventListener('popstate', window.updateActiveLinks);

// Legacy getSiteRelativePath helper removed (moved to top of file)

document.addEventListener('click', (event) => {
  const anchor = event.target.closest('a');
  if (!anchor) return;

  const href = anchor.getAttribute('href');
  if (!href) return;

  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return;
  }

  if (anchor.getAttribute('target') === '_blank') {
    return;
  }

  try {
    const url = new URL(anchor.href, window.location.href);
    const isSameOrigin = (url.origin === window.location.origin) || (window.location.protocol === 'file:' && url.protocol === 'file:');
    if (!isSameOrigin) {
      return;
    }

    // Don't intercept media/asset links or links that don't match our routing paths
    const siteRelative = getSiteRelativePath(url.pathname);
    if (siteRelative.includes('/media/') || 
        (!siteRelative.startsWith('/posts/') && 
         !siteRelative.startsWith('/pages/') && 
         !siteRelative.startsWith('/tags/') && 
         !siteRelative.startsWith('/authors/') && 
         siteRelative !== '/' && 
         siteRelative !== '/index.html')) {
      return;
    }

    event.preventDefault();
    history.pushState(null, null, url.href);
    if (window.spaRoute) {
      window.spaRoute();
    }
  } catch (err) {
    console.warn("URL parsing failed for link:", href, err);
  }
});

// SPA Routing and Dynamic Render logic
document.addEventListener("DOMContentLoaded", () => {
  const mainEl = document.querySelector('main');
  if (!mainEl) return;

  // Cache original home shell
  const originalMainHTML = mainEl.innerHTML;
  const originalMainClass = mainEl.className;
  const originalBodyClass = document.body.className;
  const originalTitle = document.title;

  let postsData = null;
  let pagesData = null;
  let playgroundsData = null;
  let currentViewMode = 'grid';
  let plotterInstance = null;
  const disabledClusterIds = new Set();
  let isDefaultClustersInitialized = false;

  const getPostsData = async () => {
    if (!postsData) {
      const basePath = getSiteBasePath();
      const res = await fetch(`${basePath}/data/posts.json?v=${Date.now()}`);
      postsData = await res.json();
    }
    return postsData;
  };

  const getPagesData = async () => {
    if (!pagesData) {
      const basePath = getSiteBasePath();
      const res = await fetch(`${basePath}/data/pages.json?v=${Date.now()}`);
      pagesData = await res.json();
    }
    return pagesData;
  };

  const getPlaygroundsData = async () => {
    if (!playgroundsData) {
      const basePath = getSiteBasePath();
      const res = await fetch(`${basePath}/data/playgrounds.json?v=${Date.now()}`);
      playgroundsData = await res.json();
      playgroundsData.forEach(pg => {
        pg.id = pg.slug || pg.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      });
    }
    return playgroundsData;
  };

  let speakingData = null;
  const getSpeakingData = async () => {
    if (!speakingData) {
      const basePath = getSiteBasePath();
      const res = await fetch(`${basePath}/data/speaking.json?v=${Date.now()}`);
      speakingData = await res.json();
    }
    return speakingData;
  };


  const setupCodeBlocks = (container) => {
    const preElements = container.querySelectorAll('pre');
    preElements.forEach(pre => {
      if (pre.parentNode.classList.contains('code-block-wrapper')) return;

      const code = pre.querySelector('code');
      if (!code) return;

      let lang = 'plaintext';
      const classes = code.className.split(' ');
      classes.forEach(c => {
        if (c.startsWith('language-')) {
          lang = c.replace('language-', '');
        }
      });

      let displayLang = lang.toUpperCase();
      if (lang === 'mathematica') displayLang = 'Wolfram Language';
      else if (lang === 'python') displayLang = 'Python';
      else if (lang === 'javascript') displayLang = 'JavaScript';
      else if (lang === 'html') displayLang = 'HTML';
      else if (lang === 'css') displayLang = 'CSS';
      else if (lang === 'bash' || lang === 'shell') displayLang = 'Shell';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="code-block-lang">${displayLang}</span>
        <button class="code-block-copy-btn" type="button">Copy</button>
      `;

      const copyBtn = header.querySelector('.code-block-copy-btn');
      copyBtn.addEventListener('click', () => {
        const textToCopy = code.dataset.rawCode || code.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('Failed to copy code: ', err);
        });
      });

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });

    if (window.applyWLCustomizations) {
      window.applyWLCustomizations(container);
    }
  };



  const getTagSlug = (tag) => {
    if (tag === "R programming") return "r";
    return tag.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getResponsiveSrcset = (thumbPath, prefix) => {
    if (!thumbPath || thumbPath.endsWith('.gif')) return '';
    const lastSlash = thumbPath.lastIndexOf('/');
    const dir = thumbPath.substring(0, lastSlash + 1);
    const filename = thumbPath.substring(lastSlash + 1);
    const dotIdx = filename.lastIndexOf('.');
    const base = filename.substring(0, dotIdx);
    const ext = filename.substring(dotIdx);
    
    const xs = `${prefix}${dir}responsive/${base}-xs${ext}`;
    const sm = `${prefix}${dir}responsive/${base}-sm${ext}`;
    const md = `${prefix}${dir}responsive/${base}-md${ext}`;
    const lg = `${prefix}${dir}responsive/${base}-lg${ext}`;
    
    return `srcset="${xs} 300w, ${sm} 480w, ${md} 768w, ${lg} 1200w"`;
  };

  const renderCard = (post, prefix = '', showTag = true, showGlyph = false) => {
    const basePath = getSiteBasePath();
    const primaryTag = post.tags && post.tags.length > 0 ? post.tags[0] : null;
    const tagHtml = (showTag && primaryTag) 
      ? `<div class="c-card__tag"><a href="${basePath}/tags/${getTagSlug(primaryTag)}/">${primaryTag}</a></div>`
      : '';

    const postGlyph = showGlyph ? `<span class="c-card__badge-glyph c-card__badge-glyph--post" title="Article" aria-label="Article"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg></span>` : '';
    const playgroundGlyph = showGlyph ? `<span class="c-card__badge-glyph c-card__badge-glyph--playground" title="Playground" aria-label="Playground"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2z"></path><path d="M12 13V8"></path><circle cx="12" cy="5" r="3"></circle></svg></span>` : '';

    let imageHtml = '';
    if (post.thumbnail) {
      if (post.isPlayground) {
        imageHtml = `
          <a href="${post.url}" rel="noopener noreferrer" target="_blank" class="c-card__image">
            <img src="${prefix}${post.thumbnail}" onerror="this.onerror=null;this.src='https://placehold.co/600x380/1a1a1a/ffffff?text=Image+Not+Found';" loading="lazy" alt="">
            ${playgroundGlyph}
          </a>
        `;
      } else {
        const srcsetHtml = getResponsiveSrcset(post.thumbnail, prefix);
        const widthAttr = post.thumbWidth ? `width="${post.thumbWidth}"` : '';
        const heightAttr = post.thumbHeight ? `height="${post.thumbHeight}"` : '';
        imageHtml = `
          <a href="${basePath}/posts/${post.slug}/" class="c-card__image">
            <img src="${prefix}${post.thumbnail}" ${srcsetHtml} ${widthAttr} ${heightAttr} sizes="(min-width: 56.25em) 100vw, (min-width: 37.5em) 50vw, 100vw" loading="lazy" alt="">
            ${postGlyph}
          </a>
        `;
      }
    }

    const titleLink = post.isPlayground
      ? `<a href="${post.url}" rel="noopener noreferrer" target="_blank" class="invert">${post.name}</a>`
      : `<a href="${basePath}/posts/${post.slug}/" class="invert">${post.name}</a>`;

    const metaHtml = `<footer class="c-card__meta"><time datetime="${post.date}">${formatDate(post.date)}</time></footer>`;

    return `
      <article class="c-card default ${post.isPlayground ? 'c-card--playground' : ''}">
        ${imageHtml}
        <div class="c-card__wrapper">
          <header class="c-card__header">
            ${tagHtml}
            <h2 class="c-card__title">
              ${titleLink}
            </h2>
          </header>
          ${metaHtml}
        </div>
      </article>
    `;
  };

  const handleLazyImages = (container) => {
    const lazyImages = container.querySelectorAll('img[loading]');
    lazyImages.forEach(img => {
      if (img.classList.contains('is-loaded')) return;
      if (img.complete) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', function () {
          this.classList.add('is-loaded');
        }, false);
      }
    });
  };

  const resolveRelativePath = (relPath, context) => {
    const contextParts = context.split('/').filter(Boolean);
    const relParts = relPath.split('/');

    while (relParts[0] === '..') {
      relParts.shift();
      contextParts.pop();
    }
    if (relParts[0] === '.') {
      relParts.shift();
    }

    return [...contextParts, ...relParts].join('/');
  };

  const normalizeContentHTML = (htmlContent, originalPathContext) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const basePath = getSiteBasePath();

    const getAbsoluteUrl = (urlStr) => {
      if (!urlStr) return urlStr;
      if (urlStr.startsWith('http') || urlStr.startsWith('/') || urlStr.startsWith('#') || urlStr.startsWith('mailto:') || urlStr.startsWith('tel:') || urlStr.startsWith('javascript:')) {
        return urlStr;
      }
      return basePath + '/' + urlStr;
    };

    const imgs = tempDiv.querySelectorAll('img');
    imgs.forEach(img => {
      let src = img.getAttribute('src');
      if (src) {
        src = src.replace(/^https?:\/\/phileasdg\.github\.io\//, '');
        if (!src.startsWith('http') && !src.startsWith('/') && !src.startsWith('#')) {
          if (!src.startsWith('media/') && !src.startsWith('assets/') && !src.startsWith('data/')) {
            src = resolveRelativePath(src, originalPathContext);
          }
        }
        img.setAttribute('src', getAbsoluteUrl(src));
      }

      let srcset = img.getAttribute('srcset');
      if (srcset) {
        srcset = srcset.replace(/https?:\/\/phileasdg\.github\.io\//g, '');
        const parts = srcset.split(',').map(part => {
          const trimmed = part.trim();
          const firstSpace = trimmed.indexOf(' ');
          if (firstSpace === -1) {
            let url = trimmed;
            if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
              if (!url.startsWith('media/') && !url.startsWith('assets/') && !url.startsWith('data/')) {
                url = resolveRelativePath(url, originalPathContext);
              }
            }
            return getAbsoluteUrl(url);
          }
          let url = trimmed.substring(0, firstSpace);
          const rest = trimmed.substring(firstSpace);
          if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
            if (!url.startsWith('media/') && !url.startsWith('assets/') && !url.startsWith('data/')) {
              url = resolveRelativePath(url, originalPathContext);
            }
          }
          return getAbsoluteUrl(url) + rest;
        });
        img.setAttribute('srcset', parts.join(', '));
      }
    });

    const links = tempDiv.querySelectorAll('a');
    links.forEach(a => {
      let href = a.getAttribute('href');
      if (href) {
        href = href.replace(/^https?:\/\/phileasdg\.github\.io\//, '');
        if (!href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          if (!href.startsWith('media/') && !href.startsWith('assets/') && !href.startsWith('data/')) {
            href = resolveRelativePath(href, originalPathContext);
          }
        }
        a.setAttribute('href', getAbsoluteUrl(href));
      }
    });

    return tempDiv.innerHTML;
  };

  const getTagsDataFromPosts = (posts, playgrounds = []) => {
    const tagsMap = {};
    const processItem = item => {
      if (item.tags) {
        item.tags.forEach(tag => {
          if (!tagsMap[tag]) {
            tagsMap[tag] = { name: tag, count: 0, slug: getTagSlug(tag) };
          }
          tagsMap[tag].count++;
        });
      }
    };
    posts.forEach(processItem);
    playgrounds.forEach(processItem);
    return Object.values(tagsMap).sort((a, b) => a.name.localeCompare(b.name));
  };

  const getTagNetworkData = (posts, playgrounds = []) => {
    const nodesMap = {};
    const edgesMap = {};
    const connectionsMap = {};

    const processItem = item => {
      if (!item.tags || !Array.isArray(item.tags) || item.tags.length === 0) return;
      item.tags.forEach(tag => {
        const slug = getTagSlug(tag);
        if (!nodesMap[slug]) {
          nodesMap[slug] = { id: slug, name: tag, count: 0 };
          connectionsMap[slug] = {};
        }
        nodesMap[slug].count++;
      });

      if (item.tags.length > 1) {
        for (let i = 0; i < item.tags.length; i++) {
          const slugA = getTagSlug(item.tags[i]);
          const nameA = item.tags[i];
          for (let j = i + 1; j < item.tags.length; j++) {
            const slugB = getTagSlug(item.tags[j]);
            const nameB = item.tags[j];
            if (slugA === slugB) continue;

            const edgeKey = [slugA, slugB].sort().join('___');
            if (!edgesMap[edgeKey]) {
              edgesMap[edgeKey] = {
                id: edgeKey,
                source: slugA,
                target: slugB,
                sourceName: nameA,
                targetName: nameB,
                weight: 0
              };
            }
            edgesMap[edgeKey].weight++;

            connectionsMap[slugA][slugB] = (connectionsMap[slugA][slugB] || 0) + 1;
            connectionsMap[slugB][slugA] = (connectionsMap[slugB][slugA] || 0) + 1;
          }
        }
      }
    };

    posts.forEach(processItem);
    playgrounds.forEach(processItem);

    const nodes = Object.values(nodesMap);
    const edges = Object.values(edgesMap);

    return {
      nodes,
      edges,
      connectionsMap,
      getConnectedTags: (slug) => {
        const conns = connectionsMap[slug];
        if (!conns) return [];
        return Object.entries(conns)
          .map(([targetSlug, weight]) => ({
            slug: targetSlug,
            name: nodesMap[targetSlug] ? nodesMap[targetSlug].name : targetSlug,
            count: nodesMap[targetSlug] ? nodesMap[targetSlug].count : 0,
            weight
          }))
          .sort((a, b) => b.weight - a.weight || b.count - a.count);
      }
    };
  };

  const ensureForceGraphLoaded = () => {
    if (window.ForceGraph) return Promise.resolve(window.ForceGraph);
    if (window._forceGraphPromise) return window._forceGraphPromise;
    window._forceGraphPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="force-graph"]');
      if (existing && window.ForceGraph) {
        resolve(window.ForceGraph);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/force-graph@1.43.5/dist/force-graph.min.js';
      script.async = true;
      script.onload = () => resolve(window.ForceGraph);
      script.onerror = () => {
        const fallback = document.createElement('script');
        fallback.src = 'https://cdn.jsdelivr.net/npm/force-graph@1.43.5/dist/force-graph.min.js';
        fallback.onload = () => resolve(window.ForceGraph);
        fallback.onerror = (err) => reject(err);
        document.head.appendChild(fallback);
      };
      document.head.appendChild(script);
    });
    return window._forceGraphPromise;
  };

  const initTagNetworkGraph = async (container, options = {}) => {
    if (!container) return null;
    const {
      posts = [],
      playgrounds = [],
      activeSlug = null,
      onSelectNode = null,
      height = 620
    } = options;

    try {
      await ensureForceGraphLoaded();
    } catch (e) {
      console.error('Failed to load force-graph library:', e);
      container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--gray-2)">Failed to load graph visualizer.</div>';
      return null;
    }

    const data = getTagNetworkData(posts, playgrounds);
    const graphNodes = data.nodes.map(n => ({
      id: n.id,
      name: n.name,
      count: n.count
    }));

    const graphLinks = data.edges.map(e => ({
      source: e.source,
      target: e.target,
      weight: e.weight
    }));

    // Leave existing inspector if present, only mount canvas
    let graphMount = container.querySelector('.c-tag-graph-canvas-mount');
    if (!graphMount) {
      graphMount = document.createElement('div');
      graphMount.className = 'c-tag-graph-canvas-mount';
      graphMount.style.position = 'absolute';
      graphMount.style.inset = '0';
      graphMount.style.width = '100%';
      graphMount.style.height = '100%';
      container.prepend(graphMount);
    }

    // Floating Camera Controls
    let controls = container.querySelector('.c-tag-graph-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'c-tag-graph-controls';
      controls.innerHTML = `
        <button type="button" class="c-tag-graph-btn-ctrl" id="js-tg-zoom-in" title="Zoom In">+</button>
        <button type="button" class="c-tag-graph-btn-ctrl" id="js-tg-zoom-out" title="Zoom Out">&minus;</button>
        <button type="button" class="c-tag-graph-btn-ctrl" id="js-tg-reset" title="Fit to Screen">&#x21bb;</button>
      `;
      container.appendChild(controls);
    }

    const width = container.clientWidth || 800;
    const heightPx = container.clientHeight || height || 600;

    const highlightNodes = new Set();
    const highlightLinks = new Set();
    let hoveredNode = null;
    let selectedNode = activeSlug ? graphNodes.find(n => n.id === activeSlug) : null;
    let searchFilter = '';

    const updateHighlights = (targetNode) => {
      highlightNodes.clear();
      highlightLinks.clear();
      if (targetNode) {
        highlightNodes.add(targetNode.id);
        const conns = data.connectionsMap[targetNode.id] || {};
        Object.keys(conns).forEach(neighborId => highlightNodes.add(neighborId));
        graphLinks.forEach(link => {
          const s = typeof link.source === 'object' ? link.source.id : link.source;
          const t = typeof link.target === 'object' ? link.target.id : link.target;
          if (s === targetNode.id || t === targetNode.id) {
            highlightLinks.add(link);
          }
        });
      }
    };

    if (selectedNode) updateHighlights(selectedNode);

    const isDarkMode = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-theme');

    const graph = window.ForceGraph()(graphMount)
      .width(width)
      .height(heightPx)
      .graphData({ nodes: graphNodes, links: graphLinks })
      .backgroundColor('transparent')
      .nodeId('id')
      .nodeRelSize(6)
      .linkWidth(link => {
        const isHighlighted = highlightLinks.has(link);
        if (searchFilter) {
          const sNode = typeof link.source === 'object' ? link.source : graphNodes.find(n => n.id === link.source);
          const tNode = typeof link.target === 'object' ? link.target : graphNodes.find(n => n.id === link.target);
          const sMatches = sNode && sNode.name.toLowerCase().includes(searchFilter);
          const tMatches = tNode && tNode.name.toLowerCase().includes(searchFilter);
          return (sMatches || tMatches) ? Math.min(2 + link.weight * 0.8, 6) : 0.4;
        }
        if (hoveredNode || selectedNode) {
          return isHighlighted ? Math.min(2.5 + link.weight * 0.9, 7) : 0.6;
        }
        return Math.min(1 + link.weight * 0.7, 5);
      })
      .linkColor(link => {
        const isHighlighted = highlightLinks.has(link);
        if (searchFilter) {
          const sNode = typeof link.source === 'object' ? link.source : graphNodes.find(n => n.id === link.source);
          const tNode = typeof link.target === 'object' ? link.target : graphNodes.find(n => n.id === link.target);
          const sMatches = sNode && sNode.name.toLowerCase().includes(searchFilter);
          const tMatches = tNode && tNode.name.toLowerCase().includes(searchFilter);
          return (sMatches || tMatches) ? '#007AA5' : (isDarkMode ? 'rgba(148, 163, 184, 0.05)' : 'rgba(100, 116, 139, 0.05)');
        }
        if (hoveredNode || selectedNode) {
          return isHighlighted ? '#007AA5' : (isDarkMode ? 'rgba(148, 163, 184, 0.08)' : 'rgba(100, 116, 139, 0.08)');
        }
        return isDarkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(100, 116, 139, 0.35)';
      })
      .nodeCanvasObject((node, ctx, globalScale) => {
        const isSelected = selectedNode && selectedNode.id === node.id;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isConnected = highlightNodes.has(node.id);
        const matchesSearch = searchFilter && node.name.toLowerCase().includes(searchFilter);
        const isDimmed = searchFilter ? !matchesSearch : ((hoveredNode || selectedNode) && !isConnected && !isHovered && !isSelected);

        const radius = Math.max(10, Math.min(24, 8 + Math.sqrt(node.count) * 4.5));
        node.__radius = radius;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.15 : 1;

        // Outer glow ring
        if (isSelected || isHovered || matchesSearch) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + (matchesSearch ? 6 : (isSelected ? 6 : 4)), 0, 2 * Math.PI, false);
          ctx.fillStyle = (isSelected || matchesSearch) ? 'rgba(0, 122, 165, 0.35)' : 'rgba(56, 189, 248, 0.25)';
          ctx.fill();
        }

        // Main node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
        if (isSelected || matchesSearch) {
          ctx.fillStyle = '#007AA5';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        } else if (isHovered) {
          ctx.fillStyle = '#0284c7';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if ((hoveredNode || selectedNode) && isConnected) {
          ctx.fillStyle = isDarkMode ? '#1e3a5f' : '#e0f2fe';
          ctx.fill();
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.fillStyle = isDarkMode ? '#1e293b' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = isDarkMode ? '#475569' : '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // Count number inside node
        ctx.font = `bold ${Math.max(9, Math.min(12, radius * 0.75))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = (isSelected || isHovered || matchesSearch) ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b');
        ctx.fillText(node.count, node.x, node.y);

        // Label under node
        const fontSize = Math.max(10, Math.min(14, 11 + radius * 0.12));
        ctx.font = `${isSelected || isHovered || matchesSearch ? 'bold ' : '600 '}${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = (isSelected || isHovered || matchesSearch) ? '#007AA5' : (isDarkMode ? '#f8fafc' : '#0f172a');
        ctx.fillText(node.name, node.x, node.y + radius + 4);

        ctx.restore();
      })
      .nodePointerAreaPaint((node, color, ctx) => {
        const radius = node.__radius || 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 6, 0, 2 * Math.PI, false);
        ctx.fill();
      })
      .onNodeHover(node => {
        hoveredNode = node || null;
        if (hoveredNode) {
          updateHighlights(hoveredNode);
        } else if (selectedNode) {
          updateHighlights(selectedNode);
        } else {
          highlightNodes.clear();
          highlightLinks.clear();
        }
        graphMount.style.cursor = node ? 'pointer' : 'grab';
      })
      .onNodeClick(node => {
        if (!node || !node.id) return;
        const basePath = getSiteBasePath();
        navigateTo(`${basePath}/tags/${node.id}/`);
      });

    if (graph.d3Force('charge')) graph.d3Force('charge').strength(-240);
    if (graph.d3Force('link')) graph.d3Force('link').distance(link => Math.max(60, 150 - link.weight * 14));

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          graph.width(w).height(h);
        }
      }
    });
    resizeObserver.observe(container);

    controls.querySelector('#js-tg-zoom-in').addEventListener('click', () => {
      graph.zoom(graph.zoom() * 1.3, 300);
    });
    controls.querySelector('#js-tg-zoom-out').addEventListener('click', () => {
      graph.zoom(graph.zoom() * 0.75, 300);
    });
    controls.querySelector('#js-tg-reset').addEventListener('click', () => {
      graph.zoomToFit(400, 30);
    });

    setTimeout(() => {
      graph.zoomToFit(400, 30);
    }, 600);

    return {
      destroy: () => {
        resizeObserver.disconnect();
        if (graph._destructor) graph._destructor();
      },
      setSearch: (query) => {
        searchFilter = query ? query.trim().toLowerCase() : '';
        // Force canvas redraw
        graph.nodeRelSize(6);
        if (searchFilter) {
          const matches = graphNodes.filter(n => n.name.toLowerCase().includes(searchFilter));
          if (matches.length === 1 && matches[0].x !== undefined) {
            graph.centerAt(matches[0].x, matches[0].y, 300);
          }
        }
      },
      focusNode: (slug) => {
        if (!slug) {
          selectedNode = null;
          highlightNodes.clear();
          highlightLinks.clear();
          graph.zoomToFit(400, 30);
          return;
        }
        const target = graphNodes.find(n => n.id === slug);
        if (target) {
          selectedNode = target;
          updateHighlights(selectedNode);
          setTimeout(() => {
            if (target.x !== undefined) {
              graph.centerAt(target.x, target.y, 400);
              graph.zoom(1.6, 400);
            }
          }, 300);
        }
      }
    };
  };

  const initGridMasonry = (grid) => {
    if (!grid) return;
    if (window.msnry) {
      try {
        window.msnry.destroy();
      } catch (e) {
        console.warn("Error destroying Masonry:", e);
      }
      window.msnry = null;
    }
    if (typeof Masonry !== 'undefined') {
      window.msnry = new Masonry(grid, {
        itemSelector: '.c-card',
        columnWidth: '.c-card',
        gutter: '.gutter-sizer',
        percentPosition: true
      });

      if (typeof imagesLoaded !== 'undefined') {
        imagesLoaded(grid).on('progress', () => {
          if (window.msnry) window.msnry.layout();
        });
      }
    }
  };

  const setupPagination = (posts, container, grid, prefix = '', showTag = true, showGlyph = false) => {
    if (!container) return;
    container.innerHTML = '';
    
    let currentIndex = Math.min(posts.length, 12);
    if (posts.length > currentIndex) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.id = 'js-load-more';
      btn.textContent = 'Load More';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        const nextChunk = posts.slice(currentIndex, currentIndex + 12);
        currentIndex += nextChunk.length;

        const chunkDiv = document.createElement('div');
        chunkDiv.innerHTML = nextChunk.map(p => renderCard(p, prefix, showTag, showGlyph)).join('');
        const newItems = Array.from(chunkDiv.children);
        newItems.forEach(item => grid.appendChild(item));
        handleLazyImages(grid);

        if (window.msnry) {
          window.msnry.appended(newItems);
        }

        if (typeof imagesLoaded !== 'undefined') {
          imagesLoaded(grid).on('progress', () => {
            if (window.msnry) window.msnry.layout();
          });
        }

        if (currentIndex >= posts.length) {
          btn.remove();
        }
      });
      container.appendChild(btn);
    }
  };

  const ensureLightboxElement = () => {
    let dialog = document.getElementById('lightbox-dialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'lightbox-dialog';
      dialog.className = 'lightbox';
      dialog.setAttribute('aria-label', 'Image gallery');
      dialog.innerHTML = `
        <div class="lightbox__container">
          <button id="lightbox-close" class="lightbox__close" aria-label="Close gallery">&times;</button>
          <div id="lightbox-counter" style="position: absolute; top: 1.5rem; left: 1.5rem; color: #fff; opacity: 0.8; font-size: 1rem; z-index: 10; font-family: var(--body-font);"></div>
          <div class="lightbox__stage" tabindex="0">
            <button id="lightbox-prev" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">&#10094;</button>
            <figure class="lightbox__figure">
              <img id="lightbox-img" class="lightbox__img" src="" alt="" />
              <figcaption id="lightbox-caption" class="lightbox__caption"></figcaption>
            </figure>
            <button id="lightbox-next" class="lightbox__nav lightbox__nav--next" aria-label="Next image">&#10095;</button>
          </div>
        </div>
      `;
      document.body.appendChild(dialog);

      const img = dialog.querySelector('#lightbox-img');
      const caption = dialog.querySelector('#lightbox-caption');
      const counter = dialog.querySelector('#lightbox-counter');
      const closeBtn = dialog.querySelector('#lightbox-close');
      const prevBtn = dialog.querySelector('#lightbox-prev');
      const nextBtn = dialog.querySelector('#lightbox-next');
      const stage = dialog.querySelector('.lightbox__stage');

      const updateImage = () => {
        const items = dialog._items || [];
        const idx = dialog._currentIndex || 0;
        if (items.length === 0) return;
        const active = items[idx];
        img.src = active.src;
        img.alt = active.alt || '';
        if (active.captionHtml) {
          caption.innerHTML = active.captionHtml;
        } else {
          caption.textContent = active.title || '';
        }
        counter.textContent = `${idx + 1} / ${items.length}`;
        if (items.length <= 1) {
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
        } else {
          prevBtn.style.display = '';
          nextBtn.style.display = '';
        }
      };

      const showNext = () => {
        const items = dialog._items || [];
        if (items.length === 0) return;
        dialog._currentIndex = (dialog._currentIndex + 1) % items.length;
        updateImage();
      };

      const showPrev = () => {
        const items = dialog._items || [];
        if (items.length === 0) return;
        dialog._currentIndex = (dialog._currentIndex - 1 + items.length) % items.length;
        updateImage();
      };

      closeBtn.addEventListener('click', () => dialog.close());
      
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showPrev();
      });
      
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showNext();
      });

      dialog.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        if (e.target === dialog || e.target.classList.contains('lightbox__container') || e.target.classList.contains('lightbox__stage')) {
          dialog.close();
        }
      });

      dialog.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
      });

      let touchStartX = 0;
      let touchEndX = 0;
      stage.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      stage.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const diffX = touchEndX - touchStartX;
        if (Math.abs(diffX) > 50) {
          if (diffX < 0) showNext();
          else showPrev();
        }
      }, { passive: true });

      dialog._updateImage = updateImage;
    }
    return dialog;
  };

  const initGallery = (container = document) => {
    const images = container.querySelectorAll('.post__left figure a, .post__right figure a, .post__center figure a, .gallery-item a, .gallery__item a');
    if (images.length === 0) return;

    const items = Array.from(images).map((el) => {
      const figure = el.closest('figure');
      const figcaption = figure ? figure.querySelector('figcaption') : null;
      const title = figcaption ? figcaption.textContent : '';
      const imgEl = el.querySelector('img');
      const alt = imgEl ? imgEl.getAttribute('alt') : '';

      return {
        src: el.getAttribute('href'),
        title: title,
        alt: alt
      };
    });

    images.forEach((img, index) => {
      if (img.dataset.galleryBound) return;
      img.dataset.galleryBound = 'true';

      img.addEventListener('click', (e) => {
        e.preventDefault();
        const dialog = ensureLightboxElement();
        dialog._items = items;
        dialog._currentIndex = index;
        dialog._updateImage();
        dialog.showModal();
        dialog.querySelector('.lightbox__stage').focus();
      });
    });
  };

  const updateStyleSheets = (routeType, bodyClass, slug) => {
    const basePath = getSiteBasePath();
    const existingPlaygroundsLink = document.querySelector('link[href*="playgrounds.css"]');
    const existingArtLink = document.querySelector('link[href*="art.css"]');
    const existingMasonryLink = document.querySelector('link[href*="masonry.css"]');
    const existingPostLink = document.querySelector('link[href*="post.css"]');
    const existingSpeakingLink = document.querySelector('link[href*="speaking.css"]');
    
    const loadPlaygrounds = (slug === 'playgrounds' || bodyClass === 'playgrounds-body');
    const loadArt = (slug === 'art' || bodyClass === 'art-body');
    const loadPostCss = (routeType === 'post' || bodyClass === 'post-template');
    const loadSpeaking = (slug === 'guest-lectures-and-public-speaking-events');

    if (loadPlaygrounds) {
      if (!existingPlaygroundsLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${basePath}/assets/css/playgrounds.css`;
        document.head.appendChild(link);
      }
      if (!existingMasonryLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${basePath}/assets/css/masonry.css`;
        document.head.appendChild(link);
      }
    } else {
      if (existingPlaygroundsLink) existingPlaygroundsLink.remove();
      if (existingMasonryLink) existingMasonryLink.remove();
    }

    if (loadArt) {
      if (!existingArtLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${basePath}/assets/css/art.css`;
        document.head.appendChild(link);
      }
    } else {
      if (existingArtLink) existingArtLink.remove();
    }

    if (loadPostCss) {
      if (!existingPostLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${basePath}/assets/css/post.css`;
        document.head.appendChild(link);
      }
    } else {
      if (existingPostLink) existingPostLink.remove();
    }

    if (loadSpeaking) {
      if (!existingSpeakingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${basePath}/assets/css/speaking.css`;
        document.head.appendChild(link);
      }
    } else {
      if (existingSpeakingLink) existingSpeakingLink.remove();
    }
  };

  const renderPost = (postMeta, contentHtml) => {
    const basePath = getSiteBasePath();
    const primaryTag = postMeta.tags && postMeta.tags.length > 0 ? postMeta.tags[0] : null;
    const tagHtml = primaryTag 
      ? `<a class="content__maintag" href="${basePath}/tags/${getTagSlug(primaryTag)}/">${primaryTag}</a>`
      : '';

    let imageHtml = '';
    if (postMeta.thumbnail) {
      const prefix = basePath ? basePath + '/' : '/';
      const srcsetHtml = getResponsiveSrcset(postMeta.thumbnail, prefix);
      const widthAttr = postMeta.thumbWidth ? `width="${postMeta.thumbWidth}"` : '';
      const heightAttr = postMeta.thumbHeight ? `height="${postMeta.thumbHeight}"` : '';
      imageHtml = `
        <figure class="content__featured-image">
          <img src="${prefix}${postMeta.thumbnail}" ${srcsetHtml} ${widthAttr} ${heightAttr} sizes="(min-width: 56.25em) 100vw, (min-width: 37.5em) 50vw, 100vw" loading="eager" alt="">
        </figure>
      `;
    }

    const formattedDate = formatDate(postMeta.date);
    let lastUpdatedHtml = '';
    if (postMeta.date_modified && postMeta.date_published && postMeta.date_modified !== postMeta.date_published) {
      const pubDate = new Date(postMeta.date_published);
      const modDate = new Date(postMeta.date_modified);
      if (Math.abs(modDate - pubDate) > 60000) {
        lastUpdatedHtml = `<p class="content__last-updated">This article was updated on ${formatDate(postMeta.date_modified)}</p>`;
      }
    }

    const tagsListHtml = postMeta.tags && postMeta.tags.length > 0
      ? `<ul class="content__tag">
          ${postMeta.tags.map(t => `<li><a href="${basePath}/tags/${getTagSlug(t)}/">${t}</a></li>`).join('')}
         </ul>`
      : '';

    let navHtml = '';
    if (postsData) {
      const idx = postsData.findIndex(p => p.slug === postMeta.slug);
      if (idx !== -1) {
        let prevPost = idx < postsData.length - 1 ? postsData[idx + 1] : null;
        let nextPost = idx > 0 ? postsData[idx - 1] : null;

        let prevLinkHtml = prevPost
          ? `<div class="content__nav__prev">
              <a class="content__nav__link" href="${basePath}/posts/${prevPost.slug}/" rel="prev">
                Previous Post
                <h3 class="h6">${prevPost.name}</h3>
              </a>
             </div>`
          : '';

        let nextLinkHtml = nextPost
          ? `<div class="content__nav__next">
              <a class="content__nav__link" href="${basePath}/posts/${nextPost.slug}/" rel="next">
                Next Post
                <h3 class="h6">${nextPost.name}</h3>
              </a>
             </div>`
          : '';

        navHtml = `
          <nav class="content__nav">
            ${prevLinkHtml}
            ${nextLinkHtml}
          </nav>
        `;
      }
    }

    const rawBody = contentHtml || '<p>Content not found.</p>';
    const normalizedBody = normalizeContentHTML(rawBody, `posts/${postMeta.slug}/`);

    return `
      <div class="wrapper">
        <article class="content">
          <header class="content__header">
            ${tagHtml}
            <h1 class="content__title">${postMeta.name}</h1>
            <div class="content__meta">
              <time datetime="${postMeta.date}">${formattedDate}</time>
            </div>
          </header>
          ${imageHtml}
          <div class="content__inner">
            <div class="content__entry">
              ${normalizedBody}
            </div>
            <footer>
              ${lastUpdatedHtml}
              <div class="content__tags-share">
                ${tagsListHtml}
                <aside class="content__share"></aside>
              </div>
              ${navHtml}
            </footer>
          </div>
        </article>
      </div>
    `;
  };

  const route = async () => {
    const basePath = getSiteBasePath();

    // Handle legacy/fallback hash routing from 404.html redirects
    if (window.location.hash.startsWith('#/')) {
      const hashPath = window.location.hash.substring(1);
      const cleanHashPath = hashPath.replace(/^\//, '').replace(/\/$/, '');
      const posts = await getPostsData();
      const pages = await getPagesData();
      
      let newPath = basePath + hashPath;
      if (!hashPath.startsWith('/posts/') && !hashPath.startsWith('/pages/') && !hashPath.startsWith('/tags/') && !hashPath.startsWith('/authors/')) {
         if (posts.find(p => p.slug === cleanHashPath)) {
            newPath = basePath + '/posts/' + cleanHashPath + '/';
         } else if (pages.find(p => p.slug === cleanHashPath)) {
            newPath = basePath + '/pages/' + cleanHashPath + '/';
         }
      }
      history.replaceState(null, null, newPath);
    }

    const prefix = basePath ? basePath + '/' : '/';
    const siteRelativePath = getSiteRelativePath(window.location.pathname);
    const cleanRoute = siteRelativePath.replace(/^\//, '').replace(/\/$/, '');

    const posts = await getPostsData();
    const pages = await getPagesData();
    const playgrounds = await getPlaygroundsData();

    if (cleanRoute === '' || cleanRoute === 'index.html' || cleanRoute === 'graph') {
      if (cleanRoute === 'graph') {
        history.replaceState(null, null, basePath + '/');
        return;
      }
      updateStyleSheets('home', originalBodyClass, '');
      document.title = originalTitle;
      document.body.className = originalBodyClass;
      mainEl.className = originalMainClass;
      mainEl.innerHTML = originalMainHTML;

      const grid = mainEl.querySelector('.l-masonry');
      const paginationContainer = mainEl.querySelector('#pagination-container');

      if (grid) {
        grid.style.display = '';
        const visiblePosts = posts.filter(p => p.hideFromHome !== true);
        const initialChunk = visiblePosts.slice(0, 12);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = initialChunk.map(p => renderCard(p, prefix)).join('');
        Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
        handleLazyImages(grid);
        initGridMasonry(grid);

        if (paginationContainer) {
          paginationContainer.style.display = '';
          setupPagination(visiblePosts, paginationContainer, grid, prefix);
        }
      }    } else if (cleanRoute.startsWith('posts/')) {
      const slug = cleanRoute.substring(6);
      const postMeta = posts.find(p => p.slug === slug);
      if (postMeta) {
        try {
          const contentRes = await fetch(`${basePath}/content/posts/${slug}.html?v=${Date.now()}`);
          if (!contentRes.ok) throw new Error(`Failed to load content for post: ${slug}`);
          const contentHtml = await contentRes.text();
          updateStyleSheets('post', 'post-template', slug);
          document.title = `${postMeta.name} - Phileas Dazeley-Gaist`;
          document.body.className = 'post-template';
          mainEl.className = 'post';
          mainEl.innerHTML = renderPost(postMeta, contentHtml);
          if (window.Prism) {
            Prism.highlightAllUnder(mainEl);
            setupCodeBlocks(mainEl);
          }
          initGallery(mainEl);
        } catch (err) {
          console.error(err);
          updateStyleSheets('post', 'post-template', slug);
          document.title = `${postMeta.name} - Phileas Dazeley-Gaist`;
          document.body.className = 'post-template';
          mainEl.className = 'post';
          mainEl.innerHTML = renderPost(postMeta, '<p>Error loading content.</p>');
        }
        handleLazyImages(mainEl);
      } else {
        history.replaceState(null, null, basePath + '/');
        route();
      }
    } else if (cleanRoute.startsWith('pages/')) {
      const slug = cleanRoute.substring(6);
      const page = pages.find(p => p.slug === slug);
      if (page) {
        try {
          const contentRes = await fetch(`${basePath}/content/pages/${slug}.html?v=${Date.now()}`);
          if (!contentRes.ok) throw new Error(`Failed to load content for page: ${slug}`);
          let contentHtml = await contentRes.text();

          const bodyClass = page.body_class || '';
          updateStyleSheets('page', bodyClass, slug);
          document.title = `${page.title} - Phileas Dazeley-Gaist`;
          document.body.className = bodyClass;
          mainEl.className = page.main_class || '';
          mainEl.innerHTML = normalizeContentHTML(contentHtml, `pages/${page.slug}/`);

          if (slug === 'playgrounds') {
            try {
              const playgroundsRes = await fetch(`${basePath}/data/playgrounds.json?v=${Date.now()}`);
              const playgrounds = await playgroundsRes.json();
              const container = mainEl.querySelector('#playgrounds-container');
              if (container) {
                container.innerHTML = playgrounds.map(item => {
                  return `
        <article class="c-card">
            <a class="c-card__image" href="${item.url}" rel="noopener noreferrer" target="_blank">
                <img alt="${item.title} Project Thumbnail"
                    onerror="this.onerror=null;this.src='https://placehold.co/600x380/1a1a1a/ffffff?text=Image+Not+Found';"
                    src="${basePath}/${item.thumbnail}" />
            </a>
            <div class="c-card__wrapper">
                <header class="c-card__header">
                    <h2 class="c-card__title"><a class="invert" href="${item.url}" rel="noopener noreferrer" target="_blank">${item.title}</a></h2>
                </header>
                <p class="c-card__description">${item.description}</p>
            </div>
        </article>
                  `;
                }).join('');
              }
            } catch (err) {
              console.error("Failed to load playgrounds data:", err);
            }
          } else if (slug === 'art') {
            try {
              const [artRes, postsRes, playgroundsRes] = await Promise.all([
                fetch(`${basePath}/data/art.json?v=${Date.now()}`),
                fetch(`${basePath}/data/posts.json?v=${Date.now()}`),
                fetch(`${basePath}/data/playgrounds.json?v=${Date.now()}`)
              ]);
              const artData = await artRes.json();
              const postsData = await postsRes.json();
              const playgroundsData = await playgroundsRes.json();

              const artItems = Array.isArray(artData) ? artData : (artData.artworks || []);
              
              // Dynamically query posts and playgrounds tagged with "Art"
              const relatedPosts = (artData.related_posts && artData.related_posts.length > 0)
                ? artData.related_posts
                : postsData
                    .filter(p => p.tags && p.tags.some(t => t.toLowerCase() === 'art'))
                    .map(p => ({
                      title: p.name || p.title,
                      url: `posts/${p.slug}/`,
                      thumbnail: p.thumbnail,
                      topic: p.tags ? p.tags.filter(t => t.toLowerCase() !== 'art').slice(0, 3).join(' · ') : ''
                    }));

              const relatedPlaygrounds = (artData.related_playgrounds && artData.related_playgrounds.length > 0)
                ? artData.related_playgrounds
                : playgroundsData.filter(p => (p.tags && p.tags.some(t => t.toLowerCase() === 'art')) || p.isArt);

              const container = mainEl.querySelector('#art-gallery-container');
              if (container) {
                const renderCards = (items) => {
                  if (!items || items.length === 0) {
                    return `<div class="art-gallery-empty">No artworks found in this category.</div>`;
                  }
                  return items.map(item => {
                    const paperClass = item.isPaper ? 'art-card--paper' : '';
                    const yearHtml = item.year ? `<span class="art-card__year">${item.year}</span>` : '';
                    const catLabel = item.categoryLabel || item.category || 'Artwork';

                    const links = [];
                    let postHref = '';
                    if (item.post_url) {
                      postHref = item.post_url.startsWith('http') ? item.post_url : `${basePath}/${item.post_url}`;
                      const label = item.post_label || 'Read essay';
                      links.push(`<a href="${postHref}" class="art-card__link">${label} &rarr;</a>`);
                    }
                    if (item.playground_url) {
                      const label = item.playground_label || 'Interactive generator';
                      links.push(`<a href="${item.playground_url}" target="_blank" rel="noopener noreferrer" class="art-card__link">${label} &nearr;</a>`);
                    }
                    const linksHtml = links.length > 0 ? `<div class="art-card__links">${links.join('<span class="art-card__link-sep">&middot;</span>')}</div>` : '';

                    const imgSrc = `${basePath}/${item.thumbnail || item.image}`;
                    const fullImgSrc = `${basePath}/${item.image || item.thumbnail}`;
                    const captionText = [item.medium, item.year ? `(${item.year})` : '', item.dimensions].filter(Boolean).join(' — ');

                    let captionHtml = `<strong>${item.title}</strong>`;
                    if (captionText) captionHtml += `<div style="font-size:0.9rem; opacity:0.85; margin-top:0.25rem;">${captionText}</div>`;
                    if (postHref) {
                      captionHtml += `<div style="margin-top:0.4rem;"><a href="${postHref}" style="color:#fff; font-size:0.85rem; text-decoration:underline;">Read companion essay &rarr;</a></div>`;
                    }

                    return `
        <figure class="art-card ${paperClass}" data-category="${item.category || 'all'}">
            <a class="art-card__image-wrap" href="${fullImgSrc}" data-art-lightbox="true" data-title="${item.title}" data-caption-html="${captionHtml.replace(/"/g, '&quot;')}">
                <img class="art-card__image"
                    alt="${item.title}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='https://placehold.co/800x600/1a1a1a/ffffff?text=Image+Not+Found';"
                    src="${imgSrc}" />
            </a>
            <figcaption class="art-card__body">
                <div class="art-card__meta-top">
                    <span class="art-card__tag">${catLabel}</span>
                    ${yearHtml}
                </div>
                <h2 class="art-card__title">${item.title}</h2>
                ${item.medium ? `<div class="art-card__medium">${item.medium}</div>` : ''}
                ${item.description ? `<p class="art-card__description">${item.description}</p>` : ''}
                ${linksHtml}
            </figcaption>
        </figure>
                    `;
                  }).join('');
                };

                container.innerHTML = renderCards(artItems);

                // Build Category Filter Bar dynamically from art.json categories
                const filterBar = mainEl.querySelector('#art-filter-bar') || mainEl.querySelector('.art-filter-bar');
                if (filterBar) {
                  const catMap = new Map();
                  artItems.forEach(item => {
                    if (item.category && !catMap.has(item.category)) {
                      catMap.set(item.category, item.categoryLabel || item.category);
                    }
                  });

                  let filterHtml = `<button class="art-filter-btn is-active" type="button" data-filter="all" role="tab" aria-selected="true">All Works</button>`;
                  catMap.forEach((label, catKey) => {
                    filterHtml += `<button class="art-filter-btn" type="button" data-filter="${catKey}" role="tab" aria-selected="false">${label}</button>`;
                  });
                  filterBar.innerHTML = filterHtml;

                  const filterBtns = filterBar.querySelectorAll('.art-filter-btn');
                  filterBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                      const filter = btn.dataset.filter;
                      filterBtns.forEach(b => {
                        b.classList.remove('is-active');
                        b.setAttribute('aria-selected', 'false');
                      });
                      btn.classList.add('is-active');
                      btn.setAttribute('aria-selected', 'true');

                      const cards = container.querySelectorAll('.art-card');
                      cards.forEach(card => {
                        if (filter === 'all' || card.dataset.category === filter) {
                          card.classList.remove('is-hidden');
                        } else {
                          card.classList.add('is-hidden');
                        }
                      });
                    });
                  });
                }

                // Render Bottom Related Section with rich visual cards
                const bottomSection = mainEl.querySelector('#art-bottom-section');
                if (bottomSection && (relatedPosts.length > 0 || relatedPlaygrounds.length > 0)) {
                  let postsHtml = '';
                  if (relatedPosts.length > 0) {
                    postsHtml = `
                      <div class="art-bottom-block">
                        <h2 class="art-bottom__heading">Related Essays &amp; Research</h2>
                        <div class="art-bottom-cards-grid">
                          ${relatedPosts.map(p => {
                            const postHref = p.url.startsWith('http') ? p.url : `${basePath}/${p.url}`;
                            const thumbSrc = p.thumbnail ? `${basePath}/${p.thumbnail}` : '';
                            const thumbHtml = thumbSrc 
                              ? `<img class="art-related-card__thumb" src="${thumbSrc}" alt="${p.title}" loading="lazy" />`
                              : '';
                            return `
                              <a href="${postHref}" class="art-related-card">
                                ${thumbHtml}
                                <div class="art-related-card__body">
                                  <h3 class="art-related-card__title">${p.title}</h3>
                                  ${p.topic ? `<p class="art-related-card__desc">${p.topic}</p>` : ''}
                                </div>
                              </a>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    `;
                  }

                  let playgroundsHtml = '';
                  if (relatedPlaygrounds.length > 0) {
                    playgroundsHtml = `
                      <div class="art-bottom-block">
                        <h2 class="art-bottom__heading">Related Interactive Playgrounds</h2>
                        <div class="art-bottom-cards-grid">
                          ${relatedPlaygrounds.map(p => {
                            const thumbSrc = p.thumbnail ? `${basePath}/${p.thumbnail}` : '';
                            const thumbHtml = thumbSrc 
                              ? `<img class="art-related-card__thumb" src="${thumbSrc}" alt="${p.title}" loading="lazy" />`
                              : '';
                            return `
                              <a href="${p.url}" target="_blank" rel="noopener noreferrer" class="art-related-card">
                                ${thumbHtml}
                                <div class="art-related-card__body">
                                  <h3 class="art-related-card__title">${p.title}</h3>
                                  ${p.description ? `<p class="art-related-card__desc">${p.description}</p>` : ''}
                                </div>
                              </a>
                            `;
                          }).join('')}
                        </div>
                      </div>
                    `;
                  }

                  bottomSection.innerHTML = `
                    ${postsHtml}
                    ${playgroundsHtml}
                  `;
                }

                // Attach Lightbox to all artwork images
                const bindArtLightbox = () => {
                  const getVisibleArtItems = () => {
                    const visibleLinks = Array.from(container.querySelectorAll('.art-card:not(.is-hidden) [data-art-lightbox="true"]'));
                    return visibleLinks.map(link => ({
                      src: link.getAttribute('href'),
                      title: link.dataset.title || '',
                      captionHtml: link.getAttribute('data-caption-html') || '',
                      alt: link.dataset.title || ''
                    }));
                  };

                  container.addEventListener('click', (e) => {
                    const link = e.target.closest('[data-art-lightbox="true"]');
                    if (!link) return;
                    e.preventDefault();

                    const currentVisibleLinks = Array.from(container.querySelectorAll('.art-card:not(.is-hidden) [data-art-lightbox="true"]'));
                    const visibleIndex = currentVisibleLinks.indexOf(link);

                    const dialog = ensureLightboxElement();
                    dialog._items = getVisibleArtItems();
                    dialog._currentIndex = visibleIndex >= 0 ? visibleIndex : 0;
                    dialog._updateImage();
                    dialog.showModal();
                    dialog.querySelector('.lightbox__stage').focus();
                  });
                };

                bindArtLightbox();
              }
            } catch (err) {
              console.error("Failed to load art data:", err);
            }
          } else if (slug === 'guest-lectures-and-public-speaking-events') {
            try {
              const speakingEvents = await getSpeakingData();
              const container = mainEl.querySelector('#speaking-events-container');
              if (container) {
                const upcoming = speakingEvents.filter(e => e.status === 'upcoming');
                const past = speakingEvents.filter(e => e.status !== 'upcoming');

                let html = '';

                if (upcoming.length > 0) {
                  html += `
                    <div class="speaking-year-section" data-section="upcoming">
                      <h2 class="speaking-section-title collapsible-header">
                        <span class="collapse-toggle-icon">▼</span> Upcoming Events
                      </h2>
                      <div class="speaking-year-content">
                        <div class="speaking-list">
                  `;
                  upcoming.forEach(item => {
                    const linksHtml = item.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="speaking-event__link">${l.type}</a>`).join(' <span class="speaking-event__link-sep">·</span> ');
                    html += `
                      <div class="speaking-event-row">
                        <div class="speaking-event__title">${item.title}</div>
                        <div class="speaking-event__meta">
                          <span class="speaking-event__date">${item.date}</span>
                          ${item.host ? `<span class="speaking-event__meta-sep">·</span> <span class="speaking-event__host">${item.host}</span>` : ''}
                          ${linksHtml ? `<span class="speaking-event__meta-sep">·</span> <span class="speaking-event__links">${linksHtml}</span>` : ''}
                        </div>
                      </div>
                    `;
                  });
                  html += `
                        </div>
                      </div>
                    </div>
                  `;
                }

                if (past.length > 0) {
                  html += `<h2 class="speaking-past-title">Past Events</h2>`;
                  
                  const pastByYear = {};
                  past.forEach(e => {
                    pastByYear[e.year] = pastByYear[e.year] || [];
                    pastByYear[e.year].push(e);
                  });

                  const years = Object.keys(pastByYear).sort((a,b) => b.localeCompare(a));
                  years.forEach((year, index) => {
                    const yearEvents = pastByYear[year];
                    
                    // Index 0 (most recent year, e.g. 2026) is expanded, older years collapsed by default
                    const isCollapsed = index > 0;

                    html += `
                      <div class="speaking-year-section ${isCollapsed ? 'is-collapsed' : ''}" data-year="${year}">
                        <h3 class="speaking-year-header collapsible-header">
                          <span class="collapse-toggle-icon">▼</span> ${year}
                        </h3>
                        <div class="speaking-year-content">
                          <div class="speaking-list">
                    `;

                    yearEvents.forEach(item => {
                      const linksHtml = item.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="speaking-event__link">${l.type}</a>`).join(' <span class="speaking-event__link-sep">·</span> ');
                      html += `
                        <div class="speaking-event-row">
                          <div class="speaking-event__title">${item.title}</div>
                          <div class="speaking-event__meta">
                            <span class="speaking-event__date">${item.date}</span>
                            ${item.host ? `<span class="speaking-event__meta-sep">·</span> <span class="speaking-event__host">${item.host}</span>` : ''}
                            ${linksHtml ? `<span class="speaking-event__meta-sep">·</span> <span class="speaking-event__links">${linksHtml}</span>` : ''}
                          </div>
                        </div>
                      `;
                    });

                    html += `
                          </div>
                        </div>
                      </div>
                    `;
                  });
                }

                container.innerHTML = html;

                // Bind collapsible header events
                const headers = container.querySelectorAll('.collapsible-header');
                headers.forEach(h => {
                  h.addEventListener('click', () => {
                    const section = h.closest('.speaking-year-section');
                    section.classList.toggle('is-collapsed');
                  });
                });
              }
            } catch (err) {
               console.error("Failed to load speaking data:", err);
            }
          }
          if (window.Prism) {
            Prism.highlightAllUnder(mainEl);
            setupCodeBlocks(mainEl);
          }
          initGallery(mainEl);
        } catch (err) {
          console.error(err);
          const bodyClass = page.body_class || '';
          updateStyleSheets('page', bodyClass, slug);
          document.title = `${page.title} - Phileas Dazeley-Gaist`;
          document.body.className = bodyClass;
          mainEl.className = page.main_class || '';
          mainEl.innerHTML = '<div class="wrapper"><p>Error loading page content.</p></div>';
        }
        handleLazyImages(mainEl);
      } else {
        history.replaceState(null, null, basePath + '/');
        route();
      }
    } else if (cleanRoute === 'tags' || cleanRoute.startsWith('tags/')) {
      const rawSlug = cleanRoute === 'tags' ? '' : cleanRoute.substring(5);
      const slug = rawSlug.replace(/\/$/, '');
      updateStyleSheets('tag', 'tags-template', slug);

      if (slug === '' || slug === 'index') {
        // --- 1. TAGS INDEX PAGE (/tags/) ---
        const tagsList = getTagsDataFromPosts(posts, playgrounds);
        const sortedTags = [...tagsList].sort((a, b) => a.name.localeCompare(b.name));

        // Group tags by starting letter
        const groupsMap = {};
        sortedTags.forEach(tag => {
          const firstChar = tag.name.charAt(0).toUpperCase();
          const letterKey = /[A-Z]/.test(firstChar) ? firstChar : '#';
          if (!groupsMap[letterKey]) {
            groupsMap[letterKey] = [];
          }
          groupsMap[letterKey].push(tag);
        });

        const sortedLetters = Object.keys(groupsMap).sort();

        document.title = `Tags Index - Phileas Dazeley-Gaist`;
        document.body.className = 'tags-template';
        mainEl.className = 'page page--tags';

        const groupsHtml = sortedLetters.map(letter => {
          const groupTags = groupsMap[letter];
          const pillsHtml = groupTags.map(tag => `
            <div class="c-tag-directory-pill" data-name="${tag.name.toLowerCase()}">
              <a href="${basePath}/tags/${tag.slug}/" class="c-tag-directory-pill__link">
                <span class="c-tag-directory-pill__name">${tag.name}</span>
                <span class="c-tag-directory-pill__count">${tag.count}</span>
              </a>
              <a href="${basePath}/tags/graph/?focus=${tag.slug}" class="c-tag-directory-pill__graph" title="View ${tag.name} in Network">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="8.5" y1="7.5" x2="15.5" y2="16.5"></line><line x1="8.5" y1="16.5" x2="15.5" y2="7.5"></line><line x1="6" y1="9" x2="6" y2="15"></line><line x1="18" y1="9" x2="18" y2="15"></line></svg>
              </a>
            </div>
          `).join('');

          return `
            <div class="c-tag-directory__group" data-letter="${letter}">
              <div class="c-tag-directory__letter">${letter}</div>
              <div class="c-tag-directory__pills">${pillsHtml}</div>
            </div>
          `;
        }).join('');

        mainEl.innerHTML = `
          <div class="wrapper">
            <header class="c-tag-network-hero">
              <div class="c-tag-network-header">
                <h1 class="c-tag-network-header__title">Tags</h1>
                <div class="c-tags-view-toggle">
                  <a href="${basePath}/tags/" class="c-tags-view-toggle__btn is-active">Index</a>
                  <a href="${basePath}/tags/graph/" class="c-tags-view-toggle__btn">Network &rarr;</a>
                </div>
              </div>
              <div class="c-tag-network-toolbar">
                <div class="c-tag-search-wrapper">
                  <svg class="c-tag-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" class="c-tag-search-input" id="js-tag-search-input" placeholder="Search tags..." aria-label="Search tags" autocomplete="off">
                  <button type="button" class="c-tag-search-clear" id="js-tag-search-clear" aria-label="Clear search">&times;</button>
                </div>
              </div>
            </header>

            <div class="c-tag-directory" id="js-tags-directory-view">
              ${groupsHtml}
              <div class="c-tag-index-empty" id="js-tags-empty" style="display: none;">No tags found matching your search.</div>
            </div>
          </div>
        `;

        const directoryView = mainEl.querySelector('#js-tags-directory-view');
        const emptyEl = mainEl.querySelector('#js-tags-empty');
        const searchInput = mainEl.querySelector('#js-tag-search-input');
        const searchClear = mainEl.querySelector('#js-tag-search-clear');

        const performSearch = (val) => {
          const query = val.trim().toLowerCase();
          searchClear.style.display = query ? 'block' : 'none';

          let totalVisible = 0;
          const directoryGroups = directoryView.querySelectorAll('.c-tag-directory__group');

          directoryGroups.forEach(groupEl => {
            const pills = groupEl.querySelectorAll('.c-tag-directory-pill');
            let groupVisibleCount = 0;

            pills.forEach(pill => {
              const name = pill.getAttribute('data-name') || '';
              const matches = !query || name.includes(query);
              pill.style.display = matches ? 'inline-flex' : 'none';
              if (matches) groupVisibleCount++;
            });

            groupEl.style.display = groupVisibleCount > 0 ? '' : 'none';
            totalVisible += groupVisibleCount;
          });

          if (emptyEl) {
            emptyEl.style.display = totalVisible === 0 ? 'block' : 'none';
          }
        };

        searchInput.addEventListener('input', () => performSearch(searchInput.value));
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          searchInput.focus();
          performSearch('');
        });
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            searchInput.value = '';
            performSearch('');
          }
        });

      } else if (slug === 'graph' || slug === 'network') {
        // --- 2. TAGS GRAPH PAGE (/tags/graph/) ---
        const urlParams = new URLSearchParams(window.location.search);
        const requestedFocus = urlParams.get('focus') || (window.location.hash ? window.location.hash.replace('#', '') : null);

        document.title = `Tag Network - Phileas Dazeley-Gaist`;
        document.body.className = 'tags-template';
        mainEl.className = 'page page--tags';

        mainEl.innerHTML = `
          <div class="wrapper">
            <header class="c-tag-network-hero">
              <div class="c-tag-network-header">
                <h1 class="c-tag-network-header__title">Tag Network</h1>
                <div class="c-tags-view-toggle">
                  <a href="${basePath}/tags/" class="c-tags-view-toggle__btn">&larr; Tags Index</a>
                  <a href="${basePath}/tags/graph/" class="c-tags-view-toggle__btn is-active">Network</a>
                </div>
              </div>
              <div class="c-tag-network-toolbar">
                <div class="c-tag-search-wrapper">
                  <svg class="c-tag-search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <input type="text" class="c-tag-search-input" id="js-tag-search-input" placeholder="Search network nodes..." aria-label="Search network nodes" autocomplete="off">
                  <button type="button" class="c-tag-search-clear" id="js-tag-search-clear" aria-label="Clear search">&times;</button>
                </div>
              </div>
            </header>

            <div class="c-tag-network-stage" id="js-tag-network-stage">
              <div class="c-tag-stage-hint" id="js-tag-stage-hint">Scroll to zoom &bull; Drag to explore &bull; Click node to open tag page</div>
            </div>
          </div>
        `;

        const stage = mainEl.querySelector('#js-tag-network-stage');
        const searchInput = mainEl.querySelector('#js-tag-search-input');
        const searchClear = mainEl.querySelector('#js-tag-search-clear');

        let graphInstance = null;
        initTagNetworkGraph(stage, {
          posts,
          playgrounds,
          activeSlug: requestedFocus
        }).then(inst => {
          graphInstance = inst;
          if (requestedFocus) {
            graphInstance.focusNode(requestedFocus);
          }
        });

        const performSearch = (val) => {
          const query = val.trim().toLowerCase();
          searchClear.style.display = query ? 'block' : 'none';
          if (graphInstance) graphInstance.setSearch(query);
        };

        searchInput.addEventListener('input', () => performSearch(searchInput.value));
        searchClear.addEventListener('click', () => {
          searchInput.value = '';
          searchInput.focus();
          performSearch('');
        });
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            searchInput.value = '';
            performSearch('');
          }
        });

      } else {
        // --- 3. INDIVIDUAL TAG PAGE (/tags/:slug/) ---
        const tagsList = getTagsDataFromPosts(posts, playgrounds);
        const networkData = getTagNetworkData(posts, playgrounds);
        const matchedTag = tagsList.find(t => t.slug === slug);
        const tagName = matchedTag ? matchedTag.name : slug;
        
        const filteredPosts = posts.filter(p => p.tags && p.tags.some(t => getTagSlug(t) === slug)).map(p => ({ ...p, isPlayground: false }));
        const filteredPlaygrounds = playgrounds.filter(pg => pg.tags && pg.tags.some(t => getTagSlug(t) === slug)).map(pg => ({ ...pg, isPlayground: true, name: pg.title, slug: pg.id }));
        const combinedItems = [...filteredPosts, ...filteredPlaygrounds];
        combinedItems.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const connectedTags = networkData.getConnectedTags(slug);

        document.title = `Tag: ${tagName} - Phileas Dazeley-Gaist`;
        document.body.className = 'tag-template';
        mainEl.className = 'page page--tag';

        const connectedPillsHtml = connectedTags.length > 0
          ? `
            <div class="c-tag-connected">
              <span class="c-tag-connected__title">Connected:</span>
              <div class="c-tag-connected__pills">
                ${connectedTags.slice(0, 6).map(t => `
                  <a href="${basePath}/tags/${t.slug}/" class="c-tag-pill" title="${t.name}: ${t.weight} shared item${t.weight === 1 ? '' : 's'}">
                    <span class="c-tag-pill__name">${t.name}</span>
                    <span class="c-tag-pill__count">${t.weight}</span>
                  </a>
                `).join('')}
              </div>
            </div>
          `
          : '';

        mainEl.innerHTML = `
          <div class="wrapper">
            <div class="hero">
              <h1>${tagName} <sup>(${combinedItems.length})</sup></h1>
              <div class="c-tag-header-meta">
                ${connectedPillsHtml}
                <div class="c-tag-actions">
                  <a href="${basePath}/tags/graph/?focus=${slug}" class="c-tag-network-link" title="View ${tagName} in Network">
                    <svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"></circle><circle cx="18" cy="6" r="3"></circle><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="8.5" y1="7.5" x2="15.5" y2="16.5"></line><line x1="8.5" y1="16.5" x2="15.5" y2="7.5"></line><line x1="6" y1="9" x2="6" y2="15"></line><line x1="18" y1="9" x2="18" y2="15"></line></svg>
                    <span>View in Network &rarr;</span>
                  </a>
                </div>
              </div>
            </div>
            <div class="l-masonry l-masonry--3">
              <div class="gutter-sizer"></div>
            </div>
            <nav class="pagination desc" id="pagination-container"></nav>
          </div>
        `;

        const grid = mainEl.querySelector('.l-masonry');
        const initialChunk = combinedItems.slice(0, 12);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = initialChunk.map(p => renderCard(p, prefix, false, true)).join('');
        Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
        handleLazyImages(grid);
        initGridMasonry(grid);
        const paginationContainer = mainEl.querySelector('#pagination-container');
        setupPagination(combinedItems, paginationContainer, grid, prefix, false, true);
      }
    } else if (cleanRoute.startsWith('authors/')) {
      const slug = cleanRoute.substring(8);
      updateStyleSheets('author', 'author-template', slug);
      document.title = `Author: Phileas Dazeley-Gaist - Phileas Dazeley-Gaist`;
      document.body.className = 'author-template';
      mainEl.className = 'page page--author';

      mainEl.innerHTML = `
        <div class="wrapper">
          <div class="hero"><h1>Phileas Dazeley-Gaist <sup>(${posts.length})</sup></h1></div>
          <div class="l-masonry l-masonry--3">
            <div class="gutter-sizer"></div>
          </div>
          <nav class="pagination desc" id="pagination-container"></nav>
        </div>
      `;

      const grid = mainEl.querySelector('.l-masonry');
      const visiblePosts = posts.filter(p => p.hideFromHome !== true);
      const initialChunk = visiblePosts.slice(0, 12);
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = initialChunk.map(p => renderCard(p, prefix)).join('');
      Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
      handleLazyImages(grid);
      initGridMasonry(grid);

      const paginationContainer = mainEl.querySelector('#pagination-container');
      setupPagination(visiblePosts, paginationContainer, grid, prefix);
    } else {
      history.replaceState(null, null, basePath + '/');
      route();
    }

    if (window.updateActiveLinks) {
      window.updateActiveLinks();
    }
  };

  window.spaRoute = route;
  window.addEventListener('popstate', route);
  route();
});

