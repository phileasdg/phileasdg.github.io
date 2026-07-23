import path from 'path';
import { getResponsiveSrcsetAndSizes } from './images.js';

function processWolframCode(rawCode) {
  let code = rawCode;
  const widgets = [];
  
  // 1. Entities
  code = code.replace(/Entity\s*\[\s*"([^"]+)"\s*,\s*"([^"]+)"\s*\]/g, (match, type, name) => {
    const id = `__WIDGET_ENTITY_${widgets.length}__`;
    widgets.push({
      id,
      html: `<span class="wl-entity-container"><span class="wl-entity-pill" title="Click to copy Wolfram expression: ${match.replace(/"/g, '&quot;')}"><span class="wl-entity-label">${name}</span></span><span class="wl-entity-text" style="display: none !important;">${match}</span></span>`
    });
    return id;
  });

  // 2. RGBColors
  code = code.replace(/RGBColor\s*\[\s*([0-9.eE\-+]+`?)\s*,\s*([0-9.eE\-+]+`?)\s*,\s*([0-9.eE\-+]+`?)\s*(?:,\s*([0-9.eE\-+]+`?)\s*)?\]/g, (match, r, g, b, a) => {
    const id = `__WIDGET_COLOR_${widgets.length}__`;
    const parseWLNumber = (str) => parseFloat(str.replace('`', ''));
    const r255 = Math.round(parseWLNumber(r) * 255);
    const g255 = Math.round(parseWLNumber(g) * 255);
    const b255 = Math.round(parseWLNumber(b) * 255);
    const alpha = a !== undefined ? parseWLNumber(a) : 1;
    widgets.push({
      id,
      html: `<span class="wl-color-container"><span class="wl-color-swatch" title="Click to copy code: ${match.replace(/"/g, '&quot;')}" style="background-color: rgba(${r255}, ${g255}, ${b255}, ${alpha})"></span><span class="wl-color-text" style="display: none !important;">${match}</span></span>`
    });
    return id;
  });

  // 3. Iconized (Associations, Lists & Objects) - Bracket-balanced matching
  let result = '';
  let i = 0;
  while (i < code.length) {
    const matchIndex = code.indexOf('Iconize[', i);
    if (matchIndex === -1) {
      result += code.slice(i);
      break;
    }
    result += code.slice(i, matchIndex);
    
    let depth = 1;
    let inString = false;
    let escape = false;
    let j = matchIndex + 8; // length of 'Iconize['
    
    while (j < code.length && depth > 0) {
      const char = code[j];
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = !inString;
      } else if (!inString) {
        if (char === '[') depth++;
        else if (char === ']') depth--;
      }
      j++;
    }
    
    if (depth === 0) {
      const fullMatch = code.slice(matchIndex, j);
      const argsString = code.slice(matchIndex + 8, j - 1).trim();
      
      let content = argsString;
      let label = null;
      
      const labelMatch = argsString.match(/,\s*"([^"]+)"\s*$/);
      if (labelMatch) {
        label = labelMatch[1];
        content = argsString.slice(0, labelMatch.index).trim();
      }
      
      const isList = content.startsWith('{');
      const lbl = label || (isList ? "List" : "Association");
      const openB = isList ? "{" : "&lt;|";
      const closeB = isList ? "}" : "|&gt;";
      
      const id = `__WIDGET_ASSOC_${widgets.length}__`;
      widgets.push({
        id,
        html: `<span class="wl-assoc-container"><span class="wl-assoc-pill" title="Click to toggle expand/collapse. Alt/Option-click to copy code."><span class="wl-assoc-bracket">${openB}</span><span class="wl-assoc-label">${lbl}</span><span class="wl-assoc-bracket">${closeB}</span><span class="wl-assoc-divider"></span><span class="wl-assoc-toggle">+</span></span><span class="wl-assoc-content wl-assoc-collapsed" style="display:none;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span><span class="wl-assoc-text" style="display: none !important;">${fullMatch.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span></span>`
      });
      
      result += id;
      i = j;
    } else {
      result += 'Iconize[';
      i = matchIndex + 8;
    }
  }
  code = result;

  // Escape the rest of the string to avoid HTML injection
  code = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Re-inject the HTML widgets in reverse order to handle nested widgets
  for (let idx = widgets.length - 1; idx >= 0; idx--) {
    const widget = widgets[idx];
    code = code.replaceAll(widget.id, widget.html);
  }

  return code;
}


// Helper to split cells by pipe, ignoring escaped pipes
export function splitCells(row) {
  const cells = [];
  let current = '';
  for (let j = 0; j < row.length; j++) {
    if (row[j] === '|' && (j === 0 || row[j - 1] !== '\\')) {
      cells.push(current);
      current = '';
    } else {
      current += row[j];
    }
  }
  cells.push(current);

  let result = cells.map(c => c.trim().replace(/\\\|/g, '|'));
  if (row.trim().startsWith('|')) {
    result.shift();
  }
  if (row.trim().endsWith('|') && result.length > 0) {
    result.pop();
  }
  return result;
}

