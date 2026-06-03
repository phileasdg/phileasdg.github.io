import re

def check_quotes(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Strip comments to avoid checking quotes inside comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Check quotes line by line
    for i, line in enumerate(content.split('\n'), 1):
        # Count single and double quotes
        singles = line.count("'")
        doubles = line.count('"')
        
        if singles % 2 != 0:
            print(f"Line {i}: Unbalanced single quotes: {line.strip()}")
        if doubles % 2 != 0:
            print(f"Line {i}: Unbalanced double quotes: {line.strip()}")

if __name__ == '__main__':
    print("Checking quote balance in style.css...")
    check_quotes('assets/css/style.css')
