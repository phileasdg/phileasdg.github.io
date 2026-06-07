import fs from 'fs';
import path from 'path';

const PAGES_JSON_PATH = './data/pages.json';
const PAGES_HTML_DIR = './content/pages';
const PAGES_MD_DIR = './content/pages/markdown';

if (!fs.existsSync(PAGES_MD_DIR)) {
  fs.mkdirSync(PAGES_MD_DIR, { recursive: true });
}

// Read pages.json
let pages = [];
if (fs.existsSync(PAGES_JSON_PATH)) {
  pages = JSON.parse(fs.readFileSync(PAGES_JSON_PATH, 'utf8'));
}

function extractEntryContent(html) {
  const startTag = '<div class="content__entry">';
  const startIdx = html.indexOf(startTag);
  if (startIdx === -1) return null;
  
  let depth = 1;
  let pos = startIdx + startTag.length;
  
  while (depth > 0 && pos < html.length) {
    if (html.substring(pos, pos + 5) === '<div ' || html.substring(pos, pos + 5) === '<div>') {
      depth++;
      pos += 4;
    } else if (html.substring(pos, pos + 6) === '</div>') {
      depth--;
      if (depth === 0) {
        return html.substring(startIdx + startTag.length, pos);
      }
      pos += 6;
    } else {
      pos++;
    }
  }
  return null;
}

function htmlToMarkdown(html) {
  let md = html.trim();

  // Remove leading/trailing newlines
  md = md.replace(/\r\n/g, '\n');

  // Convert simple paragraph blocks and divs
  md = md.replace(/<div[^>]*>/g, '');
  md = md.replace(/<\/div>/g, '\n');

  // Handle headers
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

  // Handle emphasis
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // Handle links (taking care of absolute/relative paths)
  md = md.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // Handle figures and images (specifically standard pattern on site)
  // Example: <figure class="post__image"><img alt="" height="1797" loading="lazy" sizes="..." src="../../media/posts/6/portrait-new.png" srcset="..." width="2696"/></figure>
  md = md.replace(/<figure[^>]*>\s*<img[^>]*?alt="([^"]*)"[^>]*?src="([^"]*)"[^>]*?>\s*<\/figure>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*?alt="([^"]*)"[^>]*?src="([^"]*)"[^>]*?>/gi, '![$1]($2)');

  // Handle lists
  // We match <li> tags inside <ul>. A simple match-and-replace is easiest.
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // Clean paragraphs
  md = md.replace(/<p[^>]*>/gi, '\n');
  md = md.replace(/<\/p>/gi, '\n');

  // Clean double spaces/newlines
  md = md.replace(/&nbsp;/g, ' ');
  md = md.replace(/ /g, ' '); // Non-breaking space character
  md = md.replace(/\n\s*\n\s*\n/g, '\n\n');

  return md.trim();
}

pages.forEach(page => {
  if (page.slug === 'playgrounds') {
    console.log(`Skipping custom playgrounds page: ${page.slug}`);
    return;
  }

  const htmlFilePath = path.join(PAGES_HTML_DIR, `${page.slug}.html`);
  if (!fs.existsSync(htmlFilePath)) {
    console.warn(`HTML file not found for page ${page.slug}: ${htmlFilePath}`);
    return;
  }

  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  const entryContent = extractEntryContent(htmlContent);

  if (!entryContent) {
    console.warn(`Could not extract entry content for page ${page.slug}`);
    return;
  }

  const mdContent = htmlToMarkdown(entryContent);

  // Generate frontmatter
  const frontmatter = [
    '---',
    `title: "${page.title}"`,
    `body_class: "${page.body_class || 'post-template'}"`,
    `main_class: "${page.main_class || 'post'}"`,
    '---',
    '',
    mdContent
  ].join('\n');

  const mdFilePath = path.join(PAGES_MD_DIR, `${page.slug}.md`);
  fs.writeFileSync(mdFilePath, frontmatter, 'utf8');
  console.log(`Migrated: ${page.slug}.html -> ${page.slug}.md`);
});