// Helper to parse alignments from separator row
export function parseAlignments(separatorRow) {
  const cells = splitCells(separatorRow);
  return cells.map(cell => {
    const trimmed = cell.trim();
    const alignLeft = trimmed.startsWith(':');
    const alignRight = trimmed.endsWith(':');
    if (alignLeft && alignRight) return 'center';
    if (alignRight) return 'right';
    if (alignLeft) return 'left';
    return '';
  });
}

// Helper to parse inline markdown elements
export function parseInlineMarkdown(text) {
  let processed = text;

  // 1. Links
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 2. Temporarily extract HTML tags
  const htmlTags = [];
  processed = processed.replace(/<[^>]+>/g, (match) => {
    htmlTags.push(match);
    return `%%HTMLTAGPLACEHOLDER${htmlTags.length - 1}%%`;
  });

  // 3. Temporarily extract inline code
  const codeBlocks = [];
  processed = processed.replace(/`([^`]+)`/g, (match, code) => {
    codeBlocks.push(code);
    return `%%CODEPLACEHOLDER${codeBlocks.length - 1}%%`;
  });

  // 4. Bold
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // 5. Italic
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');

  // 6. Restore inline code
  processed = processed.replace(/%%CODEPLACEHOLDER(\d+)%%/g, (match, index) => {
    const escapedCode = codeBlocks[Number(index)]
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<code>${escapedCode}</code>`;
  });

  // 7. Restore HTML tags
  processed = processed.replace(/%%HTMLTAGPLACEHOLDER(\d+)%%/g, (match, index) => {
    return htmlTags[Number(index)];
  });

  return processed;
}

// Helper to format table in HTML
export function renderTableHTML(headers, alignments, rows) {
  let html = [];
  html.push('<div class="post__table-wrapper">');
  html.push('<table>');

  if (headers && headers.length > 0) {
    html.push('<thead>');
    html.push('<tr>');
    headers.forEach((h, index) => {
      const align = alignments[index] || '';
      const style = align ? ` style="text-align: ${align};"` : '';
      html.push(`<th${style}>${parseInlineMarkdown(h)}</th>`);
    });
    html.push('</tr>');
    html.push('</thead>');
  }

  if (rows && rows.length > 0) {
    html.push('<tbody>');
    rows.forEach(row => {
      html.push('<tr>');
      const colCount = Math.max(headers.length, row.length);
      for (let index = 0; index < colCount; index++) {
        const cell = row[index] || '';
        const align = alignments[index] || '';
        const style = align ? ` style="text-align: ${align};"` : '';
        html.push(`<td${style}>${parseInlineMarkdown(cell)}</td>`);
      }
      html.push('</tr>');
    });
    html.push('</tbody>');
  }

  html.push('</table>');
  html.push('</div>');
  return html.join('\n');
}

