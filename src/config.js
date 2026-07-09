import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

export const POSTS_MARKDOWN_DIR = './markdown/posts';
export const POSTS_OUTPUT_HTML_DIR = './content/posts';
export const POSTS_JSON_PATH = './data/posts.json';

export const PAGES_MARKDOWN_DIR = './markdown/pages';
export const PAGES_OUTPUT_HTML_DIR = './content/pages';
export const PAGES_JSON_PATH = './data/pages.json';
export const CUSTOM_PAGES_DIR = './content/custom-pages';
export const INDEX_HTML_PATH = './index.html';

export let indexHtmlTemplate = '';

export function initConfig() {
  try {
    indexHtmlTemplate = fs.readFileSync(INDEX_HTML_PATH, 'utf8');

    // Perform Cache-Busting on index.html assets
    const assets = [
      'assets/css/style.css',
      'assets/css/wl-customizations.css',
      'assets/js/wl-customizations.js',
      'assets/js/common.js',
      'assets/js/scripts.min.js',
      'assets/js/masonry.pkgd.min.js',
      'assets/js/imagesloaded.pkgd.min.js'
    ];

    let modifiedTemplate = false;
    assets.forEach(asset => {
      if (fs.existsSync(asset)) {
        const content = fs.readFileSync(asset);
        const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
        const regex = new RegExp(asset.replace(/\./g, '\\\\.') + '\\\\?v=[a-zA-Z0-9_.-]+', 'g');
        const newString = `${asset}?v=${hash}`;
        
        const before = indexHtmlTemplate;
        indexHtmlTemplate = indexHtmlTemplate.replace(regex, newString);
        
        if (indexHtmlTemplate === before) {
          // Handle case without query param
          const regexNoQuery = new RegExp('"' + asset.replace(/\./g, '\\\\.') + '"', 'g');
          indexHtmlTemplate = indexHtmlTemplate.replace(regexNoQuery, '"' + newString + '"');
        }
        
        if (indexHtmlTemplate !== before) {
          modifiedTemplate = true;
        }
      }
    });

    if (modifiedTemplate) {
      fs.writeFileSync(INDEX_HTML_PATH, indexHtmlTemplate, 'utf8');
      console.log('Cache busting hashes updated in index.html');
    }

  } catch (e) {
    console.warn('Warning: index.html not found. Pre-rendering and cache-busting will be disabled.');
  }

  // Ensure directories exist
  if (!fs.existsSync(POSTS_MARKDOWN_DIR)) {
    fs.mkdirSync(POSTS_MARKDOWN_DIR, { recursive: true });
  }
  if (!fs.existsSync(PAGES_MARKDOWN_DIR)) {
    fs.mkdirSync(PAGES_MARKDOWN_DIR, { recursive: true });
  }
}

let currentBranch = '';
try {
  currentBranch = execSync('git symbolic-ref --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch (e) {
  // Ignore if git is not initialized or fails
}

export const isProduction = process.env.NODE_ENV === 'production' || currentBranch === 'master';
