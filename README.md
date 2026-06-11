# Website Development & Build Documentation

Welcome to the development repository for the Phileas Dazeley-Gaist personal blog website. This codebase generates a highly responsive, custom static website designed to behave as a Single Page Application (SPA) for smooth and rich user experiences.

This documentation serves as a comprehensive reference guide for human developers and AI assistants (like Antigravity) to understand the site structure, compilation mechanics, validation suite, and standard developer workflows.

> [!IMPORTANT]
> **Documentation Maintenance:** This documentation is a living document. Any significant changes to the directory layout, build system config/scripts, styling conventions, or routing mechanisms must be immediately updated in this `README.md` to ensure a consistent, accurate source of truth.

---

## 1. System & Architecture Overview

The website is a static site structured to mimic a modern Single Page Application (SPA).

* **SPA Client-Side Router:** Standard link clicks are intercepted globally via JavaScript in [common.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/common.js). Instead of a full page refresh, the browser's `history.pushState` is updated, and the site performs a fetch request to retrieve only the HTML partial content (e.g. `content/posts/Lotka-Volterra-models...html`). The router then dynamically updates the `<main>` element, swaps the active class of nav menu links, loads route-specific CSS files, runs syntax highlighting, and configures responsive media elements.
* **Component-Based Headers/Footers:** To keep layout logic DRY, the `<site-header>` and `<site-footer>` sections are implemented as custom HTML Web Components defined inside [common.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/common.js).
* **Masonry Grid:** The home feed leverages `masonry.pkgd.min.js` and `imagesloaded.pkgd.min.js` to construct a dynamic, card-based grid layout that auto-adjusts post positions.

---

## 2. Directory Structure Map

```
phileasdg.github.io/
├── index.html                 # Main website shell (SPA entry point)
├── 404.html                   # Custom error page and legacy router redirect
├── package.json               # NPM build & validation scripts
├── README.md                  # This developer guide
├── TAGS.md                    # Generated list of tags used in posts & playgrounds
├── assets/                    # Dynamic stylesheets, scripts, and media resources
│   ├── css/
│   │   ├── style.css          # Main stylesheet (contains general site styles & custom overrides)
│   │   ├── masonry.css        # Layout styling for the masonry feed grid
│   │   ├── playgrounds.css    # Interactive playground page styling
│   │   ├── post.css           # Typography and layout overrides for articles/posts
│   │   └── speaking.css       # Layout styles for speaking events
│   ├── js/
│   │   ├── common.js          # SPA router, web components, and dynamic page render logic
│   │   └── scripts.js         # Navigation menu, sticky header, and search popup logic
│   └── svg/                   # Common vector icons and maps
├── data/                      # Structured JSON metadata databases (source of truth for feed cards)
│   ├── posts.json             # Merged post details (titles, dates, tags, thumbnails, slugs)
│   ├── pages.json             # Page attributes (slugs, custom classes)
│   ├── playgrounds.json       # Interactive project configurations (names, URLs, descriptions)
│   ├── speaking.json          # Speaking events datasets
│   ├── resume-en.json         # Source data for the English resume
│   └── resume-fr.json         # Source data for the French CV
├── markdown/                  # Human-writable content sources
│   ├── posts/                 # Markdown (.md) source files for blog posts
│   └── pages/                 # Markdown (.md) source files for standard pages (e.g. about, speaking)
├── content/                   # Output folder for compiled HTML partials (loaded dynamically by router)
│   ├── posts/                 # Generated HTML content files of blog posts
│   ├── pages/                 # Generated HTML content files of static pages (including JSON-rendered resumes)
│   └── custom-pages/          # Custom HTML files that are copied directly to output during build
├── media/                     # User-uploaded images, videos, and post thumbnails
└── scratch/                   # Developer scripts and internal utilities
    ├── build-posts.js         # The compilation engine (compiles markdown/JSON into HTML/JSON)
    └── validate.js            # The test engine (validates routes, syntax, and asset links)
```

---

## 3. The Build Engine (`scratch/build-posts.js`)

The compilation pipeline is powered by a custom Node.js script: [build-posts.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/scratch/build-posts.js). Running `npm run build` triggers this script, executing the following phases:

