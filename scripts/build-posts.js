import { initConfig } from '../src/config.js';
import { ensureResponsiveImages } from '../src/images.js';
import { compilePosts, compilePages, generateTagsList } from '../src/compilers.js';

async function main() {
  // Initialize configuration and cache-busting
  initConfig();
  
  // Run compilation steps
  await ensureResponsiveImages();
  compilePosts();
  compilePages();
  generateTagsList();
}

main().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
