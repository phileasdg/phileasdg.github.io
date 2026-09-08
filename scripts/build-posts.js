import { initConfig } from '../src/config.js';
import { ensureResponsiveImages } from '../src/images.js';
import { compilePosts, compilePages, generateTagsList } from '../src/compilers.js';
import { fetchOrcidPublications } from './fetch-orcid.js';

async function main() {
  // Initialize configuration and cache-busting
  initConfig();

  // Sync ORCID publications (uses local cache if offline)
  try {
    await fetchOrcidPublications();
  } catch (e) {
    console.warn('Notice: ORCID sync skipped:', e.message);
  }
  
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
