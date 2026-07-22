(function() {
  console.warn("wl-customizations.js: Module loaded and active!");

  function copyToClipboard(text, pillEl) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      const tooltip = document.createElement('span');
      tooltip.className = 'wl-copy-toast';
      tooltip.textContent = 'Copied Code!';
      document.body.appendChild(tooltip);
      
      const rect = pillEl.getBoundingClientRect();
      tooltip.style.left = `${rect.left + rect.width / 2}px`;
      tooltip.style.top = `${rect.top - 28}px`;

      setTimeout(() => {
        tooltip.classList.add('fade-out');
        setTimeout(() => tooltip.remove(), 300);
      }, 1000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  document.addEventListener('copy', function(e) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    const CODE_SELECTOR = 'pre code.language-mathematica, pre code.language-wolfram, pre code.language-wl';
    const codeBlock = (anchorNode && anchorNode.parentElement && anchorNode.parentElement.closest(CODE_SELECTOR)) ||
                      (focusNode && focusNode.parentElement && focusNode.parentElement.closest(CODE_SELECTOR));

    if (!codeBlock) return;

    try {
      const range = selection.getRangeAt(0);
      const fragment = range.cloneContents();

      const containers = fragment.querySelectorAll('.wl-color-container, .wl-entity-container, .wl-assoc-container');
      containers.forEach(container => {
        const pill = container.querySelector('.wl-entity-pill, .wl-color-swatch, .wl-assoc-pill');
        const textWrapper = container.querySelector('.wl-color-text, .wl-entity-text, .wl-assoc-text');
        if (pill) pill.remove();
        if (textWrapper) {
          textWrapper.style.display = 'inline';
        }
      });

      const orphanPills = fragment.querySelectorAll('.wl-entity-pill, .wl-color-swatch, .wl-assoc-pill');
      orphanPills.forEach(p => p.remove());

      const resultText = fragment.textContent;
      if (resultText && resultText.trim()) {
        e.clipboardData.setData('text/plain', resultText);
        e.preventDefault();
      }
    } catch (err) {
      console.error('Error handling selection copy: ', err);
    }
  });

  document.addEventListener('click', (e) => {
    // Handle Color Swatches and Entity Pills
    const colorSwatch = e.target.closest('.wl-color-swatch');
    const entityPill = e.target.closest('.wl-entity-pill');
    
    if (colorSwatch || entityPill) {
      const el = colorSwatch || entityPill;
      const parent = el.closest('.wl-color-container') || el.closest('.wl-entity-container');
      const textNode = parent ? parent.querySelector('.wl-color-text, .wl-entity-text') : null;
      if (textNode) {
        copyToClipboard(textNode.textContent.trim(), el);
      }
      return;
    }

    // Handle Association Pills
    const assocPill = e.target.closest('.wl-assoc-pill');
    if (assocPill) {
      const container = assocPill.closest('.wl-assoc-container');
      const content = container.querySelector('.wl-assoc-content');
      const toggle = assocPill.querySelector('.wl-assoc-toggle');
      
      if (e.altKey || e.metaKey) {
        const textNode = container.querySelector('.wl-assoc-text');
        if (textNode) {
          copyToClipboard(textNode.textContent.trim(), assocPill);
        }
        return;
      }
      
      if (content.classList.contains('wl-assoc-collapsed')) {
        content.classList.remove('wl-assoc-collapsed');
        content.classList.add('wl-assoc-expanded');
        content.style.display = 'inline';
        toggle.textContent = '-';
      } else {
        content.classList.remove('wl-assoc-expanded');
        content.classList.add('wl-assoc-collapsed');
        content.style.display = 'none';
        toggle.textContent = '+';
      }
    }
  });

})();
