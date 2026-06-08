const resolveRelativePath = (relPath, context) => {
  const contextParts = context.split('/').filter(Boolean);
  const relParts = relPath.split('/');

  while (relParts[0] === '..') {
    relParts.shift();
    contextParts.pop();
  }
  if (relParts[0] === '.') {
    relParts.shift();
  }

  return [...contextParts, ...relParts].join('/');
};

const testSrc = (src, originalPathContext) => {
  let cleaned = src.replace(/^https?:\/\/phileasdg\.github\.io\//, '');
  if (cleaned && !cleaned.startsWith('http') && !cleaned.startsWith('/') && !cleaned.startsWith('#')) {
    if (!cleaned.startsWith('media/') && !cleaned.startsWith('assets/') && !cleaned.startsWith('data/')) {
      cleaned = resolveRelativePath(cleaned, originalPathContext);
    }
  }
  return cleaned;
};

const testSrcset = (srcset, originalPathContext) => {
  let cleaned = srcset.replace(/https?:\/\/phileasdg\.github\.io\//g, '');
  const parts = cleaned.split(',').map(part => {
    const trimmed = part.trim();
    const firstSpace = trimmed.indexOf(' ');
    if (firstSpace === -1) {
      if (!trimmed.startsWith('http') && !trimmed.startsWith('/') && !trimmed.startsWith('#')) {
        if (!trimmed.startsWith('media/') && !trimmed.startsWith('assets/') && !trimmed.startsWith('data/')) {
          return resolveRelativePath(trimmed, originalPathContext);
        }
      }
      return trimmed;
    }
    const url = trimmed.substring(0, firstSpace);
    const rest = trimmed.substring(firstSpace);
    if (!url.startsWith('http') && !url.startsWith('/') && !url.startsWith('#')) {
      if (!url.startsWith('media/') && !url.startsWith('assets/') && !url.startsWith('data/')) {
        return resolveRelativePath(url, originalPathContext) + rest;
      }
    }
    return trimmed;
  });
  return parts.join(', ');
};

// Case 1: relative path
const src1 = '../../media/posts/tracking-icebergs/iceberg-figure-1.png';
const srcset1 = '../../media/posts/tracking-icebergs/responsive/iceberg-figure-1-xs.png 300w, ../../media/posts/tracking-icebergs/responsive/iceberg-figure-1-sm.png 480w, ../../media/posts/tracking-icebergs/responsive/iceberg-figure-1-md.png 768w';
console.log('Case 1 (relative):');
console.log('src:', testSrc(src1, 'posts/tracking-icebergs/'));
console.log('srcset:', testSrcset(srcset1, 'posts/tracking-icebergs/'));

// Case 2: absolute path with https
const src2 = 'https://phileasdg.github.io/media/posts/trading-places-a-network-analysis-of-global-commerce/0mhu7w08drqns.png';
const srcset2 = 'https://phileasdg.github.io/media/posts/trading-places-a-network-analysis-of-global-commerce/responsive/0mhu7w08drqns-xs.png 300w, https://phileasdg.github.io/media/posts/trading-places-a-network-analysis-of-global-commerce/responsive/0mhu7w08drqns-sm.png 480w';
console.log('\nCase 2 (absolute):');
console.log('src:', testSrc(src2, 'posts/trading-places-a-network-analysis-of-global-commerce/'));
console.log('srcset:', testSrcset(srcset2, 'posts/trading-places-a-network-analysis-of-global-commerce/'));
