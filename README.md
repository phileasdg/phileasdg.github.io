# Website Development & Build Documentation

Welcome to the development repository for the Phileas Dazeley-Gaist personal blog website. This codebase generates a highly responsive, custom static website designed with a **dual-mode architecture**: it functions as a Single Page Application (SPA) for dynamic client-side navigation while serving full, pre-rendered static HTML pages for direct URLs, search engines, and social media preview bots.

This documentation serves as a comprehensive reference guide for human developers and AI coding assistants (like Antigravity) to understand the site structure, compilation mechanics, Wolfram Language parser engine, validation suite, and standard developer workflows.

> [!IMPORTANT]
> **Documentation Maintenance:** This documentation is a living document. Any significant changes to the directory layout, build system config/scripts, styling conventions, or routing mechanisms must be immediately updated in this `README.md` to ensure a consistent, accurate source of truth.

---

## 1. System & Architecture Overview

The website employs a hybrid architecture combining static pre-rendering with client-side SPA routing:

* **Dual-Mode Static Pre-Rendering & Routing:**
  * **Direct Page Access & SEO:** Every post and page is pre-rendered at build time into standalone HTML pages (`posts/[slug]/index.html` and `pages/[slug]/index.html`) complete with OpenGraph and Twitter card `<meta>` tags. This ensures social media link previews and search engine crawlers work natively on GitHub Pages without requiring server-side redirects.
  * **SPA Client-Side Router:** Standard link clicks are intercepted globally via JavaScript in [common.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/common.js). Instead of a full page refresh, the browser's `history.pushState` is updated, and the site fetches partial HTML content from `content/posts/[slug].html` or `content/pages/[slug].html`. The router dynamically swaps content in the `<main>` element, updates active navigation states, loads route-specific CSS files, triggers syntax highlighting, and configures responsive media elements.
* **Component-Based Headers & Footers:** Custom HTML Web Components (`<site-header>` and `<site-footer>`) defined in [common.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/common.js) maintain layout DRYness.
* **Masonry Grid:** The home feed leverages `masonry.pkgd.min.js` and `imagesloaded.pkgd.min.js` to construct a dynamic, card-based grid layout that auto-adjusts post thumbnail positions.

---

## 2. Directory Structure Map

