import os
import json
from bs4 import BeautifulSoup

BASE_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io"
PAGES_DIR = os.path.join(BASE_DIR, "pages")
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, "data", "pages.json")

print(f"Scanning pages inside {PAGES_DIR}...")
pages_data = []

for folder_name in os.listdir(PAGES_DIR):
    folder_path = os.path.join(PAGES_DIR, folder_name)
    if os.path.isdir(folder_path):
        index_file = os.path.join(folder_path, "index.html")
        if os.path.exists(index_file):
            print(f"Extracting page: {folder_name}")
            with open(index_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            soup = BeautifulSoup(content, "html.parser")
            
            # Extract title
            title_tag = soup.find("title")
            title = title_tag.string if title_tag else folder_name.replace("-", " ").title()
            # Remove " | Phileas' Website" or " - Phileas Dazeley-Gaist" from title if present
            title = title.split(" | ")[0].split(" - ")[0]
            
            # Extract body class
            body = soup.find("body")
            body_class = " ".join(body.get("class", [])) if body else ""
            
            # Extract main tag and class
            main = soup.find("main")
            main_class = " ".join(main.get("class", [])) if main else ""
            
            # Extract main inner HTML
            main_content = ""
            if main:
                # We want to serialize the children of main
                main_content = "".join(str(child) for child in main.children)
                
            pages_data.append({
                "slug": folder_name,
                "title": title,
                "body_class": body_class,
                "main_class": main_class,
                "content_html": main_content
            })

# Save to pages.json
print(f"\nSaving {len(pages_data)} pages to {OUTPUT_JSON_PATH}...")
os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(pages_data, f, indent=2, ensure_ascii=False)

print("Extraction complete!")
