import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// --- CONFIGURATION ---
const POSTS_MARKDOWN_DIR = './markdown/posts';
const POSTS_OUTPUT_HTML_DIR = './content/posts';
const POSTS_JSON_PATH = './data/posts.json';

const PAGES_MARKDOWN_DIR = './markdown/pages';
const PAGES_OUTPUT_HTML_DIR = './content/pages';
const PAGES_JSON_PATH = './data/pages.json';
const CUSTOM_PAGES_DIR = './content/custom-pages';

let currentBranch = '';
try {
  currentBranch = execSync('git symbolic-ref --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
} catch (e) {
  // Ignore if git is not initialized or fails
}

const isProduction = process.env.NODE_ENV === 'production' || currentBranch === 'master';

// Ensure directories exist
if (!fs.existsSync(POSTS_MARKDOWN_DIR)) {
  fs.mkdirSync(POSTS_MARKDOWN_DIR, { recursive: true });
}
if (!fs.existsSync(PAGES_MARKDOWN_DIR)) {
  fs.mkdirSync(PAGES_MARKDOWN_DIR, { recursive: true });
}

// Helper to find responsive variants of an image on disk and build srcset/sizes attributes
function getResponsiveSrcsetAndSizes(imgPath) {
  // Strip origin if present
  let cleanPath = imgPath.replace(/^https?:\/\/phileasdg\.github\.io\//, '/');

  // Normalize relative parts
  cleanPath = cleanPath.replace(/^(\.\.\/)+/, '');
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1);
  }

  // Now cleanPath is like "media/posts/49/image.png"
  const fullLocalPath = path.resolve(cleanPath);
  if (!fs.existsSync(fullLocalPath)) {
    return { srcset: '', sizes: '' };
  }

  const dir = path.dirname(cleanPath);
  const ext = path.extname(cleanPath);
  const base = path.basename(cleanPath, ext);

  // Check on disk for responsive sizes
  const responsiveDir = path.join(dir, 'responsive');
  const sizesList = [
    { suffix: '-xs', width: '300w' },
    { suffix: '-sm', width: '480w' },
    { suffix: '-md', width: '768w' },
    { suffix: '-lg', width: '1200w' }
  ];

  const foundSrcset = [];
  sizesList.forEach(item => {
    const responsiveFileLocal = path.resolve(responsiveDir, `${base}${item.suffix}${ext}`);
    if (fs.existsSync(responsiveFileLocal)) {
      let prefix = '';
      if (imgPath.startsWith('https://phileasdg.github.io/')) {
        prefix = 'https://phileasdg.github.io/';
      } else if (imgPath.startsWith('../../')) {
        prefix = '../../';
      } else if (imgPath.startsWith('../')) {
        prefix = '../';
      } else if (imgPath.startsWith('/')) {
        prefix = '/';
      }

      const relativeHtmlPath = `${prefix}${dir}/responsive/${base}${item.suffix}${ext}`;
      foundSrcset.push(`${relativeHtmlPath} ${item.width}`);
    }
  });

  if (foundSrcset.length > 0) {
    return {
      srcset: `srcset="${foundSrcset.join(', ')}"`,
      sizes: `sizes="(max-width: 48em) 100vw, 100vw"`
    };
  }

  return { srcset: '', sizes: '' };
}

// --- MARKDOWN PARSER ---
// Helper to split cells by pipe, ignoring escaped pipes
function splitCells(row) {
  const cells = [];
  let current = '';
  for (let j = 0; j < row.length; j++) {
    if (row[j] === '|' && (j === 0 || row[j - 1] !== '\\')) {
      cells.push(current);
      current = '';
    } else {
      current += row[j];
    }
  }
  cells.push(current);

  let result = cells.map(c => c.trim().replace(/\\\|/g, '|'));
  if (row.trim().startsWith('|')) {
    result.shift();
  }
  if (row.trim().endsWith('|') && result.length > 0) {
    result.pop();
  }
  return result;
}