export function parseMarkdown(md) {
  let html = md.replace(/\r\n/g, '\n');

  const lines = html.split('\n');
  let inList = false;
  let inCodeBlock = false;
  let codeBlockLines = [];
  let unescapedCodeBlockLines = [];
  let codeBlockLang = '';
  let inTable = false;
  let tableHeaders = [];
  let tableAlignments = [];
  let tableRows = [];
  let result = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Check for code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        let rawCode = unescapedCodeBlockLines.join('\n');
        const rawCodeStr = rawCode.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        
        let innerHtml = codeBlockLines.join('\n');
        if (codeBlockLang === 'wl' || codeBlockLang === 'wolfram') {
           innerHtml = processWolframCode(rawCode);
        }
        
        result.push(`<pre><code class="language-${codeBlockLang}" data-raw-code="${rawCodeStr}">${innerHtml}</code></pre>`);
        inCodeBlock = false;
        codeBlockLines = [];
        unescapedCodeBlockLines = [];
      } else {
        codeBlockLang = line.trim().slice(3).trim() || 'plaintext';
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      // Escape HTML tags inside code blocks
      const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      codeBlockLines.push(escaped);
      unescapedCodeBlockLines.push(line);
      continue;
    }

    // Check if table row
    if (inTable) {
      if (line.trim().startsWith('|') || line.includes('|')) {
        const cells = splitCells(line);
        tableRows.push(cells);
        continue;
      } else {
        result.push(renderTableHTML(tableHeaders, tableAlignments, tableRows));
        inTable = false;
        tableHeaders = [];
        tableAlignments = [];
        tableRows = [];
        // fall through to parse the current line normally
      }
    }

    // Check if table starts
    if (!inTable && line.includes('|') && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const separatorRegex = /^\s*\|?\s*(?:\s*:?-+:?\s*\|)+\s*(?:\s*:?-+:?\s*)?\|?\s*$/;
      if (separatorRegex.test(nextLine)) {
        inTable = true;
        tableHeaders = splitCells(line);
        tableAlignments = parseAlignments(nextLine);
        tableRows = [];
        i++; // skip the separator row
        continue;
      }
    }

    // Process inline markdown for non-code block lines
    let processedLine = line.trim();

    // Horizontal rule / separator delimiter
    if (processedLine === '---' || processedLine === '***' || processedLine === '___') {
      result.push('<hr class="separator" />');
      continue;
    }

    // 1. Images (must be BEFORE links and BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgTarget) => {
      const parts = imgTarget.trim().split(/\s+/);
      const imgPath = parts[0];
      let widthAttr = '';
      let heightAttr = '';
      let alignment = 'center';

      if (!alt || alt.trim() === '') {
        const base = path.basename(imgPath, path.extname(imgPath));
        alt = base.replace(/[-_]/g, ' ');
      }

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        const sizeMatch = part.match(/^=(\d*)x(\d*)$/);
        if (sizeMatch) {
          if (sizeMatch[1]) widthAttr = ` width="${sizeMatch[1]}"`;
          if (sizeMatch[2]) heightAttr = ` height="${sizeMatch[2]}"`;
        } else if (part === 'left' || part === 'right' || part === 'center') {
          alignment = part;
        }
      }

      const { srcset, sizes } = getResponsiveSrcsetAndSizes(imgPath);
      const srcsetAttr = srcset ? ' ' + srcset : '';
      const sizesAttr = sizes ? ' ' + sizes : '';
      return `<figure class="post__image post__image--${alignment}"><img src="${imgPath}" alt="${alt}"${widthAttr}${heightAttr}${srcsetAttr}${sizesAttr} loading="lazy" /></figure>`;
    });

    // 2. Links (must be BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // 3. Headers (must match start of line or follow an HTML tag, must be BEFORE extracting HTML tags)
    processedLine = processedLine.replace(/(^|>)\s*### (.*$)/gim, '$1<h3>$2</h3>');
    processedLine = processedLine.replace(/(^|>)\s*## (.*$)/gim, '$1<h2>$2</h2>');
    processedLine = processedLine.replace(/(^|>)\s*# (.*$)/gim, '$1<h1>$2</h1>');

    // 4. Temporarily extract HTML tags (original + newly generated) to prevent modifying them
    const htmlTags = [];
    processedLine = processedLine.replace(/<[^>]+>/g, (match) => {
      htmlTags.push(match);
      return `%%HTMLTAGPLACEHOLDER${htmlTags.length - 1}%%`;
    });

    // 5. Temporarily extract inline code to prevent formatting inside backticks
    const codeBlocks = [];
    processedLine = processedLine.replace(/`([^`]+)`/g, (match, code) => {
      codeBlocks.push(code);
      return `%%CODEPLACEHOLDER${codeBlocks.length - 1}%%`;
    });

    // 6. Bold
    processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 7. Italic
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processedLine = processedLine.replace(/_(.*?)_/g, '<em>$1</em>');

    // 8. Restore inline code
    processedLine = processedLine.replace(/%%CODEPLACEHOLDER(\d+)%%/g, (match, index) => {
      const escapedCode = codeBlocks[Number(index)]
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<code>${escapedCode}</code>`;
    });

    // 9. Restore HTML tags
    processedLine = processedLine.replace(/%%HTMLTAGPLACEHOLDER(\d+)%%/g, (match, index) => {
      return htmlTags[Number(index)];
    });

    // Check if line is list item
    const listMatch = processedLine.match(/^[\-\*\+]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${listMatch[1]}</li>`);
    } else {
      if (inList) {
        result.push('</ul>');
        inList = false;
      }

      if (processedLine === '') {
        continue;
      }

      // If it's already an HTML block tag, don't wrap it in <p>
      const isHtmlBlock = /^\s*<\/?(a|table|thead|tbody|tr|th|td|h[1-6]|ul|ol|li|div|p|figure|figcaption|iframe|pre|img|blockquote|hr|aside|section|script|style|details|summary|form|input|button|label)\b/i.test(processedLine) || processedLine.startsWith('<!--');
      if (isHtmlBlock) {
        if (/^\s*<table\b/i.test(processedLine)) {
          result.push('<div class="post__table-wrapper">');
        }
        result.push(processedLine);
        if (/<\/table>\s*$/i.test(processedLine)) {
          result.push('</div>');
        }
      } else {
        result.push(`<p>${processedLine}</p>`);
      }
    }
  }

  if (inList) {
    result.push('</ul>');
  }
  if (inTable) {
    result.push(renderTableHTML(tableHeaders, tableAlignments, tableRows));
  }
  if (inCodeBlock) {
    const rawCodeStr = codeBlockLines.join('\n').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    result.push(`<pre><code class="language-${codeBlockLang}" data-raw-code="${rawCodeStr}">${codeBlockLines.join('\n')}</code></pre>`);
  }

  return result.join('\n');
}
