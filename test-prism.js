import Prism from 'prismjs';
import loadLanguages from 'prismjs/components/index.js';
loadLanguages(['wolfram']);
const code = 'a = 1;';
console.log(Prism.highlight(code, Prism.languages.wolfram, 'wolfram'));
