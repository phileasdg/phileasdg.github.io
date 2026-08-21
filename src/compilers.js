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
      ...(mergedData.hideFromHome !== undefined && { hideFromHome: mergedData.hideFromHome }),
      ...(mergedData.draft && { draft: true })
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

  const { includeDrafts } = getBuildSettings();
  if (!includeDrafts) {
    posts = posts.filter(p => !p.draft && p.published !== false && p.status !== 'draft');
  }

  if (isProduction || !includeDrafts) {
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

export function getBuildSettings() {
  const SETTINGS_PATH = './data/settings.json';
  let settings = { releaseMode: false };
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch (e) {}
  }

  const isRelease = Boolean(settings.releaseMode);
  return { releaseMode: isRelease, includeDrafts: !isRelease };
}

export function compilePages() {
  const { mode, includeDrafts } = getBuildSettings();

  console.log(`Compiling pages (${includeDrafts ? 'Dev Mode - including drafts' : 'Release Mode - excluding drafts'})...`);
  const mdFiles = fs.readdirSync(PAGES_MARKDOWN_DIR).filter(file => file.endsWith('.md'));
  const customFiles = fs.existsSync(CUSTOM_PAGES_DIR)
    ? fs.readdirSync(CUSTOM_PAGES_DIR).filter(file => file.endsWith('.html') && !file.startsWith('_'))
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

    const existingMeta = existingPages.find(p => p.slug === slug) || {};
    const mergedData = { ...existingMeta, ...data };

    const bodyHtml = parseMarkdown(content);
    const finalHtml = `<div class="wrapper"><article class="content"><header class="content__header"><h1 class="content__title">${mergedData.title || slug}</h1></header><div class="content__inner"><div class="content__entry">${bodyHtml}</div><footer><div class="content__tags-share"><aside class="content__share"></aside></div></footer></div></article></div>`;

    fs.writeFileSync(path.join(PAGES_OUTPUT_HTML_DIR, `${slug}.html`), finalHtml, 'utf8');

    const metadata = {
      slug: slug,
      title: mergedData.title || slug,
      body_class: mergedData.body_class || 'post-template',
      main_class: mergedData.main_class || 'post',
      ...(mergedData.draft && { draft: true })
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

    const fileContent = fs.readFileSync(srcPath, 'utf8');

    const existingMeta = existingPages.find(p => p.slug === slug) || {};
    let isDraft = Boolean(existingMeta.draft);
    let pageTitle = existingMeta.title || (slug.charAt(0).toUpperCase() + slug.slice(1));
    let bodyClass = existingMeta.body_class || 'post-template';
    let mainClass = existingMeta.main_class || 'post';

    const commentMatch = fileContent.match(/^<!--\s*([\s\S]*?)\s*-->/);
    if (commentMatch) {
      const metaLines = commentMatch[1].split('\n');
      metaLines.forEach(line => {
        const [key, ...valParts] = line.split(':');
        if (key && valParts.length > 0) {
          const val = valParts.join(':').trim();
          const k = key.trim().toLowerCase();
          if (k === 'draft') isDraft = (val === 'true' || val === '1');
          if (k === 'title') pageTitle = val;
          if (k === 'body_class') bodyClass = val;
          if (k === 'main_class') mainClass = val;
        }
      });
    }

    const cleanContent = fileContent.replace(/^<!--\s*[\s\S]*?\s*-->\s*/, '');
    fs.writeFileSync(destPath, cleanContent, 'utf8');
    console.log(`  Compiled custom page: ${file} -> ${destPath}`);

    const metadata = {
      slug: slug,
      title: pageTitle,
      body_class: bodyClass,
      main_class: mainClass,
      ...(isDraft && { draft: true })
    };

    updatedPages.push(metadata);
  });

  // Sort pages
  const orderMap = {
    'guest-lectures-and-public-speaking-events': 1,
    'publications': 2,
    'art': 3,
    'playgrounds': 4,
    'a-few-words-about-me': 5,
    'about': 5,
    'resume-cv': 6,
    'resume-english': 7,
    'cv-francais': 8,
    'inquiries': 9
  };

  updatedPages.sort((a, b) => {
    const orderA = orderMap[a.slug] || 99;
    const orderB = orderMap[b.slug] || 99;
    return orderA - orderB;
  });

  // Filter pages for publication
  const pagesToPublish = includeDrafts
    ? updatedPages
    : updatedPages.filter(p => !p.draft);

  // In release mode, clean up draft HTML directories from disk and git tracking
  if (!includeDrafts) {
    updatedPages.filter(p => p.draft).forEach(p => {
      const draftDir = `./pages/${p.slug}`;
      if (fs.existsSync(draftDir)) {
        fs.rmSync(draftDir, { recursive: true, force: true });
        console.log(`  [Release Mode] Excluded draft page directory from release build: ${draftDir}`);
      }
    });
  }

  if (indexHtmlTemplate) {
    pagesToPublish.forEach(p => {
      const pageDir = `./pages/${p.slug}`;
      if (!fs.existsSync(pageDir)) {
        fs.mkdirSync(pageDir, { recursive: true });
      }
      let pageShell = indexHtmlTemplate;
      pageShell = pageShell.replace(/<title>.*?<\/title>/, `<title>${p.title} - Phileas Dazeley-Gaist</title>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" property="og:title"\/>/, `<meta content="${p.title}" property="og:title"/>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" name="twitter:title"\/>/, `<meta content="${p.title}" name="twitter:title"/>`);
      pageShell = pageShell.replace(/<meta content="[^"]*" property="og:url"\/>/, `<meta content="https://phileasdg.github.io/pages/${p.slug}/" property="og:url"/>`);
      pageShell = pageShell.replace(/<head>/, `<head><script>window._PRE_RENDERED = true;</script>`);
      fs.writeFileSync(path.join(pageDir, 'index.html'), pageShell, 'utf8');
    });
  }

  fs.writeFileSync(PAGES_JSON_PATH, JSON.stringify(updatedPages, null, 2), 'utf8');
  console.log(`Successfully compiled pages and updated: ${PAGES_JSON_PATH}`);

  compileMenu(updatedPages);
  updateReadmeDocs();
}

