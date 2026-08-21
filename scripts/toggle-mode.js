import fs from 'fs';

const SETTINGS_PATH = './data/settings.json';
let settings = { releaseMode: false };

if (fs.existsSync(SETTINGS_PATH)) {
  try {
    settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  } catch (e) {
    console.error('Error reading data/settings.json:', e);
  }
}

const newReleaseMode = !settings.releaseMode;
fs.writeFileSync(SETTINGS_PATH, JSON.stringify({ releaseMode: newReleaseMode }, null, 2), 'utf8');
console.log(`\n🔄 Switched releaseMode in data/settings.json to: ${newReleaseMode} (${newReleaseMode ? 'RELEASE - drafts excluded' : 'DEV - drafts included'})\n`);
