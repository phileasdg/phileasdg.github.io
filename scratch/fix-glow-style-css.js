import fs from 'fs';

const cssPath = 'assets/css/style.css';
let css = fs.readFileSync(cssPath, 'utf8');

// The version with the glow issue (which is currently in style.css)
const oldCodeStyles = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa}.code-block-wrapper pre,.code-block-wrapper pre[class*="language-"]{margin:0!important;border:none!important;border-radius:0!important;background:transparent!important;padding:0.8rem 1rem!important;padding-right:6.5rem!important;overflow-x:auto;box-shadow:none!important}.code-block-header{position:absolute;top:8px;right:12px;z-index:10;display:flex;align-items:center;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.6rem;color:#888888;user-select:none}.code-block-lang{text-transform:uppercase;font-size:0.55rem;letter-spacing:0.03em;opacity:0.7}.code-block-lang::after{content:"|";margin-left:8px;opacity:0.5}.code-block-copy-btn{background:transparent;border:none;color:#007AA5;cursor:pointer;padding:0;font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:0.03em;transition:all 0.1s ease-in-out}.code-block-copy-btn:hover{color:#101011;text-decoration:underline}.code-block-copy-btn.copied{color:#28a745}';

// The new corrected version with the resets
const newCodeStyles = '.code-block-wrapper{position:relative;border:1px solid #e1e4e8;border-radius:4px;margin:0.75rem 0;background:#f6f8fa}.code-block-wrapper pre,.code-block-wrapper pre[class*="language-"]{margin:0!important;border:none!important;border-radius:0!important;background:transparent!important;padding:0.8rem 1rem!important;padding-right:6.5rem!important;overflow-x:auto;box-shadow:none!important}.code-block-header{position:absolute;top:8px;right:12px;z-index:10;display:flex;align-items:center;gap:8px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:0.6rem;color:#888888;user-select:none}.code-block-lang{text-transform:uppercase;font-size:0.55rem;letter-spacing:0.03em;opacity:0.7}.code-block-lang::after{content:"|";margin-left:8px;opacity:0.5}.code-block-copy-btn{background:transparent!important;border:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;transform:none!important;-webkit-transform:none!important;will-change:auto!important;color:#007AA5!important;cursor:pointer!important;padding:0!important;font-size:0.6rem!important;font-weight:600!important;text-transform:uppercase!important;letter-spacing:0.03em!important;transition:color 0.1s ease-in-out!important;width:auto!important;display:inline-block!important}.code-block-copy-btn:hover{color:#101011!important;text-decoration:underline!important;background:transparent!important;transform:none!important;box-shadow:none!important}.code-block-copy-btn.copied{color:#28a745!important;background:transparent!important;transform:none!important;box-shadow:none!important}';

if (css.includes(oldCodeStyles)) {
  css = css.replace(oldCodeStyles, newCodeStyles);
  console.log('Successfully updated copy button styles in style.css to remove the glow.');
} else {
  // If not found (e.g. if it had some variations), let's append it
  css += '\n' + newCodeStyles;
  console.log('Appended reset style rules as fallback in style.css');
}

fs.writeFileSync(cssPath, css, 'utf8');
