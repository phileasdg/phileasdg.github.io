import fs from 'fs';
import path from 'path';

const POSTS_JSON_PATH = './data/posts.json';
const POSTS_HTML_DIR = './content/posts';
const MARKDOWN_OUTPUT_DIR = './content/posts/markdown';

if (!fs.existsSync(MARKDOWN_OUTPUT_DIR)) {
  fs.mkdirSync(MARKDOWN_OUTPUT_DIR, { recursive: true });
}

function htmlToMarkdown(html) {
  let md = html.replace(/\r\n/g, '\n').trim();

  // Keep code blocks intact: replace <pre><code class="language-xyz">...</code></pre> with ```xyz...```
  const codeBlocks = [];
  md = md.replace(/<pre><code class="language-([^"]+)">([\s\S]*?)<\/code><\/pre>/gi, (match, lang, code) => {
    codeBlocks.push({ lang, code: code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') });
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });
  md = md.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    codeBlocks.push({ lang: '', code: code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&') });
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });

  // Preserve complex HTML blocks (like figure, iframe, div) as-is by converting them temporarily to placeholders
  const htmlBlocks = [];
  md = md.replace(/(<figure[\s\S]*?<\/figure>|<iframe[\s\S]*?<\/iframe>|<div[\s\S]*?<\/div>)/gi, (match) => {
    htmlBlocks.push(match);
    return `\n\n%%HTMLBLOCK_${htmlBlocks.length - 1}%%\n\n`;
  });

  // Replace tags
  md = md.replace(/<h2>(.*?)<\/h2>/gi, '\n\n## $1\n\n');
  md = md.replace(/<h3>(.*?)<\/h3>/gi, '\n\n### $1\n\n');
  md = md.replace(/<h1>(.*?)<\/h1>/gi, '\n\n# $1\n\n');

  // Handle lists: we process <ul> and <ol> blocks
  // For simplicity, convert <li> items inside <ul> to "- text" and inside <ol> to "1. text"
  md = md.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, listContent) => {
    return '\n\n' + listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n').trim() + '\n\n';
  });
  md = md.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, listContent) => {
    let index = 1;
    return '\n\n' + listContent.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (m, liText) => `${index++}. ${liText}\n`).trim() + '\n\n';
  });

  // Simple list item replacements if any are left outside ul/ol
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');

  // Replace paragraphs with double newline
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n\n$1\n\n');

  // Inline formatting
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');

  // Images: <img src="url" alt="text" ...> -> ![text](url)
  md = md.replace(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]+alt="([^"]*)"[^>]+src="([^"]+)"[^>]*>/gi, '![$1]($2)');

  // Links: <a href="url" ...>text</a> -> [text](url)
  md = md.replace(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Restore HTML blocks
  md = md.replace(/%%HTMLBLOCK_(\d+)%%/g, (match, index) => {
    return htmlBlocks[Number(index)].trim();
  });

  // Restore code blocks
  md = md.replace(/%%CODEBLOCK_(\d+)%%/g, (match, index) => {
    const block = codeBlocks[Number(index)];
    return `\n\n\`\`\`${block.lang}\n${block.code.trim()}\n\`\`\`\n\n`;
  });

  // Clean up whitespace
  md = md.replace(/\n{3,}/g, '\n\n').trim();

  return md;
}

if (!fs.existsSync(POSTS_JSON_PATH)) {
  console.error('posts.json not found!');
  process.exit(1);
}

const posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));

posts.forEach(post => {
  // Don't migrate the example post, we already have it in markdown
  if (post.slug === 'example-markdown-post') return;

  const htmlPath = path.join(POSTS_HTML_DIR, `${post.slug}.html`);
  const mdPath = path.join(MARKDOWN_OUTPUT_DIR, `${post.slug}.md`);

  if (fs.existsSync(htmlPath)) {
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const mdBody = htmlToMarkdown(htmlContent);

    // Build frontmatter
    const frontmatter = [
      '---',
      `title: "${post.name.replace(/"/g, '\\"')}"`,
      `date: "${post.date}"`,
      `tags: ${JSON.stringify(post.tags)}`,
      `thumbnail: "${post.thumbnail || ''}"`,
      post.thumbWidth !== undefined ? `thumbWidth: ${post.thumbWidth}` : null,
      post.thumbHeight !== undefined ? `thumbHeight: ${post.thumbHeight}` : null,
      post.date_modified !== undefined ? `date_modified: "${post.date_modified}"` : null,
      post.date_published !== undefined ? `date_published: "${post.date_published}"` : null,
      post.hideFromHome !== undefined ? `hideFromHome: ${post.hideFromHome}` : null,
      '---',
      '',
      mdBody
    ].filter(line => line !== null).join('\n');

    fs.writeFileSync(mdPath, frontmatter, 'utf8');
    console.log(`Migrated: ${post.slug}.html -> markdown/${post.slug}.md`);
  } else {
    console.warn(`HTML file not found for post: ${post.slug}`);
  }
});

console.log('All migrations completed!');