1. **Compilation of Posts (`compilePosts`)**:
   * Scans `markdown/posts/*.md` files.
   * Parses **YAML-like frontmatter** (delimited by `---`) using simple string matching to extract variables like `title`, `date`, `tags`, `thumbnail`, and `hideFromHome`.
   * Standardizes the parsed attributes into metadata blocks.
   * Translates Markdown lines into HTML code via a custom regex-based inline parser (converting tables, headers, bold, italics, code blocks, images, lists, and links).
   * Locates local media assets and queries disk sizes to generate responsive `srcset`/`sizes` attributes for images automatically.
   * Compiles the final HTML file to `content/posts/[slug].html` and updates the compiled array in `data/posts.json` sorted by date descending.
2. **Compilation of Pages (`compilePages`)**:
   * Compiles `markdown/pages/*.md` into `content/pages/[slug].html` inside a standard wrapping template container.
   * Compiles JSON CVs (`data/resume-en.json` and `data/resume-fr.json`) into rich structured HTML resumes using `renderResumeHTML` templates, outputting to `content/pages/resume-english.html` and `content/pages/cv-francais.html`.
   * Copies raw static HTML files from `content/custom-pages/` directly to `content/pages/`.
   * Compiles details into `data/pages.json`.
3. **Generation of Tag List (`generateTagsList`)**:
   * Scans tags from compiled posts and playgrounds, aggregates occurrences, and auto-generates [TAGS.md](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/TAGS.md).

---

## 4. The Validation Engine (`scratch/validate.js`)

Running `npm run test` (or `npm run validate`) executes [validate.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/scratch/validate.js) which conducts sanity checks to safeguard the integrity of the website:

* **JSON Validation:** Validates `data/posts.json` and `data/pages.json` to verify they contain valid syntax.
* **HTML Integrity:** Iterates through every HTML file inside `content/posts/` and `content/pages/`.
* **Link/Resource Checker:** Parses HTML tags to locate any `href`, `src`, or `srcset` URLs. It verifies that:
  * External links (using schemas like `http`, `https`, `mailto`, `tel`) are skipped.
  * Internal links (e.g. `/posts/some-post/`) map to verified compiled slugs in `data/posts.json` or `data/pages.json`.
  * Physical media files exist on disk at the specified path (handling relative paths relative to the post context as simulated by the SPA router).
* **Main Shell Validation:** Scans the root-level `index.html` and `404.html` to confirm all referenced CSS, JS, and image assets exist on disk.

---

## 5. Developer & Workflow Guidelines

Follow these exact steps when creating or editing components of the website:

### Adding or Modifying a Blog Post
1. Create/edit a `.md` file inside [markdown/posts/](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/markdown/posts).
2. Set up the frontmatter correctly at the top of the file:
   ```yaml
   ---
   title: "Your Post Title"
   date: "YYYY-MM-DD HH:MM"
   tags: ["Tag1", "Tag2"]
   thumbnail: "media/posts/xx/your-image.png"
   hideFromHome: false
   ---
   ```
3. Write content using standard markdown syntax.
4. Run the build script to compile:
   ```bash
   npm run build
   ```
5. Run the validation suite to ensure there are no broken images or invalid markdown links:
   ```bash
   npm run test
   ```

### Adjusting Global Styles & Media Queries
* Keep styles clean and centralized in [style.css](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/css/style.css).
* Route-specific stylesheets like `post.css`, `speaking.css`, or `playgrounds.css` are loaded dynamically by the router in `common.js` when the matching page is loaded. Place narrow style concerns in these matching stylesheets.
* Whenever overriding base selectors (like `button` or `input`), ensure overrides do not break layout components by polluting them with generic styling. Reset overrides locally using specific wrapper classes (e.g., using `.navbar .navbar__toggle` with higher specificity/`!important` resets to avoid base styling leakages).

### Modifying Router or Shell Elements
* When adding a new item to the navigation bar, update the `connectedCallback` element inside the `SiteHeader` class in [common.js](file:///Users/phileasdazeleygaist/Desktop/My%20Websites/my%20blog/phileasdg.github.io/assets/js/common.js).
* Ensure any custom link element sets `target="_self"` to allow the click interceptor in `common.js` to treat it as an SPA transition.
