import fs from 'fs';
import path from 'path';

const POSTS_MD_DIR = './markdown/posts';
const PAGES_MD_DIR = './markdown/pages';

function cleanMarkdown(mdContent) {
  let md = mdContent;

  // 1. Strip YAML frontmatter
  if (md.startsWith('---')) {
    const parts = md.split('---');
    if (parts.length >= 3) {
      md = parts.slice(2).join('---').trim();
    }
  }

  // 2. Normalize carriage returns
  md = md.replace(/\r\n/g, '\n');

  // 3. Convert HTML figures back to Markdown images with dimensions if present
  // Example: <figure class="post__image align-center"><img loading="lazy" src="PATH" alt="" width="W" height="H" ...></figure>
  md = md.replace(/<figure class="post__image[^"]*">\s*<img([^>]*?)\/>\s*<\/figure>/gi, (match, imgAttrs) => {
    return cleanImgTag(imgAttrs);
  });
  md = md.replace(/<figure class="post__image[^"]*">\s*<img([^>]*?)>\s*<\/figure>/gi, (match, imgAttrs) => {
    return cleanImgTag(imgAttrs);
  });
  
  // If there are standard <img> tags without figure wrappers
  md = md.replace(/<img([^>]*?)\/>/gi, (match, imgAttrs) => cleanImgTag(imgAttrs));
  md = md.replace(/<img([^>]*?)>/gi, (match, imgAttrs) => cleanImgTag(imgAttrs));

  // 4. Strip cell wrapper divs and layout markers
  md = md.replace(/<div id="cell-[^"]*" class="cell">/gi, '');
  md = md.replace(/<div class="cell-wrapper">/gi, '');
  md = md.replace(/<div class="cell-content">/gi, '');
  md = md.replace(/<div class="csl-bib-body">/gi, '');
  md = md.replace(/<div class="csl-entry">/gi, '');
  
  // Strip generic class-less divs
  md = md.replace(/<div>/gi, '');
  
  // Remove closing divs
  md = md.replace(/<\/div>/gi, '\n');

  // Convert HTML headers back to Markdown
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

  // 5. Clean lists: convert <li> items to standard markdown list item format
  md = md.replace(/<li[^>]*>\s*<div[^>]*>\s*<div[^>]*>(.*?)<\/div>\s*<\/div>\s*<\/li>/gim, '- $1\n');
  md = md.replace(/<li[^>]*>\s*<span[^>]*>(.*?)<\/span>\s*<\/li>/gim, '- $1\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gim, '- $1\n');
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');

  // 6. Clean paragraph elements
  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n');

  // 7. Strip cc3 spans
  md = md.replace(/<span class="cc3"[^>]*>(.*?)<\/span>/gi, '$1');
  md = md.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');

  // 8. Clean up non-breaking spaces and double newlines
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/ /g, ' ');
  md = md.replace(/\n\s*\n\s*\n/g, '\n\n');

  return md.trim();
}

function cleanImgTag(imgAttrs) {
  const srcMatch = imgAttrs.match(/src="([^"]+)"/);
  const altMatch = imgAttrs.match(/alt="([^"]*)"/);
  const widthMatch = imgAttrs.match(/width="(\d+)"/);
  const heightMatch = imgAttrs.match(/height="(\d+)"/);

  if (!srcMatch) return '';
  const src = srcMatch[1];
  const alt = altMatch ? altMatch[1] : '';
  const w = widthMatch ? widthMatch[1] : '';
  const h = heightMatch ? heightMatch[1] : '';

  if (w && h) {
    return `![${alt}](${src} =${w}x${h})`;
  } else if (w) {
    return `![${alt}](${src} =${w}x)`;
  } else if (h) {
    return `![${alt}](${src} =x${h})`;
  }
  return `![${alt}](${src})`;
}

// Clean posts
const posts = fs.readdirSync(POSTS_MD_DIR).filter(file => file.endsWith('.md') && file !== 'example-markdown-post.md');
posts.forEach(file => {
  const filePath = path.join(POSTS_MD_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = cleanMarkdown(content);
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log(`Cleaned post: ${file}`);
});

// Clean pages
const pages = fs.readdirSync(PAGES_MD_DIR).filter(file => file.endsWith('.md'));
pages.forEach(file => {
  const filePath = path.join(PAGES_MD_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const cleaned = cleanMarkdown(content);
  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log(`Cleaned page: ${file}`);
});

console.log('Markdown cleanup process completed successfully!');
