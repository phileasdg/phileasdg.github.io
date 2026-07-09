export function parseFrontMatter(fileContent) {
  const normalized = fileContent.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { data: {}, content: fileContent };
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return { data: {}, content: fileContent };
  }

  const frontmatterText = normalized.substring(4, closingIndex);
  const content = normalized.substring(closingIndex + 5).trim();

  const lines = frontmatterText.split('\n');
  const data = {};
  lines.forEach(line => {
    const match = line.match(/^\s*([^:]+)\s*:\s*(.*)\s*$/);
    if (match) {
      let key = match[1].trim();
      let val = match[2].trim();

      // Strip outer quotes
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }

      if (val === 'true') {
        val = true;
      } else if (val === 'false') {
        val = false;
      }

      // Parse arrays like ["a", "b"]
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val.substring(1, val.length - 1).split(',').map(s => {
          s = s.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length - 1);
          }
          return s;
        }).filter(Boolean);
      }

      data[key] = val;
    }
  });

  return { data, content };
}
