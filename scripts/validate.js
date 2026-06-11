import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceDir = path.resolve(__dirname, '..');

const postsJsonPath = path.join(workspaceDir, 'data', 'posts.json');
const pagesJsonPath = path.join(workspaceDir, 'data', 'pages.json');

function validateJsonFile(filePath, name) {
  console.log(`--- Validating ${name} ---`);
  if (!fs.existsSync(filePath)) {
    console.error(`FAIL: ${name} does not exist at ${filePath}`);
    return null;
  }
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`SUCCESS: ${name} parsed correctly. Total items: ${data.length}`);
    return data;
  } catch (err) {
    console.error(`FAIL: Error parsing ${name}:`, err.message);
    return null;
  }
}

function checkFileExists(relPath, currentFilePath, postsData) {
  // Strip query parameters or hashes
  let cleanPath = relPath.split('?')[0].split('#')[0];
  if (!cleanPath) return true; // anchor link

  // External links, mailto, etc.
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://') || cleanPath.startsWith('mailto:') || cleanPath.startsWith('//') || cleanPath.startsWith('tel:')) {
    return true;
  }

  // Resolve path relative to directory of current file
  const currentDir = path.dirname(currentFilePath);

  // If path starts with site root '/', resolve relative to workspaceDir
  let resolvedPath;
  if (cleanPath.startsWith('/')) {
    resolvedPath = path.normalize(path.join(workspaceDir, cleanPath));
  } else {
    resolvedPath = path.normalize(path.join(currentDir, cleanPath));
  }

  const relFromRoot = path.relative(workspaceDir, resolvedPath).replace(/\\/g, '/');

  // Check SPA routes
  if (relFromRoot.startsWith('posts/')) {
    const slug = relFromRoot.split('/')[1];
    if (postsData && postsData.some(p => p.slug === slug)) {
      return true;
    }
  } else if (relFromRoot.startsWith('pages/')) {
    const slug = relFromRoot.split('/')[1];
    if (fs.existsSync(pagesJsonPath)) {
      try {
        const pagesData = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf8'));
        if (pagesData.some(p => p.slug === slug)) {
          return true;
        }
      } catch (e) {}
    }
  } else if (relFromRoot.startsWith('tags/') || relFromRoot.startsWith('authors/')) {
    return true;
  }

  if (fs.existsSync(resolvedPath)) {
    return true;
  }

  // Directory fallback: if directory, check index.html inside it
  if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory()) {
    const indexPath = path.join(resolvedPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return true;
    }
  }

  // Fallback for relative folders
  if (!path.extname(resolvedPath)) {
    const altPath = path.join(resolvedPath, 'index.html');
    if (fs.existsSync(altPath)) {
      return true;
    }
  }

  return false;
}

// Simple parser to extract src, href, and srcset attributes
function extractUrls(htmlContent) {
  const urls = [];
  
  // 1. Match href="..."
  const hrefRegex = /href=["']([^"']+)["']/g;
  let match;
  while ((match = hrefRegex.exec(htmlContent)) !== null) {
    urls.push({ tag: 'link/a', attr: 'href', val: match[1] });
  }

  // 2. Match src="..."
  const srcRegex = /src=["']([^"']+)["']/g;
  while ((match = srcRegex.exec(htmlContent)) !== null) {
    urls.push({ tag: 'img/script', attr: 'src', val: match[1] });
  }

  // 3. Match srcset="..."
  const srcsetRegex = /srcset=["']([^"']+)["']/g;
  while ((match = srcsetRegex.exec(htmlContent)) !== null) {
    const srcsetValue = match[1];
    // srcset has comma-separated list of image-url width-descriptor
    srcsetValue.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        const urlPart = trimmed.split(/\s+/)[0];
        if (urlPart) {
          urls.push({ tag: 'source/img', attr: 'srcset', val: urlPart });
        }
      }
    });
  }

  return urls;
}

