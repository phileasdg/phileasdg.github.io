# Development Roadmap

This document outlines the development milestones, completed features, and future enhancements for the Phileas Dazeley-Gaist personal blog website and static build generator.

---

## [COMPLETED] Phase 1: SEO & Static Pre-Rendering Architecture
- **Goal:** Resolve GitHub Pages 404 fallback routing for direct URLs, enable native search engine indexing, and support rich social media preview cards.
- **Completed Action:**
  - Updated build pipeline to generate standalone pre-rendered HTML files with route-specific `<title>`, `<meta property="og:title">`, `<meta name="twitter:title">`, and `<meta property="og:url">` tags inside `posts/[slug]/index.html` and `pages/[slug]/index.html`.
  - Maintained dynamic SPA client-side routing in `assets/js/common.js` by fetching partial HTML from `content/posts/` and `content/pages/` during in-app navigation.

---

## [COMPLETED] Phase 2: Dependency Management & Responsive Image Automation
- **Goal:** Automate manual image resizing tasks and implement automated browser cache-busting.
- **Completed Action:**
  - Integrated **Sharp** (`^0.35.3`) into `src/images.js` to automatically scan post media directories and generate responsive image variants (`-xs`, `-sm`, `-md`, `-lg`) in optimized WebP/PNG formats during build time.
  - Implemented automated MD5 asset content hashing in `src/config.js` to inject cache-busting query strings (`?v=hash`) into `index.html` automatically.

---

## [COMPLETED] Phase 3: Modular Architecture & Development Server
- **Goal:** Refactor the build engine into clean, maintainable ES modules and provide a hot-rebuilding local development server.
- **Completed Action:**
  - Refactored monolithic scripts into modular source files in `src/`:
    - [src/config.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/config.js): Path constants & cache-busting logic.
    - [src/frontmatter.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/frontmatter.js): YAML frontmatter parser.
    - [src/images.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/images.js): Sharp image resolution & `srcset` builder.
    - [src/parser.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/parser.js): Markdown & Wolfram Language parser engine.
    - [src/renderers.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/renderers.js): HTML template renderers.
    - [src/compilers.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/compilers.js): Posts, pages, RSS, and sitemap compiler routines.
  - Created [scripts/server.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/scripts/server.js) (`npm run dev`) featuring recursive file watching, automatic build triggering, and zero-cache HTTP headers.

---

## [COMPLETED] Phase 4: Wolfram Language Dynamic UI Engine
- **Goal:** Support interactive, rich Wolfram Language notebook UI components natively in HTML.
- **Completed Action:**
  - Built custom Wolfram Language syntax parser in `src/parser.js`.
  - Added interactive **RGBColor swatches** (`.wl-color-swatch`), **Entity pills** (`.wl-entity-container`), and depth-aware balanced bracket parsing for **collapsible Iconize containers** (`<| Association |>` and `{ List }`).
  - Added prompt cleaning (removing `In[]:=` execution markers) and code formatting.
  - Added custom styling in [assets/css/wl-customizations.css](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/css/wl-customizations.css) and interaction scripts in [assets/js/wl-customizations.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/wl-customizations.js).

---

## [COMPLETED] Phase 5: Syndication, RSS, & Sitemap Automation
- **Goal:** Automatically build search engine sitemaps and RSS/Atom feeds upon content compilation.
- **Completed Action:**
  - Implemented automated RSS 2.0 / Atom feed compiler ([feed.xml](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/feed.xml)) and JSON Feed 1.1 compiler ([feed.json](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/feed.json)).
  - Implemented XML Sitemap compiler ([sitemap.xml](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/sitemap.xml)) with custom XSL formatting ([sitemap.xsl](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/sitemap.xsl)).
  - Automated post tag aggregation and [TAGS.md](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/TAGS.md) updating.

---

## Phase 6: Future Enhancements & Performance Goals
- **Goal:** Continuous performance optimization and enhanced user customizability.
- **Planned Action Items:**
  - Implement a persistent dark mode toggle in the navigation header.
  - Optimize client-side search index loading for large post archives.
  - Perform continuous Lighthouse audits for Core Web Vitals (CWV) and accessibility (a11y).
