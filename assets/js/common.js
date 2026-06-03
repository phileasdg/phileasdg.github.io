// Dynamic Header Component
class SiteHeader extends HTMLElement {
  connectedCallback() {
    const pathname = window.location.pathname;
    const isFileScheme = window.location.protocol === 'file:';

    const getRelativePrefix = () => {
      // Strip base if it starts with /newsite or /phileasdg.github.io
      let normPath = pathname;
      if (pathname.startsWith('/newsite')) {
        normPath = pathname.substring(8);
      } else if (pathname.startsWith('/phileasdg.github.io')) {
        normPath = pathname.substring(20);
      }
      const segments = normPath.split('/').filter(s => s.length > 0);
      
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last.includes('.') || last === '404.html') {
          segments.pop();
        }
      }
      return '../'.repeat(segments.length);
    };

    const isActive = (path) => {
      if (isFileScheme) {
        if (path === '/') {
          return pathname.endsWith('newsite/index.html') || pathname.endsWith('newsite/');
        }
        const folder = path.replace(/^\/|\/$/g, '');
        return pathname.includes('/' + folder + '/');
      }

      // Normalize paths for matching
      const normPath = path.replace(/^\/(newsite|phileasdg\.github\.io)/, "").replace(/\/$/, "");
      const normCurr = pathname.replace(/^\/(newsite|phileasdg\.github\.io)/, "").replace(/\/$/, "");
      if (normPath === "" && normCurr === "") return true;
      if (normPath !== "" && normCurr.startsWith(normPath)) return true;
      return false;
    };

    const getLink = (path) => {
      if (isFileScheme) {
        if (path === '/') return 'index.html';
        return path.replace(/^\//, '');
      }
      const relPrefix = getRelativePrefix();
      if (path === '/') {
        return relPrefix + 'index.html';
      }
      return relPrefix + path.replace(/^\//, '');
    };

    this.innerHTML = `
      <header class="header" id="js-header">
        <a href="${getLink('/')}" class="logo">Phileas Dazeley-Gaist</a>
        <nav class="navbar js-navbar">
          <button class="navbar__toggle js-toggle" aria-label="Menu">
            <span class="navbar__toggle-box"><span class="navbar__toggle-inner">Menu</span></span>
          </button>
          <ul class="navbar__menu">
            <li class="${isActive('/') ? 'active' : ''}"><a href="${getLink('/')}" target="_self">Home</a></li>
            <li class="${isActive('/pages/guest-lectures-and-public-speaking-events') ? 'active' : ''}"><a href="${getLink('/pages/guest-lectures-and-public-speaking-events/')}" target="_self">Public Speaking</a></li>
            <li class="${isActive('/pages/playgrounds') ? 'active' : ''}"><a href="${getLink('/pages/playgrounds')}" target="_self">Playgrounds</a></li>
            <li class="${isActive('/pages/publications') ? 'active' : ''}"><a href="${getLink('/pages/publications/')}" target="_self">Publications</a></li>
            <li class="${isActive('/pages/a-few-words-about-me') ? 'active' : ''}"><a href="${getLink('/pages/a-few-words-about-me/')}" target="_self">About</a></li>
            <li class="${isActive('/pages/resume-cv') || isActive('/pages/resume-english') || isActive('/pages/cv-francais') ? 'active' : ''}"><a href="${getLink('/pages/resume-cv/')}" target="_self">Resume / CV</a></li>
            <li class="${isActive('/pages/inquiries') ? 'active' : ''}"><a href="${getLink('/pages/inquiries/')}" target="_self">Inquiries</a></li>
          </ul>
        </nav>
      </header>
    `;
  }
}