function validateHtmlFiles(postsData, pagesData) {
  console.log('--- Validating Compiled HTML Files ---');
  let allOk = true;

  // 1. Validate posts
  for (const post of postsData) {
    const slug = post.slug;
    const htmlFile = path.join(workspaceDir, 'content', 'posts', `${slug}.html`);
    // Simulated path context as seen in the SPA
    const fakeFilePath = path.join(workspaceDir, 'posts', slug, 'index.html');

    if (!fs.existsSync(htmlFile)) {
      console.error(`FAIL: Post HTML missing for slug: ${slug} at ${htmlFile}`);
      allOk = false;
      continue;
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const urls = extractUrls(htmlContent);
    const broken = [];

    for (const item of urls) {
      if (!checkFileExists(item.val, fakeFilePath, postsData)) {
        broken.push(item);
      }
    }

    if (broken.length > 0) {
      console.error(`FAIL: content/posts/${slug}.html has broken links/resources:`);
      broken.forEach(item => {
        console.error(`  - [${item.tag}] ${item.attr}="${item.val}"`);
      });
      allOk = false;
    }
  }

  // 2. Validate pages
  for (const page of pagesData) {
    const slug = page.slug;
    const htmlFile = path.join(workspaceDir, 'content', 'pages', `${slug}.html`);
    const fakeFilePath = path.join(workspaceDir, 'pages', slug, 'index.html');

    if (!fs.existsSync(htmlFile)) {
      console.error(`FAIL: Page HTML missing for slug: ${slug} at ${htmlFile}`);
      allOk = false;
      continue;
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const urls = extractUrls(htmlContent);
    const broken = [];

    for (const item of urls) {
      if (!checkFileExists(item.val, fakeFilePath, postsData)) {
        broken.push(item);
      }
    }

    if (broken.length > 0) {
      console.error(`FAIL: content/pages/${slug}.html has broken links/resources:`);
      broken.forEach(item => {
        console.error(`  - [${item.tag}] ${item.attr}="${item.val}"`);
      });
      allOk = false;
    }
  }

  if (allOk) {
    console.log('SUCCESS: All posts and pages have valid relative resource and link paths.');
  }
  return allOk;
}

function validateMainPages(postsData) {
  console.log('--- Validating Main HTML Pages ---');
  let allOk = true;

  const mainFiles = [
    path.join(workspaceDir, 'index.html'),
    path.join(workspaceDir, '404.html')
  ];

  for (const htmlFile of mainFiles) {
    if (!fs.existsSync(htmlFile)) {
      console.error(`FAIL: Main file missing: ${htmlFile}`);
      allOk = false;
      continue;
    }

    const htmlContent = fs.readFileSync(htmlFile, 'utf8');
    const urls = extractUrls(htmlContent);
    const broken = [];

    for (const item of urls) {
      if (!checkFileExists(item.val, htmlFile, postsData)) {
        broken.push(item);
      }
    }

    const relPath = path.relative(workspaceDir, htmlFile);
    if (broken.length > 0) {
      console.error(`FAIL: ${relPath} has broken links/resources:`);
      broken.forEach(item => {
        console.error(`  - [${item.tag}] ${item.attr}="${item.val}"`);
      });
      allOk = false;
    }
  }

  if (allOk) {
    console.log('SUCCESS: All main pages have valid links/resources.');
  }
  return allOk;
}

const posts = validateJsonFile(postsJsonPath, 'posts.json');
const pages = validateJsonFile(pagesJsonPath, 'pages.json');

if (posts && pages) {
  const htmlOk = validateHtmlFiles(posts, pages);
  const mainOk = validateMainPages(posts);

  if (htmlOk && mainOk) {
    console.log('\n*** ALL SANITY CHECKS PASSED SUCCESSFULLY! ***');
    process.exit(0);
  } else {
    console.error('\n*** SOME SANITY CHECKS FAILED! ***');
    process.exit(1);
  }
} else {
  console.error('Validation stopped due to metadata file loading failure.');
  process.exit(1);
}
