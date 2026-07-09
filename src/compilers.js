import fs from 'fs';
import path from 'path';
import { 
  POSTS_MARKDOWN_DIR, POSTS_OUTPUT_HTML_DIR, POSTS_JSON_PATH, 
  PAGES_MARKDOWN_DIR, PAGES_OUTPUT_HTML_DIR, PAGES_JSON_PATH, 
  CUSTOM_PAGES_DIR, indexHtmlTemplate, isProduction 
} from './config.js';
import { parseFrontMatter } from './frontmatter.js';
import { parseMarkdown } from './parser.js';
import { renderResumeHTML } from './renderers.js';

export function compilePosts() {
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

    const finalHtml = parseMarkdown(content);
    fs.writeFileSync(path.join(POSTS_OUTPUT_HTML_DIR, `${slug}.html`), finalHtml, 'utf8');

    if (indexHtmlTemplate) {
      let pageShell = indexHtmlTemplate;
      const title = data.title || slug;
      pageShell = pageShell.replace(/<title>.*?<\/title>/, `<title>${title} - Phileas Dazeley-Gaist</title>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" property="og:title"\/>/, `<meta content="${title}" property="og:title"/>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" name="twitter:title"\/>/, `<meta content="${title}" name="twitter:title"/>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" property="og:url"\/>/, `<meta content="https://phileasdg.github.io/pages/${slug}/" property="og:url"/>`);
      
      const pageDir = `./pages/${slug}`;
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      fs.writeFileSync(path.join(pageDir, 'index.html'), pageShell, 'utf8');
    }

    if (indexHtmlTemplate) {
      let postShell = indexHtmlTemplate;
      const title = mergedData.title || mergedData.name || slug;
      postShell = postShell.replace(/<title>.*?<\/title>/, `<title>${title} - Phileas Dazeley-Gaist</title>`);
      postShell = postShell.replace(/<meta content="[^"]*" property="og:title"\/>/, `<meta content="${title}" property="og:title"/>`);
      postShell = postShell.replace(/<meta content="[^"]*" name="twitter:title"\/>/, `<meta content="${title}" name="twitter:title"/>`);
      
      if (mergedData.excerpt) {
        const desc = mergedData.excerpt.replace(/"/g, '&quot;');
        postShell = postShell.replace(/<meta content="[^"]*" property="og:description"\/>/, `<meta content="${desc}" property="og:description"/>`);
        postShell = postShell.replace(/<meta content="[^"]*" name="twitter:description"\/>/, `<meta content="${desc}" name="twitter:description"/>`);
      }
      
      postShell = postShell.replace(/<meta content="[^"]*" property="og:url"\/>/, `<meta content="https://phileasdg.github.io/posts/${slug}/" property="og:url"/>`);
      
      if (mergedData.thumbnail) {
        const imgUrl = `https://phileasdg.github.io/${mergedData.thumbnail.replace(/^\//, '')}`;
        postShell = postShell.replace(/<\/head>/, `<meta property="og:image" content="${imgUrl}"/><meta name="twitter:image" content="${imgUrl}"/></head>`);
      }

      // Add base path script for nested routes so asset paths resolve correctly
      postShell = postShell.replace(/<head>/, `<head><script>window._PRE_RENDERED = true;</script>`);
      
      const postDir = `./posts/${slug}`;
      if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
      }
      fs.writeFileSync(path.join(postDir, 'index.html'), postShell, 'utf8');
    }


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

export function compilePages() {
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

export function generateTagsList() {
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
  mdContent += `This file is automatically generated by the build script (\`scripts/build-posts.js\`). Do not edit it manually.\n\n`;
  mdContent += `| Tag | Total Count | Posts | Playgrounds |\n`;
  mdContent += `| --- | --- | --- | --- |\n`;
  sortedTags.forEach(t => {
    mdContent += `| ${t.name} | ${t.count} | ${t.posts} | ${t.playgrounds} |\n`;
  });

  fs.writeFileSync('./TAGS.md', mdContent, 'utf8');
  console.log('Successfully generated TAGS.md');
}
