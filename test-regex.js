const fs = require('fs');
const content = fs.readFileSync('markdown/posts/terrestrial-ecoregions-of-the-world-computational-insights-into-global-biodiversity.md', 'utf8');
const iconizeRegex = /Iconize\s*\[[\s\S]*?\]/gi;
let match;
while ((match = iconizeRegex.exec(content)) !== null) {
  console.log("Found match length:", match[0].length);
  const matchStr = match[0];
  const labelMatch = matchStr.match(/,\s*(?:&quot;|")([^"&]+)(?:&quot;|")\s*\]$/i);
  console.log("Label:", labelMatch ? labelMatch[1] : null);
}
