import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = './data/settings.json';
const PAGES_JSON_PATH = './data/pages.json';
const POSTS_JSON_PATH = './data/posts.json';

console.log('--- Checking Release Mode Guard ---');

if (!fs.existsSync(SETTINGS_PATH)) {
  console.error('❌ FAIL: data/settings.json does not exist!');
  process.exit(1);
}

let settings = {};
try {
  settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
} catch (e) {
  console.error('❌ FAIL: Could not parse data/settings.json');
  process.exit(1);
}

if (settings.releaseMode !== true) {
  console.error('\n❌ BLOCKED: Pushing to remote is forbidden when "releaseMode" is false in data/settings.json!\n👉 Please set "releaseMode": true in data/settings.json (or run npm run toggle-mode) before pushing.\n');
  process.exit(1);
}

if (fs.existsSync(PAGES_JSON_PATH)) {
  const pages = JSON.parse(fs.readFileSync(PAGES_JSON_PATH, 'utf8'));
  const drafts = pages.filter(p => p.draft);
  if (drafts.length > 0) {
    console.error(`\n❌ BLOCKED: pages.json still contains draft pages: ${drafts.map(d => d.slug).join(', ')}\n`);
    process.exit(1);
  }
}

if (fs.existsSync(POSTS_JSON_PATH)) {
  const posts = JSON.parse(fs.readFileSync(POSTS_JSON_PATH, 'utf8'));
  const drafts = posts.filter(p => p.draft || p.published === false || p.status === 'draft');
  if (drafts.length > 0) {
    console.error(`\n❌ BLOCKED: posts.json still contains draft posts: ${drafts.map(d => d.slug).join(', ')}\n`);
    process.exit(1);
  }
}

console.log('✅ PASS: releaseMode is true and release build contains zero draft items.');
