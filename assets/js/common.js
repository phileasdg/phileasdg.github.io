// Dynamic Header Component
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="header" id="js-header">
        <a href="#/" class="logo">Phileas Dazeley-Gaist</a>
        <nav class="navbar js-navbar">
          <button class="navbar__toggle js-toggle" aria-label="Menu">
            <span class="navbar__toggle-box"><span class="navbar__toggle-inner">Menu</span></span>
          </button>
          <ul class="navbar__menu">
            <li><a href="#/" target="_self">Home</a></li>
            <li><a href="#/pages/guest-lectures-and-public-speaking-events/" target="_self">Public Speaking</a></li>
            <li><a href="#/pages/playgrounds/" target="_self">Playgrounds</a></li>
            <li><a href="#/pages/publications/" target="_self">Publications</a></li>
            <li><a href="#/pages/a-few-words-about-me/" target="_self">About</a></li>
            <li><a href="#/pages/resume-cv/" target="_self">Resume / CV</a></li>
            <li><a href="#/pages/inquiries/" target="_self">Inquiries</a></li>
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
  const hash = window.location.hash || '#/';
  const menuItems = document.querySelectorAll('.navbar__menu li, .navbar_mobile_sidebar li, .navbar_mobile_overlay li');
  menuItems.forEach(li => {
    const a = li.querySelector('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href === hash || (hash === '#/' && href === '#/')) {
      li.classList.add('active');
    } else if (hash.startsWith('#/pages/') && href.startsWith('#/pages/')) {
      const pageSlug = hash.replace(/^#\/?pages\//, '').replace(/\/$/, '');
      const menuSlug = href.replace(/^#\/?pages\//, '').replace(/\/$/, '');
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
window.addEventListener('hashchange', window.updateActiveLinks);

// Global Click Interception & Routing Helper
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

    const sitePath = getSiteRelativePath(url.pathname);
    let routeHash = '';

    if (sitePath === '/' || sitePath === '/index.html') {
      routeHash = '#/';
    } else {
      const postsMatch = sitePath.match(/^\/posts\/([^\/]+)/);
      const pagesMatch = sitePath.match(/^\/pages\/([^\/]+)/);
      const tagsMatch = sitePath.match(/^\/tags\/([^\/]+)/);
      const tagsIndexMatch = sitePath.match(/^\/tags\/?(index\.html)?$/);
      const authorsMatch = sitePath.match(/^\/authors\/([^\/]+)/);

      if (postsMatch) {
        routeHash = `#/posts/${postsMatch[1]}/`;
      } else if (pagesMatch) {
        routeHash = `#/pages/${pagesMatch[1]}/`;
      } else if (tagsMatch) {
        routeHash = `#/tags/${tagsMatch[1]}/`;
      } else if (tagsIndexMatch) {
        routeHash = `#/tags/`;
      } else if (authorsMatch) {
        routeHash = `#/authors/${authorsMatch[1]}/`;
      }
    }

    if (routeHash) {
      event.preventDefault();
      window.location.hash = routeHash;
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

  const getPostsData = async () => {
    if (!postsData) {
      const res = await fetch('data/posts.json');
      postsData = await res.json();
    }
    return postsData;
  };

  const getPagesData = async () => {
    if (!pagesData) {
      const res = await fetch('data/pages.json');
      pagesData = await res.json();
    }
    return pagesData;
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

  const renderCard = (post, prefix = '') => {
    const primaryTag = post.tags && post.tags.length > 0 ? post.tags[0] : null;
    const tagHtml = primaryTag 
      ? `<div class="c-card__tag"><a href="#/tags/${getTagSlug(primaryTag)}/">${primaryTag}</a></div>`
      : '';

    let imageHtml = '';
    if (post.thumbnail) {
      const srcsetHtml = getResponsiveSrcset(post.thumbnail, prefix);
      const widthAttr = post.thumbWidth ? `width="${post.thumbWidth}"` : '';
      const heightAttr = post.thumbHeight ? `height="${post.thumbHeight}"` : '';
      imageHtml = `
        <a href="#/posts/${post.slug}/" class="c-card__image">
          <img src="${prefix}${post.thumbnail}" ${srcsetHtml} ${widthAttr} ${heightAttr} sizes="(min-width: 56.25em) 100vw, (min-width: 37.5em) 50vw, 100vw" loading="lazy" alt="">
        </a>
      `;
    }

    const formattedDate = formatDate(post.date);

    return `
      <article class="c-card default">
        ${imageHtml}
        <div class="c-card__wrapper">
          <header class="c-card__header">
            ${tagHtml}
            <h2 class="c-card__title">
              <a href="#/posts/${post.slug}/" class="invert">${post.name}</a>
            </h2>
          </header>
          <footer class="c-card__meta">
            <time datetime="${post.date}">${formattedDate}</time>
          </footer>
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

    const imgs = tempDiv.querySelectorAll('img');
    imgs.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('#')) {
        if (!src.startsWith('media/') && !src.startsWith('assets/') && !src.startsWith('data/')) {
          img.setAttribute('src', resolveRelativePath(src, originalPathContext));
        }
      }
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        const parts = srcset.split(',').map(part => {
          const trimmed = part.trim();
          const firstSpace = trimmed.indexOf(' ');
          if (firstSpace === -1) {
            if (!trimmed.startsWith('http') && !trimmed.startsWith('/') && !trimmed.startsWith('#')) {
              if (!trimmed.startsWith('media/') && !trimmed.startsWith('assets/') && !trimmed.startsWith('data/')) {
                return resolveRelativePath(trimmed, originalPathContext);
              }
            }
            return trimmed;
          }
          const url = trimmed.substring(0, firstSpace);
          const rest = trimmed.substring(firstSpace);
          if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
            if (!url.startsWith('media/') && !url.startsWith('assets/') && !url.startsWith('data/')) {
              return resolveRelativePath(url, originalPathContext) + rest;
            }
          }
          return trimmed;
        });
        img.setAttribute('srcset', parts.join(', '));
      }
    });

    const links = tempDiv.querySelectorAll('a');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        if (!href.startsWith('media/') && !href.startsWith('assets/') && !href.startsWith('data/')) {
          a.setAttribute('href', resolveRelativePath(href, originalPathContext));
        }
      }
    });

    return tempDiv.innerHTML;
  };

  const getTagsDataFromPosts = (posts) => {
    const tagsMap = {};
    posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => {
          if (!tagsMap[tag]) {
            tagsMap[tag] = { name: tag, count: 0, slug: getTagSlug(tag) };
          }
          tagsMap[tag].count++;
        });
      }
    });
    return Object.values(tagsMap).sort((a, b) => a.name.localeCompare(b.name));
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

  const setupPagination = (posts, container, grid, prefix = '') => {
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
        chunkDiv.innerHTML = nextChunk.map(p => renderCard(p, prefix)).join('');
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

  const updateStyleSheets = (routeType, bodyClass, slug) => {
    const existingPlaygroundsLink = document.querySelector('link[href*="playgrounds.css"]');
    const existingMasonryLink = document.querySelector('link[href*="masonry.css"]');
    const existingPostLink = document.querySelector('link[href*="post.css"]');
    
    const loadPlaygrounds = (slug === 'playgrounds' || bodyClass === 'playgrounds-body');
    const loadPostCss = (routeType === 'post' || bodyClass === 'post-template');

    if (loadPlaygrounds) {
      if (!existingPlaygroundsLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/playgrounds.css';
        document.head.appendChild(link);
      }
      if (!existingMasonryLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/masonry.css';
        document.head.appendChild(link);
      }
    } else {
      if (existingPlaygroundsLink) existingPlaygroundsLink.remove();
      if (existingMasonryLink) existingMasonryLink.remove();
    }

    if (loadPostCss) {
      if (!existingPostLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'assets/css/post.css';
        document.head.appendChild(link);
      }
    } else {
      if (existingPostLink) existingPostLink.remove();
    }
  };

  const renderPost = (postMeta, contentHtml) => {
    const primaryTag = postMeta.tags && postMeta.tags.length > 0 ? postMeta.tags[0] : null;
    const tagHtml = primaryTag 
      ? `<a class="content__maintag" href="#/tags/${getTagSlug(primaryTag)}/">${primaryTag}</a>`
      : '';

    let imageHtml = '';
    if (postMeta.thumbnail) {
      const srcsetHtml = getResponsiveSrcset(postMeta.thumbnail, '');
      const widthAttr = postMeta.thumbWidth ? `width="${postMeta.thumbWidth}"` : '';
      const heightAttr = postMeta.thumbHeight ? `height="${postMeta.thumbHeight}"` : '';
      imageHtml = `
        <figure class="content__featured-image">
          <img src="${postMeta.thumbnail}" ${srcsetHtml} ${widthAttr} ${heightAttr} sizes="(min-width: 56.25em) 100vw, (min-width: 37.5em) 50vw, 100vw" loading="eager" alt="">
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
          ${postMeta.tags.map(t => `<li><a href="#/tags/${getTagSlug(t)}/">${t}</a></li>`).join('')}
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
              <a class="content__nav__link" href="#/posts/${prevPost.slug}/" rel="prev">
                Previous Post
                <h3 class="h6">${prevPost.name}</h3>
              </a>
             </div>`
          : '';

        let nextLinkHtml = nextPost
          ? `<div class="content__nav__next">
              <a class="content__nav__link" href="#/posts/${nextPost.slug}/" rel="next">
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
    const hash = window.location.hash || '#/';
    const cleanHash = hash.replace(/^#\/?/, '').replace(/\/$/, '');

    const posts = await getPostsData();
    const pages = await getPagesData();

    if (cleanHash === '') {
      updateStyleSheets('home', originalBodyClass, '');
      document.title = originalTitle;
      document.body.className = originalBodyClass;
      mainEl.className = originalMainClass;
      mainEl.innerHTML = originalMainHTML;

      const grid = mainEl.querySelector('.l-masonry');
      const paginationContainer = mainEl.querySelector('#pagination-container');

      if (grid) {
        const visiblePosts = posts.filter(p => p.hideFromHome !== true);
        const initialChunk = visiblePosts.slice(0, 12);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = initialChunk.map(p => renderCard(p, '')).join('');
        Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
        handleLazyImages(grid);
        initGridMasonry(grid);

        if (paginationContainer) {
          setupPagination(visiblePosts, paginationContainer, grid, '');
        }
      }
    } else if (cleanHash.startsWith('posts/')) {
      const slug = cleanHash.substring(6);
      const postMeta = posts.find(p => p.slug === slug);
      if (postMeta) {
        updateStyleSheets('post', 'post-template', slug);
        document.title = `${postMeta.name} - Phileas Dazeley-Gaist`;
        document.body.className = 'post-template';
        mainEl.className = 'post';
        try {
          const contentRes = await fetch(`content/posts/${slug}.html`);
          if (!contentRes.ok) throw new Error(`Failed to load content for post: ${slug}`);
          const contentHtml = await contentRes.text();
          mainEl.innerHTML = renderPost(postMeta, contentHtml);
          if (window.Prism) {
            Prism.highlightAllUnder(mainEl);
          }
        } catch (err) {
          console.error(err);
          mainEl.innerHTML = renderPost(postMeta, '<p>Error loading content.</p>');
        }
        handleLazyImages(mainEl);
      } else {
        window.location.hash = '#/';
      }
    } else if (cleanHash.startsWith('pages/')) {
      const slug = cleanHash.substring(6);
      const page = pages.find(p => p.slug === slug);
      if (page) {
        const bodyClass = page.body_class || '';
        updateStyleSheets('page', bodyClass, slug);
        document.title = `${page.title} - Phileas Dazeley-Gaist`;
        document.body.className = bodyClass;
        mainEl.className = page.main_class || '';
        try {
          const contentRes = await fetch(`content/pages/${slug}.html`);
          if (!contentRes.ok) throw new Error(`Failed to load content for page: ${slug}`);
          const contentHtml = await contentRes.text();
          mainEl.innerHTML = normalizeContentHTML(contentHtml, `pages/${page.slug}/`);
          if (window.Prism) {
            Prism.highlightAllUnder(mainEl);
          }
        } catch (err) {
          console.error(err);
          mainEl.innerHTML = '<div class="wrapper"><p>Error loading page content.</p></div>';
        }
        handleLazyImages(mainEl);
      } else {
        window.location.hash = '#/';
      }
    } else if (cleanHash.startsWith('tags/')) {
      const slug = cleanHash.substring(5);
      updateStyleSheets('tag', 'tags-template', slug);
      if (slug === '') {
        const tagsList = getTagsDataFromPosts(posts);
        document.title = `All tags - Phileas Dazeley-Gaist`;
        document.body.className = 'tags-template';
        mainEl.className = 'page page--tags';

        const tagCardsHtml = tagsList.map(tag => `
          <li class="c-card">
            <div class="c-card__wrapper">
              <div class="c-card__header">
                <h2 class="c-card__title">
                  <a class="invert" href="#/tags/${tag.slug}/">${tag.name} </a><sup>(${tag.count})</sup>
                </h2>
              </div>
            </div>
          </li>
        `).join('');

        mainEl.innerHTML = `
          <div class="wrapper">
            <div class="hero"><h1>Collection of all tags <sup>(${tagsList.length})</sup></h1></div>
            <ul class="l-masonry l-masonry--3">
              <div class="gutter-sizer"></div>
              ${tagCardsHtml}
            </ul>
          </div>
        `;
        const grid = mainEl.querySelector('.l-masonry');
        initGridMasonry(grid);
      } else {
        const tagsList = getTagsDataFromPosts(posts);
        const matchedTag = tagsList.find(t => t.slug === slug);
        const tagName = matchedTag ? matchedTag.name : slug;
        
        const filteredPosts = posts.filter(p => p.tags && p.tags.some(t => getTagSlug(t) === slug));
        document.title = `Tag: ${tagName} - Phileas Dazeley-Gaist`;
        document.body.className = 'tag-template';
        mainEl.className = 'page page--tag';

        mainEl.innerHTML = `
          <div class="wrapper">
            <div class="hero"><h1>${tagName} <sup>(${filteredPosts.length})</sup></h1></div>
            <div class="l-masonry l-masonry--3">
              <div class="gutter-sizer"></div>
            </div>
            <nav class="pagination desc" id="pagination-container"></nav>
          </div>
        `;

        const grid = mainEl.querySelector('.l-masonry');
        const initialChunk = filteredPosts.slice(0, 12);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = initialChunk.map(p => renderCard(p, '')).join('');
        Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
        handleLazyImages(grid);
        initGridMasonry(grid);

        const paginationContainer = mainEl.querySelector('#pagination-container');
        setupPagination(filteredPosts, paginationContainer, grid, '');
      }
    } else if (cleanHash.startsWith('authors/')) {
      const slug = cleanHash.substring(8);
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
      tempDiv.innerHTML = initialChunk.map(p => renderCard(p, '')).join('');
      Array.from(tempDiv.children).forEach(item => grid.appendChild(item));
      handleLazyImages(grid);
      initGridMasonry(grid);

      const paginationContainer = mainEl.querySelector('#pagination-container');
      setupPagination(visiblePosts, paginationContainer, grid, '');
    } else {
      window.location.hash = '#/';
    }

    if (window.updateActiveLinks) {
      window.updateActiveLinks();
    }
  };

  window.addEventListener('hashchange', route);
  route();
});

