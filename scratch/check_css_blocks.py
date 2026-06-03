import re

def parse_css_hierarchy(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Strip comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Tokenize by braces
    tokens = re.split(r'([{}])', content)
    
    depth = 0
    stack = []
    
    for token in tokens:
        token = token.strip()
        if not token:
            continue
            
        if token == '{':
            depth += 1
            # The selector is the token before this brace
            selector = stack[-1] if stack else 'Unknown'
            print(f"{'  ' * (depth - 1)}[OPEN] {selector} (depth={depth})")
        elif token == '}':
            if depth > 0:
                print(f"{'  ' * (depth - 1)}[CLOSE] (depth={depth})")
                depth -= 1
                if stack:
                    stack.pop()
            else:
                print("ERROR: Unmatched closing brace!")
        else:
            # This is a selector or property declarations list
            # We only push if we expect a selector next (i.e. we are before an open brace)
            # Actually, to keep it simple, we can just split by semicolons if we are inside a rule,
            # but if we are outside, this is a selector.
            # A simple rule: if the token is not a symbol, it's a selector if we're going to open a brace.
            # So we push it to stack.
            if len(stack) > depth:
                stack[-1] = token
            else:
                stack.append(token)

if __name__ == '__main__':
    print("Nesting hierarchy of style.css:")
    print("=" * 60)
    parse_css_hierarchy('assets/css/style.css')
