import fs from 'fs';

const cssPath = 'assets/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// The first version we added
const firstVersion = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa}.code-block-wrapper pre{margin:0!important;border:none!important;border-radius:0!important;padding:0.8rem 1rem!important;padding-right:6.5rem!important;overflow-x:auto}.code-block-header{position:absolute;top:6px;right:6px;z-index:10;display:flex;align-items:center;gap:6px;background:rgba(246, 248, 250, 0.85);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:1px solid rgba(225, 228, 230, 0.8);border-radius:4px;padding:2px 6px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.6rem;color:#586069;font-weight:500;user-select:none}.code-block-lang{text-transform:uppercase;font-size:0.55rem;letter-spacing:0.03em;opacity:0.8;border-right:1px solid #e1e4e8;padding-right:6px;margin-right:2px}.code-block-copy-btn{background:transparent;border:none;border-radius:3px;color:#007AA5;cursor:pointer;padding:1px 4px;font-size:0.6rem;font-weight:600;transition:all 0.1s ease-in-out}.code-block-copy-btn:hover{background:rgba(0,0,0,0.05);color:#101011}.code-block-copy-btn.copied{background:#28a745;color:#ffffff;padding:1px 6px}';

// The new simplified version (no double borders, no backgrounds, no glow)
const simplifiedVersion = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa}.code-block-wrapper pre,.code-block-wrapper pre[class*="language-"]{margin:0!important;border:none!important;border-radius:0!important;background:transparent!important;padding:0.8rem 1rem!important;padding-right:6.5rem!important;overflow-x:auto;box-shadow:none!important}.code-block-header{position:absolute;top:8px;right:12px;z-index:10;display:flex;align-items:center;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.6rem;color:#888888;user-select:none}.code-block-lang{text-transform:uppercase;font-size:0.55rem;letter-spacing:0.03em;opacity:0.7}.code-block-lang::after{content:"|";margin-left:8px;opacity:0.5}.code-block-copy-btn{background:transparent;border:none;color:#007AA5;cursor:pointer;padding:0;font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;transition:all 0.1s ease-in-out}.code-block-copy-btn:hover{color:#101011;text-decoration:underline}.code-block-copy-btn.copied{color:#28a745}';

if (css.includes(firstVersion)) {
  css = css.replace(firstVersion, simplifiedVersion);
  console.log('Successfully updated first version styles in style.css to simplified styles');
} else {
  // If not found (e.g. if it had some variations), let's append it
  css += '\n' + simplifiedVersion;
  console.log('Appended simplified style rules as fallback in style.css');
}

fs.writeFileSync(cssPath, css, 'utf8');