// Helper to parse alignments from separator row
function parseAlignments(separatorRow) {
  const cells = splitCells(separatorRow);
  return cells.map(cell => {
    const trimmed = cell.trim();
    const alignLeft = trimmed.startsWith(':');
    const alignRight = trimmed.endsWith(':');
    if (alignLeft && alignRight) return 'center';
    if (alignRight) return 'right';
    if (alignLeft) return 'left';
    return '';
  });
}

// Helper to parse inline markdown elements
function parseInlineMarkdown(text) {
  let processed = text;

  // 1. Links
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 2. Temporarily extract HTML tags
  const htmlTags = [];
  processed = processed.replace(/<[^>]+>/g, (match) => {
    htmlTags.push(match);
    return `%%HTMLTAGPLACEHOLDER${htmlTags.length - 1}%%`;
  });

  // 3. Temporarily extract inline code
  const codeBlocks = [];
  processed = processed.replace(/`([^`]+)`/g, (match, code) => {
    codeBlocks.push(code);
    return `%%CODEPLACEHOLDER${codeBlocks.length - 1}%%`;
  });

  // 4. Bold
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Italic
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');

  // 6. Restore inline code
  processed = processed.replace(/%%CODEPLACEHOLDER(\d+)%%/g, (match, index) => {
    const escapedCode = codeBlocks[Number(index)]
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<code>${escapedCode}</code>`;
  });

  // 7. Restore HTML tags
  processed = processed.replace(/%%HTMLTAGPLACEHOLDER(\d+)%%/g, (match, index) => {
    return htmlTags[Number(index)];
  });

  return processed;
}

// Helper to format table in HTML
function renderTableHTML(headers, alignments, rows) {
  let html = [];
  html.push('<div class="post__table-wrapper">');
  html.push('<table>');

  if (headers && headers.length > 0) {
    html.push('<thead>');
    html.push('<tr>');
    headers.forEach((h, index) => {
      const align = alignments[index] || '';
      const style = align ? ` style="text-align: ${align};"` : '';
      html.push(`<th${style}>${parseInlineMarkdown(h)}</th>`);
    });
    html.push('</tr>');
    html.push('</thead>');
  }

  if (rows && rows.length > 0) {
    html.push('<tbody>');
    rows.forEach(row => {
      html.push('<tr>');
      const colCount = Math.max(headers.length, row.length);
      for (let index = 0; index < colCount; index++) {
        const cell = row[index] || '';
        const align = alignments[index] || '';
        const style = align ? ` style="text-align: ${align};"` : '';
        html.push(`<td${style}>${parseInlineMarkdown(cell)}</td>`);
      }
      html.push('</tr>');
    });
    html.push('</tbody>');
  }

  html.push('</table>');
  html.push('</div>');
  return html.join('\n');
}