// Dynamic Footer Component
class SiteFooter extends HTMLElement {
  connectedCallback() {
    const pathname = window.location.pathname;
    
    const getRelativePrefix = () => {
      let normPath = pathname;
      if (pathname.startsWith('/newsite')) {
        normPath = pathname.substring(8);
      } else if (pathname.startsWith('/phileasdg.github.io')) {
        normPath = pathname.substring(20);
      }
      const segments = normPath.split('/').filter(s => s.length > 0);
      if (segments.length > 0) {
        const last = segments[segments.length - 1];
        if (last.includes('.') || last === '404.html') {
          segments.pop();
        }
      }
      return '../'.repeat(segments.length);
    };

    const relPrefix = getRelativePrefix();

    this.innerHTML = `
      <footer class="footer">
        <div class="footer__social">
          <a href="https://www.instagram.com/phileasdg/" aria-label="Instagram" class="instagram">
            <svg><use xlink:href="${relPrefix}assets/svg/svg-map.svg#instagram"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/phileas/" aria-label="LinkedIn" class="linkedin">
            <svg><use xlink:href="${relPrefix}assets/svg/svg-map.svg#linkedin"/></svg>
          </a>
          <a href="https://www.youtube.com/@phileasdg" aria-label="Youtube" class="youtube">
            <svg><use xlink:href="${relPrefix}assets/svg/svg-map.svg#youtube"/></svg>
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

// Dynamic Grid Rendering & Pagination
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector('.l-masonry');
  const paginationContainer = document.getElementById('pagination-container');
  if (!grid || document.body.classList.contains('tags-template')) return;

  // Determine relative prefix for data fetching and URLs
  const getRelativePrefix = () => {
    const pathname = window.location.pathname;
    const newsiteIndex = pathname.indexOf('/newsite/');
    if (newsiteIndex !== -1) {
      const subPath = pathname.substring(newsiteIndex + 9);
      const segments = subPath.split('/').filter(s => s.length > 0 && !s.includes('.html'));
      return '../'.repeat(segments.length);
    }
    const repoIndex = pathname.indexOf('/phileasdg.github.io/');
    if (repoIndex !== -1) {
      const subPath = pathname.substring(repoIndex + 21);
      const segments = subPath.split('/').filter(s => s.length > 0 && !s.includes('.html'));
      return '../'.repeat(segments.length);
    }
    if (pathname.includes('/tags/') || pathname.includes('/authors/') || pathname.includes('/posts/')) {
      return '../../';
    }
    return '';
  };

  const relPrefix = getRelativePrefix();

  // Helper to normalize tag name to match index folders
  const getTagSlug = (tag) => {
    if (tag === "R programming") return "r";
    return tag.toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Helper to generate responsive srcset
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

  // HTML Template for post card
  const renderCard = (post, prefix) => {
    const primaryTag = post.tags && post.tags.length > 0 ? post.tags[0] : null;
    const tagHtml = primaryTag 
      ? `<div class="c-card__tag"><a href="${prefix}tags/${getTagSlug(primaryTag)}/">${primaryTag}</a></div>`
      : '';

    let imageHtml = '';
    if (post.thumbnail) {
      const srcsetHtml = getResponsiveSrcset(post.thumbnail, prefix);
      imageHtml = `
        <a href="${prefix}posts/${post.slug}/" class="c-card__image">
          <img src="${prefix}${post.thumbnail}" ${srcsetHtml} sizes="(min-width: 56.25em) 100vw, (min-width: 37.5em) 50vw, 100vw" loading="lazy" alt="">
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
              <a href="${prefix}posts/${post.slug}/" class="invert">${post.name}</a>
            </h2>
          </header>
          <footer class="c-card__meta">
            <time datetime="${post.date}">${formattedDate}</time>
          </footer>
        </div>
      </article>
    `;
  };

  // Determine Page Type and Filter
  let pageType = 'home';
  let tagFilterName = '';
  if (document.body.classList.contains('tag-template')) {
    pageType = 'tag';
    const h1 = document.querySelector('.hero h1');
    if (h1) {
      const h1Clone = h1.cloneNode(true);
      const sup = h1Clone.querySelector('sup');
      if (sup) sup.remove();
      tagFilterName = h1Clone.textContent.trim();
    }
  } else if (document.body.classList.contains('author-template')) {
    pageType = 'author';
  }

  // Fetch posts.json and populate grid
  fetch(`${relPrefix}data/posts.json`)
    .then(response => response.json())
    .then(posts => {
      // Filter posts based on page type
      const filteredPosts = posts.filter(post => {
        if (pageType === 'tag') {
          return post.tags && post.tags.some(t => t.toLowerCase() === tagFilterName.toLowerCase());
        }
        return true;
      });

      let currentIndex = 0;
      const CHUNK_SIZE = 12;

      // Render first chunk
      const initialChunk = filteredPosts.slice(0, CHUNK_SIZE);
      currentIndex = initialChunk.length;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = initialChunk.map(p => renderCard(p, relPrefix)).join('');
      const initialItems = Array.from(tempDiv.children);
      initialItems.forEach(item => grid.appendChild(item));

      // Initialize Masonry
      if (typeof Masonry !== 'undefined') {
        window.msnry = new Masonry(grid, {
          itemSelector: '.c-card',
          columnWidth: '.c-card',
          gutter: '.gutter-sizer',
          percentPosition: true
        });

        if (typeof imagesLoaded !== 'undefined') {
          imagesLoaded(grid).on('progress', () => {
            window.msnry.layout();
          });
        }
      }

      // Render pagination button if more posts exist
      if (paginationContainer) {
        paginationContainer.innerHTML = '';
        if (filteredPosts.length > currentIndex) {
          const btn = document.createElement('button');
          btn.className = 'btn';
          btn.id = 'js-load-more';
          btn.textContent = 'Load More';
          btn.style.cursor = 'pointer';
          btn.addEventListener('click', () => {
            const nextChunk = filteredPosts.slice(currentIndex, currentIndex + CHUNK_SIZE);
            currentIndex += nextChunk.length;

            const chunkDiv = document.createElement('div');
            chunkDiv.innerHTML = nextChunk.map(p => renderCard(p, relPrefix)).join('');
            const newItems = Array.from(chunkDiv.children);
            newItems.forEach(item => grid.appendChild(item));

            if (window.msnry) {
              window.msnry.appended(newItems);
            }

            if (typeof imagesLoaded !== 'undefined') {
              imagesLoaded(grid).on('progress', () => {
                if (window.msnry) window.msnry.layout();
              });
            }

            if (currentIndex >= filteredPosts.length) {
              btn.remove();
            }
          });
          paginationContainer.appendChild(btn);
        }
      }
    })
    .catch(err => {
      console.error("Failed to load posts database:", err);
    });
});

