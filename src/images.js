import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { POSTS_MARKDOWN_DIR, PAGES_MARKDOWN_DIR } from './config.js';
import { parseFrontMatter } from './frontmatter.js';

// Helper to find responsive variants of an image on disk and build srcset/sizes attributes
export function getResponsiveSrcsetAndSizes(imgPath) {
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

export async function ensureResponsiveImages() {
  console.log('Checking and generating missing responsive images...');
  const sizes = [
    { suffix: '-xs', width: 300 },
    { suffix: '-sm', width: 480 },
    { suffix: '-md', width: 768 },
    { suffix: '-lg', width: 1200 }
  ];

  const filesToScan = [];
  const addFiles = (dir) => {
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir).forEach(file => {
        if (file.endsWith('.md')) filesToScan.push(path.join(dir, file));
      });
    }
  };
  addFiles(POSTS_MARKDOWN_DIR);
  addFiles(PAGES_MARKDOWN_DIR);

  const imagesToCheck = new Set();
  
  for (const filePath of filesToScan) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = parseFrontMatter(fileContent);
    
    if (data.thumbnail) imagesToCheck.add(data.thumbnail);
    
    const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const parts = match[2].trim().split(/\s+/);
      imagesToCheck.add(parts[0]);
    }
    
    const htmlImgRegex = /<img[^>]+src="([^">]+)"/gi;
    while ((match = htmlImgRegex.exec(content)) !== null) {
      imagesToCheck.add(match[1]);
    }
  }

  for (let imgPath of imagesToCheck) {
    let cleanPath = imgPath.replace(/^https?:\/\/phileasdg\.github\.io\//, '/');
    cleanPath = cleanPath.replace(/^(\.\.\/)+/, '');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    
    const fullLocalPath = path.resolve(cleanPath);
    if (!fs.existsSync(fullLocalPath)) continue;

    const dir = path.dirname(cleanPath);
    const ext = path.extname(cleanPath);
    if (!ext || ext.toLowerCase() === '.svg' || ext.toLowerCase() === '.gif') continue;
    
    const base = path.basename(cleanPath, ext);
    const responsiveDir = path.join(dir, 'responsive');
    
    let generatedAny = false;
    for (const size of sizes) {
      const outPath = path.join(responsiveDir, `${base}${size.suffix}${ext}`);
      if (!fs.existsSync(outPath)) {
        if (!generatedAny) {
          if (!fs.existsSync(responsiveDir)) {
            fs.mkdirSync(responsiveDir, { recursive: true });
          }
          generatedAny = true;
        }
        console.log(`  Generating responsive image: ${outPath}`);
        try {
          await sharp(fullLocalPath).resize({ width: size.width, withoutEnlargement: true }).toFile(outPath);
        } catch (err) {
          console.error(`  Failed to process ${outPath}:`, err.message);
        }
      }
    }
  }
}