```
phileasdg.github.io/
├── index.html                 # Main website SPA shell entry point
├── 404.html                   # Custom 404 error page and legacy router redirect
├── package.json               # NPM build scripts & Sharp dependencies
├── README.md                  # Development architecture and workflow guide
├── ROADMAP.md                 # Development roadmap and status tracker
├── TAGS.md                    # Generated tag directory across posts & playgrounds
├── feed.json                  # Generated JSON Feed 1.1 database
├── feed.xml                   # Generated RSS 2.0 / Atom feed
├── sitemap.xml                # Generated XML Sitemap
├── sitemap.xsl                # XSL stylesheet for formatted sitemap rendering
├── assets/                    # Dynamic stylesheets, scripts, and visual resources
│   ├── css/
│   │   ├── style.css          # Main stylesheet (global layout, typography, site themes)
│   │   ├── masonry.css        # Layout styling for the masonry feed grid
│   │   ├── playgrounds.css    # Interactive playground page styling
│   │   ├── post.css           # Article typography and responsive media styling
│   │   ├── speaking.css       # Layout styles for speaking events
│   │   └── wl-customizations.css # Wolfram Language UI widgets (swatches, pills, associations)
│   ├── js/
│   │   ├── common.js          # SPA router, web components, and dynamic page render logic
│   │   ├── scripts.js         # Navigation menu, sticky header, and search popup logic
│   │   └── wl-customizations.js # Interactive toggle handlers for Wolfram Language widgets
│   └── svg/                   # Vector graphics, icons, and maps
├── data/                      # Structured JSON metadata databases (source of truth for feed cards)
│   ├── posts.json             # Post metadata index (titles, dates, tags, thumbnails, slugs)
│   ├── pages.json             # Static page index
│   ├── playgrounds.json       # Interactive project configurations
│   ├── speaking.json          # Speaking events dataset
│   ├── resume-en.json         # Source dataset for English resume
│   └── resume-fr.json         # Source dataset for French CV
├── markdown/                  # Human-writable content sources
│   ├── posts/                 # Markdown (.md) source files for blog posts
│   └── pages/                 # Markdown (.md) source files for static pages
├── content/                   # Generated HTML partials loaded dynamically by SPA router
│   ├── posts/                 # Partial HTML files of blog posts
│   ├── pages/                 # Partial HTML files of static pages (including compiled resumes)
│   └── custom-pages/          # Raw static HTML files copied directly during build
├── posts/                     # Pre-rendered static post pages (`posts/[slug]/index.html`) for direct URLs
├── pages/                     # Pre-rendered static page pages (`pages/[slug]/index.html`) for direct URLs
├── media/                     # User images, responsive asset variants, videos, and post thumbnails
├── src/                       # Modular build engine source files
│   ├── config.js              # Environment settings & automated MD5 asset cache-busting
│   ├── frontmatter.js         # Frontmatter extraction & parser
│   ├── images.js              # Sharp-powered responsive image generator & srcset resolver
│   ├── parser.js              # Markdown-to-HTML & Wolfram Language widget parser engine
│   ├── renderers.js           # Structured HTML template renderers (Resumes, Feeds, Sitemaps)
│   └── compilers.js           # Post, page, RSS, and sitemap compilation pipelines
└── scripts/                   # CLI build scripts & developer tools
    ├── build-posts.js         # CLI entry point for site compilation (`npm run build`)
    ├── server.js              # Zero-cache dev server with live rebuild watcher (`npm run dev`)
    ├── validate.js            # Automated validation test engine (`npm run test`)
    └── parse-events.js        # Event dataset extraction utility
```

---

## 3. The Modular Build Engine (`src/` & `scripts/build-posts.js`)

The compilation pipeline is executed via `npm run build` (invoking [scripts/build-posts.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/scripts/build-posts.js)), which coordinates modular components in [src/](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src):

1. **Configuration & Automated Cache-Busting ([src/config.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/config.js))**:
   * Reads target CSS and JS assets, computes MD5 hashes of file contents, and automatically updates asset version strings (`?v=hash`) in [index.html](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/index.html) to prevent stale browser caching.
2. **Automated Responsive Image Generation ([src/images.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/images.js))**:
   * Uses **Sharp** (`^0.35.3`) to scan media directories and automatically generate optimized responsive image variants (`-xs`, `-sm`, `-md`, `-lg`) in WebP/PNG formats.
   * Generates dynamic `srcset` and `sizes` HTML attributes for inline images and thumbnails.
3. **Wolfram Language UI & Markdown Parser Engine ([src/parser.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/parser.js))**:
   * Translates Markdown formatting into semantic HTML.
   * **Wolfram Language Entity Pills:** Converts `Entity["Category", "Name"]` syntax into interactive `.wl-entity-container` UI pills.
   * **RGBColor Swatches:** Converts `RGBColor[r, g, b]` expressions into inline interactive `.wl-color-swatch` visual swatches with calculated RGBA background colors.
   * **Iconize & Association Containers:** Uses depth-aware balanced bracket parsing to convert `Iconize[<|...|>]` and `Iconize[{...}]` expressions into interactive collapsible `<| Association |>` and `{ List }` UI pills.
   * **Execution Prompt Cleanup:** Strips `In[]:=` execution prompts and standardizes multiline WL code syntax.
