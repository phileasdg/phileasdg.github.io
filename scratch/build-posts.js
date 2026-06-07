import fs from 'fs';
import path from 'path';

const MARKDOWN_DIR = './content/posts/markdown';
const OUTPUT_HTML_DIR = './content/posts';
const POSTS_JSON_PATH = './data/posts.json';

// Ensure directories exist
if (!fs.existsSync(MARKDOWN_DIR)) {
  fs.mkdirSync(MARKDOWN_DIR, { recursive: true });
}

// Simple Markdown parser
function parseMarkdown(md) {
  let html = md.replace(/\r\n/g, '\n');

  const lines = html.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
      } else {
        const lang = line.trim().slice(3).trim() || 'plaintext';
        result.push(`<pre><code class="language-${lang}">`);
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
      result.push(escaped);
      continue;
    }

    // Process inline markdown for non-code block lines
    let processedLine = line.trim();

    // 1. Temporarily extract HTML tags to prevent modifying them
    const htmlTags = [];
    processedLine = processedLine.replace(/<[^>]+>/g, (match) => {
      htmlTags.push(match);
      return `%%HTMLTAGPLACEHOLDER${htmlTags.length - 1}%%`;
    });

    // 2. Temporarily extract inline code to prevent formatting inside backticks
    const codeBlocks = [];
    processedLine = processedLine.replace(/`([^`]+)`/g, (match, code) => {
      codeBlocks.push(code);
      return `%%CODEPLACEHOLDER${codeBlocks.length - 1}%%`;
    });

    // 3. Images (must be BEFORE links)
    processedLine = processedLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // 4. Links
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 5. Headers (must match start of line, but we trimmed leading spaces)
    processedLine = processedLine.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    processedLine = processedLine.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    processedLine = processedLine.replace(/^# (.*$)/gim, '<h1>$1</h1>');

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
      if (processedLine.startsWith('<h') || processedLine.startsWith('<ul') || processedLine.startsWith('<li') || processedLine.startsWith('<div') || processedLine.startsWith('<p') || processedLine.startsWith('<figure') || processedLine.startsWith('<iframe') || processedLine.startsWith('</') || processedLine.startsWith('<pre') || processedLine.startsWith('<img')) {
        result.push(processedLine);
      } else {
        result.push(`<p>${processedLine}</p>`);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }
  if (inCodeBlock) {
    result.push('</code></pre>');
  }

  return result.join('\n');
}

// Simple Frontmatter parser
function parseFrontMatter(fileContent) {
  const parts = fileContent.split('---');
  if (parts.length < 3) {
    return { data: {}, content: fileContent };
  }
  const frontmatterText = parts[1];
  const content = parts.slice(2).join('---').trim();

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

// Read all markdown files
const mdFiles = fs.readdirSync(MARKDOWN_DIR).filter(file => file.endsWith('.md'));

// Read existing posts.json
let posts = [];
if (fs.existsSync(POSTS_JSON_PATH)) {
  try {
    posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));
  } catch (err) {
    console.error('Error reading posts.json:', err);
  }
}

// Process each markdown file
mdFiles.forEach(file => {
  const filePath = path.join(MARKDOWN_DIR, file);
  const fileContent = fs.readFileSync(filePath, 'utf8');
  
  // Parse frontmatter and content
  const { data, content } = parseFrontMatter(fileContent);
  const slug = data.slug || path.basename(file, '.md');
  const htmlContent = parseMarkdown(content);
  
  // Write compiled HTML
  fs.writeFileSync(path.join(OUTPUT_HTML_DIR, `${slug}.html`), htmlContent, 'utf8');
  
  // Prepare metadata entry
  const metadata = {
    id: data.id || slug,
    name: data.title || data.name || slug,
    slug: slug,
    date: data.date || new Date().toISOString().substring(0, 16),
    tags: data.tags || [],
    thumbnail: data.thumbnail || "",
    ...(data.thumbWidth !== undefined && { thumbWidth: Number(data.thumbWidth) }),
    ...(data.thumbHeight !== undefined && { thumbHeight: Number(data.thumbHeight) }),
    ...(data.date_modified !== undefined && { date_modified: data.date_modified }),
    ...(data.date_published !== undefined && { date_published: data.date_published })
  };

  // Merge/Upsert into posts array
  const existingIndex = posts.findIndex(p => p.slug === slug);
  if (existingIndex > -1) {
    posts[existingIndex] = { ...posts[existingIndex], ...metadata };
  } else {
    posts.push(metadata);
  }
  
  console.log(`Compiled: ${file} -> ${slug}.html`);
});

// Sort posts by date descending
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Save posts.json with pretty print
fs.writeFileSync(POSTS_JSON_PATH, JSON.stringify(posts, null, 2), 'utf8');
console.log(`Successfully compiled posts and updated: ${POSTS_JSON_PATH}`);
