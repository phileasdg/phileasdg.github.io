(function() {
  console.warn("wl-customizations.js: Module loaded and active!");

  const rgbRegex = /RGBColor\s*\[\s*([0-9.eE\-+]+`?)\s*,\s*([0-9.eE\-+]+`?)\s*,\s*([0-9.eE\-+]+`?)\s*(?:,\s*([0-9.eE\-+]+`?)\s*)?\]/gi;

  function parseWLNumber(str) {
    if (!str) return null;
    return parseFloat(str.replace('`', ''));
  }

  function injectColorSwatches(codeElement) {
    // Avoid double processing if swatches already exist
    if (codeElement.querySelector('.wl-color-swatch')) {
      return;
    }
    
    // If we already scanned this highlighted block and found no colors, skip it
    if (codeElement.dataset.wlCustomized === 'none' && codeElement.querySelector('.token')) {
      return;
    }

    // Find all text nodes
    const textNodes = [];
    const walk = document.createTreeWalker(codeElement, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walk.nextNode()) {
      textNodes.push(node);
    }

    let fullText = "";
    const nodeOffsets = [];
    for (let i = 0; i < textNodes.length; i++) {
      nodeOffsets.push({
        node: textNodes[i],
        start: fullText.length,
        end: fullText.length + textNodes[i].nodeValue.length
      });
      fullText += textNodes[i].nodeValue;
    }

    let match;
    const matches = [];
    while ((match = rgbRegex.exec(fullText)) !== null) {
      const r = parseWLNumber(match[1]);
      const g = parseWLNumber(match[2]);
      const b = parseWLNumber(match[3]);
      const a = match[4] ? parseWLNumber(match[4]) : 1.0;

      if (r !== null && g !== null && b !== null && !isNaN(r) && !isNaN(g) && !isNaN(b)) {
        matches.push({
          index: match.index,
          matchText: match[0],
          r: r,
          g: g,
          b: b,
          a: isNaN(a) ? 1.0 : a
        });
      }
    }

    // Mark as evaluated
    if (matches.length === 0) {
      codeElement.dataset.wlCustomized = 'none';
      return;
    }
    codeElement.dataset.wlCustomized = 'true';

    console.warn(`wl-customizations.js: Injecting ${matches.length} swatches and hiding matching text.`);

    // Apply swatches and hide text in reverse order so we don't invalidate character offsets
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      const matchLength = m.matchText.length;
      const matchStart = m.index;
      const matchEnd = matchStart + matchLength;

      // Find all text nodes that overlap with [matchStart, matchEnd]
      const overlappingNodes = [];
      for (let j = 0; j < nodeOffsets.length; j++) {
        const info = nodeOffsets[j];
        if (info.end > matchStart && info.start < matchEnd) {
          overlappingNodes.push(info);
        }
      }

      const nodesToWrap = [];

      for (let j = 0; j < overlappingNodes.length; j++) {
        const info = overlappingNodes[j];
        let node = info.node;
        let nodeStart = info.start;
        let nodeEnd = info.end;

        // Split start if the match starts inside the node
        if (matchStart > nodeStart) {
          const splitOffset = matchStart - nodeStart;
          const remainingNode = node.splitText(splitOffset);
          
          nodeEnd = nodeStart + splitOffset;
          node = remainingNode;
          nodeStart = nodeStart + splitOffset;
        }

        // Split end if the match ends inside the node
        if (matchEnd < nodeEnd) {
          const splitOffset = matchEnd - nodeStart;
          node.splitText(splitOffset);
          nodeEnd = nodeStart + splitOffset;
        }

        nodesToWrap.push(node);
      }

      if (nodesToWrap.length === 0) continue;

      // Wrap each node in nodesToWrap in a <span class="wl-color-text">
      nodesToWrap.forEach(node => {
        const parent = node.parentNode;
        const wrapper = document.createElement('span');
        wrapper.className = 'wl-color-text';
        parent.insertBefore(wrapper, node);
        wrapper.appendChild(node);
      });

      // Insert the swatch BEFORE the first wrapped element
      const firstWrapper = nodesToWrap[0].parentNode; // which is the .wl-color-text span
      const parent = firstWrapper.parentNode;

      const swatch = document.createElement('span');
      swatch.className = 'wl-color-swatch';
      swatch.title = m.matchText.trim();
      
      const r255 = Math.round(m.r * 255);
      const g255 = Math.round(m.g * 255);
      const b255 = Math.round(m.b * 255);
      swatch.style.backgroundColor = `rgba(${r255}, ${g255}, ${b255}, ${m.a})`;

      parent.insertBefore(swatch, firstWrapper);
    }
  }

  // Monitor DOM changes to automatically apply customizations
  function initObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // 1. If nodes were added
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const codeBlocks = node.querySelectorAll('pre code.language-mathematica, pre code.language-wolfram');
              codeBlocks.forEach(code => {
                setTimeout(() => injectColorSwatches(code), 50);
              });
              
              if (node.matches && (node.matches('code.language-mathematica') || node.matches('code.language-wolfram'))) {
                setTimeout(() => injectColorSwatches(node), 50);
              }
            }
          });
        }
        
        // 2. If the contents of a code block changed (e.g. Prism highlighting replaces text with spans)
        const target = mutation.target;
        if (target && target.nodeName === 'CODE' && 
            (target.classList.contains('language-mathematica') || target.classList.contains('language-wolfram'))) {
          if (mutation.type === 'childList') {
            // Check if it has token elements (meaning Prism completed highlighting)
            if (target.querySelector('.token')) {
              setTimeout(() => injectColorSwatches(target), 50);
            }
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    console.warn("wl-customizations.js: MutationObserver initialized on document.body");
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }

  // Run immediately on existing code blocks
  setTimeout(() => {
    const existing = document.querySelectorAll('pre code.language-mathematica, pre code.language-wolfram');
    console.warn(`wl-customizations.js: Initial scan found ${existing.length} existing code blocks.`);
    existing.forEach(code => injectColorSwatches(code));
  }, 500);

})();