4. **Compilation of Posts & Pages ([src/compilers.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/src/compilers.js))**:
   * Compiles `markdown/posts/*.md` into both partial HTML files (`content/posts/[slug].html`) and full standalone pre-rendered HTML pages (`posts/[slug]/index.html`) with customized OpenGraph and Twitter card `<meta>` tags.
   * Compiles `markdown/pages/*.md` and custom JSON resumes into static pages (`pages/[slug]/index.html`).
   * Updates `data/posts.json` and `data/pages.json`.
5. **Feed & Sitemap Generation**:
   * Automatically compiles [feed.xml](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/feed.xml) (RSS 2.0 / Atom), [feed.json](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/feed.json) (JSON Feed 1.1), [sitemap.xml](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/sitemap.xml), and updates [TAGS.md](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/TAGS.md).

---

## 4. Development Server (`scripts/server.js`)

Running `npm run dev` launches a lightweight Node.js HTTP server at `http://127.0.0.1:8000/`:

* **Live File Watcher:** Recursively monitors `markdown/`, `content/custom-pages/`, and `data/` JSON files for modifications and automatically triggers `npm run build`.
* **Zero-Cache Response Headers:** Emits `Cache-Control: no-store, no-cache, must-revalidate` headers on all responses so changes reflect immediately in the browser without manual hard refreshes.

---

## 5. The Validation Suite (`scripts/validate.js`)

Executing `npm run test` (or `npm run validate`) runs automated integrity checks:

* **JSON Database Validation:** Verifies `data/posts.json` and `data/pages.json` for structural correctness and valid JSON syntax.
* **HTML Content Integrity:** Scans all generated HTML partials and pre-rendered pages in `content/` and `posts/`.
* **Link & Asset Verification:** Parses `href`, `src`, and `srcset` URLs to ensure:
  * Internal links resolve to valid compiled post/page slugs.
  * Local media assets exist on disk at the specified paths.
  * External URLs format correctly.
* **Shell Validation:** Confirms all CSS, JS, and image dependencies referenced in `index.html` and `404.html` exist on disk.

---

## 6. Developer Workflows & Guidelines

### Adding or Modifying a Blog Post
1. Create or edit a `.md` file inside [markdown/posts/](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/markdown/posts).
2. Ensure the frontmatter is formatted properly:
   ```yaml
   ---
   title: "Your Post Title"
   date: "YYYY-MM-DD HH:MM"
   tags: ["Tag1", "Tag2"]
   thumbnail: "media/posts/xx/your-image.png"
   hideFromHome: false
   ---
   ```
3. Run the build script to compile content, generate responsive images, and update metadata:
   ```bash
   npm run build
   ```
4. Run the validation test suite to confirm asset paths and link integrity:
   ```bash
   npm run test
   ```

### Adjusting Styles & Wolfram Language Customizations
* Global styles belong in [assets/css/style.css](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/css/style.css).
* Route-specific stylesheets (`post.css`, `speaking.css`, `playgrounds.css`) are loaded dynamically by the router in `common.js` on matching routes.
* Wolfram Language interactive widgets (swatches, entity pills, collapsible association containers) are styled in [assets/css/wl-customizations.css](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/css/wl-customizations.css) and driven by [assets/js/wl-customizations.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/wl-customizations.js).

---

## 7. Roadmap & Current State Summary

Please refer to [ROADMAP.md](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/ROADMAP.md) for full project status.

### Summary of Completed Milestones:
* **SEO & Static Pre-Rendering:** Resolved. Standalone `posts/[slug]/index.html` and `pages/[slug]/index.html` files provide pre-rendered HTML with full OpenGraph/Twitter meta tags.
* **Automated Responsive Images:** Resolved. **Sharp** automatically builds optimized multi-resolution image variants (`-xs`, `-sm`, `-md`, `-lg`).
* **Automated Cache-Busting:** Resolved. MD5 content hashing automatically updates asset URLs in `index.html`.
* **Modular Engine & Wolfram Language Parser:** Resolved. Code compilation is fully modularized in `src/` with interactive Wolfram UI rendering.
