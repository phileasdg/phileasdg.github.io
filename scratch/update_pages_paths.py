import os
import json

workspace_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
pages_json_path = os.path.join(workspace_dir, "data", "pages.json")

print(f"Loading {pages_json_path}...")
with open(pages_json_path, 'r', encoding='utf-8') as f:
    pages = json.load(f)

updated_count = 0
for page in pages:
    if "content_html" in page:
        old_content = page["content_html"]
        # Replace imgs/ with media/imgs/
        new_content = old_content.replace('src="imgs/', 'src="media/imgs/')
        if old_content != new_content:
            page["content_html"] = new_content
            updated_count += 1

if updated_count > 0:
    with open(pages_json_path, 'w', encoding='utf-8') as f:
        json.dump(pages, f, indent=2, ensure_ascii=False)
    print(f"Successfully updated paths in {updated_count} pages.")
else:
    print("No paths needed updating.")
