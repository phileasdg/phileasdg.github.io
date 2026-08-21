import { execSync } from 'child_process';
import fs from 'fs';

console.log('--- Checking Release Mode Guard ---');

let targetRef = 'HEAD';

if (!process.stdin.isTTY) {
  try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (input) {
      const parts = input.split(/\s+/);
      if (parts[1] && parts[1] !== '0000000000000000000000000000000000000000') {
        targetRef = parts[1];
      }
    }
  } catch (e) {}
}

try {
  const settingsJson = execSync(`git show ${targetRef}:data/settings.json`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
  const settings = JSON.parse(settingsJson);

  if (settings.releaseMode !== true) {
    console.error(`\n❌ BLOCKED: The commit being pushed (${targetRef}) has "releaseMode": false in data/settings.json!\n👉 Switch to Release Mode, build, commit, and push.\n`);
    process.exit(1);
  }

  console.log(`✅ PASS: The commit being pushed has releaseMode: true in data/settings.json.`);
} catch (e) {
  console.error(`\n❌ BLOCKED: Could not inspect data/settings.json in commit ${targetRef}.\n`);
  process.exit(1);
}


