import fs from 'fs';

const cssPath = 'assets/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Change img[loading]{opacity:0} to img[loading]{opacity:1}
css = css.replace('img[loading]{opacity:0}', 'img[loading]{opacity:1}');

// 2. Locate the minified code block styles at the end and replace them with the compact overlays
const targetCodeStyles = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa;overflow:hidden}.code-block-wrapper pre{margin:0!important;border:none!important;border-radius:0!important;padding:0.6rem 0.8rem!important}.code-block-header{display:flex;justify-content:space-between;align-items:center;background:#fafbfc;padding:0.3rem 0.8rem;border-bottom:1px solid #e1e4e8;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.7rem;color:#586069;font-weight:500;user-select:none}.code-block-copy-btn{background:transparent;border:1px solid #e1e4e8;border-radius:3px;color:#586069;cursor:pointer;padding:0.1rem 0.4rem;font-size:0.65rem;font-weight:500;transition:all .1s ease-in-out}.code-block-copy-btn:hover{background:#f3f4f6;color:#24292e;border-color:#d1d5da}.code-block-copy-btn.copied{background:#28a745;color:#fff;border-color:#28a745}';

const newCompactCodeStyles = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa}.code-block-wrapper pre{margin:0!important;border:none!important;border-radius:0!important;padding:0.8rem 1rem!important;padding-right:6.5rem!important;overflow-x:auto}.code-block-header{position:absolute;top:6px;right:6px;z-index:10;display:flex;align-items:center;gap:6px;background:rgba(246, 248, 250, 0.85);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);border:1px solid rgba(225, 228, 230, 0.8);border-radius:4px;padding:2px 6px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.6rem;color:#586069;font-weight:500;user-select:none}.code-block-lang{text-transform:uppercase;font-size:0.55rem;letter-spacing:0.03em;opacity:0.8;border-right:1px solid #e1e4e8;padding-right:6px;margin-right:2px}.code-block-copy-btn{background:transparent;border:none;border-radius:3px;color:#007AA5;cursor:pointer;padding:1px 4px;font-size:0.6rem;font-weight:600;transition:all 0.1s ease-in-out}.code-block-copy-btn:hover{background:rgba(0,0,0,0.05);color:#101011}.code-block-copy-btn.copied{background:#28a745;color:#ffffff;padding:1px 6px}';

const tableStyles = '.post__table-wrapper{width:100%;overflow-x:auto;margin:1.5rem 0;border:1px solid var(--light,#d5d5d5);border-radius:var(--border-radius,8px);background:var(--white,#ffffff);box-shadow:0 4px 12px rgba(0,0,0,0.02);-webkit-overflow-scrolling:touch}.post__table-wrapper table{width:100%;border-collapse:collapse;border-spacing:0;margin:0!important;font-size:0.9rem;line-height:1.5;text-align:left;border:none}.post__table-wrapper th,.post__table-wrapper td{padding:0.75rem 1rem;border-bottom:1px solid var(--lighter,#f3f3f3)}.post__table-wrapper th{background-color:var(--lighter,#f3f3f3);font-variation-settings:"wght" var(--font-weight-bold,700);color:var(--dark,#101011);font-weight:700;user-select:none;border-bottom:2px solid var(--light,#d5d5d5)}.post__table-wrapper tr:last-child td{border-bottom:none}.post__table-wrapper tr:hover td{background-color:rgba(var(--color-rgb,0,122,165),0.02)}';

if (css.includes(targetCodeStyles)) {
  css = css.replace(targetCodeStyles, newCompactCodeStyles + tableStyles);
  console.log('Successfully replaced code cell styling and appended table styling in style.css');
} else {
  // Fallback: append compact styles and table styles if the exact minified code block string has any minor spacing variation
  css += '\n' + newCompactCodeStyles + '\n' + tableStyles;
  console.log('Appended code cell and table styling as fallback in style.css');
}

fs.writeFileSync(cssPath, css, 'utf8');
