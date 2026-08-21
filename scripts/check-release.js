import fs from 'fs';
import { execSync } from 'child_process';

console.log('--- Checking Release Mode Guard (Inspecting HEAD Git Commit Only) ---');

// 1. Check releaseMode in the latest git commit (HEAD)
try {
  const settingsJson = execSync('git show HEAD:data/settings.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const settings = JSON.parse(settingsJson);
  if (settings.releaseMode !== true) {
    console.error('\n❌ BLOCKED: The latest git commit (HEAD) has "releaseMode": false!\n👉 You must compile in Release Mode and create a commit before pushing.\n');
    process.exit(1);
  }
} catch (e) {
  console.error('\n❌ BLOCKED: data/settings.json is missing from the latest git commit (HEAD)!\n');
  process.exit(1);
}

// 2. Check pages.json in HEAD for draft pages
try {
  const pagesJson = execSync('git show HEAD:data/pages.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const pages = JSON.parse(pagesJson);
  const drafts = pages.filter(p => p.draft);
  if (drafts.length > 0) {
    console.error(`\n❌ BLOCKED: The committed data/pages.json in HEAD contains draft pages: ${drafts.map(d => d.slug).join(', ')}\n👉 Please build and commit in Release Mode before pushing.\n`);
    process.exit(1);
  }
} catch (e) {}

// 3. Check posts.json in HEAD for draft posts
try {
  const postsJson = execSync('git show HEAD:data/posts.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const posts = JSON.parse(postsJson);
  const drafts = posts.filter(p => p.draft || p.published === false || p.status === 'draft');
  if (drafts.length > 0) {
    console.error(`\n❌ BLOCKED: The committed data/posts.json in HEAD contains draft posts: ${drafts.map(d => d.slug).join(', ')}\n`);
    process.exit(1);
  }
} catch (e) {}

// 4. Check menu.json in HEAD for draft menu items
try {
  const menuJson = execSync('git show HEAD:data/menu.json', { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const menu = JSON.parse(menuJson);
  const drafts = menu.filter(item => item.draft);
  if (drafts.length > 0) {
    console.error(`\n❌ BLOCKED: The committed data/menu.json in HEAD contains draft items: ${drafts.map(d => d.title).join(', ')}\n`);
    process.exit(1);
  }
} catch (e) {}

console.log('✅ PASS: The latest git commit (HEAD) has releaseMode: true and zero draft items.');