export function compileMenu(allPages = []) {
  const MENU_JSON_PATH = './data/menu.json';
  if (!fs.existsSync(MENU_JSON_PATH)) return;

  const { includeDrafts } = getBuildSettings();
  console.log(`Compiling menu (${includeDrafts ? 'Dev Mode - including draft items' : 'Release Mode - excluding draft items'})...`);

  try {
    let menu = JSON.parse(fs.readFileSync(MENU_JSON_PATH, 'utf8'));

    // Collect draft URLs from pages and posts
    const draftUrls = new Set();

    allPages.filter(p => p.draft).forEach(p => {
      draftUrls.add(`/pages/${p.slug}/`);
      draftUrls.add(`/pages/${p.slug}`);
    });

    if (fs.existsSync(POSTS_JSON_PATH)) {
      try {
        const posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));
        posts.filter(p => p.draft || p.published === false || p.status === 'draft').forEach(p => {
          draftUrls.add(`/posts/${p.slug}/`);
          draftUrls.add(`/posts/${p.slug}`);
        });
      } catch (e) {}
    }

    if (includeDrafts) {
      // In Dev Mode: Ensure all pages from allPages exist in menu if not present
      allPages.forEach(p => {
        const pageUrl = `/pages/${p.slug}/`;
        const exists = menu.some(item => item.url === pageUrl || item.url === `/pages/${p.slug}`);
        const hiddenPages = ['resume-english', 'cv-francais', 'wolfram-contributions-and-publications'];
        if (!exists && !hiddenPages.includes(p.slug)) {
          const title = p.slug === 'art' ? 'Art' : (p.title || p.slug);
          const pubIndex = menu.findIndex(item => item.title === 'Publications');
          if (pubIndex !== -1) {
            menu.splice(pubIndex + 1, 0, { title: title, url: pageUrl });
          } else {
            menu.push({ title: title, url: pageUrl });
          }
        }
      });
    } else {
      // In Release Mode: Exclude draft items
      menu = menu.filter(item => {
        if (item.draft) return false;
        if (item.url && draftUrls.has(item.url)) {
          console.log(`  [Release Mode] Automatically excluded draft item from navbar: ${item.title} (${item.url})`);
          return false;
        }
        return true;
      });
    }

    fs.writeFileSync(MENU_JSON_PATH, JSON.stringify(menu, null, 2), 'utf8');
  } catch (err) {
    console.error('Error compiling menu:', err);
  }
}

