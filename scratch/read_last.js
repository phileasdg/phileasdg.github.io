import fs from 'fs';
import path from 'path';

const logPath = "/Users/phileasdazeleygaist/.gemini/antigravity-ide/brain/b163e65e-e821-48cb-9c72-cfc6d3aef175/.system_generated/logs/transcript.jsonl";
const outPath = "./scratch/last_lines.txt";

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');
const lastLines = lines.slice(-100);

fs.writeFileSync(outPath, lastLines.join('\n'), 'utf8');
console.log(`Successfully read last ${lastLines.length} lines`);
