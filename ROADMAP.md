# Development Roadmap

This document outlines the planned improvements and refactoring efforts for the static blog generator.

## [COMPLETED] Phase 1: SEO & Static Pre-rendering
- **Goal:** Fix the 404 issue on GitHub Pages for direct links and enable rich social media previews.
- **Action:** Modify the build script to generate full HTML files with appropriate `<meta>` tags (OpenGraph, Twitter Cards) in `posts/[slug]/index.html` instead of just generating partial HTML snippets. The SPA router will be updated to fetch content from the partials while the server serves the full pre-rendered HTML for direct links.

## [COMPLETED] Phase 2: Dependency Management & Build Automation
- **Goal:** Automate manual tasks and standardize the development environment.
- **Action:** 
  - Initialize a robust `package.json` with necessary dependencies.
  - Integrate `sharp` to automatically generate responsive image variants (`-xs`, `-sm`, `-md`, `-lg`) during the build process, replacing the manual resizing workflow.
  - Implement cache-busting by injecting MD5 hashes into CSS/JS filenames (e.g., `style.[hash].css`) to ensure users never see stale assets.

## Phase 3: Code Refactoring & Maintainability
- **Goal:** Make the custom build engine easier to maintain and extend.
- **Action:** Refactor the monolithic `scripts/build-posts.js` into modular files (e.g., `src/parser.js`, `src/generator.js`, `src/watch.js`).

## [COMPLETED] Phase 4: Accessibility & Content Polish
- **Goal:** Improve a11y compliance.
- **Action:** Ensure all markdown-generated images enforce meaningful `alt` attributes instead of defaulting to empty strings.
