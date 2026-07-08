import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..');

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(baseDir, req.url.split('?')[0]);
  if (req.url === '/' || req.url.split('?')[0] === '/') {
    filePath = path.join(baseDir, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  const noCacheHeaders = {
    'Content-Type': contentType,
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        fs.readFile(path.join(baseDir, '404.html'), (err404, content404) => {
          if (err404) {
            res.writeHead(404, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' });
            res.end('<h1>404 Not Found</h1>', 'utf-8');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' });
            res.end(content404, 'utf-8');
          }
        });
      } else {
        res.writeHead(500, { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, noCacheHeaders);
      res.end(content, 'utf-8');
    }
  });
});

let buildTimeout;
function triggerBuild(filename) {
  clearTimeout(buildTimeout);
  buildTimeout = setTimeout(() => {
    console.log(`\n[Watch] File change detected: ${filename}. Rebuilding...`);
    exec('node scripts/build-posts.js', (err, stdout, stderr) => {
      if (err) {
        console.error('[Watch] Build failed:', stderr);
      } else {
        console.log(stdout.trim());
        console.log('[Watch] Build successful!');
      }
    });
  }, 100);
}

// Watch markdown directory recursively (native support on macOS)
const markdownDir = path.join(baseDir, 'markdown');
if (fs.existsSync(markdownDir)) {
  fs.watch(markdownDir, { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.md') || filename.endsWith('.json'))) {
      triggerBuild(`markdown/${filename}`);
    }
  });
}

// Watch content/custom-pages recursively
const customPagesDir = path.join(baseDir, 'content/custom-pages');
if (fs.existsSync(customPagesDir)) {
  fs.watch(customPagesDir, { recursive: true }, (eventType, filename) => {
    if (filename) {
      triggerBuild(`content/custom-pages/${filename}`);
    }
  });
}

// Watch manual data files
const manualDataFiles = [
  'data/resume-en.json',
  'data/resume-fr.json',
  'data/speaking.json',
  'data/playgrounds.json'
];
manualDataFiles.forEach(relPath => {
  const fullPath = path.join(baseDir, relPath);
  if (fs.existsSync(fullPath)) {
    fs.watch(fullPath, (eventType, filename) => {
      triggerBuild(relPath);
    });
  }
});

server.listen(8000, '127.0.0.1', () => {
  console.log('Server running at http://127.0.0.1:8000/');
  console.log('Watching for changes in markdown/, content/custom-pages/, and manual data/ JSON files...');
});
