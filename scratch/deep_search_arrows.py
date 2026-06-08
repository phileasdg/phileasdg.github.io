import os

search_queries = ['<<', '>>', '&lt;&lt;', '&gt;&gt;', 'laquo', 'raquo', '«', '»', 'lsaquo', 'rsaquo', '‹', '›']
project_dir = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog"

print("Starting deep search...")
matches = []

for root, dirs, files in os.walk(project_dir):
    # Skip .git directory to avoid clutter
    if '.git' in root:
        continue
    for file in files:
        file_path = os.path.join(root, file)
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            for query in search_queries:
                if query in content:
                    # Find line number
                    lines = content.splitlines()
                    for idx, line in enumerate(lines):
                        if query in line:
                            matches.append((file_path, idx + 1, query, line.strip()[:100]))
        except Exception as e:
            pass

print(f"Found {len(matches)} matches:")
for match in matches:
    print(f"File: {match[0]}\n  Line {match[1]}: Found '{match[2]}' in: '{match[3]}'\n")