function parseMarkdown(md) {
  let html = md.replace(/\r\n/g, '\n');

  const lines = html.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = '';
  let inTable = false;
  let tableHeaders = [];
  let tableAlignments = [];
  let tableRows = [];
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        result.push(`<pre><code class="language-${codeBlockLang}">${codeBlockLines.join('\n')}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        codeBlockLang = line.trim().slice(3).trim() || 'plaintext';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Escape HTML tags inside code blocks
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlockLines.push(escaped);
      continue;
    }

    // Check if table row
    if (inTable) {
      if (line.trim().startsWith('|') || line.includes('|')) {
        const cells = splitCells(line);
        tableRows.push(cells);
        continue;
      } else {
        result.push(renderTableHTML(tableHeaders, tableAlignments, tableRows));
        inTable = false;
        tableHeaders = [];
        tableAlignments = [];
        tableRows = [];
        // fall through to parse the current line normally
      }
    }

    // Check if table starts
    if (!inTable && line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const separatorRegex = /^\s*\|?\s*(?:\s*:?-+:?\s*\|)+\s*(?:\s*:?-+:?\s*)?\|?\s*$/;
      if (separatorRegex.test(nextLine)) {
        inTable = true;
        tableHeaders = splitCells(line);
        tableAlignments = parseAlignments(nextLine);
        tableRows = [];
        i++; // skip the separator row
        continue;
      }
    }

    // Process inline markdown for non-code block lines
    let processedLine = line.trim();

    // Horizontal rule / separator delimiter
    if (processedLine === '---' || processedLine === '***' || processedLine === '___') {
      result.push('<hr class="separator" />');
      continue;
    }

    // 1. Images (must be BEFORE links and BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgTarget) => {
      const parts = imgTarget.trim().split(/\s+/);
      const imgPath = parts[0];
      let widthAttr = '';
      let heightAttr = '';
      let alignment = 'center';

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        const sizeMatch = part.match(/^=(\d*)x(\d*)$/);
        if (sizeMatch) {
          if (sizeMatch[1]) widthAttr = ` width="${sizeMatch[1]}"`;
          if (sizeMatch[2]) heightAttr = ` height="${sizeMatch[2]}"`;
        } else if (part === 'left' || part === 'right' || part === 'center') {
          alignment = part;
        }
      }

      const { srcset, sizes } = getResponsiveSrcsetAndSizes(imgPath);
      const srcsetAttr = srcset ? ' ' + srcset : '';
      const sizesAttr = sizes ? ' ' + sizes : '';
      return `<figure class="post__image post__image--${alignment}"><img src="${imgPath}" alt="${alt}"${widthAttr}${heightAttr}${srcsetAttr}${sizesAttr} loading="lazy" /></figure>`;
    });

    // 2. Links (must be BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 3. Headers (must match start of line or follow an HTML tag, must be BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/(^|>)\s*### (.*$)/gim, '$1<h3>$2</h3>');
    processedLine = processedLine.replace(/(^|>)\s*## (.*$)/gim, '$1<h2>$2</h2>');
    processedLine = processedLine.replace(/(^|>)\s*# (.*$)/gim, '$1<h1>$2</h1>');

    // 4. Temporarily extract HTML tags (original + newly generated) to prevent modifying them
    const htmlTags = [];
    processedLine = processedLine.replace(/<[^>]+>/g, (match) => {
      htmlTags.push(match);
      return `%%HTMLTAGPLACEHOLDER${htmlTags.length - 1}%%`;
    });

    // 5. Temporarily extract inline code to prevent formatting inside backticks
    const codeBlocks = [];
    processedLine = processedLine.replace(/`([^`]+)`/g, (match, code) => {
      codeBlocks.push(code);
      return `%%CODEPLACEHOLDER${codeBlocks.length - 1}%%`;
    });

    // 6. Bold
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 7. Italic
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processedLine = processedLine.replace(/_(.*?)_/g, '<em>$1</em>');

    // 8. Restore inline code
    processedLine = processedLine.replace(/%%CODEPLACEHOLDER(\d+)%%/g, (match, index) => {
      const escapedCode = codeBlocks[Number(index)]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<code>${escapedCode}</code>`;
    });

    // 9. Restore HTML tags
    processedLine = processedLine.replace(/%%HTMLTAGPLACEHOLDER(\d+)%%/g, (match, index) => {
      return htmlTags[Number(index)];
    });

    // Check if line is list item
    const listMatch = processedLine.match(/^[\-\*\+]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }

      if (processedLine === '') {
        continue;
      }

      // If it's already an HTML block tag, don't wrap it in <p>
      const isHtmlBlock = /^\s*<\/?(table|thead|tbody|tr|th|td|h[1-6]|ul|ol|li|div|p|figure|figcaption|iframe|pre|img|blockquote|hr|aside|section|script|style|details|summary|form|input|button|label)\b/i.test(processedLine) || processedLine.startsWith('<!--');
      if (isHtmlBlock) {
        if (/^\s*<table\b/i.test(processedLine)) {
          result.push('<div class="post__table-wrapper">');
        }
        result.push(processedLine);
        if (/<\/table>\s*$/i.test(processedLine)) {
          result.push('</div>');
        }
      } else {
        result.push(`<p>${processedLine}</p>`);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }
  if (inTable) {
    result.push(renderTableHTML(tableHeaders, tableAlignments, tableRows));
  }
  if (inCodeBlock) {
    result.push(`<pre><code class="language-${codeBlockLang}">${codeBlockLines.join('\n')}</code></pre>`);
  }

  return result.join('\n');
}

// --- FRONTMATTER PARSER ---
function parseFrontMatter(fileContent) {
  const normalized = fileContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { data: {}, content: fileContent };
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { data: {}, content: fileContent };
  }

  const frontmatterText = normalized.substring(4, closingIndex);
  const content = normalized.substring(closingIndex + 5).trim();

  const lines = frontmatterText.split('\n');
  const data = {};
  lines.forEach(line => {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim();

      // Strip outer quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      }

      // Parse arrays like ["a", "b"]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.substring(1, val.length - 1).split(',').map(s => {
          s = s.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length - 1);
          }
          return s;
        }).filter(Boolean);
      }

      data[key] = val;
    }
  });

  return { data, content };
}


// --- COMPILE POSTS ---
function compilePosts() {
  console.log('Compiling posts...');
  const mdFiles = fs.readdirSync(POSTS_MARKDOWN_DIR).filter(file => {
    if (isProduction && file === 'example-markdown-post.md') {
      return false;
    }
    return file.endsWith('.md');
  });

  let posts = [];
  if (fs.existsSync(POSTS_JSON_PATH)) {
    try {
      posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));
    } catch (err) {
      console.error('Error reading posts.json:', err);
    }
  }

  mdFiles.forEach(file => {
    const filePath = path.join(POSTS_MARKDOWN_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = parseFrontMatter(fileContent);
    const slug = path.basename(file, '.md');

    // Look up existing metadata in posts.json
    const existingIndex = posts.findIndex(p => p.slug === slug);
    const existingMeta = existingIndex > -1 ? posts[existingIndex] : {};

    // Merge: frontmatter overrides existing, which overrides defaults
    const mergedData = { ...existingMeta, ...data };

    const htmlContent = parseMarkdown(content);
    fs.writeFileSync(path.join(POSTS_OUTPUT_HTML_DIR, `${slug}.html`), htmlContent, 'utf8');

    const metadata = {
      id: mergedData.id || slug,
      name: mergedData.title || mergedData.name || slug,
      slug: slug,
      date: mergedData.date || new Date().toISOString().substring(0, 16),
      tags: mergedData.tags || [],
      thumbnail: mergedData.thumbnail || "",
      ...(mergedData.thumbWidth !== undefined && { thumbWidth: Number(mergedData.thumbWidth) }),
      ...(mergedData.thumbHeight !== undefined && { thumbHeight: Number(mergedData.thumbHeight) }),
      ...(mergedData.date_modified !== undefined && { date_modified: mergedData.date_modified }),
      ...(mergedData.date_published !== undefined && { date_published: mergedData.date_published }),
      ...(mergedData.hideFromHome !== undefined && { hideFromHome: mergedData.hideFromHome })
    };

    if (existingIndex > -1) {
      posts[existingIndex] = { ...posts[existingIndex], ...metadata };
    } else {
      posts.push(metadata);
    }
    console.log(`  Compiled post: ${file} -> ${slug}.html`);
  });

  const processedSlugs = new Set(mdFiles.map(file => path.basename(file, '.md')));
  posts = posts.filter(p => processedSlugs.has(p.slug));

  if (isProduction) {
    const exampleHtmlPath = path.join(POSTS_OUTPUT_HTML_DIR, 'example-markdown-post.html');
    if (fs.existsSync(exampleHtmlPath)) {
      fs.unlinkSync(exampleHtmlPath);
      console.log('  Removed example-markdown-post.html from production build.');
    }
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(posts, null, 2), 'utf8');
  console.log(`Successfully compiled posts and updated: ${POSTS_JSON_PATH}`);
}

// --- RENDER RESUME FROM JSON ---
function renderResumeHTML(data) {
  let html = [];
  
  html.push('<div class="resume">');
  
  html.push('  <header class="resume__header">');
  html.push(`    <div class="resume__title-group">`);
  html.push(`      <h1 class="resume__name">${data.name}</h1>`);
  html.push(`      <p class="resume__tagline">${data.tagline}</p>`);
  html.push('    </div>');
  html.push('    <div class="resume__contact">');
  if (data.contact.email) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg><a href="mailto:${data.contact.email.replace('[at]', '@')}">${data.contact.email}</a></div>`);
  }
  if (data.contact.linkedin) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="currentColor"/></svg><a href="${data.contact.linkedin}" target="_blank" rel="noopener">${data.contact.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</a></div>`);
  }
  if (data.contact.github) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" fill="currentColor"/></svg><a href="${data.contact.github}" target="_blank" rel="noopener">${data.contact.github.replace('https://github.com/', 'github.com/')}</a></div>`);
  }
  html.push('    </div>');
  html.push('  </header>');
  
  html.push('  <div class="resume__grid">');
  
  html.push('    <div class="resume__main">');
  
  if (data.work_experience && data.work_experience.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Expérience Professionnelle' : 'Work Experience';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.work_experience.forEach(job => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${job.role}</h3>`);
      html.push(`            <span class="resume__item-meta">${job.start_date} &ndash; ${job.end_date}</span>`);
      html.push('          </div>');
      html.push('          <div class="resume__item-subheader">');
      html.push(`            <span class="resume__item-company">${job.company}</span>`);
      html.push(`            <span class="resume__item-location">${job.location} &bull; ${job.type}</span>`);
      html.push('          </div>');
      html.push(`          <p class="resume__item-desc">${job.description}</p>`);
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.education && data.education.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Formation' : 'Education';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.education.forEach(edu => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${edu.institution}</h3>`);
      html.push(`            <span class="resume__item-meta">${edu.start_date} &ndash; ${edu.end_date}</span>`);
      html.push('          </div>');
      html.push('          <div class="resume__item-subheader">');
      html.push(`            <span class="resume__item-degree">${edu.degree}${edu.meta ? ' &bull; ' + edu.meta : ''}</span>`);
      html.push(`            <span class="resume__item-location">${edu.location}</span>`);
      html.push('          </div>');
      if (edu.description) {
        html.push(`          <p class="resume__item-desc">${edu.description}</p>`);
      }
      if (edu.courses && edu.courses.length > 0) {
        const coursesTitle = isFR ? 'Cours notables :' : 'Noteworthy Courses:';
        html.push(`          <div class="resume__courses"><strong>${coursesTitle}</strong> ${edu.courses.join(', ')}</div>`);
      }
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.teaching_experience && data.teaching_experience.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? "Expérience d'Enseignement" : 'Teaching Experience';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.teaching_experience.forEach(teach => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${teach.role}</h3>`);
      html.push(`            <span class="resume__item-meta">${teach.dates}</span>`);
      html.push('          </div>');
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.publications && data.publications.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Publications' : 'Publications';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list">');
    data.publications.forEach(pub => {
      html.push(`          <li>${pub.citation}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  if (data.leadership_volunteering && data.leadership_volunteering.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Leadership, Collaboration et Bénévolat' : 'Leadership, Collaboration, and Volunteering';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list">');
    data.leadership_volunteering.forEach(item => {
      html.push(`          <li>${item}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  html.push('    </div>');

  html.push('    <div class="resume__sidebar">');

  if (data.skills && data.skills.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Compétences Clés' : 'Highlighted Skills';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__skills-container">');
    data.skills.forEach(skill => {
      html.push(`          <span class="resume__skill-tag">${skill}</span>`);
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.languages && data.languages.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Langues' : 'Language Proficiency';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list-simple">');
    data.languages.forEach(lang => {
      html.push(`          <li><strong>${lang.language}</strong>: ${lang.proficiency}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  if (data.references && data.references.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Références (Disponibles sur demande)' : 'References (Available Upon Request)';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list-simple">');
    data.references.forEach(ref => {
      html.push(`          <li>`);
      html.push(`            <div class="resume__ref-name">${ref.name}</div>`);
      html.push(`            <div class="resume__ref-title">${ref.title}</div>`);
      html.push(`          </li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  html.push('    </div>');
  html.push('  </div>');
  html.push('</div>');

  return html.join('\n');
}

// --- COMPILE PAGES ---
function compilePages() {
  console.log('Compiling pages...');
  const mdFiles = fs.readdirSync(PAGES_MARKDOWN_DIR).filter(file => file.endsWith('.md'));
  const customFiles = fs.existsSync(CUSTOM_PAGES_DIR)
    ? fs.readdirSync(CUSTOM_PAGES_DIR).filter(file => file.endsWith('.html'))
    : [];

  let existingPages = [];
  if (fs.existsSync(PAGES_JSON_PATH)) {
    try {
      existingPages = JSON.parse(fs.readFileSync(PAGES_JSON_PATH, 'utf8'));
    } catch (err) {
      console.error('Error reading pages.json:', err);
    }
  }

  const updatedPages = [];

  // 1. Process Markdown pages
  mdFiles.forEach(file => {
    const filePath = path.join(PAGES_MARKDOWN_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = parseFrontMatter(fileContent);
    const slug = path.basename(file, '.md');

    // Look up existing page metadata
    const existingMeta = existingPages.find(p => p.slug === slug) || {};
    const mergedData = { ...existingMeta, ...data };

    // Compile markdown body
    const bodyHtml = parseMarkdown(content);

    // Wrap in standard page layout
    const finalHtml = `<div class="wrapper"><article class="content"><header class="content__header"><h1 class="content__title">${mergedData.title || slug}</h1></header><div class="content__inner"><div class="content__entry">${bodyHtml}</div><footer><div class="content__tags-share"><aside class="content__share"></aside></div></footer></div></article></div>`;

    fs.writeFileSync(path.join(PAGES_OUTPUT_HTML_DIR, `${slug}.html`), finalHtml, 'utf8');

    const metadata = {
      slug: slug,
      title: mergedData.title || slug,
      body_class: mergedData.body_class || 'post-template',
      main_class: mergedData.main_class || 'post'
    };

    updatedPages.push(metadata);
    console.log(`  Compiled page: ${file} -> ${slug}.html`);
  });

  // 1b. Process JSON resumes
  const resumeJsonFiles = [
    { json: './data/resume-en.json', slug: 'resume-english', title: 'Resume' },
    { json: './data/resume-fr.json', slug: 'cv-francais', title: 'CV' }
  ];

  resumeJsonFiles.forEach(item => {
    if (fs.existsSync(item.json)) {
      try {
        const fileContent = fs.readFileSync(item.json, 'utf8');
        const resumeData = JSON.parse(fileContent);
        
        const bodyHtml = renderResumeHTML(resumeData);
        const finalHtml = `<div class="wrapper"><article class="content"><div class="content__inner"><div class="content__entry">${bodyHtml}</div><footer><div class="content__tags-share"><aside class="content__share"></aside></div></footer></div></article></div>`;
        
        fs.writeFileSync(path.join(PAGES_OUTPUT_HTML_DIR, `${item.slug}.html`), finalHtml, 'utf8');
        
        const metadata = {
          slug: item.slug,
          title: resumeData.title || item.title,
          body_class: 'resume-body',
          main_class: 'resume-main'
        };
        
        updatedPages.push(metadata);
        console.log(`  Compiled JSON page: ${item.json} -> ${item.slug}.html`);
      } catch (err) {
        console.error(`Error compiling JSON page ${item.json}:`, err);
      }
    }
  });

  // 2. Process Custom HTML pages
  customFiles.forEach(file => {
    const slug = path.basename(file, '.html');
    const srcPath = path.join(CUSTOM_PAGES_DIR, file);
    const destPath = path.join(PAGES_OUTPUT_HTML_DIR, file);

    // Copy the custom HTML file
    fs.copyFileSync(srcPath, destPath);
    console.log(`  Copied custom page: ${file} -> ${destPath}`);

    // Lookup metadata in existingPages
    const existingMeta = existingPages.find(p => p.slug === slug);
    const metadata = {
      slug: slug,
      title: existingMeta ? existingMeta.title : (slug.charAt(0).toUpperCase() + slug.slice(1)),
      body_class: existingMeta ? existingMeta.body_class : 'post-template',
      main_class: existingMeta ? existingMeta.main_class : 'post'
    };

    updatedPages.push(metadata);
  });

  // Sort pages slightly or keep order matching original menu order for nicer list
  const orderMap = {
    'guest-lectures-and-public-speaking-events': 1,
    'playgrounds': 2,
    'publications': 3,
    'a-few-words-about-me': 4,
    'resume-cv': 5,
    'resume-english': 6,
    'cv-francais': 7,
    'inquiries': 8
  };

  updatedPages.sort((a, b) => {
    const orderA = orderMap[a.slug] || 99;
    const orderB = orderMap[b.slug] || 99;
    return orderA - orderB;
  });

  fs.writeFileSync(PAGES_JSON_PATH, JSON.stringify(updatedPages, null, 2), 'utf8');
  console.log(`Successfully compiled pages and updated: ${PAGES_JSON_PATH}`);
}

// --- GENERATE TAGS LIST ---
function generateTagsList() {
  console.log('Generating tags list...');
  let posts = [];
  let playgrounds = [];

  if (fs.existsSync(POSTS_JSON_PATH)) {
    try {
      posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));
    } catch (err) {
      console.error('Error reading posts.json for tags generator:', err);
    }
  }
  if (fs.existsSync('./data/playgrounds.json')) {
    try {
      playgrounds = JSON.parse(fs.readFileSync('./data/playgrounds.json', 'utf8'));
    } catch (err) {
      console.error('Error reading playgrounds.json for tags generator:', err);
    }
  }

  const tagsMap = {};
  const processItem = (item, type) => {
    if (item.tags) {
      item.tags.forEach(tag => {
        if (!tag || tag.trim() === '') return;
        const normalizedTag = tag.trim();
        if (!tagsMap[normalizedTag]) {
          tagsMap[normalizedTag] = { name: normalizedTag, count: 0, posts: 0, playgrounds: 0 };
        }
        tagsMap[normalizedTag].count++;
        if (type === 'post') tagsMap[normalizedTag].posts++;
        if (type === 'playground') tagsMap[normalizedTag].playgrounds++;
      });
    }
  };

  posts.forEach(p => processItem(p, 'post'));
  playgrounds.forEach(p => processItem(p, 'playground'));

  const sortedTags = Object.values(tagsMap).sort((a, b) => a.name.localeCompare(b.name));

  let mdContent = `# Website Tags List\n\n`;
  mdContent += `This file is automatically generated by the build script (\`scratch/build-posts.js\`). Do not edit it manually.\n\n`;
  mdContent += `| Tag | Total Count | Posts | Playgrounds |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;
  sortedTags.forEach(t => {
    mdContent += `| ${t.name} | ${t.count} | ${t.posts} | ${t.playgrounds} |\n`;
  });

  fs.writeFileSync('./TAGS.md', mdContent, 'utf8');
  console.log('Successfully generated TAGS.md');
}

// Run compilation
compilePosts();
compilePages();
generateTagsList();