export function updateReadmeDocs() {
  const README_PATH = './README.md';
  const SCRIPTS_JSON_PATH = './data/scripts.json';
  const PACKAGE_JSON_PATH = './package.json';
  if (!fs.existsSync(README_PATH)) return;

  // Auto-discover any new scripts added to package.json
  if (fs.existsSync(PACKAGE_JSON_PATH)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
      const pkgScripts = pkg.scripts || {};
      let scriptsData = [];
      if (fs.existsSync(SCRIPTS_JSON_PATH)) {
        scriptsData = JSON.parse(fs.readFileSync(SCRIPTS_JSON_PATH, 'utf8'));
      }

      let scriptsUpdated = false;
      Object.keys(pkgScripts).forEach(name => {
        if (!scriptsData.find(s => s.name === name)) {
          scriptsData.push({
            name: name,
            command: `npm run ${name}`,
            description: `Executes \`${pkgScripts[name]}\`.`
          });
          scriptsUpdated = true;
        }
      });

      if (scriptsUpdated) {
        fs.writeFileSync(SCRIPTS_JSON_PATH, JSON.stringify(scriptsData, null, 2), 'utf8');
      }
    } catch (e) {}
  }

  let readme = fs.readFileSync(README_PATH, 'utf8');
  let originalReadme = readme;

  if (fs.existsSync(SCRIPTS_JSON_PATH)) {
    try {
      const scripts = JSON.parse(fs.readFileSync(SCRIPTS_JSON_PATH, 'utf8'));
      let tableMd = '| Command | Description |\n| :--- | :--- |\n';
      scripts.forEach(s => {
        tableMd += `| \`${s.command}\` | ${s.description} |\n`;
      });

      const scriptRegex = /<!-- SCRIPTS_TABLE_START -->[\s\S]*?<!-- SCRIPTS_TABLE_END -->/;
      if (scriptRegex.test(readme)) {
        readme = readme.replace(scriptRegex, `<!-- SCRIPTS_TABLE_START -->\n${tableMd}<!-- SCRIPTS_TABLE_END -->`);
      }
    } catch (e) {}
  }

  if (readme !== originalReadme) {
    fs.writeFileSync(README_PATH, readme, 'utf8');
    console.log('Successfully updated README.md documentation table.');
  }
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

  if (indexHtmlTemplate) {
    const tagsDir = './tags';
    if (!fs.existsSync(tagsDir)) fs.mkdirSync(tagsDir, { recursive: true });
    let tagsShell = indexHtmlTemplate
      .replace(/<title>.*?<\/title>/, `<title>Tags Index - Phileas Dazeley-Gaist</title>`)
      .replace(/<meta content="[^"]*" property="og:title"\/>/, `<meta content="Tags Index" property="og:title"/>`)
      .replace(/<meta content="[^"]*" property="og:url"\/>/, `<meta content="https://phileasdg.github.io/tags/" property="og:url"/>`);
    fs.writeFileSync(path.join(tagsDir, 'index.html'), tagsShell, 'utf8');

    const graphDir = './tags/graph';
    if (!fs.existsSync(graphDir)) fs.mkdirSync(graphDir, { recursive: true });
    let graphShell = indexHtmlTemplate
      .replace(/<title>.*?<\/title>/, `<title>Tag Network - Phileas Dazeley-Gaist</title>`)
      .replace(/<meta content="[^"]*" property="og:title"\/>/, `<meta content="Tag Network" property="og:title"/>`)
      .replace(/<meta content="[^"]*" property="og:url"\/>/, `<meta content="https://phileasdg.github.io/tags/graph/" property="og:url"/>`);
    fs.writeFileSync(path.join(graphDir, 'index.html'), graphShell, 'utf8');
  }
}
