import re
import sys

def prettify_css(content):
    content = re.sub(r'\s+', ' ', content).strip()
    # Normalize spaces around symbols
    for sym in ['{', '}', ';', ',', ':']:
        content = content.replace(f' {sym}', sym).replace(f'{sym} ', sym)
        
    res = []
    indent = 0
    i = 0
    n = len(content)
    while i < n:
        c = content[i]
        if c == '{':
            res.append(' {\n')
            indent += 1
            res.append('  ' * indent)
        elif c == '}':
            indent = max(0, indent - 1)
            # Strip trailing spaces/newlines of the last block if it was just padding
            if res and isinstance(res[-1], str):
                res[-1] = res[-1].rstrip(' ')
            res.append('\n' + '  ' * indent + '}\n')
            if indent > 0:
                res.append('  ' * indent)
        elif c == ';':
            res.append(';\n')
            res.append('  ' * indent)
        elif c == ',':
            res.append(', ')
        else:
            res.append(c)
        i += 1
        
    # Join and split by newline to clean up
    result = "".join(res)
    lines = result.split('\n')
    cleaned_lines = []
    for line in lines:
        cleaned_line = line.rstrip()
        if cleaned_line:
            cleaned_lines.append(cleaned_line)
        elif cleaned_lines and cleaned_lines[-1] != '':
            cleaned_lines.append('')
            
    return "\n".join(cleaned_lines)

if __name__ == '__main__':
    # Copy from original publii folder to restore clean state first
    src_path = '../publii/assets/css/style.css'
    dest_path = 'assets/css/style.css'
    try:
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()
        formatted = prettify_css(content)
        with open(dest_path, 'w', encoding='utf-8') as f:
            f.write(formatted)
        print("CSS restored from publii/ and successfully prettified.")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
